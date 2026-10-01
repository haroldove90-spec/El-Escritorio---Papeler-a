import React from 'react';
import { ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface RoleSelectorProps {
  onSelectRole: (role: string) => void;
  onOpenDataSettings: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  onSelectRole,
  onOpenDataSettings,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col justify-between p-4 sm:p-8">
      {/* Top right quick actions */}
      <div className="w-full flex justify-end items-center gap-3 max-w-5xl mx-auto">
        <PWAInstallButton />
        <button
          onClick={onOpenDataSettings}
          className="text-xs font-semibold text-gray-500 hover:text-[#1F4461] px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition cursor-pointer"
        >
          Ajustes / Base de Datos
        </button>
      </div>

      {/* Main Center Section */}
      <div className="max-w-4xl w-full mx-auto my-auto flex flex-col items-center text-center">
        {/* Full Size Unencapsulated Logo */}
        <div className="mb-6 flex justify-center w-full">
          <img
            src="https://appdesignproyectos.com/papelerialogo.png"
            alt="Papelería El Escritorio"
            className="w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] h-auto object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1F4461]/10 text-[#1F4461] text-xs font-bold tracking-wide uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#9CC55B]" />
          <span>Sistema Punto de Venta • Control Total</span>
        </div>

        {/* Roles Grid: 2 Columns Mobile, 4 Columns Desktop */}
        {/* Strictly: No headers, no descriptions, only role icon and role name */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
          {/* Active Admin Card */}
          <button
            onClick={() => onSelectRole('Admin')}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white border-2 border-[#1F4461] shadow-lg shadow-[#1F4461]/10 hover:shadow-xl hover:shadow-[#1F4461]/20 hover:-translate-y-1 transition-all duration-200 cursor-pointer text-[#1F4461]"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1F4461] text-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#163248] transition-transform duration-200 shadow-md">
              <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-[#9CC55B]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#1F4461] group-hover:text-[#163248]">
              Admin
            </span>
            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#9CC55B] animate-pulse" />
          </button>

          {/* Placeholder/Secondary role slot disabled or optional Cajero for grid balance */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white/60 border border-dashed border-gray-300 text-gray-400 select-none opacity-60">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-gray-400">
              Cajero (Próx.)
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white/60 border border-dashed border-gray-300 text-gray-400 select-none opacity-40 hidden lg:flex">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 text-gray-300 flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-gray-400">
              Supervisor
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl bg-white/60 border border-dashed border-gray-300 text-gray-400 select-none opacity-40 hidden lg:flex">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 text-gray-300 flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-gray-400">
              Inventario
            </span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-500 font-medium">
          Selecciona tu rol para acceder al Punto de Venta
        </p>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-gray-400 mt-6 font-mono">
        Papelería El Escritorio POS • v1.0.0
      </div>
    </div>
  );
};
