import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Asumiendo que tu NestJS corre en este puerto
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
