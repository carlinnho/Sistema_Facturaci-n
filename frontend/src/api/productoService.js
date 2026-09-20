import api from "./axiosConfig";

export const productoService = {
  // Obtener todos los productos disponibles
  listar: async () => {
    const response = await api.get("/productos");
    return response.data;
  },

  // Buscar un producto específico escaneado con la cámara o pistola
  buscarPorBarras: async (codigo) => {
    const response = await api.get(`/productos/barras?codigo=${codigo}`);
    return response.data;
  },

  // Crear un nuevo producto (el backend genera el SKU)
  crear: async (productoData) => {
    /* productoData debe contener: 
      { nombre, codigo_barras (opcional), precio, stock_minimo, stock_actual, id_categoria }
    */
    const response = await api.post("/productos", productoData);
    return response.data;
  },

  // Editar producto (el backend no recibe stock_actual aquí, solo datos base)
  actualizar: async (id, productoData) => {
    /* productoData debe contener: 
      { nombre, codigo_barras (opcional), precio, stock_minimo, id_categoria }
    */
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  },

  // Reposición masiva (entrada/salida de stock)
  actualizarStockMultiple: async (payload) => {
    // Recibe el payload completo { items: [...] } desde Inventario.jsx
    const response = await api.patch("/productos/stock/multiple", payload);
    return response.data;
  },

  // Borrado lógico (lo marca como descontinuado)
  eliminar: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },
};
