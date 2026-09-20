import { useState, useEffect } from "react";
import { Delete } from "lucide-react";
import FramerModal from "./FramerModal";

export default function QuantityKeypad({
  isOpen,
  onClose,
  initialValue,
  maxStock,
  productName,
  onConfirm,
}) {
  const [val, setVal] = useState("1");

  useEffect(() => {
    if (isOpen) setVal(initialValue.toString());
  }, [isOpen, initialValue]);

  // --- SOPORTE PARA TECLADO FÍSICO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo escuchamos si el modal de cantidad está abierto
      if (!isOpen) return;

      // Si el usuario presiona un número del 0 al 9
      if (/^[0-9]$/.test(e.key)) {
        handlePress(e.key);
      }
      // Si presiona Borrar (Retroceso)
      else if (e.key === "Backspace") {
        handleDelete();
      }
      // Si presiona Enter (Confirmar)
      else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
      // Si presiona Esc (Cerrar / Cancelar)
      else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, val, maxStock]); // Se re-evalúa cuando cambia el valor para que el Enter tome el número correcto

  const handlePress = (num) => {
    setVal((prev) => {
      if (prev === "0") return num;
      // Limitamos a 4 dígitos para que no ingresen números irreales
      if (prev.length >= 4) return prev;
      return prev + num;
    });
  };

  const handleDelete = () =>
    setVal((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));

  const handleConfirm = () => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 1;
    if (num > maxStock) num = maxStock;
    if (num < 1) num = 1; // Forzamos un mínimo de 1

    onConfirm(num);
    onClose();
  };

  const buttons = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00"];

  return (
    <FramerModal isOpen={isOpen} onClose={onClose} title="Editar Cantidad">
      <div className="p-6">
        <p className="text-center text-sm font-bold text-gray-500 mb-4 line-clamp-1">
          {productName}
        </p>
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl h-20 mb-6 flex items-center justify-between px-6">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">
            Cant.
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-600">{val}</span>
            {/* Solo mostramos el "/ Stock" si no es un número infinito (9999) */}
            {maxStock < 9999 && (
              <span className="text-sm font-bold text-gray-400 mb-1">
                / {maxStock}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {buttons.map((btn) => (
            <button
              key={btn}
              onClick={() => handlePress(btn)}
              className="h-16 bg-white border border-gray-200 rounded-xl text-2xl font-black text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm"
            >
              {btn}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="h-16 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-all shadow-sm"
          >
            <Delete className="h-7 w-7" />
          </button>
        </div>
        <button
          onClick={handleConfirm}
          className="w-full mt-6 h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
        >
          Confirmar
        </button>
      </div>
    </FramerModal>
  );
}
