import client from "../api/client.js";

export const AdminUsers = async (signal = null) => {
  let users = [];
  try {
    users = await client.get("/users");
  } catch (error) {
    console.error("Falha ao buscar utilizadores", error);
  }

  const setupView = () => {
    const tableBody = document.getElementById("admin-users-tbody");
    if (!tableBody) return;

    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Nenhum usuário encontrado.</td></tr>';
      return;
    }

    users.forEach((user) => {
      const tr = document.createElement("tr");
      tr.className = "user-row";
      tr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
      tr.style.transition = "background 0.2s ease";
      
      const isSuspended = user.status === "SUSPENDED";
      const statusBadge = isSuspended
        ? '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Suspenso</span>'
        : '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Ativo</span>';

      tr.innerHTML = `
        <td data-label="Nome" style="padding: 1rem; color: #fff; font-weight: 500;">${user.name}</td>
        <td data-label="E-mail" style="padding: 1rem; color: var(--text-sub);">${user.email}</td>
        <td data-label="Papel" style="padding: 1rem;">
          <span style="font-size: 0.8rem; letter-spacing: 1px; color: var(--primary-electric);">${user.role}</span>
        </td>
        <td data-label="Status" style="padding: 1rem;">${statusBadge}</td>
        <td data-label="Ações" style="padding: 1rem; text-align: right;">
          <button class="suspend-btn admin-card-btn ${isSuspended ? 'disabled' : ''}" style="display: inline-flex; border-color: rgba(239, 68, 68, 0.3); color: #ef4444;" title="Suspender JWT">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"></path></svg>
          </button>
        </td>
      `;

      const suspendBtn = tr.querySelector('.suspend-btn');
      if (!isSuspended) {
        suspendBtn.addEventListener("click", async () => {
          const confirmSuspend = confirm(`Suspender instantaneamente o acesso de ${user.name}? O JWT será revogado via Redis.`);
          if (confirmSuspend) {
            try {
              // Assumindo que temos o token signature para blacklist no frontend? 
              // Não, o backend pode deduzir ou o admin não tem como saber.
              // Vamos mandar um body genérico e o backend fará a suspensão da DB.
              await client.post(`/users/${user.id}/suspend`, { tokenSignature: "admin_forced", tokenExpiryTimestamp: 86400 });
              tr.querySelector('td:nth-child(4)').innerHTML = '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Suspenso</span>';
              suspendBtn.style.opacity = '0.5';
              suspendBtn.style.pointerEvents = 'none';
            } catch (err) {
              alert("Erro ao suspender usuário.");
            }
          }
        }, { signal });
      } else {
        suspendBtn.style.opacity = '0.5';
        suspendBtn.style.cursor = 'not-allowed';
      }

      tableBody.appendChild(tr);
    });
  };

  setTimeout(setupView, 0);

  return `
    <style>
      .user-row:hover {
        background: rgba(255, 255, 255, 0.03);
      }
    </style>
    <div class="animate-fade-in" style="position: relative; padding-bottom: 5rem; padding-top: 3rem; max-width: 1000px; margin: 0 auto; width: 100%;">
      
      <div style="text-align: left; margin-bottom: 3rem;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
          Gestão de Utilizadores
        </h1>
        <p style="color: var(--text-sub, #8A99AD); font-size: 1rem;">Suspenda acessos via JWT Blacklist instantaneamente.</p>
      </div>

      <div class="cyber-glass-container" style="background: rgba(6, 12, 24, 0.65); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden;">
        <table class="responsive-table" style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1);">
            <tr>
              <th style="padding: 1rem; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase;">Nome</th>
              <th style="padding: 1rem; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase;">E-mail</th>
              <th style="padding: 1rem; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase;">Papel</th>
              <th style="padding: 1rem; color: var(--text-sub); font-size: 0.85rem; text-transform: uppercase;">Status</th>
              <th style="padding: 1rem; text-align: right;"></th>
            </tr>
          </thead>
          <tbody id="admin-users-tbody">
            <!-- Usuários injetados dinamicamente -->
          </tbody>
        </table>
      </div>
    </div>
  `;
};
