import api from "./axiosConfig";

export const categoriaService = {
  listar: async () => {
    const response = await api.get("/categorias");
    return response.data;
  },

  crear: async (nombre) => {
    const response = await api.post("/categorias", { nombre });
    return response.data;
  },

  actualizar: async (id, nombre) => {
    const response = await api.put(`/categorias/${id}`, { nombre });
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
  },
};
