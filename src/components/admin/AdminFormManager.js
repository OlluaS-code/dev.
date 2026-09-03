import client from "../../api/client.js";

/**
 * setupAdminForm — Gerenciador do formulário de criação/edição de publicações.
 *
 * Tópico 2A (Blueprint): recebe AbortSignal para vincular todos os listeners
 * de forma gerenciada, garantindo limpeza automática na desmontagem da rota.
 *
 * @param {AbortSignal} [signal] - Signal do AbortController da rota ativa.
 */
export const setupAdminForm = (signal = null) => {
  const form = document.getElementById("admin-post-form");
  const feedbackContainer = document.getElementById("form-feedback");
  const submitButton = document.getElementById("submit-btn");
  const fabBtn = document.getElementById("admin-fab-btn");
  const modalOverlay = document.getElementById("admin-modal-overlay");
  const modalClose = document.getElementById("admin-modal-close");
  const modalTitle = document.getElementById("modal-title");

  if (!form || !fabBtn || !modalOverlay) return;

  // Opções de listener com signal — todos os addEventListener abaixo usam isto
  const opts = signal ? { signal } : undefined;

  const openModal = (mode = "create", data = null) => {
    if (mode === "edit" && data) {
      document.getElementById("post-id").value = data.id;
      document.getElementById("post-title").value = data.title;
      form.elements["category"].value = data.category;
      form.elements["techStack"].value = (data.techStack || []).join(", ");

      if (window.AdminMediaInterface) {
        window.AdminMediaInterface.loadMediaData(data.media || []);
      }
      form.elements["content"].value = data.content;

      modalTitle.innerText = "Atualizar Publicação";
      submitButton.innerText = "ATUALIZAR ARTIGO";
    } else {
      form.reset();
      document.getElementById("post-id").value = "";
      if (window.AdminMediaInterface) {
        window.AdminMediaInterface.loadMediaData([]);
      }
      modalTitle.innerText = "Painel de Publicação";
      submitButton.innerText = "PUBLICAR ARTIGO";
    }

    modalOverlay.classList.add("open");
    const titleInput = document.getElementById("post-title");
    if (titleInput) titleInput.focus();
  };

  const closeModal = () => {
    modalOverlay.classList.remove("open");
    form.reset();
    document.getElementById("post-id").value = "";
    fabBtn.focus();
  };

  fabBtn.addEventListener("click", () => openModal("create"), opts);
  modalClose.addEventListener("click", closeModal, opts);

  modalOverlay.addEventListener(
    "click",
    (e) => {
      if (e.target === modalOverlay) closeModal();
    },
    opts
  );

  // Listener de teclado global — com signal evita acúmulo em cada renderização do painel
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
        closeModal();
      }
    },
    opts
  );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const isUpdate = document.getElementById("post-id").value !== "";
      const postId = document.getElementById("post-id").value;

      submitButton.disabled = true;
      submitButton.innerHTML = "Processando...";

      const formData = new FormData(form);
      const rawTechStack = formData.get("techStack") || "";
      const formattedTechStack = rawTechStack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      const payload = {
        title: formData.get("title")?.trim() || "",
        content: formData.get("content")?.trim() || "",
        category: formData.get("category") || "",
        media: window.AdminMediaInterface
          ? window.AdminMediaInterface.capturePayload()
          : [],
        techStack: formattedTechStack,
      };

      try {
        if (isUpdate) {
          await client.put(`/publications/${postId}`, payload);
          feedbackContainer.innerHTML = "Sucesso! Atualizado com sucesso.";
        } else {
          await client.post("/publications", payload);
          feedbackContainer.innerHTML = "Sucesso! Publicado com sucesso.";
        }

        feedbackContainer.className =
          "rounded-lg p-4 text-sm font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        feedbackContainer.classList.remove("hidden");

        setTimeout(() => {
          closeModal();
          window.router.navigate("feed");
        }, 1500);
      } catch (err) {
        feedbackContainer.innerHTML =
          "Erro: " + (err.message || "Dados inválidos");
        feedbackContainer.className =
          "rounded-lg p-4 text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20";
        feedbackContainer.classList.remove("hidden");
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = isUpdate
          ? "ATUALIZAR ARTIGO"
          : "PUBLICAR ARTIGO";
      }
    },
    opts
  );

  window.AdminUI = window.AdminUI || {};
  window.AdminUI.openEditModal = (postData) => {
    if (postData) {
      try {
        openModal("edit", postData);
      } catch (err) {
        console.error("Erro ao abrir modal para edição", err);
      }
    }
  };
};
