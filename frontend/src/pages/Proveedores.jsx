import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  AlertTriangle,
  MessageCircle,
  Truck,
} from "lucide-react";
import { proveedoresService } from "../api/proveedoresService";
import ProveedorDrawer from "../components/proveedores/ProveedorDrawer";
import Buscador from "../components/ui/Buscador";
import PedidoDrawer from "../components/proveedores/PedidoDrawer";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProv, setEditingProv] = useState(null);
  const [deletingProv, setDeletingProv] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pedidoProv, setPedidoProv] = useState(null);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setIsLoading(true);
      const data = await proveedoresService.listar();
      setProveedores(data || []);
    } catch (err) {
      setError("No se pudieron cargar los proveedores.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProv(null);
    setIsDrawerOpen(true);
  };

  const openEdit = (prov) => {
    setEditingProv(prov);
    setIsDrawerOpen(true);
  };

  const handleSaveSuccess = async (payload, idToEdit) => {
    if (idToEdit) {
      await proveedoresService.actualizar(idToEdit, payload);
    } else {
      await proveedoresService.crear(payload);
    }
    setIsDrawerOpen(false);
    fetchProveedores();
  };

  const confirmDelete = async () => {
    if (!deletingProv) return;
    setIsDeleting(true);
    setError("");
    try {
      await proveedoresService.eliminar(deletingProv.id);
      setDeletingProv(null);
      fetchProveedores();
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al eliminar el proveedor.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const solicitarPedido = (proveedor) => {
    if (!proveedor.telefono_whatsapp) {
      alert("Este proveedor no tiene un número de WhatsApp registrado.");
      return;
    }
    setPedidoProv(proveedor);
  };

  const filteredProveedores = useMemo(() => {
    return proveedores.filter((p) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term)) ||
        (p.telefono_whatsapp && p.telefono_whatsapp.includes(term))
      );
    });
  }, [proveedores, search]);

  return (
    <div className="h-full flex flex-col min-w-0 space-y-6 bg-transparent">
      {/* ── CABECERA FLOTANTE ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-blue-600" /> Proveedores
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {proveedores.length} proveedores registrados en el directorio.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-md transition-colors"
        >
          <Plus className="h-5 w-5" /> Nuevo Proveedor
        </button>
      </div>

      {/* ── BÚSQUEDA FLOTANTE ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center shrink-0">
        <Buscador
          placeholder="Buscar por nombre, descripción o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── CONTENEDOR GRILLA FLOTANTE ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col h-[180px]"
              >
                <div className="flex justify-between items-start mb-3">
                  <Skeleton circle width={48} height={48} />
                  <Skeleton width={60} height={20} />
                </div>
                <Skeleton width="80%" height={20} className="mb-2" />
                <Skeleton width="100%" height={12} count={2} />
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <Skeleton width={80} height={12} count={2} />
                  </div>
                  <Skeleton width={80} height={30} borderRadius={8} />
                </div>
              </div>
            ))}
          </div>
        ) : proveedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-bold text-gray-600">Aún no hay proveedores</p>
            <p className="text-sm mt-1">
              Registra tu primer proveedor para agilizar los pedidos.
            </p>
          </div>
        ) : filteredProveedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <p className="font-bold text-gray-600">Sin resultados</p>
            <p className="text-sm mt-1">
              No se encontró ningún proveedor que coincida con "{search}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredProveedores.map((p) => (
              <div
                key={p.id}
                className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-black shrink-0">
                    {p.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingProv(p);
                        setError("");
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">
                  {p.nombre}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
                  {p.descripcion || "Sin descripción detallada"}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    {p.telefono_fijo && (
                      <span className="text-[10px] font-bold text-gray-400 truncate">
                        Fijo: {p.telefono_fijo}
                      </span>
                    )}
                    {p.correo && (
                      <span className="text-[10px] font-bold text-gray-400 truncate">
                        {p.correo}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => solicitarPedido(p)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shrink-0 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProveedorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        provToEdit={editingProv}
        onSaveSuccess={handleSaveSuccess}
      />
      <PedidoDrawer
        isOpen={!!pedidoProv}
        onClose={() => setPedidoProv(null)}
        proveedor={pedidoProv}
      />

      <FramerModal
        isOpen={!!deletingProv}
        onClose={() => setDeletingProv(null)}
        title="Eliminar Proveedor"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">¿Estás seguro?</h4>
            <p className="text-sm text-gray-500 mt-2">
              Se eliminará a{" "}
              <strong className="text-gray-900">{deletingProv?.nombre}</strong>{" "}
              de tus contactos.
            </p>
          </div>
          {error && deletingProv && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingProv(null)}
              disabled={isDeleting}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
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
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden pointer-events-auto"
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
