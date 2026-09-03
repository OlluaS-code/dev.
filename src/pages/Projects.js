import client from "../api/client.js";

// Estado compartilhado
let data = [];
let order = [];
let isAnimating = false;
let currentMediaIndex = 0;

// --- Utilitário: extrai o ID de vídeos do YouTube ---
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    // youtu.be/ID
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    // youtube.com/watch?v=ID
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch (e) { /* url inválida */ }
  return null;
}

// --- FUNÇÃO DE CONEXÃO: BUSCA -> ANIMAÇÃO DO SLIDER ---
export async function showFeed(searchTerm) {
  const term = searchTerm.toLowerCase().trim();

  // A busca será feita 100% no Frontend. Como o volume de dados é pequeno (Portfólio), 
  // já baixamos tudo via /publications/feed no initProjects().
  // O endpoint /publications/search exige um enum exato de categoria, o que quebraria buscas livres.


  const targetIndex = data.findIndex(
    (item) =>
      item.title.toLowerCase().includes(term) ||
      item.title2.toLowerCase().includes(term) ||
      item.place.toLowerCase().includes(term),
  );

  if (targetIndex !== -1) {
    if (isAnimating) return;
    isAnimating = true;

    while (order[0] !== targetIndex) {
      order.push(order.shift());
    }

    renderLayout();
    updateText();
    setTimeout(() => (isAnimating = false), 1200);
  } else {
    gsap.to(".search-container", {
      x: 10,
      repeat: 3,
      yoyo: true,
      duration: 0.05,
      onComplete: () => gsap.set(".search-container", { x: 0 }),
    });
  }
}

function renderLayout(isFirstLoad = false) {
  const { innerWidth: w, innerHeight: h } = window;
  const isMobile = w < 768;

  const cardW = isMobile ? 80 : 170;
  const cardH = isMobile ? 120 : 250;
  const gap = isMobile ? 10 : 26;

  const [active, ...rest] = order;

  // Card principal expande para ocupar toda a tela
  gsap.to(`#card-${active}`, {
    x: 0,
    y: 0,
    width: "100%",
    height: "100%",
    borderRadius: 0,
    zIndex: 1,
    duration: isFirstLoad ? 0 : 1.2,
    ease: "expo.inOut",
  });

  // Apenas 4 miniaturas 100% visíveis, a 5ª fica esfumaçada saindo da tela.
  const maxVisible = 4;

  // Calcula a largura baseada apenas nas miniaturas visíveis para manter o bloco sempre ancorado à direita
  const itemsToFit = Math.min(rest.length, maxVisible);
  const totalWidth = (cardW + gap) * itemsToFit;
  let startX = w - totalWidth - w * 0.05;

  // Garante que as miniaturas não transbordam para a esquerda (cobre o texto no mobile)
  const minSafeX = isMobile ? 10 : 20;
  if (startX < minSafeX) {
    startX = minSafeX;
  }

  // Posição vertical das miniaturas: base da tela com margem de segurança
  const startY = h - cardH - (isMobile ? 90 : 50);

  rest.forEach((id, index) => {
    let opacity = 1;
    let scale = 1;
    let xPos = startX + index * (cardW + gap);
    let blurAmount = 0;

    if (index < maxVisible) {
      // As 4 primeiras miniaturas são perfeitamente visíveis
      opacity = 1;
      scale = 1;
      blurAmount = 0;
    } else if (index === maxVisible) {
      // A 5ª miniatura é o "fantasma" que indica o loop infinito
      opacity = 0.3;
      scale = 0.9;
      blurAmount = 4; // Um leve desfoque para dar efeito esfumaçado
    } else {
      // Da 6ª em diante, ficam totalmente escondidas esperando a vez delas fora da tela
      opacity = 0;
      scale = 0.8;
      xPos = w + cardW; // Joga pra fora da tela na direita
    }

    gsap.to(`#card-${id}`, {
      x: xPos,
      y: startY,
      width: cardW,
      height: cardH,
      opacity: opacity,
      scale: scale,
      filter: `blur(${blurAmount}px)`,
      borderRadius: 12,
      zIndex: 10 - index, // Z-index decrescente para que quem vem de trás fique por baixo
      duration: isFirstLoad ? 0 : 1.2,
      ease: "expo.inOut",
      delay: isFirstLoad ? 0 : index * 0.03,
    });
  });

  // Atualiza numeração e barra de progresso
  order.forEach((id, index) => {
    gsap.to(`#num-${id}`, {
      y: index === 0 ? 0 : 50,
      opacity: index === 0 ? 1 : 0,
      duration: 0.6,
    });
  });

  const progress = ((active + 1) / data.length) * 100;
  gsap.to("#progress", { width: `${progress}%`, duration: 0.8 });
}

function updateText() {
  const item = data[order[0]];
  const container = document.getElementById("details-container");

  // Sincroniza o estado de curtir do item atual
  const feedLikeBtn = document.getElementById("feed-btn-like");
  const feedShareBtn = document.getElementById("feed-btn-share");
  
  if (feedLikeBtn) {
    if (item.isLiked) {
      feedLikeBtn.classList.add("liked");
      const heart = feedLikeBtn.querySelector(".heart-icon");
      if (heart) heart.style.fill = "#ff4757";
    } else {
      feedLikeBtn.classList.remove("liked");
      const heart = feedLikeBtn.querySelector(".heart-icon");
      if (heart) heart.style.fill = "none";
    }
  }
  if (feedShareBtn) feedShareBtn.classList.remove("shared");

  const tl = gsap.timeline();
  tl.to(container.querySelectorAll(".text, .title-main, .desc, .cta"), {
    y: 30,
    opacity: 0,
    duration: 0.3,
    stagger: 0.05,
  })
    .add(() => {
      document.getElementById("title-1").innerText = item.title;
      document.getElementById("title-2").innerText = item.title2;
      container.querySelector(".place-box .text").innerText = item.place;
      document.getElementById("description").innerText = item.desc;
    })
    .to(container.querySelectorAll(".text, .title-main, .desc, .cta"), {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    });
}

function next() {
  if (isAnimating) return;
  isAnimating = true;
  order.push(order.shift());
  
  if (data && data[order[0]]) {
    persistStateInURL(data[order[0]].id);
  }
  
  renderLayout();
  updateText();
  setTimeout(() => (isAnimating = false), 1200);
}

function prev() {
  if (isAnimating) return;
  isAnimating = true;
  order.unshift(order.pop());
  
  if (data && data[order[0]]) {
    persistStateInURL(data[order[0]].id);
  }
  
  renderLayout();
  updateText();
  setTimeout(() => (isAnimating = false), 1200);
}

function secureUrlValidator(url) {
  if (!url) return "about:blank";
  const sanitized = url.trim();
  const dangerousPatterns = /^(javascript:|data:|vbscript:)/i;
  if (dangerousPatterns.test(sanitized)) {
    console.error("Vetor XSS bloqueado para URL:", sanitized);
    return "about:blank";
  }
  return sanitized;
}

function updateModalMedia(gallery) {
  const wrapper = document.getElementById("modal-media-wrapper");
  wrapper.textContent = ""; // Limpa os nós antigos de forma segura
  
  gallery.forEach((mediaObj, index) => {
    const isActive = index === 0 ? "active" : "";
    const verifiedUrl = secureUrlValidator(mediaObj.url);
    const ytId = getYouTubeId(verifiedUrl);
    
    if (ytId) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&rel=0&modestbranding=1`;
      iframe.className = isActive;
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("loading", "lazy");
      wrapper.appendChild(iframe);
    } else if (mediaObj.type === "video" || verifiedUrl.includes(".mp4")) {
      const video = document.createElement("video");
      video.src = verifiedUrl;
      video.className = isActive;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.controls = true;
      wrapper.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = verifiedUrl;
      img.className = isActive;
      img.alt = "media do projeto";
      img.setAttribute("loading", "lazy");
      wrapper.appendChild(img);
    }
  });

  currentMediaIndex = 0;

  const arrows = document.querySelectorAll(".carousel-arrow");
  arrows.forEach(
    (a) => (a.style.display = gallery.length > 1 ? "flex" : "none"),
  );
}

function changeMedia(direction) {
  const item = data[order[0]];
  const medias = document.querySelectorAll(
    "#modal-media-wrapper img, #modal-media-wrapper video, #modal-media-wrapper iframe",
  );

  medias[currentMediaIndex].classList.remove("active");
  currentMediaIndex =
    (currentMediaIndex + direction + item.gallery.length) % item.gallery.length;
  medias[currentMediaIndex].classList.add("active");
}

function openModal() {
  const modal = document.getElementById("project-modal");
  const item = data[order[0]];

  document.getElementById("modal-project-title").innerText =
    `${item.title} ${item.title2}`;
  document.getElementById("modal-project-desc").innerText = item.desc;

  const gallery = item.gallery || [];
  updateModalMedia(gallery);

  // Sincronizar estados dos botões sociais ao abrir cada projeto
  const likeBtn = document.getElementById("btn-like");
  const shareBtn = document.getElementById("btn-share");
  if (likeBtn) {
    if (item.isLiked) {
      likeBtn.classList.add("liked");
      likeBtn.querySelector("span").textContent = "Curtido";
    } else {
      likeBtn.classList.remove("liked");
      likeBtn.querySelector("span").textContent = "Curtir";
    }
  }
  if (shareBtn) {
    shareBtn.classList.remove("shared");
    shareBtn.querySelector("span").textContent = "Compartilhar";
  }

  modal.style.display = "flex";
  gsap.to(modal, { opacity: 1, duration: 0.4 });
  gsap.from(".modal-content", { y: 30, opacity: 0, duration: 0.5 });
}

function closeModal() {
  const modal = document.getElementById("project-modal");
  gsap.to(modal, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => (modal.style.display = "none"),
  });
}

/**
 * Obtém e sanitiza o parâmetro 'open' presente no fragmento hash da URL.
 * Exemplo de URL esperado: http://localhost:5500/#/?open=42
 */
function getSanitizedOpenParam() {
    try {
        const hash = window.location.hash;
        if (!hash.includes('?')) return null;

        const queryString = hash.substring(hash.indexOf('?'));
        const searchParams = new URLSearchParams(queryString);
        const rawOpenValue = searchParams.get('open');

        if (!rawOpenValue) return null;
        return rawOpenValue; // Nossa API usa UUID/Strings como ID, então não usamos parseInt
    } catch (error) {
        console.error("Falha ao analisar os parâmetros da URL de forma segura:", error);
        return null;
    }
}

/**
 * Atualiza a barra de endereços com o identificador do projeto ativo sem recarregar a página.
 */
function persistStateInURL(projectId) {
    if (!projectId) return;
    const cleanURL = `${window.location.origin}${window.location.pathname}#/?open=${projectId}`;
    window.history.replaceState({ activeProjectId: projectId }, "", cleanURL);
}

/**
 * Realiza a rotação cíclica matemática de arrays.
 */
function shiftArrayLeft(arr, steps) {
    const n = arr.length;
    if (n === 0) return arr;
    const offset = ((steps % n) + n) % n;
    return arr.slice(offset).concat(arr.slice(0, offset));
}

/**
 * Ponto de entrada principal da seção de projetos.
 * Chamado pelo app.js após a transição SPA da landing page.
 */
export async function initProjects() {
  try {
    const apiData = await client.get("/publications/feed");
    const userStr = localStorage.getItem("user");
    let myUserId = null;
    if (userStr) {
      try { myUserId = JSON.parse(userStr).id; } catch (e) {}
    }

    data = apiData.map(pub => {
      const parts = pub.title.split(" ");
      const title1 = parts.shift();
      const title2 = parts.join(" ");
      
      const interactions = pub.interactions || [];
      const isLiked = interactions.some(i => i.type === "LIKE" && i.userId === myUserId);
      const likesCount = interactions.filter(i => i.type === "LIKE").length;

      return {
        id: pub.id,
        title: title1,
        title2: title2,
        place: pub.category,
        desc: pub.content,
        gallery: pub.media || [],
        techStack: pub.techStack || [],
        linkUrl: pub.linkUrl,
        repoUrl: pub.repoUrl,
        isLiked: isLiked,
        likesCount: likesCount
      };
    });

    if (data.length === 0) {
      console.warn("Nenhum projeto encontrado.");
      return;
    }

    order = Array.from({ length: data.length }, (_, i) => i);
    
    // --- LÓGICA DE ROTEAÇÃO MATEMÁTICA PARA DEEP LINKING ---
    const deepLinkedId = getSanitizedOpenParam();
    let shouldOpenModal = false;

    if (deepLinkedId) {
        const targetIndex = data.findIndex(p => p.id === deepLinkedId);
        if (targetIndex !== -1) {
            order = shiftArrayLeft(order, targetIndex);
            shouldOpenModal = true;
            persistStateInURL(deepLinkedId);
        }
    }

    isAnimating = false;
    currentMediaIndex = 0;

    // Popula cards no DOM
    const demo = document.getElementById("demo");
    demo.innerHTML = data
      .map((item, i) => {
        const bgImg = (item.gallery && item.gallery.length > 0) ? item.gallery[0].url : '';
        const bgStyle = bgImg ? `background-image:url('${bgImg}')` : 'background-color: #0B0F19; border: 1px solid rgba(255,255,255,0.1);';
        return `<div class="card" id="card-${i}" style="${bgStyle}"></div>`;
      })
      .join("");

    // Popula numeração
    const numbers = document.getElementById("numbers");
    numbers.innerHTML = data
      .map((_, i) => `<div class="number-item" id="num-${i}">${i + 1}</div>`)
      .join("");

    // Renderiza layout inicial
    renderLayout();
    updateText();
    
    // Configura botões sociais e event listeners (inline logo abaixo)

    // Attach click events
    document.querySelectorAll(".card").forEach((card, i) => {
      card.addEventListener("click", () => {
        const currentCenter = order[0];
        if (i === currentCenter) return;
        
        const idxInOrder = order.indexOf(i);
        if (idxInOrder === -1) return;
        
        if (isAnimating) return;
        isAnimating = true;

        order = shiftArrayLeft(order, idxInOrder);
        
        if (data && data[order[0]]) {
          persistStateInURL(data[order[0]].id);
        }
        
        renderLayout();
        updateText();
        setTimeout(() => (isAnimating = false), 1200);
      });
    });

    document.getElementById("next").onclick = next;
    document.getElementById("prev").onclick = prev;

    const openModalBtn = document.querySelector(".btn-discover");
    if (openModalBtn) openModalBtn.onclick = openModal;

    // Dispara evento determinístico para o app.js
    const readyEvent = new CustomEvent("projectsReady", {
        detail: { autoOpen: shouldOpenModal, projectId: deepLinkedId },
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(readyEvent);

  } catch (err) {
    console.error("Erro ao inicializar projetos:", err);
  }

  document.getElementById("close-modal").onclick = closeModal;
  document.getElementById("modal-next").onclick = () => changeMedia(1);
  document.getElementById("modal-prev").onclick = () => changeMedia(-1);

  // --- Botão CURTIR (Dentro do Modal) ---
  const likeBtn = document.getElementById("btn-like");
  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      const currentProjectIndex = order[0];
      const item = data[currentProjectIndex];
      item.isLiked = !item.isLiked; // Toggle no estado
      
      const span = likeBtn.querySelector("span");
      const heart = likeBtn.querySelector(".heart-icon");
      
      if (item.isLiked) {
        likeBtn.classList.add("liked");
        span.textContent = "Curtido";
        if (heart) {
          heart.style.animation = "none";
          heart.offsetWidth;
          heart.style.animation = "";
        }
        // Sincroniza botão de fora
        const feedLikeBtn = document.getElementById("feed-btn-like");
        if (feedLikeBtn) {
          feedLikeBtn.classList.add("liked");
          const feedHeart = feedLikeBtn.querySelector(".heart-icon");
          if (feedHeart) feedHeart.style.fill = "#ff4757";
        }
      } else {
        likeBtn.classList.remove("liked");
        span.textContent = "Curtir";
        if (heart) heart.style.fill = "";
        // Sincroniza botão de fora
        const feedLikeBtn = document.getElementById("feed-btn-like");
        if (feedLikeBtn) {
          feedLikeBtn.classList.remove("liked");
          const feedHeart = feedLikeBtn.querySelector(".heart-icon");
          if (feedHeart) feedHeart.style.fill = "none";
        }
      }

      try {
        await client.post("/interactions/like", { publicationId: item.id });
      } catch (e) {
        console.warn("Falha ao registrar Like do Modal", e);
      }
    });
  }

  // --- Helper: Toast Notification para Compartilhamento ---
  function showCopyToast() {
    let toast = document.getElementById("copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "copy-toast";
      toast.className = "copy-toast";
      toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Link copiado para a área de transferência!
      `;
      document.body.appendChild(toast);
    }
    
    // Força reflow e aplica a classe de exibição
    toast.classList.remove("show");
    void toast.offsetWidth; 
    toast.classList.add("show");
    
    // Remove após 3 segundos
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // --- Botão COMPARTILHAR: copia URL para clipboard ---
  const shareBtn = document.getElementById("btn-share");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const currentProjectIndex = order[0];
      const item = data[currentProjectIndex];
      const shareUrl = `${window.location.origin}${window.location.pathname}#/?open=${item.id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        await client.post("/interactions/share", { publicationId: item.id });
        showCopyToast();
      } catch (e) {
        // fallback silencioso se clipboard não estiver disponível
      }

      shareBtn.classList.add("shared");
      const span = shareBtn.querySelector("span");
      span.textContent = "Copiado!";

      // Reverte após 2 segundos
      setTimeout(() => {
        shareBtn.classList.remove("shared");
        span.textContent = "Compartilhar";
      }, 2000);
    });
  }

  // --- Botões CURTIR e COMPARTILHAR da Feed (Fora do modal) ---
  const feedLikeBtn = document.getElementById("feed-btn-like");
  if (feedLikeBtn) {
    feedLikeBtn.addEventListener("click", async () => {
      const currentProjectIndex = order[0];
      const item = data[currentProjectIndex];
      item.isLiked = !item.isLiked; // Toggle no estado global
      
      const heart = feedLikeBtn.querySelector(".heart-icon");
      
      if (item.isLiked) {
        feedLikeBtn.classList.add("liked");
        if (heart) {
          heart.style.animation = "none";
          heart.offsetWidth;
          heart.style.animation = "";
        }
        // Sincroniza o modal se estiver aberto
        const modalLikeBtn = document.getElementById("btn-like");
        if (modalLikeBtn) {
          modalLikeBtn.classList.add("liked");
          modalLikeBtn.querySelector("span").textContent = "Curtido";
        }
      } else {
        feedLikeBtn.classList.remove("liked");
        if (heart) heart.style.fill = "none";
        // Sincroniza o modal
        const modalLikeBtn = document.getElementById("btn-like");
        if (modalLikeBtn) {
          modalLikeBtn.classList.remove("liked");
          modalLikeBtn.querySelector("span").textContent = "Curtir";
        }
      }

      try {
        await client.post("/interactions/like", { publicationId: item.id });
      } catch (e) {
        console.warn("Falha ao registrar Like da Feed", e);
      }
    });
  }

  const feedShareBtn = document.getElementById("feed-btn-share");
  if (feedShareBtn) {
    feedShareBtn.addEventListener("click", async () => {
      const currentProjectIndex = order[0];
      const item = data[currentProjectIndex];
      const shareUrl = `${window.location.origin}${window.location.pathname}#/?open=${item.id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        await client.post("/interactions/share", { publicationId: item.id });
        showCopyToast();
      } catch (e) {}

      feedShareBtn.classList.add("shared");
      setTimeout(() => feedShareBtn.classList.remove("shared"), 2000);
    });
  }

  // Fecha modal ao clicar no overlay
  const modal = document.getElementById("project-modal");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Atalhos de teclado
  window.onkeydown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "Escape") closeModal();
  };

  // Recalcula o layout ao redimensionar (debounced para performance)
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderLayout(), 150);
  });

  // --- LÓGICA DE FOCO (Recebida do app.js / Navbar.js) ---
  window.addEventListener("focus-project-modal", (e) => {
    const pubId = e.detail?.pubId;
    if (!pubId) return;

    // Busca linear (O(n))
    const targetIndex = data.findIndex(item => item.id === pubId);
    
    if (targetIndex !== -1) {
      if (isAnimating) {
        // Se estiver animando, espera a animação acabar antes de focar
        setTimeout(() => window.dispatchEvent(new CustomEvent("focus-project-modal", { detail: { pubId } })), 500);
        return;
      }
      
      isAnimating = true;

      // Rotaciona o array (O(n)) até que o targetIndex fique na posição 0
      while (order[0] !== targetIndex) {
        order.push(order.shift());
      }

      renderLayout();
      updateText();
      
      // Animação termina, e abre o modal instantaneamente
      setTimeout(() => {
        isAnimating = false;
        openModal();
      }, 600);
    }
  });
}
