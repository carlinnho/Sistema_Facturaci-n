import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Zap,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { authService } from "../api/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authService.loginEmpresa(email, password);
      navigate("/perfiles");
    } catch (err) {
      setError(err.response?.data?.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white font-sans">
      {/* ── Panel Izquierdo: Formulario ── */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Caja+
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-gray-500 font-medium text-sm sm:text-base">
            Ingresa con la cuenta maestra de tu empresa para abrir la caja.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in zoom-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-gray-900"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 h-12 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-400 font-medium disabled:opacity-50"
                  placeholder="admin@tiendademo.pe"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-gray-900"
              >
                Contraseña maestra
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-12 h-12 bg-white border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl outline-none transition-all text-gray-900 placeholder-gray-400 font-medium disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                Recordar este equipo
              </label>
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Acceder"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-gray-400">
            Al continuar aceptas los Términos y la Política de Privacidad.
          </p>
        </div>
      </div>

      {/* ── Panel Derecho: Decorativo ── */}
      <div className="hidden lg:flex relative overflow-hidden bg-[#2563EB] text-white items-center justify-center p-12">
        {/* Patrón de puntos sutiles */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.8) 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-md z-10">
          <h2 className="text-[2.5rem] font-bold leading-tight tracking-tight mb-4">
            Vende más rápido.
            <br />
            Controla todo.
          </h2>
          <p className="text-base text-blue-100 font-medium mb-12 leading-relaxed max-w-[90%]">
            Punto de venta, inventario y reportes en una sola plataforma
            diseñada para tu negocio.
          </p>

          <ul className="space-y-6">
            {[
              {
                icon: Zap,
                t: "Cobros en segundos",
                d: "Catálogo táctil optimizado para tablets.",
              },
              {
                icon: ShieldCheck,
                t: "Stock siempre al día",
                d: "Alertas de quiebre y reposición.",
              },
              {
                icon: BarChart3,
                t: "Reportes en tiempo real",
                d: "Conoce tus ventas al instante.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-base leading-none mb-1.5">
                    {t}
                  </p>
                  <p className="text-sm text-blue-200 leading-none">{d}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Tarjetas flotantes estilo Lovable */}
          <div className="mt-14 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white text-gray-900 p-5 shadow-2xl">
              <p className="text-xs font-medium text-gray-500 tracking-wide">
                Ticket #1042
              </p>
              <p className="mt-0.5 font-bold text-sm">3 ítems</p>
              <p className="mt-3 text-[1.6rem] font-bold">S/ 48.50</p>
            </div>
            <div className="rounded-2xl bg-white text-gray-900 p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-medium text-gray-500 tracking-wide">
                  Venta cobrada
                </p>
              </div>
              <p className="font-bold text-sm">Yape · S/ 48.50</p>
              <p className="mt-4 text-xs font-medium text-emerald-600">
                Pago confirmado
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
