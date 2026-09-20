import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatSoles } from "../../context/POSContext";

export default function Historial({ historial, isLoading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-black text-lg text-gray-900">Registro de Ventas</h3>
        <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full shadow-sm">
          Últimas {Math.min(historial?.length || 0, 50)} transacciones
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Comprobante</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Cajero</th>
              <th className="px-6 py-4">Medio Pago</th>
              <th className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              // ── ESQUELETO DE CARGA (6 filas simuladas) ──
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-3">
                    <Skeleton height={20} width={110} />
                    <Skeleton height={12} width={70} className="mt-1" />
                  </td>
                  <td className="px-6 py-3">
                    <Skeleton width={120} />
                  </td>
                  <td className="px-6 py-3">
                    <Skeleton width={140} />
                    <Skeleton height={12} width={90} className="mt-1" />
                  </td>
                  <td className="px-6 py-3">
                    <Skeleton width={100} />
                  </td>
                  <td className="px-6 py-3">
                    <Skeleton height={24} width={80} borderRadius={6} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Skeleton width={70} />
                  </td>
                </tr>
              ))
            ) : historial.length === 0 ? (
              // ── ESTADO SIN DATOS ──
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-gray-400 font-medium"
                >
                  No hay ventas registradas aún.
                </td>
              </tr>
            ) : (
              // ── DATOS REALES ──
              historial.slice(0, 50).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-bold text-blue-600">
                      {v.numero_comprobante}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold">
                      {v.tipo_comprobante}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {new Date(v.fecha_creacion).toLocaleString("es-PE")}
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-bold text-gray-900 truncate max-w-[150px]">
                      {v.nombre_cliente}
                    </p>
                    {v.documento_cliente && (
                      <p className="text-[10px] text-gray-500 font-mono">
                        {v.documento_cliente}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-600">
                    {v.cajero}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-[10px] font-black uppercase">
                      {v.medio_pago}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-black text-gray-900">
                    {formatSoles(v.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
