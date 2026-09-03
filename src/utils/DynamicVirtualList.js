/**
 * DynamicVirtualList — Renderização virtualizada de listas no DOM.
 *
 * Tópico 2B (Blueprint): Otimização de Renderização (Reflow e Repaint).
 *
 * Estratégias implementadas:
 * - Apenas os nós visíveis na viewport + buffer são montados.
 * - DocumentFragment off-screen agrega inserções num único ciclo de Reflow.
 * - translate3d posiciona elementos via GPU, sem acionar propriedades de layout (top/left).
 * - requestAnimationFrame agrupa leituras/escritas no ciclo de frame correto (60fps).
 * - AbortSignal integrado: o listener de scroll é removido automaticamente na desmontagem.
 *
 * Complexidade:
 *   DOM: O(M) onde M = elementos visíveis (constante baixo), em vez de O(N) total.
 *   Busca de posição: O(1) via floor aritmético (altura de linha uniforme).
 *
 * @template T Tipo dos dados de cada item da lista.
 */
export class DynamicVirtualList {
  /**
   * @param {HTMLElement} containerElement - Elemento com overflow:auto que serve de viewport.
   * @param {T[]} itemsList - Array com todos os dados da lista.
   * @param {(item: T, index: number) => HTMLElement} renderRowCallback - Função que retorna o nó DOM para um item.
   * @param {number} [rowHeight=56] - Altura fixa em pixels de cada linha (recomendado: medir via CSS).
   * @param {AbortSignal} [signal] - Signal de AbortController para limpeza automática de listeners.
   */
  constructor(containerElement, itemsList, renderRowCallback, rowHeight = 56, signal = null) {
    this.container = containerElement;
    this.items = itemsList;
    this.renderRow = renderRowCallback;
    this.rowHeight = rowHeight;
    this.signal = signal;

    // Calcula quantos itens cabem na viewport + buffer superior/inferior de 3 itens
    this.bufferSize = 3;
    this.visibleCount = Math.ceil(this.container.clientHeight / this.rowHeight) + this.bufferSize * 2;

    // Div interna com altura total da lista para manter o scrollbar correto
    this.scrollContent = document.createElement("div");
    this.scrollContent.style.height = `${this.items.length * this.rowHeight}px`;
    this.scrollContent.style.position = "relative";
    this.scrollContent.style.pointerEvents = "none"; // O container pai captura eventos

    this.container.appendChild(this.scrollContent);

    // requestAnimationFrame ID para evitar múltiplas chamadas no mesmo frame
    this._rafId = null;

    this._onScroll = () => {
      // Cancela frame anterior pendente (debounce via rAF)
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => this._render());
    };

    // Listener passivo (não bloqueia o scroll) com AbortSignal para limpeza automática
    this.container.addEventListener("scroll", this._onScroll, {
      passive: true,
      signal: this.signal ?? undefined,
    });

    this._render();
  }

  /**
   * Atualiza a lista de itens e re-renderiza. Útil após filtragens ou novos dados.
   * @param {T[]} newItems
   */
  updateItems(newItems) {
    this.items = newItems;
    this.scrollContent.style.height = `${this.items.length * this.rowHeight}px`;
    this.container.scrollTop = 0;
    this._render();
  }

  _render() {
    const scrollTop = this.container.scrollTop;

    // Índices com buffer para suavidade na rolagem
    const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.floor((scrollTop + this.container.clientHeight) / this.rowHeight) + this.bufferSize
    );

    // DocumentFragment temporário off-screen — agrega todas as inserções
    // num único ciclo de Reflow ao ser injetado na árvore DOM visível.
    const fragment = document.createDocumentFragment();

    // Limpa apenas o conteúdo ativo (não o container pai, evitando scroll reset)
    this.scrollContent.innerHTML = "";

    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      if (!item) continue;

      const node = this.renderRow(item, i);

      // Posicionamento absoluto via translate3d — processado diretamente na GPU,
      // sem acionar Reflow de layout (evita Layout Thrashing).
      node.style.position = "absolute";
      node.style.top = "0";
      node.style.left = "0";
      node.style.width = "100%";
      node.style.pointerEvents = "auto";
      node.style.transform = `translate3d(0, ${i * this.rowHeight}px, 0)`;
      node.style.willChange = "transform";

      fragment.appendChild(node);
    }

    // Única operação de escrita no DOM — provoca apenas 1 ciclo de Reflow
    this.scrollContent.appendChild(fragment);

    this._rafId = null;
  }

  /** Desmonta manualmente caso não use AbortSignal. */
  destroy() {
    this.container.removeEventListener("scroll", this._onScroll);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this.scrollContent.remove();
  }
}
