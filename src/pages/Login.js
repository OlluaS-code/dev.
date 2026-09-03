import client from "../api/client.js";
import { saveAuthData } from "../utils/auth.js";
import { Register } from "./Register.js";

function setupLogin(isAdminRoute) {
  const form = document.getElementById("login-form");
  const bento = document.querySelector(".auth-bento");
  const log = document.getElementById("auth-log-login");
  const btn = document.getElementById("login-submit");

  if (!form || !bento) return;

  // Intro GSAP Animation
  if (window.gsap) {
    gsap.fromTo(bento, 
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.75)" }
    );
  }

  // Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const passwordPlain = e.target.password.value;

    log.textContent = isAdminRoute ? "> Inicializando Handshake TLS..." : "Conectando ao servidor...";
    btn.textContent = "PROCESSANDO...";
    btn.style.pointerEvents = "none";
    
    // Simulate some cyber-processing delay for the effect
    await new Promise(r => setTimeout(r, 600));

    try {
      log.textContent = isAdminRoute ? "> Validando Credenciais..." : "Validando informações...";

      let payload = { email, passwordPlain };
      
      try {
        const authStore = await import("../api/authStore.js");
        const token = authStore.getSecureLoginToken();
        if (token) {
          payload.secureLoginToken = token;
        }
      } catch (err) {
        // Ignora se módulo não carregar em rotas públicas
      }

      const data = await client.post("/users/login", payload);
      
      try {
        const authStore = await import("../api/authStore.js");
        authStore.clearSecureLoginToken(); // Single-use
      } catch (e) {}
      log.textContent = isAdminRoute ? "> Acesso Concedido. Descriptografando ambiente..." : "Acesso Concedido. Redirecionando...";
      log.style.color = "#10b981"; // Success Green

      saveAuthData(data.user, data.accessToken);
      
      const isUserAdmin = data.user.role === "ADMIN";

      const handleRedirect = () => {
        if (isUserAdmin) {
           window.router.navigate("feed");
        } else {
           window.location.hash = "#/";
           window.location.reload(); // Sai do escopo do roteador de Admin e recarrega a Public UI
        }
      };
      
      // Animate Out and redirect
      if (window.gsap) {
        gsap.to(bento, { 
          scale: 1.1, opacity: 0, duration: 0.4, ease: "power2.in",
          onComplete: handleRedirect
        });
      } else {
        handleRedirect();
      }
    } catch (err) {
      log.textContent = isAdminRoute ? "> [ERRO] Falha na Autenticação." : "Falha na Autenticação. Verifique seus dados.";
      log.style.color = "#ef4444"; // Error Red
      btn.textContent = isAdminRoute ? "AUTENTICAR ACESSO" : "ENTRAR";
      btn.style.pointerEvents = "auto";

      // Error Glitch Animation
      e.target.password.classList.add("input-error");
      setTimeout(() => e.target.password.classList.remove("input-error"), 300);
    }
  });

  // Switch to Register (with FLIP/Transition)
  const registerLink = document.getElementById("goto-register");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.gsap) {
        gsap.to(bento, {
          y: -20, opacity: 0, duration: 0.3, ease: "power2.in",
          onComplete: () => window.router.navigate("register")
        });
      } else {
        window.router.navigate("register");
      }
    });
  }
}

export const Login = (isAdminRoute = false) => {
  setTimeout(() => setupLogin(isAdminRoute), 0);

  const title = isAdminRoute ? "SYSTEM.LOGIN" : "Acesso à Conta";
  const subtitle = isAdminRoute ? "IDENTIFICAÇÃO DE OPERADOR" : "FAÇA LOGIN PARA CONTINUAR";
  const emailLabel = isAdminRoute ? "E-Mail do Operador" : "Seu E-mail";
  const emailPlaceholder = isAdminRoute ? "admin@sistema.gov.br" : "seu@email.com";
  const passLabel = isAdminRoute ? "Chave Criptográfica" : "Sua Senha";
  const passPlaceholder = isAdminRoute ? "••••••••••••" : "••••••••";
  const btnText = isAdminRoute ? "AUTENTICAR ACESSO" : "ENTRAR";
  const logInitial = isAdminRoute ? ">_ Aguardando input..." : "";
  const registerSection = isAdminRoute ? "" : `
    <p class="auth-link-text">
      Ainda não tem uma conta? <button id="goto-register" class="auth-link">Cadastre-se</button>
    </p>
  `;

  return `
    <div class="auth-wrapper">
      <canvas id="auth-canvas"></canvas>
      <div class="auth-bento">
        <div class="auth-header">
          <h2 class="auth-title">${title}</h2>
          <p class="auth-subtitle">${subtitle}</p>
        </div>
        
        <form id="login-form" class="auth-form">
          <div class="auth-input-group">
            <label class="auth-label">${emailLabel}</label>
            <input name="email" type="email" class="auth-input" placeholder="${emailPlaceholder}" required autocomplete="off">
          </div>
          
          <div class="auth-input-group">
            <label class="auth-label">${passLabel}</label>
            <input name="password" type="password" class="auth-input" placeholder="${passPlaceholder}" required>
          </div>
          
          <div class="auth-log" id="auth-log-login">${logInitial}</div>
          
          <button type="submit" id="login-submit" class="auth-submit">${btnText}</button>
        </form>
        
        ${registerSection}
      </div>
    </div>
  `;
};
