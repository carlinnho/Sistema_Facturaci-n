import api from "./axiosConfig";

export const ventaService = {
  crear: async (ventaData) => {
    const response = await api.post("/ventas", ventaData);
    return response.data;
  },

  buscarCliente: async (tipo, documento) => {
    const response = await api.get(`/ventas/cliente/${tipo}/${documento}`);
    return response.data;
  },

  obtenerSiguienteTicket: async () => {
    const response = await api.get("/ventas/siguiente-ticket");
    return response.data;
  },
};
