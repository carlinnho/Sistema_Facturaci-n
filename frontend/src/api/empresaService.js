import api from "./axiosConfig";

export const empresaService = {
  obtener: async () => {
    const response = await api.get("/empresa");
    return response.data;
  },

  actualizar: async (datos) => {
    // Usamos PATCH como lo configuramos en el backend
    const response = await api.patch("/empresa", datos);
    return response.data;
  },
};
