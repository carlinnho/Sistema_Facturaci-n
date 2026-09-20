import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatSoles } from "../../context/POSContext";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  Clock,
  Users,
  CreditCard,
  Package,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard({ dashboard }) {
  // Bandera para activar el estado de carga
  const isSkeleton = !dashboard;

  // Asignamos valores por defecto seguros para evitar errores en useMemo mientras carga
  const {
    ventas_tiempo = {},
    hora_pico = {},
    top_productos = [],
    ventas_trabajador = [],
    ventas_metodo = [],
  } = dashboard || {};

  // ── FORMATO DE DATOS PARA RECHARTS ──
  const dataMetodos = useMemo(
    () =>
      ventas_metodo.map((m) => ({
        name: m.metodo,
        value: Number(m.total_recaudado),
      })),
    [ventas_metodo],
  );

  const dataTrabajadores = useMemo(
    () =>
      ventas_trabajador.map((t) => ({
        name: t.nombres.split(" ")[0],
        total: Number(t.total_recaudado),
      })),
    [ventas_trabajador],
  );

  const dataProductos = useMemo(
    () =>
      top_productos.map((p) => ({
        name:
          p.nombre_producto.length > 22
            ? p.nombre_producto.substring(0, 22) + "..."
            : p.nombre_producto,
        cantidad: Number(p.cantidad_total),
      })),
    [top_productos],
  );

  const dataHoras = useMemo(() => {
    const hp = hora_pico?.hora || 12;
    return [
      { hora: `${hp - 2}:00`, ventas: 5 },
      { hora: `${hp - 1}:00`, ventas: 15 },
      { hora: `${hp}:00`, ventas: 35 },
      { hora: `${hp + 1}:00`, ventas: 20 },
      { hora: `${hp + 2}:00`, ventas: 8 },
    ];
  }, [hora_pico]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── TARJETAS FINANCIERAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 font-bold mb-3 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Ventas de Hoy
          </div>
          <p className="text-4xl font-black text-gray-900">
            {isSkeleton ? (
              <Skeleton width={160} height={40} />
            ) : (
              formatSoles(ventas_tiempo?.ventas_hoy)
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 font-bold mb-3 text-sm">
            <Calendar className="w-4 h-4 text-purple-600" /> Ventas esta Semana
          </div>
          <p className="text-4xl font-black text-gray-900">
            {isSkeleton ? (
              <Skeleton width={160} height={40} />
            ) : (
              formatSoles(ventas_tiempo?.ventas_semana)
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 font-bold mb-3 text-sm">
            <BarChart3 className="w-4 h-4 text-emerald-600" /> Ventas este Mes
          </div>
          <p className="text-4xl font-black text-gray-900">
            {isSkeleton ? (
              <Skeleton width={160} height={40} />
            ) : (
              formatSoles(ventas_tiempo?.ventas_mes)
            )}
          </p>
        </div>
      </div>

      {/* ── GRÁFICOS PRINCIPALES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Lineal: Flujo de Ventas (Hora Pico) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-6 shrink-0">
            <Clock className="w-5 h-5 text-blue-600" /> Flujo de Ventas (Hora
            Pico)
          </h3>
          <div className="h-[250px] w-full">
            {isSkeleton ? (
              <Skeleton height="100%" borderRadius="12px" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataHoras}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="hora"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico Circular: Ingresos por Método de Pago */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-6 shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Ingresos por
            Método
          </h3>
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 h-[220px]">
            {isSkeleton ? (
              <>
                <Skeleton circle width={160} height={160} />
                <div className="flex flex-col gap-3 shrink-0 w-full sm:w-1/2 justify-center">
                  <Skeleton count={3} height={20} />
                </div>
              </>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataMetodos}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataMetodos.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatSoles(value)}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 shrink-0 w-full sm:w-1/2 justify-center">
                  {dataMetodos.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm font-bold text-gray-700"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      ></div>
                      <span className="uppercase line-clamp-2">{m.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── GRÁFICOS SECUNDARIOS (BARRAS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barras: Ranking de Productos */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 shrink-0">
            <Package className="w-5 h-5 text-orange-500" /> Ranking de Productos
            (Cantidades)
          </h3>
          <div className="h-[280px] w-full overflow-y-auto scrollbar-thin pr-2">
            {isSkeleton ? (
              <Skeleton
                height={40}
                count={6}
                className="mb-2"
                borderRadius="8px"
              />
            ) : (
              <div
                style={{
                  height: `${Math.max(250, dataProductos.length * 40)}px`,
                  width: "100%",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataProductos}
                    layout="vertical"
                    margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={130}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: "#6b7280",
                        fontWeight: "bold",
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="cantidad"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Barras: Rendimiento Trabajadores */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-black text-gray-900 flex items-center gap-2 mb-6 shrink-0">
            <Users className="w-5 h-5 text-purple-600" /> Ventas por Trabajador
            (S/)
          </h3>
          <div className="h-[280px] w-full">
            {isSkeleton ? (
              <div className="flex items-end gap-4 h-full pt-4">
                <Skeleton
                  height={150}
                  containerClassName="flex-1"
                  borderRadius="8px"
                />
                <Skeleton
                  height={200}
                  containerClassName="flex-1"
                  borderRadius="8px"
                />
                <Skeleton
                  height={100}
                  containerClassName="flex-1"
                  borderRadius="8px"
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTrabajadores}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: "bold" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `S/${val}`}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    formatter={(value) => formatSoles(value)}
                    cursor={{ fill: "#f3f4f6" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
