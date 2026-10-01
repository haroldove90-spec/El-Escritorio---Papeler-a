import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, CheckCircle, MonitorDown } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#9CC55B]/15 text-[#1F4461] text-xs font-semibold border border-[#9CC55B]/40">
        <CheckCircle className="w-3.5 h-3.5 text-[#9CC55B]" />
        <span>Instalada</span>
      </div>
    );
  }

  return (
    <>
      {/* Standard install button for browser prompt */}
      {isInstallable ? (
        <button
          onClick={install}
          title="Instalar El Escritorio en tu dispositivo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9CC55B] text-[#1F4461] hover:bg-[#8bb44c] font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Instalar App</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSModal(true)}
          title="Instalar en iPhone o iPad"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9CC55B] text-[#1F4461] hover:bg-[#8bb44c] font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Instalar en iOS</span>
        </button>
      ) : (
        <button
          onClick={() => setShowDesktopHelp(true)}
          title="Instalar aplicación"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9CC55B]/20 text-white hover:bg-[#9CC55B]/30 border border-[#9CC55B]/40 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
        >
          <MonitorDown className="w-3.5 h-3.5 text-[#9CC55B]" />
          <span>Instalar</span>
        </button>
      )}

      {/* iOS Modal instructions */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://appdesignproyectos.com/papeleriaicono.png"
                alt="El Escritorio"
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <div>
                <h3 className="text-base font-bold text-[#1F4461]">Instalar El Escritorio</h3>
                <p className="text-xs text-gray-500">en iPhone o iPad</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Sigue estos sencillos pasos en Safari para tener la aplicación en pantalla completa sin barra de navegación:
            </p>

            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-gray-700">
                  1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-gray-700">
                  2. Desliza hacia abajo y selecciona <strong>"Agregar al Inicio"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-semibold text-xs shadow-md transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Desktop instructions modal when native prompt is pending */}
      {showDesktopHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowDesktopHelp(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://appdesignproyectos.com/papeleriaicono.png"
                alt="El Escritorio"
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <div>
                <h3 className="text-base font-bold text-[#1F4461]">Instalar El Escritorio</h3>
                <p className="text-xs text-gray-500">Computadora / PC / Mac</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              Para instalar este Punto de Venta como aplicación de escritorio nativa:
            </p>

            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200/80 mb-5 text-xs text-gray-700">
              <p>
                • En <strong>Google Chrome o Microsoft Edge</strong>: Haz clic en el ícono de <strong>Instalar</strong> <MonitorDown className="w-3.5 h-3.5 inline text-[#1F4461]" /> que aparece en el extremo derecho de la barra de direcciones superior.
              </p>
              <p>
                • O abre el menú del navegador <strong>(⋮)</strong> &gt; <strong>Guardar y compartir</strong> &gt; <strong>Instalar página como aplicación</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowDesktopHelp(false)}
              className="w-full py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-semibold text-xs shadow-md transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
