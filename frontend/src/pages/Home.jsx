import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { POSProvider, usePOS, formatSoles } from "../context/POSContext";
import CatalogoHome from "../components/pos/CatalogoHome";
import CarritoHome from "../components/pos/CarritoHome";

function HomeContent() {
  const { items, totals } = usePOS();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    // Usamos h-full w-full relativo para que respete el DashboardLayout superior
    <div className="h-full w-full relative flex bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      {/* ── SECCIÓN CATÁLOGO ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        <CatalogoHome />
      </div>

      {/* ── SECCIÓN CARRITO DESKTOP ── */}
      <div className="hidden lg:flex flex-col w-[380px] xl:w-[420px] h-full shrink-0 border-l border-gray-200 bg-white">
        <CarritoHome />
      </div>

      {/* ── BOTÓN FLOTANTE MÓVIL (Píldora Mágica) ── */}
      <AnimatePresence>
        {!mobileCartOpen && totalItems > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setMobileCartOpen(true)}
            className="lg:hidden absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-sm h-14 bg-blue-600 text-white rounded-2xl shadow-[0_8px_30px_rgb(37,99,235,0.4)] flex items-center justify-between px-6 font-bold z-40"
          >
            <div className="flex items-center gap-2">
              <div className="bg-blue-800/50 px-2.5 py-1 rounded-lg text-xs">
                {totalItems}
              </div>
              <span>Ver Carrito</span>
            </div>
            <span>{formatSoles(totals.total)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── DRAWER CARRITO MÓVIL ── */}
      <AnimatePresence>
        {mobileCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCartOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-50 lg:hidden"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" /> Mi Carrito
                </h3>
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto">
                  <CarritoHome
                    isMobileView={true}
                    onCloseMobile={() => setMobileCartOpen(false)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <POSProvider>
      <HomeContent />
    </POSProvider>
  );
}
