import { useState, useEffect } from "react";
import {
  DatabaseBackup,
  Download,
  ShieldCheck,
  Loader2,
  HardDrive,
  Clock,
  FileType,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { backupService } from "../api/backupService";

export default function Backup() {
  const [historial, setHistorial] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      setIsLoading(true);
      const data = await backupService.listar();
      setHistorial(data || []);
    } catch (error) {
      console.error("Error al cargar historial", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearBackup = async () => {
    setIsCreating(true);
    try {
      await backupService.crear();
      await fetchHistorial(); // Refrescar lista
    } catch (error) {
      alert("Error al generar respaldo");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDescargar = async (id, nombre) => {
    try {
      const blob = await backupService.descargarPorId(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("El archivo ya no se encuentra en el servidor.");
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <DatabaseBackup className="w-7 h-7 text-indigo-600" /> Historial de
            Respaldos
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Gestión y descarga de copias de seguridad.
          </p>
        </div>
        <button
          onClick={handleCrearBackup}
          disabled={isCreating}
          className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          {isCreating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <HardDrive className="w-5 h-5" />
          )}
          Generar Nuevo Respaldo
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">Respaldos Almacenados</h3>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Nombre del Archivo</th>
                <th className="px-6 py-4">Fecha de Generación</th>
                <th className="px-6 py-4 text-center">Tamaño</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton width={200} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={150} />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton width={60} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton width={40} height={40} borderRadius={10} />
                    </td>
                  </tr>
                ))
              ) : historial.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-gray-400 font-medium"
                  >
                    No se han generado respaldos todavía.
                  </td>
                </tr>
              ) : (
                historial.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                          <FileType className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-700">
                          {b.nombre_archivo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {new Date(b.fecha_generacion).toLocaleString("es-PE")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-black">
                        {b.tamano}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDescargar(b.id, b.nombre_archivo)}
                        className="p-2.5 bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all"
                        title="Descargar archivo SQL"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
