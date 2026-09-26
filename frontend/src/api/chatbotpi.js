import api from "./axiosConfig";

export async function enviarMensajeChatbot(mensaje, signal) {
  const { data } = await api.post(
    "/chatbot/mensaje",
    { mensaje },
    { signal, timeout: 30000 },
  );
  return data;
}
