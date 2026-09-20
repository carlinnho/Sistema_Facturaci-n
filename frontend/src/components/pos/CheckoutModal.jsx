import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  XCircle,
  ChevronRight,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { ventaService } from "../../api/ventaService";
import { empresaService } from "../../api/empresaService";
import { useReactToPrint } from "react-to-print";
import { flushSync } from "react-dom";
import { usePOS, formatSoles } from "../../context/POSContext";
import { TicketVenta } from "./TicketVenta";
import FramerModal from "./FramerModal";

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  totals,
  paymentMethod,
  onSuccess,
  onReject,
}) {
  const [step, setStep] = useState(1);
  // Por defecto iniciamos en BOLETA (ya que quitamos SIMPLE)
  const [tipo, setTipo] = useState("BOLETA");
  const [docType, setDocType] = useState("SIN_DOC");
  const [documento, setDocumento] = useState("");
  const [clienteData, setClienteData] = useState({
    nombre: "Público General",
    direccion: "",
  });

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lastTicketId, setLastTicketId] = useState("000000");
  const paymentMap = { efectivo: 1, tarjeta: 2, yape: 3 };
  const [datosEmpresa, setDatosEmpresa] = useState(null);

  const ticketRef = useRef();
  const { triggerRefresh } = usePOS();

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${lastTicketId}`,
    onAfterPrint: () => {
      setSuccessMsg("");
      triggerRefresh();
      onSuccess();
    },
  });

  // Solo manejamos BOLETA y FACTURA
  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setError("");
    if (nuevoTipo === "BOLETA") {
      setDocType("SIN_DOC");
      setDocumento("");
      setClienteData({ nombre: "Público General", direccion: "" });
    } else {
      // FACTURA
      setDocType("RUC");
      setDocumento("");
      setClienteData({ nombre: "", direccion: "" });
    }
  };

  const buscarCliente = async () => {
    if (!documento) return;
    setIsSearching(true);
    setError("");
    try {
      const response = await ventaService.buscarCliente(docType, documento);
      const cliente = response.data;
      setClienteData({
        nombre: cliente.nombre || "",
        direccion: cliente.direccion || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "No se encontró el documento.");
      setClienteData({ nombre: "", direccion: "" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextStep = () => {
    if (tipo === "FACTURA" && (!clienteData.nombre || !clienteData.direccion)) {
      setError("Razón social y dirección son obligatorias para Facturas.");
      return;
    }
    if (
      tipo === "BOLETA" &&
      docType !== "SIN_DOC" &&
      (!clienteData.nombre || clienteData.nombre === "Público General")
    ) {
      setError(
        "Por favor, busque el documento válido primero o seleccione 'Sin Doc.'",
      );
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const detallesFormateados = items.map((it) => ({
        id_producto: it.product.id,
        cantidad: it.quantity,
        precio_unitario: it.product.price,
        descuento: 0,
      }));
      const payload = {
        id_medio_pago: paymentMap[paymentMethod] || 1,
        tipo_comprobante: tipo,
        tipo_doc_cliente: docType,
        documento_cliente: docType === "SIN_DOC" ? undefined : documento,
        nombre_cliente: clienteData.nombre || "Público General",
        direccion_cliente: clienteData.direccion || undefined,
        detalles: detallesFormateados,
      };
      const res = await ventaService.crear(payload);
      flushSync(() => {
        setLastTicketId(res.data.id_venta);
        setSuccessMsg(`Venta exitosa. Ticket #${res.data.id_venta}`);
      });
      handlePrint();
    } catch (err) {
      setError(
        err.response?.data?.message || "Ocurrió un error al procesar la venta.",
      );
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const cargarEmpresa = async () => {
      try {
        const res = await empresaService.obtener();
        setDatosEmpresa(res);
      } catch (err) {
        console.error("Error al cargar datos de empresa", err);
      }
    };
    cargarEmpresa();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTipo("BOLETA");
      setDocType("SIN_DOC");
      setDocumento("");
      setClienteData({ nombre: "Público General", direccion: "" });
      setError("");
      setSuccessMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Regla de validación estricta para habilitar el botón Buscar
  const isSearchDisabled = () => {
    if (isSearching) return true;
    if (docType === "DNI" && documento.length !== 8) return true;
    if (docType === "RUC" && documento.length !== 11) return true;
    if (docType === "CE" && documento.length < 4) return true;
    return false;
  };

  const renderStep1 = () => (
    <>
      {/* 1. Selector Principal (BOLETA / FACTURA) a 2 columnas */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {["BOLETA", "FACTURA"].map((t) => (
          <button
            key={t}
            onClick={() => handleTipoChange(t)}
            className={`py-2 text-sm font-black rounded-lg transition-all ${tipo === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        {/* 2. Botones de Atajo (Solo para BOLETA) en lugar del Select */}
        {tipo === "BOLETA" && (
          <div className="flex gap-2 mb-2">
            {[
              { id: "SIN_DOC", label: "Sin Doc." },
              { id: "DNI", label: "DNI" },
              { id: "CE", label: "CE" },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setDocType(doc.id);
                  setDocumento("");
                  if (doc.id === "SIN_DOC") {
                    setClienteData({
                      nombre: "Público General",
                      direccion: "",
                    });
                    setError("");
                  } else {
                    setClienteData({ nombre: "", direccion: "" });
                  }
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${
                  docType === doc.id
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {doc.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. Input de Búsqueda y Botón Gigante */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">
            {tipo === "FACTURA" ? "RUC" : "Número de Documento"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={
                docType === "SIN_DOC"
                  ? "Público General"
                  : `Ingrese ${docType}...`
              }
              disabled={docType === "SIN_DOC"}
              value={documento}
              onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
              maxLength={docType === "RUC" ? 11 : docType === "CE" ? 12 : 8}
              className={`flex-1 px-4 h-12 border border-gray-200 rounded-xl outline-none font-bold text-sm transition-all ${docType === "SIN_DOC" ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"}`}
            />
            {docType !== "SIN_DOC" && (
              <button
                onClick={buscarCliente}
                disabled={isSearchDisabled()}
                className="px-6 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Buscar
              </button>
            )}
          </div>
          {/* Mensaje de ayuda dinámico debajo del input */}
          {docType === "DNI" &&
            documento.length > 0 &&
            documento.length < 8 && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                Faltan {8 - documento.length} dígitos para buscar.
              </p>
            )}
          {docType === "RUC" &&
            documento.length > 0 &&
            documento.length < 11 && (
              <p className="text-[10px] text-amber-600 font-bold mt-1">
                Faltan {11 - documento.length} dígitos para buscar.
              </p>
            )}
        </div>

        {/* 4. Inputs de Resultado */}
        <div>
          <label className="text-xs font-bold text-gray-500 mb-1 block">
            Razón Social / Nombre
          </label>
          <input
            type="text"
            readOnly
            placeholder="El nombre aparecerá al buscar"
            value={clienteData.nombre}
            className="w-full px-4 h-11 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 text-sm cursor-not-allowed"
          />
        </div>

        {tipo === "FACTURA" && (
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">
              Dirección Fiscal
            </label>
            <input
              type="text"
              readOnly
              placeholder="La dirección aparecerá al buscar"
              value={clienteData.direccion}
              className="w-full px-4 h-11 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 text-sm cursor-not-allowed"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-blue-900 opacity-70">
            Medio de pago
          </p>
          <p className="font-black text-blue-900 capitalize flex items-center gap-1.5 mt-0.5">
            {paymentMethod === "efectivo" && <Banknote className="h-4 w-4" />}
            {paymentMethod === "tarjeta" && <CreditCard className="h-4 w-4" />}
            {paymentMethod === "yape" && <Smartphone className="h-4 w-4" />}
            {paymentMethod}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-900 opacity-70">
            Total a cobrar
          </p>
          <p className="text-2xl font-black text-blue-700">
            {formatSoles(totals.total)}
          </p>
        </div>
      </div>

      <button
        onClick={handleNextStep}
        className="w-full mt-6 h-14 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        Continuar <ChevronRight className="h-5 w-5" />
      </button>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
          Resumen de Venta
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {items.map((it) => (
            <div
              key={it.product.id}
              className="flex justify-between items-center text-sm"
            >
              <div className="flex gap-2 text-gray-700 font-medium">
                <span className="font-bold">{it.quantity}x</span>
                <span className="truncate max-w-[200px]">
                  {it.product.name}
                </span>
              </div>
              <span className="font-bold text-gray-900">
                {formatSoles(it.quantity * it.product.price)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-1 text-sm font-bold">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal:</span>
            <span>{formatSoles(totals.base)}</span>
          </div>
          {(tipo === "FACTURA" || tipo === "BOLETA") && (
            <div className="flex justify-between text-gray-500">
              <span>IGV (18%):</span>
              <span>{formatSoles(totals.igv)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg text-blue-700 pt-2">
            <span>Total:</span>
            <span>{formatSoles(totals.total)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onReject}
          disabled={isSubmitting}
          className="flex-1 h-14 bg-red-50 hover:bg-red-100 text-red-600 font-black text-base rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <XCircle className="h-5 w-5" /> Rechazar
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          Aceptar
        </button>
      </div>
    </>
  );

  return (
    <>
      <TicketVenta
        ref={ticketRef}
        items={items}
        totals={totals}
        cliente={{
          nombre: clienteData.nombre,
          documento: documento,
          direccion: clienteData.direccion,
        }}
        tipoComprobante={tipo}
        numeroTicket={lastTicketId}
        empresa={datosEmpresa}
      />

      <FramerModal
        isOpen={isOpen}
        onClose={onClose}
        title={step === 1 ? "Configurar Comprobante" : "Confirmar Venta"}
        maxWidth="max-w-lg"
      >
        <div className="p-6">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-10 text-emerald-600">
              <CheckCircle2 className="h-16 w-16 mb-4" />
              <p className="text-xl font-black text-center">{successMsg}</p>
              <p className="text-sm font-medium mt-2 text-gray-500">
                Imprimiendo comprobante...
              </p>
            </div>
          ) : step === 1 ? (
            renderStep1()
          ) : (
            renderStep2()
          )}
        </div>
      </FramerModal>
    </>
  );
}
