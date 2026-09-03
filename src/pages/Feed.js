import client from "../api/client.js";

/**
 * Feed — Painel de Operações Administrativo.
 * Removida a Virtual List para permitir scroll natural da página inteira.
 *
 * @param {AbortSignal} [signal] - Signal do AbortController da rota ativa.
 */
export const Feed = async (signal = null) => {
  let posts = [];
  try {
    // Apenda o timestamp para ignorar o stale-while-revalidate do navegador no painel admin
    posts = await client.get(`/publications/feed?t=${Date.now()}`);
  } catch (e) {
    posts = [];
  }

  const setupAdminUI = () => {
    // Inicializa o Gráfico de Analytics
    const analyticsContainer = document.getElementById("admin-analytics-graph");
    if (analyticsContainer && window.SVGraphAnalytics) {
      const graph = new window.SVGraphAnalytics("admin-analytics-graph", {
        width: 300,
        height: 60,
        padding: 5,
        data: [10, 25, 15, 40, 20, 50, 30], // Mock inicial (seria fetch do backend)
        color: 'var(--primary-electric, #4D76FF)'
      });
      // Inicia a animação quando renderizado
      setTimeout(() => graph.draw(), 500);
    }

    const container = document.getElementById("admin-posts-container");
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-sub); padding-top: 2rem;">Nenhuma publicação encontrada no painel.</p>';
      return;
    }

    // Renderiza cada post diretamente
    posts.forEach((post) => {
      const article = document.createElement("article");
      article.id = `post-card-${post.id}`;
      article.className = "cyber-card-matrix cyber-glass-container";
      article.style.display = "flex";
      article.style.flexDirection = "column";
      article.style.justifyContent = "space-between";
      article.style.position = "relative";
      article.style.padding = "1.5rem";

      const mediaHtml = post.media && post.media.length > 0
        ? `
          <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--glass-border); position: relative;">
            ${post.media[0].type === "video"
                ? `<video src="${post.media[0].url}" style="width: 100%; height: 100%; object-fit: cover;" muted loop autoplay></video>`
                : `<img src="${post.media[0].url}" style="width: 100%; height: 100%; object-fit: cover;" />`
            }
            ${post.media.length > 1
                ? `<div style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; backdrop-filter: blur(4px);">+${post.media.length - 1} mídias</div>`
                : ""
            }
          </div>
        ` : "";

      article.innerHTML = `
        <div style="position: absolute; top: 1.5rem; right: 1.5rem; display: flex; gap: 0.5rem; z-index: 10;">
          <button class="edit-post-btn admin-card-btn edit" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M5 21h14c1.1 0 2-.9 2-2v-7h-2v7H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2"></path><path d="M7 13v3c0 .55.45 1 1 1h3c.27 0 .52-.11.71-.29l9-9a.996.996 0 0 0 0-1.41l-3-3a.996.996 0 0 0-1.41 0l-9.01 8.99A1 1 0 0 0 7 13m10-7.59L18.59 7 17.5 8.09 15.91 6.5zm-8 8 5.5-5.5 1.59 1.59-5.5 5.5H9z"></path></svg>
          </button>
          <button class="delete-post-btn admin-card-btn delete" title="Excluir">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="m7.76 14.83-2.83 2.83 1.41 1.41 2.83-2.83 2.12-2.12.71-.71.71.71 1.41 1.42 3.54 3.53 1.41-1.41-3.53-3.54-1.42-1.41-.71-.71 5.66-5.66-1.41-1.41L12 10.59 6.34 4.93 4.93 6.34 10.59 12l-.71.71z"></path></svg>
          </button>
        </div>
        
        <div style="flex: 1;">
          <h3 style="font-size: 1.4rem; font-weight: bold; margin-bottom: 0.5rem; padding-right: 6rem; color: #fff;">${post.title}</h3>
          <p style="font-size: 0.75rem; color: var(--primary-electric, #4facfe); font-weight: 600; text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 1px;">
            ${post.category} • ${(post.techStack || []).join(" • ")}
          </p>
          ${mediaHtml}
          <p style="color: var(--text-sub, #a0aec0); font-size: 0.95rem; line-height: 1.6;">
            ${post.content}
          </p>
        </div>
        
        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 1rem;">
          <div style="display: flex; gap: 1rem; color: var(--text-sub); font-size: 0.85rem; font-weight: 500;">
            <span style="display: flex; align-items: center; gap: 4px;">❤️ ${(post.interactions || []).filter((i) => i.type === "LIKE").length}</span>
            <span style="display: flex; align-items: center; gap: 4px;">🔗 ${(post.interactions || []).filter((i) => i.type === "SHARE").length}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-sub); opacity: 0.6; font-family: monospace;">
            ${new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      `;

      // Eventos vinculados via closure e signal
      const editBtn = article.querySelector('.edit-post-btn');
      const deleteBtn = article.querySelector('.delete-post-btn');
      const opts = signal ? { signal } : undefined;

      editBtn.addEventListener("click", () => {
        if (window.AdminUI && window.AdminUI.openEditModal) {
          window.AdminUI.openEditModal(post);
        }
      }, opts);

      deleteBtn.addEventListener("click", () => {
        if (window.AdminUI && window.AdminUI.requestDelete) {
          window.AdminUI.requestDelete(post.id);
        }
      }, opts);

      container.appendChild(article);
    });
  };

  setTimeout(() => {
    setupAdminUI();
  }, 0);

  return `
    <style>
      .admin-card-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--auth-text-muted, #8892b0);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .admin-card-btn svg { width: 18px; height: 18px; transition: transform 0.2s; }
      .admin-card-btn.edit:hover { color: #3b82f6; border-color: rgba(59, 130, 246, 0.5); background: rgba(59, 130, 246, 0.1); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
      .admin-card-btn.edit:hover svg { transform: scale(1.1); }
      .admin-card-btn.delete:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
      .admin-card-btn.delete:hover svg { transform: scale(1.1) rotate(90deg); }
    </style>
    
    <div class="animate-fade-in" style="padding-bottom: 5rem; padding-top: 3rem; max-width: 900px; margin: 0 auto; width: 100%;">
      
      <!-- Cabeçalho do Feed -->
      <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem;">
          Painel de Operações
        </h1>
        <p style="color: var(--text-sub, #8A99AD); font-size: 1rem;">Gerencie seus projetos e interações globais.</p>
        
        <!-- SVG Analytics Container -->
        <div id="admin-analytics-graph" style="margin: 24px auto; width: 100%; max-width: 400px; height: 70px;"></div>
      </div>

      <!-- Container dos Posts (Grid natural) -->
      <div id="admin-posts-container" style="display: flex; flex-direction: column; gap: 2rem;">
        <!-- Elementos inseridos dinamicamente -->
      </div>

    </div>
  `;
};
