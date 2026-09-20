import api from "./axiosConfig";

export const userService = {
  listar: async () => {
    const response = await api.get("/users");
    return response.data;
  },
  crear: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },
  actualizar: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  eliminar: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
