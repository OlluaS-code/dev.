const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://deaf-clownfish-olluas-code-dd56f698.koyeb.app";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getHeadersGET = () => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

let isSessionTerminationInProgress = false;

const triggerAtomicSessionCleanup = () => {
  if (isSessionTerminationInProgress) return;
  isSessionTerminationInProgress = true;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.location.hash = '#/login';
  if (window.router) window.router.navigate('login');
  
  setTimeout(() => {
    isSessionTerminationInProgress = false;
  }, 3000);
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    triggerAtomicSessionCleanup();
    throw new Error("Sessão expirada. Autenticação obrigatória.");
  }
  if (!response.ok) throw await response.json().catch(() => ({}));
  return response.status === 204 ? null : response.json().catch(() => ({}));
};

const client = {
  async post(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: getHeadersGET(),
    });
    return handleResponse(response);
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async patch(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeadersGET(),
    });
    return handleResponse(response);
  },
};

export default client;
