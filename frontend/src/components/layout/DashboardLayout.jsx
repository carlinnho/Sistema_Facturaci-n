import { useEffect, useState, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart,
  MessageSquare,
  Package,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  UserCog,
  DoorClosed,
  Clock,
  MoreVertical,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { authService } from "../../api/authService";
import { empresaService } from "../../api/empresaService";

const navItems = [
  {
    to: "/home",
    label: "Punto de Venta",
    icon: ShoppingCart,
    allowedRoles: [1, 2],
  },
  { to: "/inventario", label: "Inventario", icon: Package, allowedRoles: [1] },
  { to: "/chatbot", label: "Chatbot", icon: MessageSquare, allowedRoles: [1, 2] },
  { to: "/reportes", label: "Reportes", icon: BarChart3, allowedRoles: [1] },
  {
    to: "/Proveedores",
    label: "Proveedores",
    icon: Building2,
    allowedRoles: [1],
  },
  {
    to: "/Backup",
    label: "Backup",
    icon: Settings,
    allowedRoles: [1],
  },
  {
    to: "/configuracion",
    label: "Configuración",
    icon: Settings,
    allowedRoles: [1],
  },
];

const getInitials = (fullName) => {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

// ─── Variantes de animación para el Drawer ───────────────────────────────────
const drawerVariants = {
  hidden: { x: "-100%", opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    x: "-100%",
    opacity: 0.5,
    transition: { type: "tween", ease: "easeInOut", duration: 0.25 },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ─── Contenido compartido del Sidebar ────────────────────────────────────────
function SidebarContent({
  collapsed,
  empresa,
  currentProfile,
  onNavClick,
  onToggleCollapse,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
  navigate,
  isMobile = false,
  onClose,
}) {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col">
      {/* Header del sidebar */}
      <div className="h-20 flex items-center px-4 border-b border-gray-200 shrink-0">
        <Link
          to="/home"
          onClick={onNavClick}
          className="flex items-center gap-3 min-w-0 w-full"
        >
          {empresa.logo_url ? (
            <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img
                src={empresa.logo_url}
                alt="Logo"
                className="h-full w-full object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}

          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <span
                className="block font-black text-gray-900 tracking-tight truncate text-base leading-none"
                title={empresa.nombre_comercial}
              >
                {empresa.nombre_comercial}
              </span>
              <span className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                Punto de Venta
              </span>
            </div>
          )}
        </Link>

        {/* Botón X para cerrar en móvil */}
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems
          .filter(
            (item) =>
              !currentProfile.roleId ||
              item.allowedRoles.includes(currentProfile.roleId),
          )
          .map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={onNavClick}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                title={collapsed && !isMobile ? label : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-gray-400"}`}
                />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{label}</span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer: Estado + Usuario */}
      <div className="border-t border-gray-200 p-3 flex flex-col gap-2 shrink-0 bg-gray-50/50">
        <div
          className={`flex flex-col gap-2 px-2 py-2 ${collapsed && !isMobile ? "items-center" : ""}`}
        >
          <LiveClock collapsed={collapsed && !isMobile} />

          <div
            className={`flex items-center gap-2 text-emerald-700 font-bold ${collapsed && !isMobile ? "justify-center" : ""}`}
            title="Caja abierta"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {(!collapsed || isMobile) && (
              <span className="text-xs uppercase tracking-wider">
                Caja Abierta
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Dropdown perfil */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full flex items-center gap-3 rounded-xl p-2 hover:bg-gray-200 transition-colors focus:outline-none ${
              collapsed && !isMobile ? "justify-center" : "text-left"
            }`}
          >
            <div className="h-9 w-9 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {currentProfile.initials}
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate capitalize leading-tight">
                  {currentProfile.name}
                </p>
                <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
                  {currentProfile.role}
                </p>
              </div>
            )}
            {(!collapsed || isMobile) && (
              <MoreVertical className="h-4 w-4 text-gray-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 ${
                  collapsed && !isMobile
                    ? "left-full bottom-0 ml-3 w-56 origin-bottom-left"
                    : "bottom-[calc(100%+8px)] left-0 w-full origin-bottom"
                }`}
              >
                <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Mi Cuenta
                </p>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavClick?.();
                    navigate("/perfiles");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <UserCog className="h-4 w-4 text-gray-400" /> Cambiar perfil
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                  <DoorClosed className="h-4 w-4 text-gray-400" /> Cerrar caja
                </button>

                <div className="h-px bg-gray-100 my-1" />

                <button
                  onClick={() => {
                    authService.logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-red-400" /> Cerrar sesión
                  empresa
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botón colapsar (solo desktop) */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 mt-1 text-xs font-bold text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" /> Ocultar Menú
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Layout Principal ─────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [currentProfile, setCurrentProfile] = useState({
    name: "Usuario",
    role: "Cargando...",
    roleId: null,
    initials: "U",
  });

  const [empresa, setEmpresa] = useState({
    nombre_comercial: "Cargando...",
    logo_url: null,
  });

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentProfile({
        name:
          payload.nombre ||
          (payload.email ? payload.email.split("@")[0] : payload.sub),
        role: payload.rol === 1 ? "Administrador" : "Trabajador",
        roleId: payload.rol,
        initials: getInitials(payload.nombre || payload.email || "Usuario"),
      });
    } catch (error) {
      console.error("Error decodificando token", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const cargarEmpresa = async () => {
      try {
        const data = await empresaService.obtener();
        if (data) {
          setEmpresa({
            nombre_comercial: data.nombre_comercial || "Mi Empresa",
            logo_url: data.logo_url || null,
          });
        }
      } catch (error) {
        console.error("Error cargando datos de la empresa", error);
        setEmpresa({ nombre_comercial: "Punto de Venta", logo_url: null });
      }
    };
    cargarEmpresa();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    setDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const sharedSidebarProps = {
    empresa,
    currentProfile,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
    navigate,
  };

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden font-sans">
      {/* ── SIDEBAR DESKTOP (lg+) ──────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex h-full bg-white border-r border-gray-200 flex-col transition-[width] duration-200 ease-out z-20 ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <SidebarContent
          {...sharedSidebarProps}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobile={false}
        />
      </aside>

      {/* ── DRAWER MÓVIL / TABLET (< lg) ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white border-r border-gray-200 z-40 shadow-2xl"
            >
              <SidebarContent
                {...sharedSidebarProps}
                collapsed={false}
                isMobile={true}
                onNavClick={closeMobileMenu}
                onClose={closeMobileMenu}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── COLUMNA DERECHA (Topbar + Main) ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar móvil (solo visible < lg) */}
        <header className="lg:hidden flex items-center gap-3 h-16 px-4 bg-white border-b border-gray-200 shrink-0 z-10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/home" className="flex items-center gap-2.5 min-w-0">
            {empresa.logo_url ? (
              <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <img
                  src={empresa.logo_url}
                  alt="Logo"
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
            )}
            <span
              className="font-black text-gray-900 tracking-tight text-sm truncate"
              title={empresa.nombre_comercial}
            >
              {empresa.nombre_comercial}
            </span>
          </Link>

          {/* Avatar del usuario en topbar */}
          <div className="ml-auto">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {currentProfile.initials}
            </div>
          </div>
        </header>

        {/* Área de contenido principal */}
        <main className="flex-1 min-h-0 bg-gray-100/50 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── LiveClock ────────────────────────────────────────────────────────────────
function LiveClock({ collapsed }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const date = now.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  if (collapsed) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        title={`${date} - ${time}`}
      >
        <Clock className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Clock className="h-4 w-4 opacity-50 shrink-0" />
      <div className="leading-tight">
        <p className="text-[13px] font-mono font-bold text-gray-900 tabular-nums">
          {time}
        </p>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {date}
        </p>
      </div>
    </div>
  );
}
