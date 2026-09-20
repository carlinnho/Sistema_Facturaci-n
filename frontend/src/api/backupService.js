import api from "./axiosConfig";

export const backupService = {
  listar: async () => {
    const response = await api.get("/backup/historial");
    return response.data.data;
  },
  crear: async () => {
    const response = await api.post("/backup/crear");
    return response.data;
  },
  descargarPorId: async (id) => {
    const response = await api.get(`/backup/descargar/${id}`, {
      responseType: "blob",
    });
    return response.data;
  },
};
