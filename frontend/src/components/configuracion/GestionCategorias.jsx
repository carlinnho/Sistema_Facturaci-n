import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Loader2,
  AlertCircle,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";
import { categoriaService } from "../../api/categoriaService";

export default function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para Crear
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estados para Editar
  const [editingCat, setEditingCat] = useState(null); // {id, nombre}
  const [editNombre, setEditNombre] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para Eliminar
  const [deletingCat, setDeletingCat] = useState(null); // {id, nombre}
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const data = await categoriaService.listar();
      setCategorias(data);
    } catch (err) {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    setIsCreating(true);
    setError("");
    try {
      await categoriaService.crear(nuevoNombre.trim());
      setNuevoNombre("");
      fetchCategorias();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la categoría.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setEditNombre(cat.nombre);
    setError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editNombre.trim() || editNombre === editingCat?.nombre) {
      setEditingCat(null);
      return;
    }

    setIsUpdating(true);
    setError("");
    try {
      await categoriaService.actualizar(editingCat.id, editNombre.trim());
      setEditingCat(null);
      fetchCategorias();
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openDelete = (cat) => {
    setDeletingCat(cat);
    setError("");
  };

  const confirmDelete = async () => {
    if (!deletingCat) return;

    setIsDeleting(true);
    setError("");
    try {
      await categoriaService.eliminar(deletingCat.id);
      setDeletingCat(null);
      fetchCategorias();
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* ── Cabecera y Formulario de Creación ── */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-white rounded-t-2xl shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Gestión de Categorías
        </h2>

        {error && !editingCat && !deletingCat && (
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Tag className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej. Cervezas, Postres..."
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 h-11 sm:h-12 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-xl outline-none text-sm sm:text-base font-medium text-gray-900 transition-all"
              disabled={isCreating}
            />
          </div>
          {/* Botón: En móvil solo el ícono +, en PC dice Añadir */}
          <button
            type="submit"
            disabled={isCreating || !nuevoNombre.trim()}
            className="h-11 w-11 sm:h-12 sm:w-auto sm:px-6 shrink-0 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
            title="Añadir Categoría"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 stroke-3" />
                <span className="hidden sm:inline">Añadir</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Lista / Tabla de Categorías (Con Scroll Horizontal) ── */}
      <div className="p-4 sm:p-6 overflow-x-auto flex-1 bg-white rounded-b-2xl">
        <div className="border border-gray-200 rounded-2xl min-w-[450px] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 w-16 text-center">
                  ID
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">
                  Nombre de Categoría
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center w-28 sm:w-32">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right w-28 sm:w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorias.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Tag className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-gray-700">Sin categorías</p>
                    <p className="text-sm mt-1">
                      Añade tu primera categoría arriba.
                    </p>
                  </td>
                </tr>
              ) : (
                categorias.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center font-mono font-semibold text-gray-400">
                      {cat.id}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-900">
                      {cat.nombre}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        Activa
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar categoría"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(cat)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Animado de Edición (Framer Motion) ── */}
      <FramerModal
        isOpen={!!editingCat}
        onClose={() => setEditingCat(null)}
        title="Editar Categoría"
      >
        <form onSubmit={handleUpdate} className="p-6">
          {error && editingCat && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <label className="text-sm font-bold text-gray-900 mb-2 block">
            Nombre de la categoría
          </label>
          <input
            type="text"
            autoFocus
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className="w-full px-4 h-12 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
            disabled={isUpdating}
          />

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isUpdating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isUpdating ||
                !editNombre.trim() ||
                editNombre === editingCat?.nombre
              }
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </FramerModal>

      {/* ── Modal Animado de Eliminación (Framer Motion) ── */}
      <FramerModal
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        title="Eliminar Categoría"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">¿Estás seguro?</h4>
            <p className="text-sm text-gray-500 mt-2">
              Estás a punto de ocultar la categoría{" "}
              <strong className="text-gray-900">"{deletingCat?.nombre}"</strong>
              . Esta acción la quitará del catálogo activo, pero no afectará a
              los reportes anteriores.
            </p>
          </div>

          {error && deletingCat && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingCat(null)}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isDeleting}
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
              Sí, eliminar
            </button>
          </div>
        </div>
      </FramerModal>
    </div>
  );
}

// ── COMPONENTE REUTILIZABLE: Modal con Framer Motion ──
function FramerModal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
