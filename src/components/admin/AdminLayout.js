import { AdminSidebar, setupSidebar } from "./AdminSidebar.js";
import { Feed } from "../../pages/Feed.js";
import { AdminUsers } from "../../pages/AdminUsers.js";
import { AdminAudit } from "../../pages/AdminAudit.js";
import { AdminSpecs } from "../../pages/AdminSpecs.js";
import { AdminTools } from "../AdminTools.js";
import { AdminDeleteModalHTML, setupDeleteModal } from "./AdminDeleteModal.js";
import { setupAdminForm } from "./AdminFormManager.js";
import { setupAdminMedia } from "./AdminMediaManager.js";

/**
 * AdminLayout.js — Casca estrutural do painel administrativo.
 *
 * Divide a tela em duas regiões:
 *   - Sidebar fixa (250px) à esquerda
 *   - Área de conteúdo dinâmico (flex: 1) à direita
 *
 * A troca de views é orquestrada pelo evento 'admin-navigate'
 * emitido pelo Sidebar e escutado aqui. Cada view é carregada
 * na região #admin-main-content sem destruir o Sidebar.
 *
 * @param {AbortSignal} signal - Signal do AbortController da rota ativa.
 * @returns {string} HTML do layout completo.
 */
export function AdminLayout(signal) {
  return `
    <div id="admin-layout" class="admin-layout">
      ${AdminSidebar(signal)}
      <main id="admin-main-content" class="admin-main-content">
        <!-- View dinâmica injetada aqui -->
      </main>
      
      <!-- Componentes Globais Injetados no nível do Layout (garante position: fixed absoluto ao viewport) -->
      ${AdminTools()}
      ${AdminDeleteModalHTML()}
    </div>
  `;
}

/**
 * Inicializa o Layout: configura o Sidebar e carrega a view padrão (Feed).
 *
 * @param {AbortSignal} signal - Signal do AbortController da rota ativa.
 */
export async function setupAdminLayout(signal) {
  // 1. Configura os listeners do Sidebar
  setupSidebar(signal);

  // 2. Configura Modais e Componentes Globais
  setupAdminMedia(signal);
  setupAdminForm(signal);
  setupDeleteModal(signal);

  // 3. Carrega a view padrão (Dashboard / Feed)
  await loadView("feed", signal);

  // 3. Escuta navegação interna do sidebar
  const opts = signal ? { signal } : undefined;

  window.addEventListener("admin-navigate", async (e) => {
    const { view } = e.detail;
    await loadView(view, signal);
  }, opts);
}

/**
 * Carrega uma view na área principal do painel, com animação de transição.
 *
 * @param {string} viewName - Nome da view a carregar.
 * @param {AbortSignal} signal - Signal da rota ativa.
 */
async function loadView(viewName, signal) {
  const mainContent = document.getElementById("admin-main-content");
  if (!mainContent) return;

  // Animação de saída da view atual
  if (window.gsap) {
    await new Promise(resolve => {
      window.gsap.to(mainContent, {
        opacity: 0,
        y: 15,
        duration: 0.2,
        ease: "power2.in",
        onComplete: resolve
      });
    });
  }

  // Renderiza a nova view
  switch (viewName) {
    case "feed":
      mainContent.innerHTML = await Feed(signal);
      break;

    case "users":
      mainContent.innerHTML = await AdminUsers(signal);
      break;

    case "audit":
      mainContent.innerHTML = await AdminAudit(signal);
      break;

    case "specs":
      mainContent.innerHTML = await AdminSpecs(signal);
      break;

    case "analytics":
      mainContent.innerHTML = renderAnalyticsView();
      break;

    default:
      mainContent.innerHTML = await Feed(signal);
  }

  // Animação de entrada da nova view
  if (window.gsap) {
    window.gsap.fromTo(mainContent,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
    );
  }
}



/**
 * View placeholder — Analytics e Tráfego (Tópico 4C).
 */
function renderAnalyticsView() {
  return `
    <div class="admin-view-container">
      <div class="admin-view-header">
        <h1 class="admin-view-title">Analytics & Tráfego</h1>
        <p class="admin-view-subtitle">Métricas de taxa de requisições e Sliding Window Log.</p>
      </div>
      <div class="admin-view-body">
        <div class="cyber-card-matrix cyber-glass-container" style="padding: 2rem; border-radius: 16px; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-electric)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: white;">Rate Limiter Atómico (Lua/Redis)</h3>
              <p style="font-size: 0.8rem; color: var(--text-sub);">Script Lua EVAL com Sliding Window Log.</p>
            </div>
          </div>
          <p style="color: var(--text-sub); font-size: 0.9rem; line-height: 1.7;">
            O gráfico SVG nativo será expandido aqui para visualização em tempo real do tráfego 
            de requisições e taxas de bloqueio do Rate Limiter.
          </p>
        </div>
        <div id="admin-analytics-full-graph" class="cyber-card-matrix cyber-glass-container" style="padding: 2rem; border-radius: 16px; height: 200px;">
          <!-- SVG Graph será renderizado aqui -->
        </div>
      </div>
    </div>
  `;
}
