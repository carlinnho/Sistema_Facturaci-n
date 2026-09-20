import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Upload,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
  AlertTriangle,
} from "lucide-react";
import { empresaService } from "../../api/empresaService";

export default function GestionEmpresa() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: "",
    message: "",
  });

  const fileInputRef = useRef(null);

  // Almacenamos los datos originales para poder cancelar y comparar cambios
  const [originalData, setOriginalData] = useState({});
  const [formData, setFormData] = useState({
    ruc: "",
    razon_social: "",
    nombre_comercial: "",
    direccion: "",
    telefono: "",
    email_login: "",
    password: "",
    logo_url: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await empresaService.obtener();
      if (data) {
        const loadedData = {
          ruc: data.ruc || "",
          razon_social: data.razon_social || "",
          nombre_comercial: data.nombre_comercial || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
          email_login: data.email_login || "",
          password: "",
          logo_url: data.logo_url || "",
        };
        setFormData(loadedData);
        setOriginalData(loadedData);
      }
    } catch (error) {
      setResultModal({
        isOpen: true,
        type: "error",
        message: "No se pudieron cargar los datos de la empresa.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setResultModal({
          isOpen: true,
          type: "error",
          message: "La imagen es muy pesada. Máximo 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    // Verificar si realmente hay cambios antes de abrir el modal
    const changedFields = getChangedFields();
    if (changedFields.length === 0) {
      setIsEditing(false);
      return;
    }
    setShowConfirmModal(true);
  };

  const getChangedFields = () => {
    const changes = [];
    if (formData.ruc !== originalData.ruc) changes.push("RUC");
    if (formData.razon_social !== originalData.razon_social)
      changes.push("Razón Social");
    if (formData.nombre_comercial !== originalData.nombre_comercial)
      changes.push("Nombre Comercial");
    if (formData.direccion !== originalData.direccion)
      changes.push("Dirección");
    if (formData.telefono !== originalData.telefono) changes.push("Teléfono");
    if (formData.email_login !== originalData.email_login)
      changes.push("Correo Electrónico");
    if (formData.password) changes.push("Contraseña");
    if (formData.logo_url !== originalData.logo_url)
      changes.push("Logo de Empresa");
    return changes;
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await empresaService.actualizar(payload);

      // Actualizamos la base original para futuros cambios
      const savedData = { ...formData, password: "" };
      setOriginalData(savedData);
      setFormData(savedData);

      setIsEditing(false);
      setShowConfirmModal(false);
      setResultModal({
        isOpen: true,
        type: "success",
        message: "Cambio completado. Los datos se actualizaron correctamente.",
      });
    } catch (error) {
      setShowConfirmModal(false);
      setResultModal({
        isOpen: true,
        type: "error",
        message:
          error.response?.data?.message ||
          "Cambio fallido. Ocurrió un error al guardar los datos.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const changesList = getChangedFields();

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Perfil de la Empresa
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Esta información aparecerá en tus tickets de venta.
          </p>
        </div>
      </div>

      <form
        id="empresaForm"
        onSubmit={handleSubmitRequest}
        className="p-6 flex-1 overflow-y-auto space-y-8"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Columna Izquierda: Logo */}
          <div className="flex flex-col items-center space-y-4 md:w-64 shrink-0">
            <div
              className={`relative group w-40 h-40 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                isEditing
                  ? "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
                  : "border-gray-200 bg-gray-100 opacity-80"
              }`}
            >
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo Empresa"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center text-gray-400 flex flex-col items-center">
                  <Building2 className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-xs font-bold px-4">Sin Logo</span>
                </div>
              )}

              {isEditing && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-gray-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                >
                  <div className="text-white flex flex-col items-center">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs font-bold">Subir Imagen</span>
                  </div>
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <p className="text-xs font-medium text-gray-500 text-center px-4">
                  Recomendado: PNG o JPG, máximo 2MB.
                </p>
              </>
            )}
          </div>

          {/* Columna Derecha: Campos */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Hash className="h-4 w-4 text-gray-400" /> RUC
              </label>
              <input
                type="text"
                name="ruc"
                maxLength="11"
                required
                disabled={!isEditing}
                value={formData.ruc}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Building2 className="h-4 w-4 text-gray-400" /> Razón Social
              </label>
              <input
                type="text"
                name="razon_social"
                required
                disabled={!isEditing}
                value={formData.razon_social}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Building2 className="h-4 w-4 text-gray-400" /> Nombre Comercial
              </label>
              <input
                type="text"
                name="nombre_comercial"
                required
                disabled={!isEditing}
                value={formData.nombre_comercial}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <MapPin className="h-4 w-4 text-gray-400" /> Dirección
              </label>
              <input
                type="text"
                name="direccion"
                required
                disabled={!isEditing}
                value={formData.direccion}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Phone className="h-4 w-4 text-gray-400" /> Teléfono
              </label>
              <input
                type="text"
                name="telefono"
                disabled={!isEditing}
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div className="col-span-1 md:col-span-2 pt-4 mt-2 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
                Credenciales del Administrador
              </h3>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Mail className="h-4 w-4 text-gray-400" /> Correo Electrónico
              </label>
              <input
                type="email"
                name="email_login"
                required
                disabled={!isEditing}
                value={formData.email_login}
                onChange={handleChange}
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1.5">
                <Lock className="h-4 w-4 text-gray-400" /> Nueva Contraseña
              </label>
              <input
                type="password"
                name="password"
                disabled={!isEditing}
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isEditing ? "Dejar en blanco para no cambiar" : "••••••••"
                }
                className="w-full px-4 h-11 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-transparent"
              />
            </div>
          </div>
        </div>
      </form>

      <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full md:w-auto px-8 h-12 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all"
          >
            <Edit3 className="h-5 w-5" /> Editar Información
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full md:w-auto px-6 h-12 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              form="empresaForm"
              type="submit"
              className="w-full md:w-auto px-8 h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Save className="h-5 w-5" /> Guardar Cambios
            </button>
          </>
        )}
      </div>

      {/* ── Modal de Confirmación ── */}
      <FramerModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Actualización"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">
              ¿Registrar cambios?
            </h4>
            <p className="text-sm text-gray-500 mt-2">
              Se han detectado modificaciones en los siguientes campos:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {changesList.map((field) => (
                <span
                  key={field}
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 h-12 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmSave}
              disabled={isSaving}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Sí, guardar
            </button>
          </div>
        </div>
      </FramerModal>

      {/* ── Modal de Resultado (Éxito / Error) ── */}
      <FramerModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal({ ...resultModal, isOpen: false })}
        title={resultModal.type === "success" ? "Operación Exitosa" : "Error"}
      >
        <div className="p-6 text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${resultModal.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}
          >
            {resultModal.type === "success" ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>
          <h4 className="text-lg font-black text-gray-900">
            {resultModal.type === "success"
              ? "Cambio completado"
              : "Cambio fallido"}
          </h4>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            {resultModal.message}
          </p>
          <button
            onClick={() => setResultModal({ ...resultModal, isOpen: false })}
            className="w-full h-12 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Aceptar
          </button>
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
