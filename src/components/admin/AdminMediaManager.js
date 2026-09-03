/**
 * setupAdminMedia — Gerenciador de linhas de mídia do formulário admin.
 *
 * Tópico 2A (Blueprint): recebe AbortSignal para vincular todos os listeners
 * de forma gerenciada, garantindo limpeza automática na desmontagem da rota.
 *
 * @param {AbortSignal} [signal] - Signal do AbortController da rota ativa.
 */
export const setupAdminMedia = (signal = null) => {
  const listContainer = document.getElementById("media-rows-list");
  const addBtn = document.getElementById("add-media-row-btn");
  const MAX_ITEMS = 3;
  const listenerOptions = signal ? { signal } : undefined;

  function secureSanitizer(text) {
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
  }

  function getCurrentRowCount() {
    return listContainer ? listContainer.querySelectorAll(".media-row").length : 0;
  }

  function updateControlsState() {
    if (!addBtn) return;
    const count = getCurrentRowCount();
    addBtn.disabled = count >= MAX_ITEMS;
    if (count >= MAX_ITEMS) {
      addBtn.style.opacity = "0.5";
      addBtn.style.cursor = "not-allowed";
    } else {
      addBtn.style.opacity = "1";
      addBtn.style.cursor = "pointer";
    }
  }

  function createMediaRow(url = "", type = "image") {
    if (!listContainer) return;
    const currentCount = getCurrentRowCount();
    if (currentCount >= MAX_ITEMS) return;

    const uniqueId = `media-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rowDiv = document.createElement("div");
    rowDiv.className = "media-row";
    rowDiv.id = uniqueId;
    rowDiv.style.display = "flex";
    rowDiv.style.gap = "0.5rem";

    rowDiv.innerHTML = `
      <input type="url" class="media-url-input auth-input" placeholder="https://..." value="${secureSanitizer(url)}" required style="flex: 2; min-width: 0;">
      <select class="media-type-select auth-input" required style="flex: 1; min-width: 0; appearance: auto; cursor: pointer; padding-right: 2rem;">
        <option value="image" ${type === "image" ? "selected" : ""} style="background: #0b0f19;">Imagem</option>
        <option value="video" ${type === "video" ? "selected" : ""} style="background: #0b0f19;">Vídeo</option>
      </select>
      <button type="button" class="remove-row-btn auth-submit" data-target="${uniqueId}" style="width: auto; flex: 0 0 54px; margin-top: 0; padding: 0; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; font-size: 1.5rem; display: flex; align-items: center; justify-content: center;">&times;</button>
    `;

    // Listener da linha com signal — removido automaticamente quando a rota for desmontada
    rowDiv.querySelector(".remove-row-btn").addEventListener(
      "click",
      function (event) {
        const targetId = event.target.getAttribute("data-target");
        const rowToRemove = document.getElementById(targetId);
        if (rowToRemove) {
          rowToRemove.remove();
          updateControlsState();
        }
      },
      listenerOptions
    );

    listContainer.appendChild(rowDiv);
    updateControlsState();
  }

  if (addBtn) {
    // Signal aplicado: se a rota for abortada, o listener é desvinculado automaticamente
    addBtn.addEventListener("click", () => createMediaRow(), listenerOptions);
  }

  window.AdminMediaInterface = {
    capturePayload: function () {
      const payload = [];
      if (!listContainer) return payload;
      const rows = listContainer.querySelectorAll(".media-row");

      for (const row of rows) {
        const urlVal = row.querySelector(".media-url-input").value.trim();
        const typeVal = row.querySelector(".media-type-select").value;

        if (urlVal !== "") {
          try {
            const parsedUrl = new URL(urlVal);
            if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
              payload.push({ url: parsedUrl.href, type: typeVal });
            }
          } catch (e) {
            console.error("URL Inválida rejeitada:", urlVal);
          }
        }
      }
      return payload;
    },
    loadMediaData: function (mediaArray) {
      if (!listContainer) return;
      listContainer.innerHTML = "";
      if (Array.isArray(mediaArray)) {
        mediaArray.forEach((item) => createMediaRow(item.url, item.type));
      }
      updateControlsState();
    },
  };
};
