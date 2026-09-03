import client from "../api/client.js";

/**
 * AdminSpecs.js — Página Administrativa para Gestão de Especialidades.
 *
 * Contém um formulário integrado (sem FAB) para criar Especialidades,
 * e uma grelha para gerir (editar/excluir) as especialidades existentes.
 * O SVG bruto pode ser colado diretamente.
 *
 * @param {AbortSignal} signal - Signal do AbortController.
 */
export async function AdminSpecs(signal) {
  let specs = [];
  try {
    specs = await client.get("/specifications");
  } catch (error) {
    if (error.name !== "AbortError") console.error("Erro ao carregar specs", error);
  }

  // Define a UI do componente de forma asíncrona no layout e dps amarra os eventos globais no AdminLayout.
  // Vamos configurar eventos diretamente na UI ou via delegation para melhor performance Vanilla JS.
  setTimeout(() => setupAdminSpecsEvents(signal), 50);

  return `
    <div class="admin-view-container">
      <div class="admin-view-header">
        <h1 class="admin-view-title">Especialidades & Skills</h1>
        <p class="admin-view-subtitle">Gerencie dinamicamente as tecnologias do seu portfólio.</p>
      </div>
      <div class="admin-view-body">
        
        <!-- Formulário In-Page -->
        <div class="cyber-card-matrix cyber-glass-container" style="padding: 2rem; border-radius: 16px; margin-bottom: 2rem;">
          <h2 style="font-size: 1.2rem; color: white; margin-bottom: 1.5rem; font-weight: 600;">Adicionar Nova Especialidade</h2>
          <form id="admin-spec-form" class="admin-modal-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <input type="hidden" id="spec-id" name="id" value="">
            
            <div class="auth-input-group">
              <label class="auth-label">Tag (ex: Frontend)</label>
              <input class="auth-input" type="text" id="spec-tag" name="tag" required placeholder="Categoria curta">
            </div>

            <div class="auth-input-group">
              <label class="auth-label">Título Principal</label>
              <input class="auth-input" type="text" id="spec-title" name="title" required placeholder="Ex: Interface & Experiência">
            </div>

            <div class="auth-input-group">
              <label class="auth-label">Descrição</label>
              <textarea class="auth-input" id="spec-desc" name="description" rows="3" required placeholder="Descreva as bibliotecas, linguagens..."></textarea>
            </div>

            <div class="auth-input-group">
              <label class="auth-label">Ícone (SVG Bruto)</label>
              <p style="font-size: 0.8rem; color: var(--text-sub); margin-bottom: 0.5rem;">Cole o código SVG aqui (ex: lucide.dev). Nós preservamos os estilos néon.</p>
              <textarea class="auth-input" id="spec-icon" name="iconSvg" rows="4" required placeholder="<svg>...</svg>"></textarea>
            </div>

            <div class="auth-input-group" style="flex-direction: row; align-items: center; gap: 0.8rem;">
              <input type="checkbox" id="spec-wide" name="isWide" style="width: 18px; height: 18px; accent-color: var(--primary);">
              <label for="spec-wide" class="auth-label" style="margin: 0; cursor: pointer;">Card Largo (Ocupa 2 colunas, ex: DevOps)</label>
            </div>

            <div class="auth-input-group">
              <label class="auth-label">Ordem de Exibição (Opcional)</label>
              <input class="auth-input" type="number" id="spec-order" name="order" value="0">
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="auth-submit" id="spec-submit-btn" style="width: fit-content; padding: 0.8rem 2rem;">Adicionar</button>
              <button type="button" class="auth-submit" id="spec-cancel-btn" style="display: none; background: transparent; border: 1px solid var(--glass-border); width: fit-content; padding: 0.8rem 2rem;">Cancelar Edição</button>
            </div>
          </form>
        </div>

        <!-- Grelha Dinâmica -->
        <h2 style="font-size: 1.2rem; color: white; margin-bottom: 1rem; font-weight: 600;">Especialidades Existentes</h2>
        <div id="admin-specs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
          ${renderSpecsGrid(specs)}
        </div>

      </div>
    </div>
  `;
}

function renderSpecsGrid(specs) {
  if (specs.length === 0) {
    return `<p style="color: var(--text-sub);">Nenhuma especialidade cadastrada. Adicione acima.</p>`;
  }

  return specs.map(spec => `
    <div class="cyber-card-matrix cyber-glass-container" id="spec-card-${spec.id}" style="padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="width: 40px; height: 40px; color: var(--primary); display: flex; align-items: center; justify-content: center;">
          ${spec.iconSvg}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-icon btn-edit-spec" data-spec='${JSON.stringify(spec).replace(/'/g, "&#39;")}' style="padding: 5px;">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon btn-del-spec" data-id="${spec.id}" style="padding: 5px; color: #ff3366;">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div>
        <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--primary); font-weight: 700; letter-spacing: 1px;">${spec.tag}</span>
        <h3 style="font-size: 1.1rem; color: white; margin: 0.2rem 0 0.5rem 0;">${spec.title}</h3>
        <p style="font-size: 0.85rem; color: var(--text-sub); line-height: 1.5;">${spec.description}</p>
        ${spec.isWide ? '<span style="font-size: 0.7rem; background: rgba(0,255,204,0.1); color: var(--primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--primary); margin-top: 0.5rem; display: inline-block;">Layout Largo</span>' : ''}
      </div>
    </div>
  `).join("");
}

function setupAdminSpecsEvents(signal) {
  const form = document.getElementById("admin-spec-form");
  const cancelBtn = document.getElementById("spec-cancel-btn");
  const submitBtn = document.getElementById("spec-submit-btn");
  const grid = document.getElementById("admin-specs-grid");

  if (!form || !grid) return;

  const opts = signal ? { signal } : undefined;

  // Handler de Cancelar
  cancelBtn.addEventListener("click", () => {
    form.reset();
    document.getElementById("spec-id").value = "";
    submitBtn.textContent = "Adicionar";
    cancelBtn.style.display = "none";
  }, opts);

  // Submit Handler (Criar / Editar)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.textContent = "Salvando...";
    submitBtn.disabled = true;

    const id = document.getElementById("spec-id").value;
    const isWide = document.getElementById("spec-wide").checked;

    const data = {
      tag: document.getElementById("spec-tag").value,
      title: document.getElementById("spec-title").value,
      description: document.getElementById("spec-desc").value,
      iconSvg: document.getElementById("spec-icon").value,
      order: parseInt(document.getElementById("spec-order").value) || 0,
      isWide: isWide
    };

    try {
      if (id) {
        await client.put(`/specifications/${id}`, data);
      } else {
        await client.post("/specifications", data);
      }
      
      // Forçar recarga da view
      window.dispatchEvent(new CustomEvent("admin-navigate", { detail: { view: "specs" } }));
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar especialidade.");
    } finally {
      submitBtn.textContent = id ? "Atualizar" : "Adicionar";
      submitBtn.disabled = false;
    }
  }, opts);

  // Delegation para os botões Editar e Excluir
  grid.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".btn-edit-spec");
    const delBtn = e.target.closest(".btn-del-spec");

    if (editBtn) {
      const spec = JSON.parse(editBtn.dataset.spec);
      document.getElementById("spec-id").value = spec.id;
      document.getElementById("spec-tag").value = spec.tag;
      document.getElementById("spec-title").value = spec.title;
      document.getElementById("spec-desc").value = spec.description;
      document.getElementById("spec-icon").value = spec.iconSvg;
      document.getElementById("spec-order").value = spec.order;
      document.getElementById("spec-wide").checked = spec.isWide;

      submitBtn.textContent = "Atualizar";
      cancelBtn.style.display = "inline-block";
      
      // Rolar suavemente para o formulário
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      
    }

    if (delBtn && !editBtn) {
      if (window.AdminUI && window.AdminUI.requestDelete) {
         window.AdminUI.requestDelete(delBtn.dataset.id, 'spec');
      }
    }
  }, opts);
}
