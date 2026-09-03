import client from "../api/client.js";

export const AdminAudit = async (signal = null) => {
  let auditLogs = [];
  try {
    auditLogs = await client.get("/interactions/audit/global");
  } catch (error) {
    console.error("Falha ao buscar logs de auditoria", error);
  }

  const setupView = () => {
    const timelineContainer = document.getElementById("admin-audit-timeline");
    if (!timelineContainer) return;

    if (auditLogs.length === 0) {
      timelineContainer.innerHTML = '<p style="text-align:center; color: var(--text-sub); padding: 2rem;">Nenhum registro de auditoria encontrado.</p>';
      return;
    }

    auditLogs.forEach((log) => {
      const isLike = log.type === "LIKE";
      const iconColor = isLike ? "#ef4444" : "#3b82f6";
      const icon = isLike 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"></path></svg>';

      const userName = log.user ? log.user.name : "Visitante Anônimo";
      const pubTitle = log.publication ? log.publication.title : "Publicação Excluída";
      
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.gap = "1.5rem";
      item.style.position = "relative";
      item.style.paddingBottom = "2rem";

      item.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: ${iconColor}; z-index: 2;">
            ${icon}
          </div>
          <div style="position: absolute; top: 32px; bottom: -8px; width: 1px; background: rgba(255,255,255,0.1); z-index: 1;"></div>
        </div>
        
        <div class="cyber-glass-container" style="flex: 1; background: rgba(6, 12, 24, 0.65); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #fff; font-weight: 600;">${userName}</span>
            <span style="color: var(--text-sub); font-size: 0.8rem; font-family: monospace;">${new Date(log.createdAt).toLocaleString()}</span>
          </div>
          <p style="color: var(--text-sub); font-size: 0.9rem; margin: 0;">
            ${isLike ? 'Curtiu a publicação' : 'Compartilhou a publicação'} <strong style="color: var(--primary-electric);">${pubTitle}</strong>.
          </p>
        </div>
      `;
      timelineContainer.appendChild(item);
    });
    
    // Remove last line
    const lastLine = timelineContainer.lastElementChild?.querySelector('div > div:nth-child(2)');
    if (lastLine) lastLine.style.display = 'none';
  };

  setTimeout(setupView, 0);

  return `
    <div class="animate-fade-in" style="position: relative; padding-bottom: 5rem; padding-top: 3rem; max-width: 800px; margin: 0 auto; width: 100%;">
      
      <div style="text-align: left; margin-bottom: 3rem;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
          Auditoria de Interações
        </h1>
        <p style="color: var(--text-sub, #8A99AD); font-size: 1rem;">Rastreamento cronológico de likes e shares no ecossistema.</p>
      </div>

      <div id="admin-audit-timeline" style="display: flex; flex-direction: column;">
        <!-- Timeline injetada dinamicamente -->
      </div>
    </div>
  `;
};
