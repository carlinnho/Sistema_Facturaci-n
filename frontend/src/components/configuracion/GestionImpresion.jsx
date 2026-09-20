import { useState, useEffect } from "react";
import { Printer, FileText, Receipt, Info, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { empresaService } from "../../api/empresaService";

export default function GestionImpresion() {
  const [empresa, setEmpresa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para saber qué ticket estamos viendo
  const [tipoView, setTipoView] = useState("BOLETA");

  // Estado exclusivo para el Modal en móviles
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        const data = await empresaService.obtener();
        setEmpresa(data);
      } catch (error) {
        console.error("Error al cargar datos de empresa para preview", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const openMobilePreview = (tipo) => {
    setTipoView(tipo);
    setIsMobilePreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-gray-500">Generando vista previa...</p>
      </div>
    );
  }

  // Extraemos el diseño del ticket en una variable para poder reusarlo en PC y Móvil
  const TicketPreview = () => (
    <div className="w-full max-w-[320px] bg-white shadow-xl lg:shadow-2xl border border-gray-200 p-6 flex flex-col text-[#1a1a1a] font-mono leading-tight mx-auto mb-10 mt-4 lg:mt-0">
      <div className="text-center space-y-2 mb-4">
        {empresa?.logo_url ? (
          <img
            src={empresa.logo_url}
            alt="Logo"
            className="h-12 mx-auto object-contain mb-2 grayscale"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-sans font-bold">
            JB
          </div>
        )}
        <p className="text-sm font-bold uppercase">
          {empresa?.razon_social || "EMPRESA S.A.C"}
        </p>
        <p className="text-[10px]">RUC: {empresa?.ruc || "00000000000"}</p>
        <p className="text-[10px] px-4">
          {empresa?.direccion || "Calle Ejemplo 123, Lima"}
        </p>
      </div>

      <div className="border-b border-dashed border-gray-300 my-3"></div>

      <div className="text-[10px] space-y-1">
        <p className="font-bold text-center text-xs mb-2">
          {tipoView === "BOLETA"
            ? "BOLETA DE VENTA ELECTRÓNICA"
            : "FACTURA ELECTRÓNICA"}
        </p>
        <p className="text-center font-bold">
          {tipoView === "BOLETA" ? "B001-00000045" : "F001-00000012"}
        </p>
        <div className="flex justify-between mt-3">
          <span>Fecha:</span>
          <span>28/04/2026</span>
        </div>
        <div className="flex justify-between">
          <span>Hora:</span>
          <span>10:45 AM</span>
        </div>
        <div className="flex justify-between">
          <span>Cajero:</span>
          <span>Administrador</span>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-300 my-3"></div>

      <div className="text-[10px] space-y-1">
        <p>
          CLIENTE:{" "}
          {tipoView === "BOLETA" ? "PÚBLICO GENERAL" : "CONSULTORA JB S.A.C"}
        </p>
        <p>{tipoView === "BOLETA" ? "DNI: 00000000" : "RUC: 20601234567"}</p>
      </div>

      <div className="border-b border-gray-900 my-3"></div>

      <div className="text-[10px] space-y-3">
        <div className="flex justify-between font-bold border-b border-gray-100 pb-1 uppercase">
          <span className="w-8">Cant</span>
          <span className="flex-1 px-2">Descripción</span>
          <span className="w-16 text-right">Total</span>
        </div>
        <div className="flex justify-between">
          <span className="w-8 italic">2.00</span>
          <span className="flex-1 px-2 uppercase truncate">
            Aceite Primor 1L
          </span>
          <span className="w-16 text-right font-bold">18.00</span>
        </div>
        <div className="flex justify-between">
          <span className="w-8 italic">1.00</span>
          <span className="flex-1 px-2 uppercase truncate">
            Arroz Costeño 5kg
          </span>
          <span className="w-16 text-right font-bold">24.50</span>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-300 my-4"></div>

      <div className="text-[11px] space-y-1.5 self-end w-full sm:w-40">
        <div className="flex justify-between">
          <span>OP. GRAVADA:</span>
          <span>S/ 36.02</span>
        </div>
        <div className="flex justify-between">
          <span>I.G.V (18%):</span>
          <span>S/ 6.48</span>
        </div>
        <div className="flex justify-between text-sm font-black border-t border-gray-900 pt-1">
          <span>TOTAL:</span>
          <span>S/ 42.50</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 bg-gray-50 border border-gray-200 flex items-center justify-center p-1">
          {/* Simulación del patrón del código QR */}
          <div className="w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[4px_4px]"></div>
        </div>

        <div className="text-[9px] text-gray-500 space-y-1">
          <p>
            Representación impresa de la {tipoView.toLowerCase()} electrónica.
          </p>
          <p>Consulte su documento en:</p>
          <p className="font-bold underline text-black">
            www.jb-facturacion.com/consulta
          </p>
          <p className="pt-2 italic font-serif">¡Gracias por su compra!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row relative">
      {/* ── PANEL IZQUIERDO: CONTROLES ── */}
      <div className="p-4 sm:p-6 lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-6 bg-white shrink-0 z-10">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Printer className="w-6 h-6 text-blue-600" /> Impresión
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Visualiza cómo saldrán tus comprobantes en formato ticket (80mm).
          </p>
        </div>

        <div className="space-y-3 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">
            Vista Previa de Comprobante
          </p>
          <div className="grid grid-cols-1 gap-3">
            {/* Botón Boleta */}
            <button
              onClick={() => {
                // En Desktop actualiza el estado lateral, en Móvil abre el modal
                if (window.innerWidth < 1024) openMobilePreview("BOLETA");
                else setTipoView("BOLETA");
              }}
              className={`flex items-center justify-between px-4 py-4 rounded-xl text-sm font-bold transition-all border-2 ${
                tipoView === "BOLETA" && window.innerWidth >= 1024
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-600/10"
                  : "border-gray-100 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt
                  className={`w-5 h-5 ${tipoView === "BOLETA" && window.innerWidth >= 1024 ? "text-blue-600" : "text-gray-400"}`}
                />
                Boleta de Venta
              </div>
              {/* Indicador visual solo en móvil para sugerir clic */}
              <span className="lg:hidden text-[10px] bg-gray-900 text-white px-2 py-1 rounded-md">
                VER TICKET
              </span>
            </button>

            {/* Botón Factura */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) openMobilePreview("FACTURA");
                else setTipoView("FACTURA");
              }}
              className={`flex items-center justify-between px-4 py-4 rounded-xl text-sm font-bold transition-all border-2 ${
                tipoView === "FACTURA" && window.innerWidth >= 1024
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-600/10"
                  : "border-gray-100 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`w-5 h-5 ${tipoView === "FACTURA" && window.innerWidth >= 1024 ? "text-blue-600" : "text-gray-400"}`}
                />
                Factura Electrónica
              </div>
              <span className="lg:hidden text-[10px] bg-gray-900 text-white px-2 py-1 rounded-md">
                VER TICKET
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Info className="w-4 h-4 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wider">
              Aviso SUNAT
            </p>
          </div>
          <p className="text-[11px] text-amber-600 leading-relaxed font-medium">
            El diseño es estándar y regulado. Cualquier cambio que realices en
            el logo o nombre en la pestaña "Empresa" se verá reflejado
            inmediatamente aquí.
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO (DESKTOP): TICKET PREVIEW ── */}
      <div className="hidden lg:flex flex-1 bg-gray-100/50 p-6 justify-center overflow-y-auto scrollbar-hide">
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <TicketPreview />
        </div>
      </div>

      {/* ── MODAL FULLSCREEN (MÓVIL): TICKET PREVIEW ── */}
      <AnimatePresence>
        {isMobilePreviewOpen && (
          <div className="fixed inset-0 z-100 flex flex-col lg:hidden">
            {/* Fondo oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900"
            />

            {/* Contenedor Deslizable */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col h-full bg-gray-100 pt-14 pb-24"
            >
              <div className="flex-1 overflow-y-auto px-4 pb-8 flex justify-center">
                <TicketPreview />
              </div>

              {/* Botonera Flotante Inferior */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Demostración
                  </span>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {tipoView === "BOLETA" ? "BOLETA" : "FACTURA"}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobilePreviewOpen(false)}
                  className="w-full h-14 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <X className="w-5 h-5" /> Cerrar Vista Previa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
