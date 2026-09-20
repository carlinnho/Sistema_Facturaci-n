import { useState, useEffect, useRef } from "react";
import {
  ArrowDownToLine,
  X,
  ScanBarcode,
  Package,
  Trash2,
  CheckCircle2,
  Camera,
  Loader2,
} from "lucide-react";
import EscanerCamara from "./EscanerCamara";
import QuantityKeypad from "../pos/QuantityKeypad";

export default function RestockDrawer({ isOpen, onClose, products, onSave }) {
  const [scanTerm, setScanTerm] = useState("");
  const [restockList, setRestockList] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para el Keypad
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Referencias para el Listener Global del Scanner
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isOpen) {
      setScanTerm("");
      setRestockList([]);
      setKeypadOpen(false);
      bufferRef.current = "";
    }
  }, [isOpen]);

  // --- LISTENER GLOBAL DE ESCÁNER (PISTOLA DE BARRAS) ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Solo escuchamos si el drawer de restock está abierto y el keypad/cámara NO lo están
      if (!isOpen || showScanner || keypadOpen) return;

      // Si el usuario está escribiendo en el input de búsqueda manual, no interferimos
      if (document.activeElement.tagName === "INPUT") return;

      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt") return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      // Si pasa mucho tiempo entre teclas, es escritura manual. Reiniciamos el buffer.
      // Las pistolas de barras disparan las teclas en milisegundos.
      if (timeDiff > 100) bufferRef.current = "";

      if (e.key === "Enter") {
        if (bufferRef.current.length > 2) {
          e.preventDefault();
          procesarCodigo(bufferRef.current);
        }
        bufferRef.current = "";
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, showScanner, keypadOpen, products]);

  const procesarCodigo = (codigo) => {
    const searchCode = String(codigo).trim();

    const found = products.find(
      (p) =>
        (p.codigo_barras && p.codigo_barras === searchCode) ||
        p.sku?.toLowerCase() === searchCode.toLowerCase() ||
        p.nombre?.toLowerCase().includes(searchCode.toLowerCase()),
    );

    if (found) {
      setRestockList((prev) => {
        const exists = prev.find((item) => item.id === found.id);
        if (exists)
          return prev.map((item) =>
            item.id === found.id ? { ...item, addQty: item.addQty + 1 } : item,
          );
        return [
          ...prev,
          {
            id: found.id,
            nombre: found.nombre,
            sku: found.sku,
            currentStock: found.stock_actual,
            addQty: 1,
          },
        ];
      });
      setScanTerm(""); // Limpiar búsqueda manual si fue usada
    } else {
      alert("Producto no encontrado en el catálogo.");
    }
  };

  const handleScan = (e) => {
    if (e.key === "Enter" && scanTerm.trim() !== "") {
      procesarCodigo(scanTerm.trim());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(restockList);
    setIsSaving(false);
  };

  // Funciones del Keypad
  const openKeypad = (item) => {
    setSelectedItem(item);
    setKeypadOpen(true);
  };

  const handleConfirmQuantity = (newQty) => {
    if (selectedItem) {
      setRestockList((prev) =>
        prev.map((it) =>
          it.id === selectedItem.id ? { ...it, addQty: newQty } : it,
        ),
      );
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex justify-end ${isOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />

        <div
          className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-emerald-600" /> Entrada
                de Stock
              </h2>
              <p className="text-sm font-medium text-gray-500">
                Pistola activa. Puedes disparar directamente.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg border border-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 border-b border-gray-200">
            <label className="text-sm font-bold text-gray-900 mb-2 block">
              Búsqueda Manual (Opcional)
            </label>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                <input
                  type="text"
                  value={scanTerm}
                  onChange={(e) => setScanTerm(e.target.value)}
                  onKeyDown={handleScan}
                  placeholder="Nombre o SKU..."
                  className="w-full pl-12 pr-4 h-12 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="h-12 w-12 flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-colors shrink-0 shadow-md"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {restockList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Package className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-bold text-gray-600">Lista vacía</p>
                <p className="text-sm mt-1">
                  Dispara la pistola, busca o usa la cámara.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {restockList.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        Stock actual: {item.currentStock}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                          Añadir (+)
                        </p>
                        {/* Aquí cambiamos el input nativo por un botón que abre el Keypad */}
                        <button
                          onClick={() => openKeypad(item)}
                          className="w-16 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg font-black text-gray-900 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 transition-all"
                        >
                          {item.addQty}
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setRestockList((prev) =>
                            prev.filter((it) => it.id !== item.id),
                          )
                        }
                        className="mt-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-white">
            <button
              disabled={restockList.length === 0 || isSaving}
              onClick={handleSave}
              className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Confirmar Entrada
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <EscanerCamara
          onClose={() => setShowScanner(false)}
          onScanSuccess={(code) => {
            procesarCodigo(code);
            setShowScanner(false);
          }}
        />
      )}

      {/* Agregamos el componente QuantityKeypad */}
      <QuantityKeypad
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        initialValue={selectedItem?.addQty || 1}
        maxStock={9999} // Límite alto para entrada de stock
        productName={selectedItem?.nombre || ""}
        onConfirm={handleConfirmQuantity}
      />
    </>
  );
}
