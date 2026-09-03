import { isAdmin } from "../utils/auth.js";

export const AdminTools = () => {
  if (!isAdmin()) return "";

  return `
    <!-- Botão de Ação Flutuante (FAB) -->
    <button id="admin-fab-btn" class="admin-fab" aria-label="Nova Publicação" title="Criar Nova Publicação">
      +
    </button>

    <!-- Overlay do Modal -->
    <div id="admin-modal-overlay" class="admin-modal-overlay">
      
      <!-- Container do Modal (Dialog) -->
      <div id="admin-modal-content" class="admin-modal-content relative" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        
        <button id="admin-modal-close" class="admin-modal-close" aria-label="Fechar modal">&times;</button>
        
        <div class="auth-header" style="margin-bottom: 2rem;">
          <h2 id="modal-title" class="auth-title" style="font-size: 1.5rem;">Painel de Publicação</h2>
          <p class="auth-subtitle">PREENCHA OS DADOS DO NOVO ARTIGO</p>
        </div>

        <form id="admin-post-form" class="auth-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <input type="hidden" id="post-id" name="id" value="">
          
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div class="auth-input-group" style="flex: 1; min-width: 250px;">
              <label class="auth-label">Título do Artigo</label>
              <input name="title" id="post-title" type="text" class="auth-input" placeholder="Ex: Introdução ao Fastify 5" required autocomplete="off">
            </div>

            <div class="auth-input-group" style="flex: 1; min-width: 200px;">
              <label class="auth-label">Categoria</label>
              <select name="category" class="auth-input" required style="appearance: auto; cursor: pointer;">
                <option value="" disabled selected>Selecione uma categoria...</option>
                <option value="Frontend" style="background: #0b0f19;">Frontend</option>
                <option value="Backend" style="background: #0b0f19;">Backend</option>
                <option value="Mobile" style="background: #0b0f19;">Mobile</option>
                <option value="FullStack" style="background: #0b0f19;">FullStack</option>
                <option value="DevOps" style="background: #0b0f19;">DevOps</option>
              </select>
            </div>
          </div>

          <div id="media-admin-component" class="media-admin-box" style="border: 1px solid var(--glass-border); padding: 1.5rem; border-radius: 12px; background: rgba(255, 255, 255, 0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <label class="auth-label" style="margin: 0;">Mídias Relacionadas (Máx. 3)</label>
              <button type="button" id="add-media-row-btn" class="auth-submit" style="padding: 0.4rem 1rem; font-size: 0.8rem; background: rgba(77, 118, 255, 0.2); border: 1px solid var(--primary);">+ Adicionar Mídia</button>
            </div>
            
            <div id="media-rows-list" class="media-rows-list" style="display: flex; flex-direction: column; gap: 1rem;">
              <!-- Linhas de mídia dinâmicas -->
            </div>
          </div>

          <div class="auth-input-group">
            <label class="auth-label">Tecnologias Utilizadas</label>
            <input name="techStack" type="text" class="auth-input" placeholder="React, Node.js, Tailwind" required autocomplete="off">
            <p style="font-size: 0.75rem; color: var(--silver-dim); margin-top: 0.5rem; text-transform: uppercase;">
              Introduza os termos separados por vírgula.
            </p>
          </div>

          <div class="auth-input-group">
            <label class="auth-label">Conteúdo/Descrição do Post</label>
            <textarea name="content" class="auth-input" required rows="5" placeholder="Escreva aqui o conteúdo do seu artigo..." style="resize: vertical; min-height: 100px;"></textarea>
          </div>

          <div id="form-feedback" class="hidden" style="padding: 1rem; border-radius: 8px; font-weight: 500; font-size: 0.875rem; transition: all 0.3s; margin-top: 1rem;"></div>

          <button type="submit" id="submit-btn" class="auth-submit" style="margin-top: 1rem; width: fit-content; align-self: flex-end; padding: 0.8rem 2.5rem;">
            PUBLICAR ARTIGO
          </button>
        </form>
      </div>
    </div>
  `;
};
