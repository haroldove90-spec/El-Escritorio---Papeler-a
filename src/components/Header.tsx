import React, { useState } from 'react';
import { LogOut, Shield, Database, Keyboard, ChevronDown, Coins, User, Store } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { CashShift, UserAccount } from '../types';

interface HeaderProps {
  currentRole: string;
  currentUser?: UserAccount;
  activeShift: CashShift | null;
  onLogout: () => void;
  onOpenDataSettings: () => void;
  onOpenStoreSettings?: () => void;
  onOpenCashModal: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  activeShift,
  onLogout,
  onOpenDataSettings,
  onOpenStoreSettings,
  onOpenCashModal,
  onOpenProfile,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FA2400] text-white shadow-md relative transition-all">
      <div className="px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left side: System Logo (Clean, unencapsulated, transparent) */}
        <div className="flex items-center gap-2.5">
          <img
            src="https://lgaocnmbdzakianuvzlf.supabase.co/storage/v1/object/public/logos/ibetzilogo.png"
            alt="Papelería Arcoíris"
            className="h-8 sm:h-9.5 w-auto max-w-[190px] sm:max-w-[240px] object-contain cursor-pointer filter drop-shadow-sm"
          />
        </div>

        {/* Middle/Shift Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          {activeShift ? (
            <button
              onClick={onOpenCashModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-xs text-white transition cursor-pointer shadow-xs"
              title="Ver estado de caja y corte X"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D700] ring-2 ring-white/60 animate-pulse" />
              <span className="font-extrabold text-[#FFF300]">Caja Abierta:</span>
              <span className="font-mono font-black text-sm tracking-tight text-white">${activeShift.expectedCash.toFixed(2)}</span>
              <span className="text-[11px] text-white/80 font-bold">(Corte X)</span>
            </button>
          ) : (
            <button
              onClick={onOpenCashModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFB100] hover:bg-[#e69f00] text-[#282829] font-bold border border-white/30 text-xs transition cursor-pointer shadow-xs"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Abrir Turno de Caja</span>
            </button>
          )}

          {/* Keyboard shortcuts popup trigger */}
          <div className="relative">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/15 hover:bg-black/25 text-xs text-white transition cursor-pointer"
              title="Atajos de teclado POS"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#FFF300]" />
              <span className="hidden lg:inline font-bold">Atajos</span>
              <ChevronDown className="w-3 h-3 text-white/75" />
            </button>

            {showShortcuts && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white text-[#282829] shadow-2xl border border-gray-200 p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 font-extrabold text-[#FA2400]">
                  <span className="text-xs">Atajos de Teclado (POS)</span>
                  <span className="text-[10px] bg-red-50 text-[#FA2400] px-2 py-0.5 rounded font-bold">Rápido</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Cobrar venta</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-900 border text-[11px]">F2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Buscar producto</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-900 border text-[11px]">F4</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Servicios rápidos</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-900 border text-[11px]">F8</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Nueva venta / Vaciar</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-900 border text-[11px]">F9</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Cerrar ventanas</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-gray-100 font-mono font-bold text-gray-900 border text-[11px]">ESC</kbd>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-100 text-[11px] text-gray-600 leading-relaxed">
                    <span className="font-bold text-[#FA2400]">Escáner de barras:</span> Apunta y dispara el lector en cualquier momento.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Supabase & Store Configuration */}
          {currentRole === 'Admin' && (
            <>
              {onOpenStoreSettings && (
                <button
                  onClick={onOpenStoreSettings}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition cursor-pointer"
                  title="Configuración de Datos del Negocio y Ticket"
                >
                  <Store className="w-3.5 h-3.5 text-[#FFF300]" />
                  <span className="hidden md:inline">Ticket</span>
                </button>
              )}
              <button
                onClick={onOpenDataSettings}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition cursor-pointer"
                title="Gestión de Datos y Supabase"
              >
                <Database className="w-3.5 h-3.5 text-[#2AB3FE]" />
                <span className="hidden sm:inline">Datos</span>
              </button>
            </>
          )}

          {/* PWA Fast Install Button */}
          <PWAInstallButton />

          {/* Active Role & Profile link */}
          {onOpenProfile ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-xs transition cursor-pointer"
              title={`Ver y editar mi perfil (${currentRole})`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#00D700]" />
                )}
              </div>
              <span className="font-black text-white tracking-wide">{currentRole}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 border border-white/20 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#00D700]" />
              <span className="font-black text-white tracking-wide">{currentRole}</span>
            </div>
          )}

          {/* Unified Logout Button */}
          <button
            onClick={onLogout}
            title="Cerrar sesión y cambiar de rol"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/45 text-white border border-white/20 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Subtle Rainbow Line Accent */}
      <div className="h-1 w-full rainbow-gradient" />
    </header>
  );
};
