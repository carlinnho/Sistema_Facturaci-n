import { useState, useEffect, useMemo } from "react";
import { X, MessageCircle, Loader2, Package } from "lucide-react";
import { productoService } from "../../api/productoService";
import { categoriaService } from "../../api/categoriaService";
import Buscador from "../ui/Buscador";

export default function PedidoDrawer({ isOpen, onClose, proveedor }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Productos Seleccionados (guardamos el ID)
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      // Reseteamos filtros y selección cada vez que se abre
      setSearch("");
      setActiveCat("all");
      setLowStockOnly(false);
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [prods, cats] = await Promise.all([
        productoService.listar(),
        categoriaService.listar(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (error) {
      console.error("Error cargando datos para pedidos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSolicitar = () => {
    if (!proveedor || !proveedor.telefono_whatsapp) {
      alert("Error: El proveedor no tiene número de WhatsApp registrado.");
      return;
    }

    const selectedProducts = products.filter((p) => selectedIds.has(p.id));

    // Armar el mensaje (Sin el SKU)
    let mensaje = `Hola *${proveedor.nombre}*, necesito consultar la disponibilidad y solicitar los siguientes productos:\n\n`;

    selectedProducts.forEach((p) => {
      mensaje += `📦 *${p.nombre}*\n`;
    });

    mensaje += `\nQuedo a la espera de su confirmación. Gracias.`;

    const url = `https://wa.me/51${proveedor.telefono_whatsapp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
    onClose();
  };

  const filteredProducts = useMemo(() => {
    // 1. Primero filtramos según los criterios (Búsqueda, Categoría, Stock)
    const filtrados = products.filter((p) => {
      const matchSearch =
        !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());

      const matchCat =
        activeCat === "all" ||
        p.id_categoria.toString() === activeCat.toString();

      const isLowStock = p.stock_actual <= p.stock_minimo;
      const matchStock = !lowStockOnly || isLowStock;

      return matchSearch && matchCat && matchStock;
    });

    // 2. Luego ORDENAMOS: Los seleccionados van primero, luego alfabéticamente
    return filtrados.sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);

      if (aSelected && !bSelected) return -1; // 'a' sube
      if (!aSelected && bSelected) return 1; // 'b' sube

      // Si ambos están seleccionados (o ninguno), ordenamos por nombre
      return a.nombre.localeCompare(b.nombre);
    });

    // Añadimos selectedIds a las dependencias para que recalcule al hacer clic
  }, [products, search, activeCat, lowStockOnly, selectedIds]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex justify-end ${isOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />

        <div
          className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Cabecera */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-gray-900">
                Seleccione productos a Pedir
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg border border-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-gray-500 leading-snug">
              Estos productos se le mandarán al proveedor{" "}
              <strong className="text-gray-700">{proveedor?.nombre}</strong>{" "}
              preguntando si tienen disponibilidad.
            </p>
          </div>

          {/* Filtros */}
          <div className="p-5 border-b border-gray-200 space-y-3 bg-white shrink-0">
            <Buscador
              placeholder="Buscar producto o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex gap-2">
              <select
                value={activeCat}
                onChange={(e) => setActiveCat(e.target.value)}
                className="flex-1 h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-blue-600 transition-colors"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <label className="flex items-center justify-center gap-2 px-4 h-11 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-bold cursor-pointer hover:bg-orange-100 transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                />
                Bajo Stock
              </label>
            </div>
          </div>

          {/* Resumen Superior Visual (Opcional pero recomendado para UX) */}
          {selectedIds.size > 0 && (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 shrink-0 flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900">
                {selectedIds.size} producto(s) en la lista del pedido
              </span>
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                Listos para enviar
              </span>
            </div>
          )}

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                <p className="font-bold text-sm">Cargando inventario...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-bold text-gray-600">No hay productos</p>
                <p className="text-xs mt-1">
                  Intenta cambiar los filtros de búsqueda.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const isLow = p.stock_actual <= p.stock_minimo;

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelection(p.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-400 shadow-sm"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 shrink-0 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}
                        >
                          {p.nombre}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                          SKU: {p.sku}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black px-2 py-1 rounded-md ${
                            isLow
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          Stock: {p.stock_actual}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie / Botón Solicitar */}
          <div className="p-6 border-t border-gray-200 bg-white shrink-0">
            <button
              onClick={handleSolicitar}
              disabled={selectedIds.size === 0}
              className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              Solicitar {selectedIds.size > 0 ? selectedIds.size : ""} Productos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
