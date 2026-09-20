import { useMemo, useState, useEffect, useRef } from "react";

import Skeleton from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";

import {
  Search,
  ScanBarcode,
  Coffee,
  Sandwich,
  LayoutGrid,
  Package,
  Loader2,
} from "lucide-react";

import { usePOS, formatSoles } from "../../context/POSContext";

import { productoService } from "../../api/productoService";

import { categoriaService } from "../../api/categoriaService";

import Buscador from "../ui/Buscador";

const getCategoryStyle = (catName) => {
  const name = catName.toLowerCase();

  if (name.includes("bebida"))
    return { icon: Coffee, tone: "bg-amber-100 text-amber-700" };

  if (name.includes("snack") || name.includes("comida"))
    return { icon: Sandwich, tone: "bg-orange-100 text-orange-700" };

  return { icon: Package, tone: "bg-blue-100 text-blue-700" };
};

export default function CatalogoHome() {
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([
    { id: "all", name: "Todo", icon: LayoutGrid },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [activeCat, setActiveCat] = useState("all");

  const { addItem, refreshKey } = usePOS();

  const bufferRef = useRef("");

  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    const cargarCatalogo = async () => {
      try {
        setIsLoading(true);

        const [prodsDB, catsDB] = await Promise.all([
          productoService.listar(),

          categoriaService.listar(),
        ]);

        const catsMapped = catsDB.map((c) => ({
          id: c.id.toString(),

          name: c.nombre,

          ...getCategoryStyle(c.nombre),
        }));

        setCategories([
          { id: "all", name: "Todo", icon: LayoutGrid },

          ...catsMapped,
        ]);

        const prodsMapped = prodsDB.map((p) => {
          const style = getCategoryStyle(p.categoria);

          return {
            id: p.id,

            sku: p.sku,

            codigo_barras: p.codigo_barras,

            name: p.nombre,

            price: parseFloat(p.precio),

            stock: p.stock_actual,

            category: p.id_categoria.toString(),

            tone: style.tone,

            icon: style.icon,
          };
        });

        setProducts(prodsMapped);
      } catch (error) {
        console.error("Error cargando el catálogo del POS:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarCatalogo();
  }, [refreshKey]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt") return;

      const currentTime = Date.now();

      const timeDiff = currentTime - lastKeyTimeRef.current;

      if (timeDiff > 100) bufferRef.current = "";

      if (e.key === "Enter") {
        if (bufferRef.current.length > 2) {
          e.preventDefault();

          const term = bufferRef.current.toLowerCase();

          const found = products.find(
            (p) =>
              (p.codigo_barras && p.codigo_barras.toLowerCase() === term) ||
              p.sku.toLowerCase() === term,
          );

          if (found) {
            if (found.stock > 0) addItem(found);
            else alert(`El producto "${found.name}" está agotado.`);
          }

          setSearch("");
        }

        bufferRef.current = "";
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products, addItem]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === "all" || p.category === activeCat;

      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.codigo_barras &&
          p.codigo_barras.toLowerCase().includes(search.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [products, activeCat, search]);

  return (
    <section className="flex flex-col min-h-0 bg-white">
      <div className="p-5 space-y-4 border-b border-gray-200">
        <div className="flex gap-3">
          <Buscador
            placeholder="Busca por nombre o SKU manualmente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="h-12 w-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl transition-colors shrink-0">
            <ScanBarcode className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((c) => {
            const active = activeCat === c.id;

            const Icon = c.icon;

            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors border ${
                  active
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 items-start">
          {isLoading ? (
            // ── ESQUELETO DE CARGA DEL CATÁLOGO ──

            Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 p-4 flex flex-col h-full min-h-[140px] bg-white"
              >
                <div className="flex items-start justify-between w-full mb-3 shrink-0">
                  <Skeleton width={45} height={18} borderRadius={4} />

                  <Skeleton width={28} height={28} borderRadius={8} />
                </div>

                <div className="mb-auto pb-3 w-full">
                  <Skeleton count={2} />
                </div>

                <div className="mt-auto flex items-center justify-between w-full shrink-0">
                  <Skeleton width={55} height={22} />

                  <Skeleton width={45} height={20} borderRadius={6} />
                </div>
              </div>
            ))
          ) : (
            // ── PRODUCTOS REALES ──

            <>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />

                  <p className="font-bold text-gray-500">
                    No se encontraron productos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  const { addItem } = usePOS();

  const Icon = product.icon;

  const isOut = product.stock === 0;

  return (
    <button
      disabled={isOut}
      onClick={() => addItem(product)}
      className={`group text-left rounded-2xl border p-4 transition-all flex flex-col h-full min-h-[140px] ${
        isOut
          ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 grayscale-[0.5]"
          : "bg-white border-gray-200 hover:border-blue-600 hover:shadow-md hover:-translate-y-1 active:scale-95"
      }`}
    >
      <div className="flex items-start justify-between w-full mb-3 shrink-0">
        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {product.sku}
        </span>

        <div className={`p-1.5 rounded-lg ${product.tone} shrink-0`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-4 w-full mb-auto pb-3">
        {product.name}
      </p>

      <div className="mt-auto flex items-center justify-between w-full shrink-0">
        <span className="text-base font-black text-gray-900">
          {formatSoles(product.price)}
        </span>

        <span
          className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
            isOut
              ? "bg-red-100 text-red-600"
              : product.stock <= 10
                ? "bg-orange-100 text-orange-600"
                : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {isOut ? "Agotado" : `${product.stock}u`}
        </span>
      </div>
    </button>
  );
}
