import { useState, useEffect } from "react";
import { CreditCard, Edit2, Loader2, Save, X, AlertCircle } from "lucide-react";
import { mediosPagoService } from "../../api/mediosPagoService";

export default function GestionMediosPago() {
  const [medios, setMedios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const cargarMedios = async () => {
    try {
      setIsLoading(true);
      const data = await mediosPagoService.listar();
      setMedios(data);
    } catch (err) {
      console.error("Error cargando medios de pago:", err);
      setError("No se pudieron cargar los métodos de pago.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarMedios();
  }, []);

  const handleToggleActivo = async (medio) => {
    try {
      const nuevoEstado = medio.activo === 1 ? 0 : 1;
      // Actualizamos UI optimísticamente
      setMedios(
        medios.map((m) =>
          m.id === medio.id ? { ...m, activo: nuevoEstado } : m,
        ),
      );
      await mediosPagoService.actualizar(medio.id, {
        nombre: medio.nombre,
        activo: nuevoEstado,
      });
    } catch (err) {
      // Revertimos si hay error
      cargarMedios();
      alert("Error al cambiar el estado del medio de pago.");
    }
  };

  const handleSaveEdit = async (id, estadoActual) => {
    if (!editName.trim()) return;
    try {
      setIsSaving(true);
      await mediosPagoService.actualizar(id, {
        nombre: editName,
        activo: estadoActual,
      });
      setMedios(
        medios.map((m) => (m.id === id ? { ...m, nombre: editName } : m)),
      );
      setEditingId(null);
    } catch (err) {
      alert("Error al actualizar el nombre.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" /> Métodos de Pago
          </h2>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Activa, desactiva o renombra los métodos disponibles en caja.
          </p>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
            <p className="font-bold">Cargando métodos de pago...</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {medios.map((medio) => (
              <li
                key={medio.id}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-all"
              >
                {/* Lado Izquierdo: Nombre o Input de Edición */}
                <div className="flex-1">
                  {editingId === medio.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="px-3 py-1.5 border border-blue-300 rounded-lg outline-none font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600/20"
                      />
                      <button
                        onClick={() => handleSaveEdit(medio.id, medio.activo)}
                        disabled={isSaving}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-sm ${medio.activo === 1 ? "text-gray-900" : "text-gray-400 line-through"}`}
                      >
                        {medio.nombre}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(medio.id);
                          setEditName(medio.nombre);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lado Derecho: Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold ${medio.activo === 1 ? "text-emerald-600" : "text-gray-400"}`}
                  >
                    {medio.activo === 1 ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    onClick={() => handleToggleActivo(medio)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${medio.activo === 1 ? "bg-emerald-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${medio.activo === 1 ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
