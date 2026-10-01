import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md border border-amber-400/40 animate-pulse">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo sin conexión — Operando localmente</span>
    </div>
  );
};
