import client from "../api/client.js";

function setupRegister() {
  const form = document.getElementById("register-form");
  const bento = document.querySelector(".auth-bento");
  const log = document.getElementById("auth-log-register");
  const btn = document.getElementById("register-submit");
  const passInput = document.getElementById("reg-password");
  const entropyContainer = document.getElementById("entropy-display");
  const entropyLabel = document.getElementById("entropy-label");

  if (!form || !bento) return;

  // Intro GSAP Animation
  if (window.gsap) {
    gsap.fromTo(
      bento,
      { y: -50, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.75)",
      },
    );
  }

  // Web Worker for Password Entropy
  let worker;
  try {
    worker = new Worker("./src/utils/entropyWorker.js");
    worker.onmessage = (e) => {
      const { score, feedback } = e.data;
      entropyContainer.className = `entropy-container entropy-${score}`;
      entropyLabel.textContent = `NÍVEL: ${feedback.toUpperCase()}`;
    };
  } catch (err) {
    console.warn("Worker not initialized.", err);
  }

  passInput.addEventListener("input", (e) => {
    if (worker) {
      worker.postMessage({ password: e.target.value });
    }
  });

  // Password Visibility Toggle Logic
  const toggleVisibility = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    icon.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      
      if (isPassword) {
        // Eye open icon (SVG)
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      } else {
        // Eye closed icon (SVG)
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      }
    });
  };

  toggleVisibility("reg-password", "toggle-pass-1");
  toggleVisibility("reg-confirm-password", "toggle-pass-2");

  // Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const passwordPlain = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (passwordPlain !== confirmPassword) {
      log.textContent = "Erro: As senhas não conferem.";
      log.style.color = "#ef4444";
      document.getElementById("reg-password").classList.add("input-error");
      document.getElementById("reg-confirm-password").classList.add("input-error");
      setTimeout(() => {
        document.getElementById("reg-password").classList.remove("input-error");
        document.getElementById("reg-confirm-password").classList.remove("input-error");
      }, 300);
      return;
    }

    log.textContent = "Criando conta...";
    btn.textContent = "PROCESSANDO...";
    btn.style.pointerEvents = "none";

    await new Promise((r) => setTimeout(r, 600));

    try {
      log.textContent = "Salvando informações...";
      await client.post("/users/register", { name, email, passwordPlain });

      log.textContent = "Conta criada com sucesso! Redirecionando...";
      log.style.color = "#10b981";

      if (window.gsap) {
        gsap.to(bento, {
          scale: 0.9,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => window.router.navigate("login"),
        });
      } else {
        window.router.navigate("login");
      }
    } catch (err) {
      log.textContent = "Erro: " + (err.message || "Falha ao registrar.");
      log.style.color = "#ef4444";
      btn.textContent = "CADASTRAR";
      btn.style.pointerEvents = "auto";

      form.classList.add("input-error");
      setTimeout(() => form.classList.remove("input-error"), 300);
    }
  });

  const loginLink = document.getElementById("goto-login");
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.gsap) {
        gsap.to(bento, {
          y: 20,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => window.router.navigate("login"),
        });
      } else {
        window.router.navigate("login");
      }
    });
  }
}

export const Register = () => {
  setTimeout(setupRegister, 0);

  return `
    <div class="auth-wrapper">
      <div class="auth-bento">
        <div class="auth-header">
          <h2 class="auth-title">Criar Conta</h2>
          <p class="auth-subtitle">CADASTRE-SE</p>
        </div>
        
        <form id="register-form" class="auth-form">
          <div class="auth-input-group">
            <label class="auth-label">Seu Nome Completo</label>
            <input name="name" type="text" class="auth-input" placeholder="Seu Nome" required autocomplete="off">
          </div>

          <div class="auth-input-group">
            <label class="auth-label">Seu E-mail</label>
            <input name="email" type="email" class="auth-input" placeholder="seu@email.com" required autocomplete="off">
          </div>
          
          <div class="auth-input-group">
            <label class="auth-label">Crie uma Senha</label>
            <div class="password-wrapper" style="position: relative;">
              <input id="reg-password" name="password" type="password" class="auth-input" placeholder="••••••••" required style="padding-right: 40px; width: 100%;">
              <button type="button" id="toggle-pass-1" class="password-toggle" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
            <div id="entropy-display" class="entropy-container entropy-0">
              <div class="entropy-bars">
                <div class="entropy-bar"></div>
                <div class="entropy-bar"></div>
                <div class="entropy-bar"></div>
                <div class="entropy-bar"></div>
              </div>
              <span id="entropy-label" class="entropy-text">NÍVEL: INSUFICIENTE</span>
            </div>
          </div>

          <div class="auth-input-group">
            <label class="auth-label">Confirme sua Senha</label>
            <div class="password-wrapper" style="position: relative;">
              <input id="reg-confirm-password" name="confirmPassword" type="password" class="auth-input" placeholder="••••••••" required style="padding-right: 40px; width: 100%;">
              <button type="button" id="toggle-pass-2" class="password-toggle" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </div>
          
          <div class="auth-log" id="auth-log-register"></div>
          
          <button type="submit" id="register-submit" class="auth-submit">CADASTRAR</button>
        </form>
        
        <p class="auth-link-text">
          Já tem uma conta? <button id="goto-login" class="auth-link">Entrar (Login)</button>
        </p>
      </div>
    </div>
  `;
};
