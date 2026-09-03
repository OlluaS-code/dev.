import client from "./api/client.js";
import { Navbar } from "./components/Navbar.js";
import { initProjects, showFeed } from "./pages/Projects.js";
import { SecureAdminRouter } from "./utils/Router.js";
import { Login } from "./pages/Login.js";
import { Register } from "./pages/Register.js";
import { Feed } from "./pages/Feed.js";
import { InterfaceTransitions } from "./animations/InterfaceTransitions.js";
import { SVGraphAnalytics } from "./components/admin/AdminAnalytics.js";
import { AdminLayout, setupAdminLayout } from "./components/admin/AdminLayout.js";

window.SVGraphAnalytics = SVGraphAnalytics;

/**
 * Transição SPA: anima a saída da landing page e revela a seção de projetos.
 * Usa GSAP (disponível globalmente via tag <script> no index.html) para
 * garantir fluidez GPU-acelerada sem delay de carregamento de nova página.
 */
function transitionToProjects(searchTerm = null) {
  const landingWrapper = document.getElementById("landing-wrapper");
  const nav = document.querySelector(".top-nav");
  const glass = document.querySelector(".glass-layer");

  const elementsToHide = [landingWrapper, nav, glass].filter(Boolean);
  const canvas = document.getElementById("canvas");

  // Verifica se já estamos na seção de projetos
  const projectsSection = document.getElementById("projects-section");
  const isAlreadyInProjects = !projectsSection.classList.contains("hidden");

  if (isAlreadyInProjects) {
    if (searchTerm) {
      showFeed(searchTerm);
    }
    return;
  }

  // Esconde o canvas (background) mais rápido
  if (canvas) {
    gsap.to(canvas, { opacity: 0, duration: 0.3, ease: "power2.out" });
  }

  // Animação de saída com GSAP: desliza para cima e desvanece
  gsap.to(elementsToHide, {
    y: "-100vh",
    opacity: 0,
    duration: 0.75,
    ease: "expo.inOut",
    onComplete: async () => {
      // Remove da árvore de renderização após animação para liberar GPU layer
      elementsToHide.forEach((el) => (el.style.display = "none"));
      if (canvas) canvas.style.display = "none";

      // Revela seção de projetos
      projectsSection.classList.remove("hidden");

      // Move a barra de busca para a seção de projetos para não sumir
      const searchWrapper = document.querySelector(".search-wrapper");
      if (searchWrapper) {
        projectsSection.appendChild(searchWrapper);
      }

      // Inicializa o carrossel agora que os elementos estão visíveis no DOM
      await initProjects();
      
      // Executa a busca se um termo foi fornecido
      if (searchTerm) {
        // Pequeno timeout para garantir que o layout foi renderizado
        setTimeout(() => showFeed(searchTerm), 100);
      }
    },
  });
}

/**
 * Transição reversa: anima a saída dos projetos e revela a home.
 */
function transitionToHome() {
  const landingWrapper = document.getElementById("landing-wrapper");
  const nav = document.querySelector(".top-nav");
  const glass = document.querySelector(".glass-layer");
  const canvas = document.getElementById("canvas");
  const projectsSection = document.getElementById("projects-section");
  const searchWrapper = document.querySelector(".search-wrapper");
  const uiContainer = document.querySelector(".ui-container");
  
  if (!projectsSection || projectsSection.classList.contains("hidden")) return;

  // Move a barra de busca de volta para a hero
  if (searchWrapper && uiContainer) {
    uiContainer.appendChild(searchWrapper);
  }

  // Oculta a seção de projetos
  projectsSection.classList.add("hidden");

  const elementsToShow = [landingWrapper, nav, glass].filter(Boolean);
  
  if (canvas) {
    canvas.style.display = "block";
    gsap.to(canvas, { opacity: 1, duration: 0.5, ease: "power2.in" });
  }

  elementsToShow.forEach((el) => {
    el.style.display = ""; // Restaura display original
  });

  gsap.fromTo(elementsToShow,
    { y: "-100vh", opacity: 0 },
    { y: "0", opacity: 1, duration: 0.75, ease: "expo.out" }
  );
}

function initAdminRouter() {
  const adminContainer = document.getElementById("admin-container");
  const landingWrapper = document.getElementById("landing-wrapper");
  const brico = document.getElementById("brand-logo");
  const nav = document.querySelector(".top-nav");
  const glass = document.querySelector(".glass-layer");
  const canvas = document.getElementById("canvas");
  const projectsSection = document.getElementById("projects-section");

  const hideAllPublicUI = () => {
    if (landingWrapper) landingWrapper.style.display = "none";
    if (brico) brico.style.display = "none";
    if (glass) glass.style.display = "none";
    if (canvas) canvas.style.display = "none";
    if (projectsSection) projectsSection.classList.add("hidden");
  };

  const onRouteMatched = async () => {
    hideAllPublicUI();
    if (adminContainer) {
      adminContainer.classList.remove("hidden");

      // Tópico 2A: cria um novo signal para esta rota, abortando o anterior
      const signal = window.router.createRouteSignal();

      let token = localStorage.getItem("token");
      let userStr = localStorage.getItem("user");
      let isAdmin = false;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          isAdmin = user.role === "ADMIN";
        } catch(e) {}
      }

      if (token && isAdmin) {
        // Oculta a top-nav pública — o sidebar substitui a navegação
        if (nav) nav.style.display = "none";

        // Injeta o AdminLayout (Sidebar + área de conteúdo)
        adminContainer.innerHTML = AdminLayout(signal);

        // Inicializa o Sidebar e carrega a view padrão (Feed)
        await setupAdminLayout(signal);

        // Executa a transição animada (público -> admin com sidebar)
        InterfaceTransitions.executeSwitch("#landing-wrapper", "#admin-container", ".cyber-card-matrix", () => {
          // done
        });
      } else {
        if (token && !isAdmin) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        if (nav) nav.style.display = "none";
        adminContainer.innerHTML = Login(true);
        InterfaceTransitions.executeSwitch("#landing-wrapper", "#admin-container", ".cyber-card-matrix", () => {});
      }
    }
  };

  const onAccessDenied = () => {
    hideAllPublicUI();
    if (adminContainer) {
      adminContainer.innerHTML = `
        <div style="color: white; text-align: center; margin-top: 20vh;">
          <h1 style="font-size: 4rem; color: #ef4444;">503</h1>
          <h2>Service Unavailable</h2>
          <p>System is undergoing maintenance.</p>
        </div>
      `;
      adminContainer.classList.remove("hidden");
    }
  };

  window.router = new SecureAdminRouter(onRouteMatched, onAccessDenied);
  
  window.router.navigate = async (route) => {
    hideAllPublicUI();
    if (adminContainer) adminContainer.classList.remove("hidden");

    // Tópico 2A: cada navegação manual também cria um novo signal,
    // abortando os listeners da rota anterior de forma atômica.
    const signal = window.router.createRouteSignal();

    if (route === "feed") {
      // Oculta a top-nav — sidebar faz a navegação
      if (nav) nav.style.display = "none";

      // Injeta o AdminLayout (Sidebar + área de conteúdo)
      adminContainer.innerHTML = AdminLayout(signal);
      await setupAdminLayout(signal);
      InterfaceTransitions.executeSwitch("#landing-wrapper", "#admin-container", ".cyber-card-matrix", () => {});
    } else if (route === "login") {
      if (nav) nav.style.display = "none";
      adminContainer.innerHTML = Login();
      InterfaceTransitions.executeSwitch("#landing-wrapper", "#admin-container", ".cyber-card-matrix", () => {});
    } else if (route === "register") {
      if (nav) nav.style.display = "none";
      adminContainer.innerHTML = Register();
      InterfaceTransitions.executeSwitch("#landing-wrapper", "#admin-container", ".cyber-card-matrix", () => {});
    }
  };
}

function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  document.querySelectorAll(".bento-card, .tech-section-title").forEach((el) => {
    observer.observe(el);
  });
}

function initBentoTilt() {
  const cards = document.querySelectorAll('.bento-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      // Don't tilt if it's not revealed yet
      if (!card.classList.contains('reveal-visible')) return;
      
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(0) scale(1.02)`;
      card.style.transition = 'none'; // disable css transition during hover
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = ''; // restore css transition
    });
  });
}

async function loadDynamicSpecs() {
  const container = document.getElementById("bento-grid-container");
  if (!container) return;

  try {
    const specs = await client.get("/specifications");
    
    if (!specs || specs.length === 0) {
      container.innerHTML = "<p style='color: var(--text-sub); text-align: center;'>Nenhuma especialidade cadastrada ainda.</p>";
      return;
    }

    container.innerHTML = specs.map((spec, index) => `
      <div class="bento-card ${spec.isWide ? 'bento-wide' : ''}" id="tech-card-${index}">
          <div class="card-glow-border"></div>
          <div class="card-content">
              <div class="card-icon">
                  ${spec.iconSvg}
              </div>
              <span class="card-tag">${spec.tag}</span>
              <h3>${spec.title}</h3>
              <p>${spec.description}</p>
          </div>
          <div class="card-glare"></div>
      </div>
    `).join("");
  } catch (err) {
    console.warn("Erro ao carregar specs dinâmicas:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  Navbar.init();
  initAdminRouter();
  
  await loadDynamicSpecs();
  
  initScrollReveal();
  initBentoTilt();

  // --- LÓGICA DE ROTEAÇÃO DETERMINÍSTICA E DEEP LINKING ---
  document.addEventListener("projectsReady", (event) => {
    const { autoOpen, projectId } = event.detail;
    
    if (autoOpen && projectId !== null) {
      // Abre a seção de projetos e esconde a landing page
      const landingPage = document.getElementById("landing-wrapper");
      const showcasePage = document.getElementById("projects-section");
      const glass = document.querySelector(".glass-layer");
      const nav = document.querySelector(".top-nav");
      
      if (landingPage) landingPage.style.display = "none";
      if (glass) glass.style.display = "none";
      if (nav) nav.style.display = "none";
      if (showcasePage) showcasePage.classList.remove("hidden");

      // Dispara o comando global para abrir o modal do projeto em foco
      window.dispatchEvent(new CustomEvent("focus-project-modal", { detail: { pubId: projectId } }));
    }
  });

  // Garante sincronização com o botão Voltar/Avançar do navegador
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.activeProjectId) {
      window.dispatchEvent(new CustomEvent("focus-project-modal", { detail: { pubId: event.state.activeProjectId } }));
    }
  });

  // --- LÓGICA DO BOTÃO EXPLORAR (TRANSIÇÃO SPA) ---
  const exploreBtn = document.getElementById("explore-btn");
  const backToHomeBtn = document.getElementById("back-to-home-btn");

  if (exploreBtn) {
    exploreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      transitionToProjects();
    });
  } else {
    console.warn("[app.js] Botão #explore-btn não encontrado no DOM.");
  }

  if (backToHomeBtn) {
    backToHomeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      transitionToHome();
    });
  }

  // --- LÓGICA DA BARRA DE BUSCA ---
  const searchWrapper = document.querySelector(".search-wrapper");
  const searchContainer = document.querySelector(".search-container");
  const searchInput = document.getElementById("search");
  const categoryPills = document.querySelectorAll(".category-pill");
  const searchForm = document.getElementById("search-form");

  if (searchContainer) {
    searchContainer.addEventListener("click", (e) => {
      searchWrapper.classList.add("active");
      searchInput.focus();
      e.stopPropagation();
    });
  }

  document.addEventListener("click", (e) => {
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      searchWrapper.classList.remove("active");
    }
  });

  categoryPills.forEach((pill) => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      categoryPills.forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");

      // Categoria selecionada aciona a transição de forma direta
      const category = pill.getAttribute("data-category");
      searchInput.value = category;
      transitionToProjects(category);
    });
  });

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val !== "") {
        transitionToProjects(val);
        searchInput.blur();
        searchWrapper.classList.remove("active");
        setTimeout(() => {
          searchInput.value = "";
        }, 300); // Clear after animation
      }
    });
  }

  // --- LÓGICA DE NAVEGAÇÃO DE NOTIFICAÇÕES ---
  window.addEventListener("open-project", (e) => {
    const pubId = e.detail?.pubId;
    if (!pubId) return;

    const isAdminPanel = !document.getElementById("admin-container").classList.contains("hidden");

    if (isAdminPanel) {
      // Estamos no painel admin, fazer scroll até o card
      const targetCard = document.getElementById(`post-card-${pubId}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Efeito visual (flash) para destacar o card
        const originalBg = targetCard.style.backgroundColor;
        targetCard.style.transition = "background-color 0.5s ease";
        targetCard.style.backgroundColor = "rgba(77, 118, 255, 0.3)"; // highlight blue
        
        setTimeout(() => {
          targetCard.style.backgroundColor = originalBg || "";
        }, 1500);
      } else {
        console.warn("Projeto não encontrado no feed do painel.");
      }
    } else {
      // Estamos na página pública, rotacionar o carrossel e abrir o modal
      transitionToProjects();
      
      // O evento precisa ser propagado para o Projects.js que fará o openModal
      // Como a transição pode ser assíncrona se não estiver carregada, damos um tempo
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("focus-project-modal", { detail: { pubId } }));
      }, 500);
    }
  });
});
