import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  ReceiptText,
} from "lucide-react";
import { usePOS, formatSoles } from "../../context/POSContext";
import { mediosPagoService } from "../../api/mediosPagoService";
import QuantityKeypad from "./QuantityKeypad";
import CheckoutModal from "./CheckoutModal";
import { ventaService } from "../../api/ventaService";

// Recibimos isMobileView y onCloseMobile como props
export default function CarritoHome({ isMobileView = false, onCloseMobile }) {
  const {
    items,
    totals,
    decrement,
    addItem,
    updateQuantity,
    clear,
    paymentMethod,
    setPaymentMethod,
  } = usePOS();

  const [keypadOpen, setKeypadOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [metodosActivos, setMetodosActivos] = useState([]);

  const handleOpenKeypad = (item) => {
    setSelectedItem(item);
    setKeypadOpen(true);
  };

  const iconMap = {
    1: Banknote,
    2: CreditCard,
    3: Smartphone,
  };

  const handleConfirmQuantity = (newQty) => {
    if (selectedItem) {
      updateQuantity(selectedItem.product.id, newQty);
    }
  };

  useEffect(() => {
    const cargarMetodos = async () => {
      try {
        const data = await mediosPagoService.listar();
        const filtrados = data.filter((m) => m.activo === 1);
        setMetodosActivos(filtrados);

        if (filtrados.length > 0 && !paymentMethod) {
          const primerMetodo = filtrados[0].nombre.toLowerCase();
          setPaymentMethod(
            primerMetodo.includes("tarjeta")
              ? "tarjeta"
              : primerMetodo.includes("yape")
                ? "yape"
                : "efectivo",
          );
        }
      } catch (err) {
        console.error("Error cargando métodos de pago", err);
      }
    };
    cargarMetodos();
  }, []);

  const [numeroTicket, setNumeroTicket] = useState("Cargando...");

  useEffect(() => {
    const cargarSiguienteTicket = async () => {
      try {
        const res = await ventaService.obtenerSiguienteTicket();
        if (res.data && res.data.siguiente_ticket) {
          setNumeroTicket(
            res.data.siguiente_ticket.toString().padStart(6, "0"),
          );
        }
      } catch (error) {
        setNumeroTicket("000000");
      }
    };
    cargarSiguienteTicket();
  }, []);

  return (
    <>
      <aside
        className={`flex flex-col h-full bg-white relative z-10 ${!isMobileView ? "border-l border-gray-200 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]" : ""}`}
      >
        {/* Cabecera del ticket: Oculta en móvil porque el Drawer ya tiene su propia cabecera */}
        {!isMobileView && (
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-blue-600" /> Ticket Actual
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                N° {numeroTicket}
              </p>
            </div>
            <button
              onClick={clear}
              disabled={items.length === 0}
              className="text-xs font-bold text-gray-400 hover:text-red-500 disabled:opacity-50 flex items-center gap-1 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4" /> Limpiar
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 text-gray-400">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-600">Sin productos aún</p>
              <p className="text-sm mt-1">
                Escanea o toca un producto para iniciar la venta.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((it) => {
                const Icon = it.product.icon;
                return (
                  <li
                    key={it.product.id}
                    className="px-5 py-4 flex items-center gap-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${it.product.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {it.product.name}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        {formatSoles(it.product.price)} c/u
                      </p>
                    </div>

                    <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-1 shrink-0">
                      <button
                        onClick={() => decrement(it.product.id)}
                        className="h-7 w-7 rounded-md bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenKeypad(it)}
                        className="w-8 sm:w-10 h-7 text-center text-sm font-black text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        {it.quantity}
                      </button>
                      <button
                        onClick={() => addItem(it.product)}
                        disabled={it.quantity >= it.product.stock}
                        className="h-7 w-7 rounded-md bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-16 sm:w-20 text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">
                        {formatSoles(it.product.price * it.quantity)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 p-5 bg-white space-y-4 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] shrink-0">
          <div className="space-y-2.5 text-sm font-medium text-gray-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-gray-900 font-bold">
                {formatSoles(totals.base)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%)</span>
              <span className="text-gray-900 font-bold">
                {formatSoles(totals.igv)}
              </span>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-gray-100">
              <span className="text-base text-gray-900 font-bold">
                Total a cobrar
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                {formatSoles(totals.total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {metodosActivos.map((metodo) => {
              const Icon = iconMap[metodo.id] || Banknote;
              const idSimplificado = metodo.nombre
                .toLowerCase()
                .includes("tarjeta")
                ? "tarjeta"
                : metodo.nombre.toLowerCase().includes("yape")
                  ? "yape"
                  : "efectivo";
              return (
                <button
                  key={metodo.id}
                  onClick={() => setPaymentMethod(idSimplificado)}
                  className={`py-3 px-2 rounded-xl text-[10px] sm:text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 sm:gap-2 ${paymentMethod === idSimplificado ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${paymentMethod === idSimplificado ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <span className="truncate w-full text-center">
                    {metodo.nombre}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            {isMobileView && (
              <button
                onClick={clear}
                disabled={items.length === 0}
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              disabled={items.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="flex-1 h-14 rounded-xl text-lg font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              Cobrar
            </button>
          </div>
        </div>
      </aside>

      <QuantityKeypad
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        initialValue={selectedItem?.quantity || 1}
        maxStock={selectedItem?.product.stock || 999}
        productName={selectedItem?.product.name || ""}
        onConfirm={handleConfirmQuantity}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        totals={totals}
        paymentMethod={paymentMethod}
        onSuccess={() => {
          clear();
          setCheckoutOpen(false);
          if (isMobileView && onCloseMobile) onCloseMobile(); // Cerrar drawer móvil si fue exitoso
        }}
        onReject={() => {
          clear();
          setCheckoutOpen(false);
          if (isMobileView && onCloseMobile) onCloseMobile();
        }}
      />
    </>
  );
}
