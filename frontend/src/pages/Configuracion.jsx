import { useState } from "react";
import {
  Building2,
  CreditCard,
  Users,
  Printer,
  Tags,
  Settings,
} from "lucide-react";

import GestionCategorias from "../components/configuracion/GestionCategorias";
import GestionEmpresa from "../components/configuracion/GestionEmpresa";
import GestionUsuarios from "../components/configuracion/GestionUsuarios";
import GestionMediosPago from "../components/configuracion/GestionMediosPago";
import GestionImpresion from "../components/configuracion/GestionImpresion";

const sections = [
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "pagos", label: "Métodos de pago", icon: CreditCard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "impresion", label: "Impresión", icon: Printer },
  { id: "categorias", label: "Categorías", icon: Tags },
];

export default function Configuracion() {
  const [active, setActive] = useState("categorias");

  return (
    <div className="h-full flex flex-col min-w-0 space-y-6 bg-transparent">
      {/* ── CABECERA FLOTANTE ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" /> Configuración
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Administra los ajustes generales de tu cuenta, catálogo y caja.
          </p>
        </div>
      </div>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="flex flex-col md:flex-row gap-6 h-full">
          {/* Menú Lateral (Píldoras/Botones) */}
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:w-[220px] lg:w-[260px] shrink-0">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`shrink-0 md:w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`}
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Tarjeta de Contenido Activo */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
            {active === "categorias" && <GestionCategorias />}
            {active === "empresa" && <GestionEmpresa />}
            {active === "pagos" && <GestionMediosPago />}
            {active === "usuarios" && <GestionUsuarios />}
            {active === "impresion" && <GestionImpresion />}{" "}
            {/* Reemplazar el Placeholder aquí */}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente temporal para módulos en construcción
function Placeholder({ title }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-gray-400 text-center">
      <p className="text-lg font-bold text-gray-600">{title}</p>
      <p className="text-sm mt-2">Este módulo se construirá próximamente.</p>
    </div>
  );
}
