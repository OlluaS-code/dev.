import client from "../../api/client.js";

export const AdminDeleteModalHTML = () => `
  <div id="admin-delete-modal" style="display: none; position: fixed; inset: 0; z-index: 9999; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px);">
    <div class="auth-bento cyber-glass-container" style="background: rgba(15, 23, 35, 0.95); max-width: 400px; padding: 2rem; text-align: center; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px;">
      <div style="margin-bottom: 1.5rem; color: #ef4444; display: flex; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
        </svg>
      </div>
      <h2 id="admin-delete-title" style="font-size: 1.4rem; font-weight: bold; margin-bottom: 0.5rem; color: #ffffff;">Excluir Publicação?</h2>
      <p id="admin-delete-desc" style="color: #a0aec0; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5;">
        Esta ação é permanente e não poderá ser desfeita. Todos os dados desta publicação serão perdidos.
      </p>
      <style>
        .modal-btn-cancel {
          padding: 0.75rem 1.5rem; border-radius: 8px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; transition: all 0.2s;
        }
        .modal-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .modal-btn-delete {
          padding: 0.75rem 1.5rem; border-radius: 8px; background: #ef4444; color: white; border: none; cursor: pointer; font-weight: bold; transition: all 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .modal-btn-delete:hover {
          background: #dc2626;
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
          transform: translateY(-1px);
        }
      </style>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="admin-delete-cancel" class="modal-btn-cancel">
          Cancelar
        </button>
        <button id="admin-delete-confirm" class="modal-btn-delete">
          Sim, Excluir
        </button>
      </div>
    </div>
  </div>
`;

/**
 * setupDeleteModal — Configura o modal de confirmação de exclusão.
 *
 * Tópico 2A (Blueprint): recebe AbortSignal para vincular todos os listeners
 * de forma gerenciada, garantindo limpeza automática na desmontagem da rota.
 *
 * @param {AbortSignal} [signal] - Signal do AbortController da rota ativa.
 */
export const setupDeleteModal = (signal = null) => {
  const deleteModal = document.getElementById("admin-delete-modal");
  const deleteConfirmBtn = document.getElementById("admin-delete-confirm");
  const deleteCancelBtn = document.getElementById("admin-delete-cancel");
  const deleteTitle = document.getElementById("admin-delete-title");
  const deleteDesc = document.getElementById("admin-delete-desc");
  let deleteContext = { id: null, type: 'publication' };

  if (!deleteModal) return;

  // Opções de listener com signal — removidos automaticamente ao abortar a rota
  const opts = signal ? { signal } : undefined;

  const closeDeleteModal = () => {
    deleteModal.style.display = "none";
    deleteContext = { id: null, type: 'publication' };
  };

  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener("click", closeDeleteModal, opts);
  }

  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener(
      "click",
      async () => {
        if (!deleteContext.id) return;
        const { id, type } = deleteContext;
        const isSpec = type === 'spec';
        const cardId = isSpec ? `spec-card-${id}` : `post-card-${id}`;
        const card = document.getElementById(cardId);
        
        closeDeleteModal();

        if (card) card.classList.add("deleting");

        try {
          const endpoint = isSpec ? `/specifications/${id}` : `/publications/${id}`;
          await client.delete(endpoint);
          if (card) card.remove();
          
          if (isSpec && document.querySelectorAll('#admin-specs-grid .cyber-card-matrix').length === 0) {
            const container = document.getElementById('admin-specs-grid');
            if (container) container.innerHTML = '<p style="color: var(--text-sub);">Nenhuma especialidade cadastrada. Adicione acima.</p>';
          }
        } catch (err) {
          if (card) {
            card.classList.remove("deleting");
            card.classList.add("animate-shake");
            setTimeout(() => card.classList.remove("animate-shake"), 500);
          }
          console.error("Falha ao deletar:", err);
        }
      },
      opts
    );
  }

  window.AdminUI = window.AdminUI || {};
  window.AdminUI.requestDelete = (id, type = 'publication') => {
    deleteContext = { id: String(id), type };
    
    if (type === 'spec') {
      deleteTitle.textContent = "Excluir Especialidade?";
      deleteDesc.textContent = "Esta ação é permanente. Tem certeza que deseja remover esta stack do sistema?";
    } else {
      deleteTitle.textContent = "Excluir Publicação?";
      deleteDesc.textContent = "Esta ação é permanente e não poderá ser desfeita. Todos os dados desta publicação serão perdidos.";
    }
    
    deleteModal.style.display = "flex";
  };
};
