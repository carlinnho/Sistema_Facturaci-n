import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Perfiles from "./pages/Perfiles";
import Home from "./pages/Home";
import DashboardLayout from "./components/layout/DashboardLayout";
import Inventario from "./pages/Inventario";
import Configuracion from "./pages/Configuracion";
import Proveedores from "./pages/Proveedores";
import Reportes from "./pages/ReportesVenta";
import Backup from "./pages/Backup";

// ── COMPONENTE GUARDIÁN DE RUTAS ──
function RoleGuard({ allowedRoles, children }) {
  const token = localStorage.getItem("access_token");

  // Si no hay token, lo mandamos a login
  if (!token) return <Navigate to="/login" replace />;

  try {
    // Decodificamos el payload del JWT
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Si el rol del usuario no está en la lista de permitidos, lo expulsamos al Home
    if (!allowedRoles.includes(payload.rol)) {
      alert(
        "Acceso denegado: Tu perfil no tiene los permisos necesarios para ver esta sección.",
      );
      return <Navigate to="/home" replace />;
    }

    // Si todo está bien, renderizamos la página solicitada
    return children;
  } catch (error) {
    console.error("Error validando permisos:", error);
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas / Sin Layout */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfiles" element={<Perfiles />} />

        {/* Rutas Protegidas (Envueltas por el DashboardLayout) */}
        <Route element={<DashboardLayout />}>
          {/* Ruta accesible para todos (Admin = 1, Trabajador = 2) */}
          <Route path="/home" element={<Home />} />

          {/* ── RUTAS RESTRINGIDAS (Solo Administrador) ── */}
          <Route
            path="/inventario"
            element={
              <RoleGuard allowedRoles={[1]}>
                <Inventario />
              </RoleGuard>
            }
          />

          <Route
            path="/Reportes"
            element={
              <RoleGuard allowedRoles={[1]}>
                <Reportes />
              </RoleGuard>
            }
          />

          <Route
            path="/Backup"
            element={
              <RoleGuard allowedRoles={[1]}>
                <Backup />
              </RoleGuard>
            }
          />

          <Route
            path="/configuracion"
            element={
              <RoleGuard allowedRoles={[1]}>
                <Configuracion />
              </RoleGuard>
            }
          />
          <Route
            path="/proveedores"
            element={
              <RoleGuard allowedRoles={[1]}>
                <Proveedores />
              </RoleGuard>
            }
          />

          {/* Futura ruta de reportes */}
          {/* <Route 
            path="/reportes" 
            element={
              <RoleGuard allowedRoles={[1]}>
                <Reportes />
              </RoleGuard>
            } 
          /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
