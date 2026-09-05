import client from "../api/client.js";

export const Navbar = {
  notifications: [],
  unreadCount: 0,
  sseConnection: null,

  init() {
    this.setupDropdowns();
    this.setupAuthMock();
    
    // Only init notifications if user has token
    const token = localStorage.getItem("token");
    if (token) {
      this.loadNotifications();
      this.initializeSSE(token);
    }
  },

  async loadNotifications() {
    try {
      this.notifications = await client.get("/notifications");
      this.updateState();
    } catch (err) {
      console.error("Falha ao carregar histórico de notificações", err);
    }
  },

  initializeSSE(token) {
    if (this.sseConnection) this.sseConnection.close();
    const url = "/api/notifications/live?token=" + token;
    this.sseConnection = new EventSource(url, { withCredentials: true });

    this.sseConnection.addEventListener("notification", (e) => {
      try {
        const notif = JSON.parse(e.data);
        if (!this.notifications.some(n => n.id === notif.id)) {
          this.notifications.unshift(notif);
          this.updateState();
          
          // WAI-ARIA update announcement
          const ariaLive = document.createElement("div");
          ariaLive.setAttribute("aria-live", "polite");
          ariaLive.className = "sr-only";
          ariaLive.innerText = "Nova notificação recebida";
          document.body.appendChild(ariaLive);
          setTimeout(() => ariaLive.remove(), 2000);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });
  },

  updateState() {
    const unread = this.notifications.filter(n => n.read === false);
    this.unreadCount = unread.length;
    this.renderUI();
  },

  renderUI() {
    const badge = document.getElementById("notif-badge");
    const list = document.getElementById("notif-list");
    const token = localStorage.getItem("token");

    if (badge) {
      if (this.unreadCount > 0) {
        badge.innerText = this.unreadCount.toString();
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }

    if (list) {
      list.innerHTML = "";
      if (!token) {
        list.innerHTML = `<div style="padding: 1.5rem 1rem; text-align: center;">
          <p style="color: var(--text-sub); font-size: 0.875rem; margin-bottom: 1rem;">Faça login ou cadastre-se para receber notificações das suas interações.</p>
          <button onclick="window.location.hash='#/login'; window.router.navigate('login')" class="action-btn" style="padding: 0.5rem 1rem; font-size: 0.8rem; width: 100%;">Fazer Login</button>
        </div>`;
        return;
      }

      if (this.notifications.length === 0) {
        list.innerHTML = `<p style="padding: 1rem; color: var(--text-sub); text-align: center; font-size: 0.875rem;">Nenhuma notificação</p>`;
        return;
      }

      this.notifications.forEach(notif => {
        const p = document.createElement("div");
        p.className = `notif-item animate-fade-in ${!notif.read ? 'unread' : ''}`;
        p.style.borderLeft = !notif.read ? "3px solid var(--primary-electric)" : "3px solid transparent";
        p.style.cursor = "pointer";
        
        p.innerHTML = `<p style="margin: 0;">${notif.message || "Nova interação recebida!"}</p>`;
        
        if (notif.data && notif.data.pubId) {
          p.addEventListener("click", () => {
            const event = new CustomEvent("open-project", {
              detail: { pubId: notif.data.pubId },
            });
            window.dispatchEvent(event);
            
            // Auto close notifications menu on click
            const notifPanel = document.querySelector(".notification-panel");
            if (notifPanel) {
               notifPanel.classList.remove("open");
               notifPanel.style.display = "none";
               document.getElementById("notification-trigger")?.setAttribute("aria-expanded", "false");
            }
          });
        }
        
        list.appendChild(p);
      });
    }
  },

  isMarkingRead: false,

  async markAllAsRead() {
    if (this.isMarkingRead) return;
    
    const unreadIds = this.notifications.filter(n => n.read === false).map(n => n.id);
    if (unreadIds.length === 0) return;

    this.isMarkingRead = true;

    // Optimistic UI update
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.updateState();

    try {
      await client.patch("/notifications/read", { ids: unreadIds });
    } catch (err) {
      console.warn("Falha ao marcar notificações como lidas", err);
    } finally {
      this.isMarkingRead = false;
    }
  },

  setupDropdowns() {
    const triggers = [
      { btn: "notification-trigger", panel: ".notification-panel" },
      { btn: "user-trigger", panel: ".user-panel" },
    ];

    const closeAll = () => {
      triggers.forEach(({ btn, panel }) => {
        const t = document.getElementById(btn);
        if (t) {
          const p = t.querySelector(panel);
          if (p) {
            p.classList.remove("open");
            p.style.display = "none";
          }
          t.setAttribute("aria-expanded", "false");
        }
      });
    };

    triggers.forEach(({ btn, panel }) => {
      const trigger = document.getElementById(btn);
      if (!trigger) return;

      const panelEl = trigger.querySelector(panel);
      if (!panelEl) return;

      panelEl.style.display = "none";
      trigger.setAttribute("aria-expanded", "false");

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = panelEl.classList.contains("open");
        closeAll();

        if (!isOpen) {
          panelEl.style.display = "block";
          panelEl.offsetWidth; // Reflow
          panelEl.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");

          if (btn === "notification-trigger") {
            this.markAllAsRead();
          }
        }
      });

      panelEl.addEventListener("click", (e) => e.stopPropagation());
    });

    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  },

  setupAuthMock() {
    const loginBtn = document.getElementById("login-action");
    const logoutBtn = document.getElementById("logout-action");
    const userLoggedIn = document.getElementById("user-logged-in");
    const userLoggedOut = document.getElementById("user-logged-out");
    const displayUserName = document.getElementById("display-user-name");

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        userLoggedIn.classList.remove("hidden");
        userLoggedOut.classList.add("hidden");
        
        const displayName = user.name || "Admin";
        displayUserName.innerText = displayName;
        displayUserName.style.color = "#FFFFFF"; // Nome em branco
        
        // Define a primeira letra no avatar (maiúscula)
        const userAvatar = document.querySelector(".user-avatar");
        if (userAvatar) {
          userAvatar.innerText = displayName.charAt(0).toUpperCase();
        }
      } catch (e) {
        // Fallback
      }
    } else {
      userLoggedIn.classList.add("hidden");
      userLoggedOut.classList.remove("hidden");
    }

    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.router) {
          window.location.hash = "#/login";
          window.router.navigate("login");
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // CORREÇÃO: Terminação explícita da ligação persistente SSE
        if (Navbar.sseConnection) {
          Navbar.sseConnection.close();
          Navbar.sseConnection = null;
        }

        if (window.auth && window.auth.logout) {
          window.auth.logout();
        } else {
          localStorage.clear();
          window.location.reload();
        }
      });
    }
  },
};
