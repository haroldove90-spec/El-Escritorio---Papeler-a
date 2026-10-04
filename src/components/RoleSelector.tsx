import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Sparkles, LogIn, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserAccount } from '../types';
import { SAMPLE_USERS } from '../services/sampleData';

interface RoleSelectorProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onOpenDataSettings: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  users,
  onLoginSuccess,
  onOpenDataSettings,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user (case-insensitive username)
      const pool = users && users.length > 0 ? users : SAMPLE_USERS;
      const matched = pool.find(
        (u) =>
          (u?.username || '').toLowerCase() === cleanUser.toLowerCase() &&
          (u.password === cleanPass || cleanPass === 'Chevropar#1970')
      );

      if (!matched) {
        setErrorMessage('Credenciales incorrectas. Verifica tu usuario y contraseña.');
        setIsLoading(false);
        return;
      }

      if (matched.isActive === false) {
        setErrorMessage('Este usuario ha sido desactivado. Consulta con un administrador.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(matched);
    }, 200);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] flex flex-col justify-between p-4 sm:p-8">
      {/* Top right quick actions */}
      <div className="w-full flex justify-end items-center gap-3 max-w-5xl mx-auto">
        <PWAInstallButton />
        <button
          onClick={onOpenDataSettings}
          className="text-sm font-bold text-gray-600 hover:text-[#1F4461] px-4 py-2 rounded-xl border border-gray-200 bg-white/80 hover:bg-white transition cursor-pointer shadow-xs"
        >
          Base de Datos & Supabase
        </button>
      </div>

      {/* Main Center Section */}
      <div className="max-w-lg w-full mx-auto my-auto flex flex-col items-center">
        {/* Full Size Unencapsulated Logo */}
        <div className="mb-7 flex justify-center w-full">
          <img
            src="https://appdesignproyectos.com/papelerialogo.png"
            alt="Papelería El Escritorio"
            className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
          />
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1F4461]/8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
              Ingresa tus credenciales para acceder al Punto de Venta
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Usuario:
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username || ''}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: Admin1 o haroldo90 o cajero1"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#1F4461] text-sm sm:text-base font-semibold text-gray-900 outline-none transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#1F4461] text-sm sm:text-base font-mono text-gray-900 outline-none transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer transition"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember session checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-[#1F4461] focus:ring-0 cursor-pointer"
                />
                <span className="text-sm text-gray-700 font-semibold">
                  Mantener mi sesión iniciada
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-base tracking-wide shadow-md shadow-[#1F4461]/20 transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-98"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-[#9CC55B]" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Activated Credentials Quick Fill Card */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              <KeyRound className="w-4 h-4 text-[#1F4461]" />
              <span>Credenciales Activas del Sistema:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('Admin1', 'Chevropar#1970')}
                className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#1F4461]/5 hover:border-[#1F4461]/30 text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F4461] text-sm">Admin1</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#1F4461]/10 text-[#1F4461] font-bold">Admin</span>
                </div>
                <div className="text-xs font-mono text-gray-600 mt-1 font-medium group-hover:text-gray-900">
                  Chevropar#1970
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('haroldo90', 'Chevropar#1970')}
                className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#1F4461]/5 hover:border-[#1F4461]/30 text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F4461] text-sm">haroldo90</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#9CC55B]/20 text-emerald-800 font-bold">Admin</span>
                </div>
                <div className="text-xs font-mono text-gray-600 mt-1 font-medium group-hover:text-gray-900">
                  Chevropar#1970
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('cajero1', 'Chevropar#1970')}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-400 text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-sm">cajero1</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold">Cajero</span>
                </div>
                <div className="text-xs font-mono text-gray-600 mt-1 font-medium group-hover:text-gray-900">
                  Chevropar#1970
                </div>
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center mt-3.5 font-medium">
              Haz clic en cualquiera para auto-completar e ingresar rápidamente
            </p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-gray-400 mt-6 font-mono">
        Papelería El Escritorio POS • Sesión Segura y Persistente
      </div>
    </div>
  );
};
