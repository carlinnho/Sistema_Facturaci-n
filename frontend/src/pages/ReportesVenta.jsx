import { useState, useEffect } from "react";
import { BarChart3, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { reportesService } from "../api/reportesService";
import Dashboard from "../components/reportes/Dashboard";
import Historial from "../components/reportes/Historial";

export default function ReportesVenta() {
  const [historial, setHistorial] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Estado del menú píldora
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" o "historial"

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [historialData, dashboardData] = await Promise.all([
        reportesService.obtenerHistorial(),
        reportesService.obtenerDashboard(),
      ]);
      setHistorial(historialData || []);
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const blob = await reportesService.descargarHistorialExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Historial_Ventas_${new Date().getTime()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error al descargar el Excel");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await reportesService.descargarDashboardPdf();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Reporte_Gerencial_${new Date().getTime()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Error al descargar el PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-transparent space-y-6 overflow-hidden">
      {/* ── CABECERA Y MENÚ PÍLDORA ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        {/* Título y Píldora */}
        <div className="flex flex-wrap items-center gap-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Analítica
          </h1>

          {/* Menú Píldora Animado */}
          <div className="relative flex items-center bg-gray-100 p-1 rounded-full border border-gray-200 shadow-inner">
            {/* Fondo deslizable (El indicador activo) */}
            <div
              className={`absolute top-1 bottom-1 w-[130px] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${
                activeTab === "dashboard" ? "translate-x-0" : "translate-x-full"
              }`}
            ></div>

            {/* Botones */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`relative z-10 w-[130px] h-9 text-sm font-bold rounded-full transition-colors ${
                activeTab === "dashboard"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("historial")}
              className={`relative z-10 w-[130px] h-9 text-sm font-bold rounded-full transition-colors ${
                activeTab === "historial"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Historial
            </button>
          </div>
        </div>

        {/* Botones Exportar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className="h-11 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isDownloadingExcel ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="h-11 px-4 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* ── CONTENEDOR DE LA VISTA ACTIVA ── */}
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        {activeTab === "dashboard" ? (
          <Dashboard dashboard={dashboard} />
        ) : (
          <Historial historial={historial} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
