import api from "./axiosConfig";

export const reportesService = {
  obtenerHistorial: async () => {
    const response = await api.get("/reportes/historial");
    return response.data.data;
  },

  obtenerDashboard: async () => {
    const response = await api.get("/reportes/dashboard");
    return response.data.data;
  },

  descargarHistorialExcel: async () => {
    const response = await api.get("/reportes/historial/excel", {
      responseType: "blob", // Vital para recibir archivos
    });
    return response.data;
  },

  descargarDashboardPdf: async () => {
    const response = await api.get("/reportes/dashboard/pdf", {
      responseType: "blob", // Vital para recibir archivos
    });
    return response.data;
  },
};
