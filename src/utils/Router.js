import client from "../api/client.js";

/**
 * SecureAdminRouter — Roteador SPA com validação de assinatura HMAC.
 *
 * Tópico 2A (Blueprint): Gerenciamento de Memória via AbortController.
 * - Cada rota recebe um AbortController único.
 * - Ao navegar para outra rota, o controller anterior é abortado,
 *   desvinculando atomicamente todos os event listeners registrados com { signal }.
 * - Isso previne memory leaks de closures penduradas em nós DOM órfãos.
 */
export class SecureAdminRouter {
  constructor(onRouteMatched, onAccessDenied) {
    this.onRouteMatched = onRouteMatched;
    this.onAccessDenied = onAccessDenied;

    /** @type {AbortController|null} Controlador da rota ativa atual */
    this.currentController = null;

    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.evaluateRoute());
    // Garante que a rotação seja avaliada mesmo se o DOMContentLoaded já tiver sido disparado
    if (document.readyState === 'loading') {
      window.addEventListener("DOMContentLoaded", () => this.evaluateRoute());
    } else {
      // Adia a execução para a próxima iteração do event loop.
      // Isso permite que `window.router = new SecureAdminRouter(...)`
      // termine a atribuição no app.js ANTES de onRouteMatched ser chamado.
      setTimeout(() => this.evaluateRoute(), 0);
    }
  }

  /**
   * Cria um novo AbortController para a rota que está sendo ativada,
   * abortando e descartando o controller da rota anterior.
   * @returns {AbortSignal} Signal a ser passado para os addEventListener dos componentes.
   */
  createRouteSignal() {
    // Aborta todos os listeners da rota anterior de forma atômica
    if (this.currentController) {
      this.currentController.abort();
    }
    this.currentController = new AbortController();
    return this.currentController.signal;
  }

  async evaluateRoute() {
    const hashPath = window.location.hash;

    if (!hashPath.startsWith("#/admin")) {
      return;
    }

    // Bypass HMAC verification if a JWT session exists
    let token = localStorage.getItem("token");
    let userStr = localStorage.getItem("user");
    let isAdmin = false;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        isAdmin = user.role === "ADMIN";
      } catch(e) {}
    }

    if (token && isAdmin) {
      this.onRouteMatched();
      return;
    }

    // Se não há sessão JWT válida, extrai o hash da URL para verificação no backend
    const pathParts = hashPath.split("?")[0].split("/");
    const providedHash = pathParts[2]; // #/admin/<hash>

    if (!providedHash) {
      this.handleDecoyDeception();
      return;
    }

    try {
      const response = await client.get(`/admin/verify/${providedHash}`);

      if (response && response.success) {
        if (response.secureLoginToken) {
          const { setSecureLoginToken } = await import("../api/authStore.js");
          setSecureLoginToken(response.secureLoginToken);
        }
        this.onRouteMatched();
      } else {
        this.handleDecoyDeception();
      }
    } catch (error) {
      this.handleDecoyDeception();
    }
  }

  async handleDecoyDeception() {
    window.history.replaceState(null, "", "/#/");

    const delay = Math.floor(Math.random() * (3500 - 1200 + 1) + 1200);
    await new Promise((resolve) => setTimeout(resolve, delay));

    this.onAccessDenied();
  }
}
