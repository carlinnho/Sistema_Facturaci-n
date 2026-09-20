import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  X,
  Save,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { userService } from "../../api/userService";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    pin: "",
    id_rol: 2,
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await userService.listar();
      setUsuarios(data);
    } catch (err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ nombres: "", apellidos: "", pin: "", id_rol: 2 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nombres: user.nombres,
      apellidos: user.apellidos,
      pin: "", // Se limpia por seguridad
      id_rol: user.id_rol,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.id_rol === 1 && (!formData.pin || formData.pin.length !== 6)) {
      setError("El Administrador debe tener un PIN de exactamente 6 dígitos.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        id_rol: parseInt(formData.id_rol),
        pin: formData.id_rol === 1 ? formData.pin : null,
      };

      if (editingUser) {
        await userService.actualizar(editingUser.id, payload);
      } else {
        await userService.crear(payload);
      }

      setModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el usuario.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setError("");
    try {
      await userService.eliminar(deletingUser.id);
      setDeletingUser(null);
      fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    // CAMBIO CLAVE: h-full flex flex-col min-h-0
    <div className="relative h-full flex flex-col min-h-0 bg-transparent">
      {/* ── Cabecera ── */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-gray-900">Personal</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Administra los accesos de tu equipo.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 w-11 sm:w-auto px-0 sm:px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
          title="Nuevo Usuario"
        >
          <Plus className="w-5 h-5 stroke-3" />
          <span className="hidden sm:inline">Nuevo Usuario</span>
        </button>
      </div>

      {/* ── Lista (CON SCROLL) ── */}
      {/* CAMBIO CLAVE: flex-1 overflow-y-auto */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-black shrink-0">
                  {u.nombres[0]}
                  {u.apellidos[0]}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingUser(u);
                      setError("");
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                {u.nombres} {u.apellidos}
              </h3>
              <div className="mt-auto pt-4 flex items-center gap-2">
                {u.id_rol === 1 ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Administrador
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                    <Users className="w-3.5 h-3.5" /> Trabajador
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal Formulario ── */}
      <FramerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && !deletingUser && (
            <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Nombres
              </label>
              <input
                type="text"
                required
                value={formData.nombres}
                onChange={(e) =>
                  setFormData({ ...formData, nombres: e.target.value })
                }
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 rounded-xl outline-none font-medium transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Apellidos
              </label>
              <input
                type="text"
                required
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({ ...formData, apellidos: e.target.value })
                }
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 rounded-xl outline-none font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-900 mb-1.5 block">
              Nivel de Acceso
            </label>
            <select
              value={formData.id_rol}
              onChange={(e) =>
                setFormData({ ...formData, id_rol: parseInt(e.target.value) })
              }
              className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 rounded-xl outline-none font-medium transition-colors"
            >
              <option value={2}>Trabajador (Solo Ventas)</option>
              <option value={1}>Administrador (Acceso Total)</option>
            </select>
          </div>

          {formData.id_rol === 1 && (
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <label className="text-sm font-bold text-purple-900 mb-1.5 block">
                PIN de Seguridad (6 dígitos)
              </label>
              <input
                type="password"
                required
                maxLength="6"
                placeholder="Ej: 123456"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pin: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full px-4 h-11 bg-white border border-purple-200 focus:border-purple-600 rounded-xl outline-none font-black tracking-widest text-center transition-colors"
              />
              <p className="text-xs text-purple-600 font-medium mt-2 leading-tight">
                Este PIN será solicitado cada vez que el administrador ingrese
                al sistema.
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}{" "}
              Guardar
            </button>
          </div>
        </form>
      </FramerModal>

      {/* ── Modal Borrar ── */}
      <FramerModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Eliminar Usuario"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">
              ¿Retirar acceso?
            </h4>
            <p className="text-sm text-gray-500 mt-2">
              Estás a punto de eliminar a{" "}
              <strong className="text-gray-900">{deletingUser?.nombres}</strong>
              . Ya no podrá ingresar al sistema.
            </p>
          </div>
          {error && deletingUser && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isDeleting}
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
              )}{" "}
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
