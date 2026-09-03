/**
 * AdminSidebar.js — Menu lateral de navegação do painel administrativo.
 *
 * Componente puro Vanilla JS com estética Glassmorphism Cyberpunk.
 * Cada link de navegação dispara a troca de view na área principal
 * do AdminLayout via evento customizado 'admin-navigate'.
 *
 * @param {AbortSignal} signal - Signal do AbortController da rota ativa.
 * @returns {string} HTML do sidebar.
 */
export function AdminSidebar(signal) {
  const userStr = localStorage.getItem("user");
  let userName = "Admin";
  if (userStr) {
    try { userName = JSON.parse(userStr).name || "Admin"; } catch(e) {}
  }

  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return `
    <aside id="admin-sidebar" class="admin-sidebar">
      <!-- Branding -->
      <div class="sidebar-brand">
        <div class="sidebar-avatar">${initials}</div>
        <div class="sidebar-brand-text">
          <span class="sidebar-brand-name">${userName}</span>
          <span class="sidebar-brand-role">Administrador</span>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <button class="sidebar-nav-item active" data-view="feed" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </button>

        <button class="sidebar-nav-item" data-view="users" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Usuários</span>
        </button>

        <button class="sidebar-nav-item" data-view="audit" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <span>Auditoria</span>
        </button>

        <button class="sidebar-nav-item" data-view="specs" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Especialidades</span>
        </button>

        <button class="sidebar-nav-item" data-view="analytics" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Analytics</span>
        </button>
      </nav>

      <div class="sidebar-divider" style="margin-top: auto;"></div>

      <!-- Footer -->
      <button class="sidebar-nav-item sidebar-logout" data-view="logout" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Sair</span>
      </button>
    </aside>
  `;
}

/**
 * Inicializa os event listeners do Sidebar.
 * Chamado após o HTML ser injetado no DOM.
 *
 * @param {AbortSignal} signal - Signal para limpeza automática dos listeners.
 */
export function setupSidebar(signal) {
  const sidebar = document.getElementById("admin-sidebar");
  if (!sidebar) return;

  const navItems = sidebar.querySelectorAll(".sidebar-nav-item");
  const opts = signal ? { signal } : undefined;

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;

      if (view === "logout") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      // Atualiza estado ativo visual
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      // Dispara evento customizado para o AdminLayout trocar a view
      window.dispatchEvent(new CustomEvent("admin-navigate", { detail: { view } }));
    }, opts);
  });
}
