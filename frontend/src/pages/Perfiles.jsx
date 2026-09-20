import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Delete, Loader2 } from "lucide-react";
import { authService } from "../api/authService";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-cyan-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-red-600",
  "from-amber-400 to-orange-500",
];

export default function Perfiles() {
  const navigate = useNavigate();
  const [perfiles, setPerfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchPerfiles = async () => {
      try {
        const data = await authService.getPerfiles();
        setPerfiles(data);
      } catch (error) {
        console.error("Error cargando perfiles:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerfiles();
  }, [navigate]);

  useEffect(() => {
    if (pin.length === 6 && pinFor) {
      handlePinSubmit();
    }
  }, [pin]);

  const handleSelect = async (perfil) => {
    setPinError("");
    setPin("");

    if (perfil.id_rol === 1) {
      setPinFor(perfil);
    } else {
      try {
        setIsVerifying(true);
        await authService.loginPerfil(perfil.id, null);
        navigate("/home");
      } catch (error) {
        console.error("Error al ingresar:", error);
        alert("No se pudo iniciar sesión en el perfil.");
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handlePinSubmit = async () => {
    setIsVerifying(true);
    setPinError("");
    try {
      await authService.loginPerfil(pinFor.id, pin);
      setPinFor(null);
      navigate("/home");
    } catch (error) {
      setPinError("PIN incorrecto. Intenta de nuevo.");
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  const press = (n) => {
    if (pin.length < 6) setPin((p) => p + n);
  };
  const back = () => setPin((p) => p.slice(0, -1));

  const getInitials = (nombres, apellidos) => {
    const n = nombres ? nombres.charAt(0) : "";
    const a = apellidos ? apellidos.charAt(0) : "";
    return (n + a).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
      {/* ── Botón Flotante de Cerrar Sesión (Esquina inferior derecha) ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            authService.logout();
            navigate("/login");
          }}
          className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-2xl transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>

      {/* ── Contenido Principal ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center text-gray-900">
          ¿Quién está operando la caja?
        </h1>
        <p className="mt-4 text-gray-500 font-medium text-center max-w-lg text-lg">
          Selecciona tu perfil para abrir el punto de venta. Los administradores
          requieren PIN.
        </p>

        {/* Grid de Perfiles */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-12 max-w-5xl z-10">
          {perfiles.map((p, index) => {
            const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                disabled={isVerifying}
                className="group flex flex-col items-center gap-4 focus:outline-none disabled:opacity-50"
              >
                {/* Avatar */}
                <div
                  className={`relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-lg transition-all duration-300 ring-4 ring-transparent group-hover:ring-blue-100 group-hover:-translate-y-2 group-hover:shadow-xl bg-gradient-to-br ${colorClass}`}
                >
                  {getInitials(p.nombres, p.apellidos)}

                  {/* Candado si es admin */}
                  {p.id_rol === 1 && (
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-2 border-4 border-white">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Textos */}
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                    {p.nombres}
                  </p>
                  <p className="text-sm font-semibold text-gray-500">{p.rol}</p>
                </div>
              </button>
            );
          })}

          {/* Botón Agregar Perfil */}
          <button className="group flex flex-col items-center gap-4 focus:outline-none">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 transition-all duration-300 group-hover:border-blue-600 group-hover:text-blue-600 group-hover:-translate-y-2 group-hover:bg-blue-50">
              <Plus className="h-10 w-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-gray-500 group-hover:text-blue-600 transition-colors">
                Agregar perfil
              </p>
              <p className="text-sm font-semibold text-gray-400">
                Nuevo cajero
              </p>
            </div>
          </button>
        </div>
      </main>

      {/* ── Modal Dialog para el PIN ── */}
      {pinFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-center text-2xl font-black text-gray-900 mb-6">
              Ingresa tu PIN
            </h2>

            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm bg-linear-to-br ${AVATAR_COLORS[0]}`}
              >
                {getInitials(pinFor.nombres, pinFor.apellidos)}
              </div>
              <p className="font-bold text-gray-600">
                {pinFor.nombres} {pinFor.apellidos}
              </p>

              {pinError && (
                <p className="text-red-500 font-semibold text-sm mt-2 animate-pulse">
                  {pinError}
                </p>
              )}

              {/* Casillas de PIN */}
              <div className="flex gap-2 my-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-12 w-10 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-colors ${
                      pin.length > i
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-200 text-transparent"
                    }`}
                  >
                    {pin[i] ? "•" : ""}
                  </div>
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                  <button
                    key={n}
                    onClick={() => press(n)}
                    className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-900 text-2xl font-bold transition-all"
                  >
                    {n}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => press("0")}
                  className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-900 text-2xl font-bold transition-all"
                >
                  0
                </button>
                <button
                  onClick={back}
                  className="h-14 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-500 transition-all flex items-center justify-center"
                  aria-label="Borrar"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>

              <button
                className="w-full mt-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={() => {
                  setPinFor(null);
                  setPin("");
                  setPinError("");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
