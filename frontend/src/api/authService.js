import api from "./axiosConfig";

export const authService = {
  // Llama a POST /auth/login-empresa
  loginEmpresa: async (email, password) => {
    const response = await api.post("/auth/login-empresa", { email, password });

    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }

    return response.data;
  },

  // Llama a GET /auth/perfiles
  getPerfiles: async () => {
    const response = await api.get("/auth/perfiles");
    return response.data;
  },

  // Llama a POST /auth/login-perfil
  loginPerfil: async (id_usuario, pin) => {
    const payload = { id_usuario };
    if (pin) {
      payload.pin = pin;
    }

    const response = await api.post("/auth/login-perfil", payload);

    if (response.data.access_token) {
      // Sobrescribimos el token temporal con el token definitivo del perfil
      localStorage.setItem("access_token", response.data.access_token);
    }

    return response.data;
  },

  // Llama a POST /auth/logout (ruta protegida)
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
    }
  },

  // Método de utilidad para saber si el usuario tiene un token
  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },
};
