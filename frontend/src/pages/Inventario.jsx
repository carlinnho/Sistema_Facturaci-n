import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  AlertTriangle,
  AlertCircle,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import ProductDrawer from "../components/inventario/ProductDrawer";
import RestockDrawer from "../components/inventario/RestockDrawer";
import { productoService } from "../api/productoService";
import { categoriaService } from "../api/categoriaService";
import Buscador from "../components/ui/Buscador";

const formatSoles = (amount) => `S/ ${parseFloat(amount).toFixed(2)}`;

export default function Inventario() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [estado, setEstado] = useState("all");
  const [orden, setOrden] = useState("nombre");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false); // Estado para ocultar/mostrar filtros en móvil
  const pageSize = 8;

  // Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // Estados para Eliminación Animada
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [prods, cats] = await Promise.all([
        productoService.listar(),
        categoriaService.listar(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    setIsDrawerOpen(true);
  };

  const handleSaveProduct = async (payload, idToEdit) => {
    if (idToEdit) {
      await productoService.actualizar(idToEdit, payload);
    } else {
      await productoService.crear(payload);
    }
    setIsDrawerOpen(false);
    cargarDatos();
  };

  const openDelete = (product) => {
    setDeletingProduct(product);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      await productoService.eliminar(deletingProduct.id);
      setDeletingProduct(null);
      cargarDatos();
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Error al descontinuar el producto.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestockSave = async (items) => {
    try {
      const payload = {
        items: items.map((it) => ({
          id_producto: it.id,
          cantidad: parseInt(it.addQty),
        })),
      };
      await productoService.actualizarStockMultiple(payload);
      setIsRestockOpen(false);
      cargarDatos();
    } catch (error) {
      alert("Error al actualizar el stock");
    }
  };

  const filtered = useMemo(() => {
    let r = products.filter((p) => {
      const matchCat =
        cat === "all" || p.id_categoria.toString() === cat.toString();
      const matchSearch =
        !search ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.codigo_barras &&
          p.codigo_barras.toLowerCase().includes(search.toLowerCase()));

      let st = "ok";
      if (p.stock_actual === 0) st = "out";
      else if (p.stock_actual <= p.stock_minimo) st = "low";

      const matchEstado = estado === "all" || estado === st;
      return matchCat && matchSearch && matchEstado;
    });

    if (orden === "nombre")
      r = [...r].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (orden === "stock")
      r = [...r].sort((a, b) => a.stock_actual - b.stock_actual);
    if (orden === "precio") r = [...r].sort((a, b) => b.precio - a.precio);

    return r;
  }, [products, search, cat, estado, orden]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const lowStockTotal = products.filter(
    (p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo,
  ).length;

  return (
    <div className="h-full flex flex-col min-w-0 space-y-4 sm:space-y-6 bg-transparent">
      {/* ── CABECERA FLOTANTE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" /> Inventario
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {products.length} productos ·{" "}
            <span className="text-orange-500 font-bold">
              {lowStockTotal} con stock bajo
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsRestockOpen(true)}
            className="flex-1 sm:flex-none h-11 flex items-center justify-center gap-2 px-3 sm:px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-colors text-sm sm:text-base"
          >
            <ArrowDownToLine className="h-5 w-5" /> <span>Reposición</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none h-11 flex items-center justify-center gap-1.5 px-3 sm:px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all text-sm sm:text-base"
          >
            <Plus className="h-5 w-5 stroke-3" />
            <span className="sm:hidden">Producto</span>
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* ── FILTROS FLOTANTES (Con Toggle en Móvil) ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 shrink-0">
        {/* Fila 1: Buscador y Botón de Filtros (Siempre visible) */}
        <div className="flex gap-2 w-full">
          <div className="flex-1 min-w-0">
            <Buscador
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {/* Botón para mostrar/ocultar filtros avanzados solo en móvil */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`sm:hidden h-11 w-11 shrink-0 flex items-center justify-center border rounded-xl transition-colors ${
              showFilters
                ? "bg-gray-100 border-gray-300 text-gray-900"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Fila 2: Filtros Avanzados (Oculto en móvil por defecto, visible en PC) */}
        <div
          className={`${showFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center`}
        >
          <div className="grid grid-cols-2 sm:flex gap-3">
            <select
              value={cat}
              onChange={(e) => {
                setCat(e.target.value);
                setPage(1);
              }}
              className="h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-blue-600 transition-colors"
            >
              <option value="all">Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setPage(1);
              }}
              className="h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-blue-600 transition-colors"
            >
              <option value="all">Estados</option>
              <option value="ok">Disponible</option>
              <option value="low">Stock bajo</option>
              <option value="out">Agotado</option>
            </select>
          </div>
          <div className="flex gap-3">
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="flex-1 sm:flex-none sm:w-auto h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-blue-600 transition-colors"
            >
              <option value="nombre">A-Z</option>
              <option value="stock">Stock</option>
              <option value="precio">Precio</option>
            </select>
            <button className="h-11 px-4 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-700 transition-colors">
              <Download className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLA CONTENEDOR FLOTANTE ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-xs sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">SKU / Código</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 w-40">Stock</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton height={16} width={80} />
                      <Skeleton height={10} width={120} className="mt-1" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={150} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={100} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton height={16} width={100} borderRadius={8} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton width={60} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton height={20} width={60} borderRadius={6} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton width={60} />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No se encontraron productos.</p>
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => {
                  let st = "ok";
                  if (p.stock_actual === 0) st = "out";
                  else if (p.stock_actual <= p.stock_minimo) st = "low";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-bold text-gray-900">
                          {p.sku}
                        </p>
                        {p.codigo_barras && (
                          <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                            {p.codigo_barras}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {p.nombre}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {p.categoria}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-gray-900 w-8 text-right">
                            {p.stock_actual}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                st === "ok"
                                  ? "bg-emerald-500"
                                  : st === "low"
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (p.stock_actual / Math.max(100, p.stock_minimo * 2)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        {formatSoles(p.precio)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StockBadge status={st} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDelete(p)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              <span className="hidden sm:inline">Mostrando </span>
              {pageItems.length} de {filtered.length}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100 font-bold"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs sm:text-sm font-bold text-gray-700 px-1 sm:px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100 font-bold"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        productToEdit={productToEdit}
        onSaveSuccess={handleSaveProduct}
      />
      <RestockDrawer
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        products={products}
        onSave={handleRestockSave}
      />
      <FramerModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Descontinuar Producto"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">¿Estás seguro?</h4>
            <p className="text-sm text-gray-500 mt-2">
              Estás a punto de ocultar el producto{" "}
              <strong className="text-gray-900">
                "{deletingProduct?.nombre}"
              </strong>
              . Esta acción lo quitará del catálogo activo.
            </p>
          </div>
          {deleteError && deletingProduct && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingProduct(null)}
              disabled={isDeleting}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              Sí, descontinuar
            </button>
          </div>
        </div>
      </FramerModal>
    </div>
  );
}

function StockBadge({ status }) {
  if (status === "ok")
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
        Disponible
      </span>
    );
  if (status === "low")
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
        Stock Bajo
      </span>
    );
  return (
    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
      Agotado
    </span>
  );
}

function FramerModal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden pointer-events-auto"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-black text-lg text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
