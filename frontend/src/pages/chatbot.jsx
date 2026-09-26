import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { enviarMensajeChatbot } from "../api/chatbotpi";

function leerRol(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])).rol;
  } catch {
    return null;
  }
}

function Resultado({ mensaje }) {
  if (mensaje.error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        {mensaje.error}
      </p>
    );
  }
  const datos = mensaje.datos;
  return (
    <>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
        {datos.respuesta}
      </p>
      {datos.periodo && (
        <p className="mt-2 text-xs leading-5 text-gray-500">{datos.periodo}</p>
      )}
      {datos.resumenVentas && (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-y border-gray-100 py-3">
          {Object.entries(datos.resumenVentas).map(([nombre, valor]) => (
            <div key={nombre} className="min-w-0">
              <dt className="text-xs text-gray-500">{nombre}</dt>
              <dd className="mt-1 break-words text-lg font-semibold tabular-nums text-gray-900">
                {valor}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {datos.filas?.length > 0 && (
        <div
          className="mt-3 max-w-full overflow-x-auto rounded-lg border border-gray-200"
          role="region"
          aria-label="Datos consultados"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Resultados de {datos.fuente}</caption>
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                {datos.columnas.map((columna) => (
                  <th
                    key={columna}
                    scope="col"
                    className="px-3 py-3 font-semibold whitespace-nowrap"
                  >
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datos.filas.map((fila, index) => (
                <tr key={index}>
                  {datos.columnas.map((columna) => (
                    <td
                      key={columna}
                      className="max-w-64 min-w-24 break-words px-3 py-3 align-top text-gray-700"
                    >
                      {String(fila[columna] ?? "No registrado")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {datos.resumenIA && (
        <div className="mt-4 border-l-2 border-emerald-500 pl-3">
          <p className="mb-1 text-xs font-semibold text-emerald-700">
            Resumen IA
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
            {datos.resumenIA}
          </p>
        </div>
      )}
      {datos.aviso && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-800">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {datos.aviso}
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-gray-400">
        {datos.fuente} ·{" "}
        {new Date(datos.consultadoEn).toLocaleTimeString("es-PE", {
          timeZone: "America/Lima",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        (Lima)
      </p>
    </>
  );
}

function Conversacion({ token }) {
  const rol = leerRol(token);
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const peticion = useRef(null);
  const lista = useRef(null);
  const entrada = useRef(null);
  const sugerencias =
    rol === 1
      ? [
          "Consultar stock de ",
          "Productos con bajo stock",
          "Cuanto vendimos hoy",
          "Productos mas vendidos esta semana",
          "Productos menos vendidos este mes",
          "Total de ingresos y producto mas vendido esta semana",
        ]
      : [
          "Stock de ",
          "Precio de arroz",
          "Como buscar un producto",
          "Como imprimir un ticket",
        ];

  useEffect(() => () => peticion.current?.abort(), []);
  useEffect(() => {
    lista.current?.scrollTo({
      top: lista.current.scrollHeight,
      behavior: "smooth",
    });
  }, [mensajes, cargando]);

  async function enviar(event) {
    event.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || mensaje.length > 500 || peticion.current) return;
    const controller = new AbortController();
    peticion.current = controller;
    setTexto("");
    setCargando(true);
    setMensajes((prev) => [
      ...prev.slice(-38),
      { id: crypto.randomUUID(), rol: "usuario", texto: mensaje },
    ]);
    try {
      const datos = await enviarMensajeChatbot(mensaje, controller.signal);
      if (
        !controller.signal.aborted &&
        localStorage.getItem("access_token") === token
      ) {
        setMensajes((prev) => [
          ...prev,
          { id: crypto.randomUUID(), rol: "asistente", datos },
        ]);
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        localStorage.getItem("access_token") !== token
      )
        return;
      if (error.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      const detalle = error.response?.data?.message;
      const mensajeError = Array.isArray(detalle) ? detalle.join(" ") : detalle;
      setMensajes((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          rol: "asistente",
          error:
            mensajeError ||
            "No se pudo completar la consulta. Revisa la conexion y vuelve a enviar tu pregunta.",
        },
      ]);
      setTexto(mensaje);
    } finally {
      if (peticion.current === controller) {
        peticion.current = null;
        setCargando(false);
        entrada.current?.focus();
      }
    }
  }

  function nuevaConversacion() {
    peticion.current?.abort();
    peticion.current = null;
    setCargando(false);
    setMensajes([]);
    setTexto("");
    entrada.current?.focus();
  }

  return (
    <section
      className="flex h-full min-h-[420px] min-w-0 flex-col overflow-hidden bg-white"
      aria-labelledby="chatbot-title"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <MessageSquare className="h-6 w-6 shrink-0 text-blue-600" />
          <div>
            <h1 id="chatbot-title" className="text-xl font-bold text-gray-900">
              Chatbot
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {rol === 1 ? "Administrador" : "Trabajador"} · Solo consulta
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={nuevaConversacion}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600"
          title="Nueva conversacion"
        >
          <Plus size={17} /> Nueva conversacion
        </button>
      </header>

      <div
        ref={lista}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6"
        role="log"
        aria-label="Conversacion"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {!mensajes.length ? (
          <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-4">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              ¿Que necesitas consultar?
            </h2>
            <div className="divide-y divide-gray-100 border-y border-gray-100">
              {sugerencias.map((pregunta) => (
                <button
                  type="button"
                  key={pregunta}
                  onClick={() => {
                    setTexto(pregunta);
                    entrada.current?.focus();
                  }}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm text-gray-600 hover:text-blue-700"
                >
                  <span>{pregunta}</span>
                  <ArrowUpRight size={17} className="shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {mensajes.map((mensaje) => (
              <article
                key={mensaje.id}
                className={
                  mensaje.rol === "usuario"
                    ? "ml-auto w-fit max-w-[90%] rounded-lg bg-blue-50 px-4 py-3"
                    : "min-w-0 border-b border-gray-100 pb-5"
                }
              >
                <p
                  className={`mb-2 text-xs font-semibold ${mensaje.rol === "usuario" ? "text-blue-700" : "text-emerald-700"}`}
                >
                  {mensaje.rol === "usuario" ? "Tu" : "Asistente POS"}
                </p>
                {mensaje.rol === "usuario" ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                    {mensaje.texto}
                  </p>
                ) : (
                  <Resultado mensaje={mensaje} />
                )}
              </article>
            ))}
            {cargando && (
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <Loader2 size={17} className="animate-spin" /> Consultando...
              </p>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={enviar}
        className="shrink-0 border-t border-gray-200 px-4 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-lg border border-gray-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <label htmlFor="chatbot-mensaje" className="sr-only">
              Tu consulta
            </label>
            <textarea
              id="chatbot-mensaje"
              ref={entrada}
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Escribe tu consulta..."
              disabled={cargando}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form.requestSubmit();
                }
              }}
              className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 text-gray-800 outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={cargando || !texto.trim()}
              aria-label="Enviar consulta"
              title="Enviar consulta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cargando ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={20} />
              )}
            </button>
          </div>
          <div className="mt-2 flex justify-between gap-2 text-xs text-gray-400">
            <span>Consulta independiente · Historial temporal</span>
            <span className="shrink-0 tabular-nums">{texto.length}/500</span>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function Chatbot() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );
  const navigate = useNavigate();
  useEffect(() => {
    const actualizarPerfil = () =>
      setToken(localStorage.getItem("access_token"));
    window.addEventListener("storage", actualizarPerfil);
    const interval = window.setInterval(actualizarPerfil, 1000);
    return () => {
      window.removeEventListener("storage", actualizarPerfil);
      window.clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    if (![1, 2].includes(leerRol(token))) navigate("/login", { replace: true });
  }, [token, navigate]);
  if (![1, 2].includes(leerRol(token))) return null;
  return <Conversacion key={token} token={token} />;
}
