import api from "./axiosConfig";

export const proveedoresService = {
  listar: async () => {
    const response = await api.get("/proveedores");
    return response.data.data; // NestJS devuelve { statusCode, message, data: [...] }
  },

  crear: async (payload) => {
    const response = await api.post("/proveedores", payload);
    return response.data;
  },

  actualizar: async (id, payload) => {
    const response = await api.patch(`/proveedores/${id}`, payload);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
  },
};
