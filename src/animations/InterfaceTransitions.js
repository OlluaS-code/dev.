// src/animations/InterfaceTransitions.js
export class InterfaceTransitions {
  /**
   * Anima a transição da interface pública para o painel administrativo.
   *
   * Timeline GSAP em 4 etapas:
   *   1. Colapso suave da UI pública (blur + fade)
   *   2. Revelação do admin-container
   *   3. Entrada do Sidebar (slide da esquerda)
   *   4. Entrada em cascata (stagger) dos cartões Bento na área principal
   *
   * @param {string} publicSelector  - Seletor do container público
   * @param {string} adminSelector   - Seletor do container administrativo
   * @param {string} bentoSelector   - Seletor dos cards animáveis
   * @param {Function} onCompleteCallback - Callback de finalização
   */
  static executeSwitch(publicSelector, adminSelector, bentoSelector, onCompleteCallback) {
    const publicContainer = document.querySelector(publicSelector);
    const adminContainer = document.querySelector(adminSelector);
    const sidebar = document.getElementById("admin-sidebar");
    const mainContent = document.getElementById("admin-main-content");
    const bentoElements = adminContainer
      ? adminContainer.querySelectorAll(bentoSelector)
      : [];

    const isPublicHidden = publicContainer && (publicContainer.style.display === 'none' || window.getComputedStyle(publicContainer).display === 'none');

    // Inicialização da Timeline centralizada
    const transitionTimeline = window.gsap.timeline({
      onComplete: onCompleteCallback
    });

    // Se o container público já estiver oculto, pulamos a animação de saída dele
    if (isPublicHidden || !publicContainer) {
      if (adminContainer) adminContainer.style.display = 'flex';
    } else {
      // Estado inicial: admin invisível
      window.gsap.set(adminContainer, { opacity: 0, display: 'none' });

      // Estado inicial: sidebar fora da tela (à esquerda)
      if (sidebar) {
        window.gsap.set(sidebar, { x: -280, opacity: 0 });
      }

      // Estado inicial: main content invisível
      if (mainContent) {
        window.gsap.set(mainContent, { opacity: 0, y: 20 });
      }

      // Estado inicial: cards bento invisíveis
      if (bentoElements.length > 0) {
        window.gsap.set(bentoElements, { opacity: 0, scale: 0.8, y: 40 });
      }

      // Passo 1: Colapso suave da UI pública
      transitionTimeline.to(publicContainer, {
        opacity: 0,
        filter: 'blur(15px)',
        scale: 1.04,
        duration: 0.35,
        ease: 'power3.in',
        onComplete: () => {
          if (publicContainer) publicContainer.style.display = 'none';
          if (adminContainer) adminContainer.style.display = 'flex';
        }
      });
    }

    // Passo 2: Revelação do admin-container
    transitionTimeline.to(adminContainer, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out'
    });

    // Passo 3: Sidebar desliza da esquerda com curva elástica
    if (sidebar) {
      transitionTimeline.to(sidebar, {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power4.out'
      }, '-=0.15');
    }

    // Passo 4: Conteúdo principal aparece
    if (mainContent) {
      transitionTimeline.to(mainContent, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power3.out'
      }, '-=0.3');
    }

    // Passo 5: Entrada em cascata dos cartões (se existirem)
    if (bentoElements.length > 0) {
      transitionTimeline.to(bentoElements, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(1.6)'
      }, '-=0.25');
    }
  }
}
