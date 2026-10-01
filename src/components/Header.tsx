import React, { useState } from 'react';
import { LogOut, Shield, Database, Keyboard, ChevronDown, Check, Coins } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { CashShift } from '../types';

interface HeaderProps {
  currentRole: string;
  activeShift: CashShift | null;
  onLogout: () => void;
  onOpenDataSettings: () => void;
  onOpenCashModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  activeShift,
  onLogout,
  onOpenDataSettings,
  onOpenCashModal,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#1F4461] text-white shadow-md border-b border-[#163248] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all">
      {/* Left side: System Logo (Not encapsulated, shown full size / unconstrained) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <img
            src="https://appdesignproyectos.com/papelerialogo.png"
            alt="Papelería El Escritorio"
            className="h-9 sm:h-12 w-auto max-w-[200px] sm:max-w-[260px] object-contain cursor-pointer"
          />
        </div>
      </div>

      {/* Middle/Shift Status Pill */}
      <div className="hidden md:flex items-center gap-3">
        {activeShift ? (
          <button
            onClick={onOpenCashModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white transition cursor-pointer"
            title="Ver estado de caja y corte X"
          >
            <div className="w-2 h-2 rounded-full bg-[#9CC55B] animate-pulse" />
            <span className="font-semibold text-[#9CC55B]">Caja Abierta:</span>
            <span className="font-mono font-bold">${activeShift.expectedCash.toFixed(2)}</span>
            <span className="text-[10px] text-gray-300">(Corte X)</span>
          </button>
        ) : (
          <button
            onClick={onOpenCashModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs text-[#F3C16C] transition cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="font-bold">Abrir Turno de Caja</span>
          </button>
        )}

        {/* Keyboard shortcuts popup trigger */}
        <div className="relative">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-gray-200 transition cursor-pointer"
            title="Atajos de teclado POS"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#F3C16C]" />
            <span className="hidden lg:inline text-xs font-medium">Atajos</span>
            <ChevronDown className="w-3 h-3 text-gray-300" />
          </button>

          {showShortcuts && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-[#282829] shadow-2xl border border-gray-200 p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 font-bold text-[#1F4461]">
                <span>Atajos de Teclado (POS)</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Rápido</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cobrar venta</span>
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 font-mono font-bold text-gray-800 border">F2</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Buscar producto</span>
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 font-mono font-bold text-gray-800 border">F4</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Servicios rápidos</span>
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 font-mono font-bold text-gray-800 border">F8</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nueva venta / Vaciar</span>
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 font-mono font-bold text-gray-800 border">F9</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cerrar ventanas</span>
                  <kbd className="px-2 py-0.5 rounded bg-gray-100 font-mono font-bold text-gray-800 border">ESC</kbd>
                </div>
                <div className="pt-1 mt-1 border-t border-gray-100 text-[10px] text-gray-500">
                  <span className="font-semibold text-[#1F4461]">Escáner de barras:</span> Apunta y dispara el lector en cualquier momento.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase & Sample Data Settings Button */}
        <button
          onClick={onOpenDataSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-gray-100 transition cursor-pointer"
          title="Gestión de Datos y Supabase"
        >
          <Database className="w-3.5 h-3.5 text-[#F3C16C]" />
          <span className="hidden sm:inline">Datos</span>
        </button>

        {/* PWA Fast Install Button */}
        <PWAInstallButton />

        {/* Active Role Identification */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#163248] border border-white/15 text-xs">
          <Shield className="w-3.5 h-3.5 text-[#9CC55B]" />
          <span className="font-bold text-white tracking-wide">{currentRole}</span>
        </div>

        {/* Unified Logout Button */}
        <button
          onClick={onLogout}
          title="Cerrar sesión y cambiar de rol"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-semibold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};
