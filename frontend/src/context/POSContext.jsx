import { createContext, useContext, useState, useCallback } from "react";

const IGV_RATE = 0.18; // 18% de IGV en Perú

export const formatSoles = (amount) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};

export const calcIgv = (total) => {
  const base = total / (1 + IGV_RATE);
  const igv = total - base;
  return { base, igv };
};

const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  // NUEVO: Estado global para forzar la recarga de componentes (ej. el Catálogo)
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const addItem = useCallback((p) => {
    setItems((prev) => {
      const found = prev.find((it) => it.product.id === p.id);
      if (found) {
        return prev.map((it) =>
          it.product.id === p.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      setItems((prev) => prev.filter((it) => it.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(newQuantity, item.product.stock) } // Nunca sobrepasa el stock
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.product.id !== id));
  }, []);

  const decrement = useCallback((id) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.product.id === id ? { ...it, quantity: it.quantity - 1 } : it,
        )
        .filter((it) => it.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0,
  );

  const { base, igv } = calcIgv(subtotal);

  const value = {
    items,
    paymentMethod,
    setPaymentMethod,
    addItem,
    updateQuantity,
    removeItem,
    decrement,
    clear,
    totals: { subtotal, igv, base, total: subtotal },
    // Exponemos las funciones de recarga global
    refreshKey,
    triggerRefresh,
  };

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS debe usarse dentro de POSProvider");
  return ctx;
}
