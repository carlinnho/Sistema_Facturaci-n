import api from "./axiosConfig";

export const mediosPagoService = {
  listar: async () => {
    const response = await api.get("/medios-pago");
    return response.data;
  },
  actualizar: async (id, datos) => {
    const response = await api.patch(`/medios-pago/${id}`, datos);
    return response.data;
  },
};
