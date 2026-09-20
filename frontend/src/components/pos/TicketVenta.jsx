import { forwardRef } from "react";
import { formatSoles } from "../../context/POSContext";

export const TicketVenta = forwardRef(
  ({ items, totals, cliente, tipoComprobante, numeroTicket, empresa }, ref) => {
    // Obtenemos la fecha y hora actual
    const hoy = new Date();
    const fecha = hoy.toLocaleDateString("es-PE");
    const hora = hoy.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="absolute -left-[9999px] top-0 overflow-hidden">
        <div
          ref={ref}
          className="p-8 bg-white text-black font-mono text-[14px] max-w-[100mm] mx-auto leading-relaxed print:p-0"
        >
          {/* CABECERA CON LOGO Y DATOS DE EMPRESA */}
          <div className="text-center mb-4">
            {empresa?.logo_url && (
              <img
                src={empresa.logo_url}
                alt="Logo"
                className="max-h-20 mx-auto mb-2 object-contain"
              />
            )}
            <h1 className="font-bold text-lg uppercase">
              {empresa?.razon_social || "EMPRESA S.A.C."}
            </h1>
            {empresa?.nombre_comercial && (
              <p className="text-sm italic">{empresa.nombre_comercial}</p>
            )}
            <p>RUC: {empresa?.ruc || "00000000000"}</p>
            <p>{empresa?.direccion || "Dirección no registrada"}</p>
            {empresa?.telefono && <p>Telf: {empresa.telefono}</p>}

            <div className="border-t border-black border-dashed my-3"></div>

            <p className="font-black text-sm uppercase">{tipoComprobante}</p>
            <p className="font-bold">
              N° {numeroTicket.toString().padStart(6, "0")}
            </p>
            <p className="text-[10px] mt-1">
              {fecha} - {hora}
            </p>
          </div>

          <div className="border-t border-black border-dashed my-2"></div>

          {/* DATOS DEL CLIENTE */}
          <div className="mb-2 text-[11px]">
            <p>
              <span className="font-bold">CLIENTE:</span>{" "}
              {cliente?.nombre || "Público General"}
            </p>
            {(tipoComprobante === "FACTURA" ||
              tipoComprobante === "BOLETA") && (
              <p>
                <span className="font-bold">DOC:</span>{" "}
                {cliente?.documento || "---"}
              </p>
            )}
            {tipoComprobante === "FACTURA" && (
              <p>
                <span className="font-bold">DIR:</span>{" "}
                {cliente?.direccion || "---"}
              </p>
            )}
          </div>

          <div className="border-t border-black border-dashed my-2"></div>

          {/* TABLA DE PRODUCTOS */}
          <div className="flex justify-between font-bold mb-1">
            <span className="w-8">CANT</span>
            <span className="flex-1 text-left">DESCRIPCIÓN</span>
            <span className="w-16 text-right">IMPORTE</span>
          </div>

          <div className="border-t border-black border-dashed my-2"></div>

          <div className="space-y-1 mb-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <span className="w-8">{it.quantity}</span>
                <span className="flex-1 text-left pr-2 uppercase">
                  {it.product.name}
                </span>
                <span className="w-16 text-right">
                  {formatSoles(it.quantity * it.product.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-black border-dashed my-2"></div>

          {/* TOTALES */}
          <div className="space-y-1 mt-2 text-right">
            <p>SUBTOTAL: {formatSoles(totals.base)}</p>
            {totals.igv > 0 && <p>IGV (18%): {formatSoles(totals.igv)}</p>}
            <p className="font-black text-[16px] mt-1">
              TOTAL: {formatSoles(totals.total)}
            </p>
          </div>

          <div className="border-t border-black border-dashed my-2 text-center mt-4">
            <p className="text-[10px]">
              ¡Gracias por su compra en{" "}
              {empresa?.nombre_comercial || "nuestra tienda"}!
            </p>
            <p className="text-[10px]">
              Representación impresa de {tipoComprobante}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
