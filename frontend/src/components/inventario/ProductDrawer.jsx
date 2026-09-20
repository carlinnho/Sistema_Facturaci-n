import { useState, useEffect } from "react";
import { X, Save, Camera, Loader2, AlertCircle } from "lucide-react";
import EscanerCamara from "./EscanerCamara";
import { categoriaService } from "../../api/categoriaService";

export default function ProductDrawer({
  isOpen,
  onClose,
  productToEdit,
  onSaveSuccess,
}) {
  const [categorias, setCategorias] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    codigo_barras: "",
    precio: "",
    stock_minimo: 0,
    stock_actual: 0,
    id_categoria: "",
  });

  // Cargar categorías y datos del producto si estamos editando
  useEffect(() => {
    if (isOpen) {
      categoriaService
        .listar()
        .then(setCategorias)
        .catch(() => {});
      setError("");

      if (productToEdit) {
        setFormData({
          nombre: productToEdit.nombre,
          codigo_barras: productToEdit.codigo_barras || "",
          precio: productToEdit.precio,
          stock_minimo: productToEdit.stock_minimo,
          stock_actual: productToEdit.stock_actual, // No se edita en la BD, pero lo guardamos visualmente
          id_categoria: productToEdit.id_categoria,
        });
      } else {
        setFormData({
          nombre: "",
          codigo_barras: "",
          precio: "",
          stock_minimo: 0,
          stock_actual: 0,
          id_categoria: "",
        });
      }
    }
  }, [isOpen, productToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Armamos la base del payload
      const payload = {
        nombre: formData.nombre.trim(),
        codigo_barras:
          formData.codigo_barras.trim() === ""
            ? null
            : formData.codigo_barras.trim(),
        precio: parseFloat(formData.precio),
        stock_minimo: parseInt(formData.stock_minimo),
        id_categoria: parseInt(formData.id_categoria),
      };

      // 2. Si es un producto NUEVO, agregamos el stock_actual
      // Si estamos EDITANDO, lo omitimos (porque UpdateProductoDto no lo acepta)
      if (!productToEdit) {
        payload.stock_actual = parseInt(formData.stock_actual);
      }

      await onSaveSuccess(payload, productToEdit?.id);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el producto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-100 flex justify-end ${isOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />

        <div
          className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {productToEdit ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {productToEdit
                  ? `SKU: ${productToEdit.sku}`
                  : "El SKU se generará automáticamente"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-lg border border-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            id="productForm"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5"
          >
            {error && (
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Código de Barras
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Escanea o escribe..."
                  value={formData.codigo_barras}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_barras: e.target.value })
                  }
                  className="w-full pl-4 pr-12 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="absolute right-2 p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Nombre del Producto
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej. Coca Cola 1L"
                className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                Categoría
              </label>
              <select
                required
                value={formData.id_categoria}
                onChange={(e) =>
                  setFormData({ ...formData, id_categoria: e.target.value })
                }
                className="w-full px-3 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
              >
                <option value="" disabled>
                  Seleccione una categoría...
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                  Precio (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({ ...formData, precio: e.target.value })
                  }
                  className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_minimo}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_minimo: e.target.value })
                  }
                  className="w-full px-4 h-11 bg-white border-2 border-gray-200 focus:border-blue-600 rounded-xl outline-none font-bold text-gray-900 transition-colors"
                />
              </div>
            </div>

            {!productToEdit && (
              <div>
                <label className="text-sm font-bold text-gray-900 mb-1.5 block">
                  Stock Inicial (Almacén)
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock_actual}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_actual: e.target.value })
                  }
                  className="w-full px-4 h-11 bg-emerald-50 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl outline-none font-black text-emerald-900 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El stock posterior se gestiona desde Reposición.
                </p>
              </div>
            )}
          </form>

          <div className="p-6 border-t border-gray-200 bg-white">
            <button
              form="productForm"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {productToEdit ? "Actualizar Producto" : "Guardar Producto"}
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <EscanerCamara
          onClose={() => setShowScanner(false)}
          onScanSuccess={(code) => {
            setFormData({ ...formData, codigo_barras: code });
            setShowScanner(false);
          }}
        />
      )}
    </>
  );
}
