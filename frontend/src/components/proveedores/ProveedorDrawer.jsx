import { useState, useEffect } from "react";
import { X, Save, Loader2, AlertCircle, MessageCircle } from "lucide-react";

export default function ProveedorDrawer({
  isOpen,
  onClose,
  provToEdit,
  onSaveSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    telefono_whatsapp: "",
    telefono_fijo: "",
    correo: "",
  });

  // Cargar datos del proveedor si estamos editando
  useEffect(() => {
    if (isOpen) {
      setError("");
      if (provToEdit) {
        setFormData({
          nombre: provToEdit.nombre,
          descripcion: provToEdit.descripcion || "",
          telefono_whatsapp: provToEdit.telefono_whatsapp || "",
          telefono_fijo: provToEdit.telefono_fijo || "",
          correo: provToEdit.correo || "",
        });
      } else {
        setFormData({
          nombre: "",
          descripcion: "",
          telefono_whatsapp: "",
          telefono_fijo: "",
          correo: "",
        });
      }
    }
  }, [isOpen, provToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        telefono_whatsapp: formData.telefono_whatsapp.trim() || null,
        telefono_fijo: formData.telefono_fijo.trim() || null,
        correo: formData.correo.trim() || null,
      };

      await onSaveSuccess(payload, provToEdit?.id);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el proveedor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex justify-end ${isOpen ? "" : "pointer-events-none"}`}
      >
        {/* Fondo oscuro difuminado */}
        <div
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />

        {/* Panel deslizante lateral */}
        <div
          className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Cabecera del Drawer */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {provToEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {provToEdit
                  ? "Actualiza los datos de contacto"
                  : "Añade un nuevo contacto a tu directorio"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg border border-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Formulario */}
          <form
            id="proveedorForm"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5"
          >
            {error && (
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Razón Social o Nombre
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                placeholder="Ej. Distribuidora XYZ"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Descripción de Insumos
              </label>
              <input
                type="text"
                placeholder="Ej: Proveedor de frenos y accesorios..."
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-1">
                  WhatsApp{" "}
                  <MessageCircle className="w-3 h-3 text-emerald-500" />
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="Ej: 987654321"
                  value={formData.telefono_whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefono_whatsapp: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                  Teléfono Fijo
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.telefono_fijo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefono_fijo: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Correo Electrónico
              </label>
              <input
                type="email"
                maxLength={100}
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
              />
            </div>
          </form>

          {/* Pie del Drawer con el botón Guardar */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <button
              form="proveedorForm"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {provToEdit ? "Actualizar Proveedor" : "Guardar Proveedor"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
