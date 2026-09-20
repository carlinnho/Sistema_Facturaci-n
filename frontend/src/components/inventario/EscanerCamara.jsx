import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  X,
  Barcode,
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const READER_ID = "qr-reader-custom";

export default function EscanerCamara({ onScanSuccess, onClose }) {
  const html5QrRef = useRef(null);
  const isRunningRef = useRef(false);

  const [camaras, setCamaras] = useState([]);
  const [camaraActiva, setCamaraActiva] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState("");
  const [cargandoCamara, setCargandoCamara] = useState(false);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setError("No se detectaron cámaras en este dispositivo.");
          return;
        }
        setCamaras(devices);
        const trasera = devices.find((d) =>
          /back|rear|environment|trasera/i.test(d.label),
        );
        setCamaraActiva(trasera ? trasera.id : devices[0].id);
      })
      .catch(() => {
        setError("No se pudo acceder a la cámara. Verifica los permisos.");
      });
  }, []);

  const iniciarEscaneo = useCallback(async () => {
    if (!camaraActiva || isRunningRef.current) return;
    setError("");
    setCargandoCamara(true);

    try {
      const qr = new Html5Qrcode(READER_ID, { verbose: false });
      html5QrRef.current = qr;

      await qr.start(
        { deviceId: { exact: camaraActiva } },
        {
          fps: 12,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.6,
          showTorchButtonIfSupported: false,
        },
        (decodedText) => {
          detenerEscaneo().then(() => onScanSuccess(decodedText));
        },
        () => {},
      );

      isRunningRef.current = true;
      setEscaneando(true);
    } catch (err) {
      setError(
        err?.message?.includes("Permission")
          ? "Permiso de cámara denegado."
          : "No se pudo iniciar la cámara.",
      );
    } finally {
      setCargandoCamara(false);
    }
  }, [camaraActiva, onScanSuccess]);

  const detenerEscaneo = useCallback(async () => {
    const qr = html5QrRef.current;
    if (!qr) return;

    try {
      if (isRunningRef.current) {
        await qr.stop();
        isRunningRef.current = false;
      }
      await qr.clear();
    } catch {
    } finally {
      html5QrRef.current = null;
      setEscaneando(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      const qr = html5QrRef.current;
      if (!qr) return;
      if (isRunningRef.current) {
        qr.stop()
          .catch(() => {})
          .finally(() => {
            qr.clear().catch(() => {});
            isRunningRef.current = false;
          });
      } else {
        qr.clear().catch(() => {});
      }
      html5QrRef.current = null;
    };
  }, []);

  const handleCambiarCamara = async (nuevoId) => {
    if (escaneando) await detenerEscaneo();
    setCamaraActiva(nuevoId);
    setError("");
  };

  const handleCerrar = async () => {
    await detenerEscaneo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-200 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 relative overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Barcode className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900 text-base">
              Escanear Código
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Apunta la cámara al código de barras
            </p>
          </div>
          <button
            onClick={handleCerrar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {camaras.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Cámara
              </label>
              <select
                value={camaraActiva}
                onChange={(e) => handleCambiarCamara(e.target.value)}
                disabled={cargandoCamara}
                className="h-11 px-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm font-bold outline-none focus:border-blue-600 cursor-pointer disabled:opacity-50"
              >
                {camaras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Cámara ${cam.id.slice(0, 8)}…`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-gray-100"
            style={{ minHeight: "220px" }}
          >
            <div id={READER_ID} className="w-full" />

            {!escaneando && !cargandoCamara && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <Camera className="w-10 h-10" />
                <p className="text-sm font-bold">Cámara detenida</p>
              </div>
            )}

            {cargandoCamara && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm font-bold">Iniciando cámara...</p>
              </div>
            )}

            {escaneando && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-[260px] h-[160px]">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                  <div className="absolute left-1 right-1 h-0.5 bg-blue-500/70 animate-scan-line shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-600 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCerrar}
              className="h-12 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>

            {!escaneando ? (
              <button
                onClick={iniciarEscaneo}
                disabled={!camaraActiva || cargandoCamara || !!error}
                className="h-12 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {cargandoCamara ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Iniciando
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Iniciar
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={detenerEscaneo}
                className="h-12 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <CameraOff className="w-4 h-4" /> Detener
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        #${READER_ID} > img { display: none !important; }
        #${READER_ID} > div[style] { border: none !important; box-shadow: none !important; }
        #${READER_ID}__dashboard, #${READER_ID}__dashboard_section, #${READER_ID}__header_message, #${READER_ID}__filescan_input, #${READER_ID}__camera_selection, #${READER_ID}__camera_permission_button, select[id^="${READER_ID}"], button[id^="${READER_ID}"] { display: none !important; }
        #${READER_ID} video { width: 100% !important; height: auto !important; display: block !important; border-radius: 0 !important; }
        @keyframes scan-line { 0% { top: 4px; opacity: 1; } 50% { opacity: 0.6; } 100% { top: calc(100% - 4px); opacity: 1; } }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
}
