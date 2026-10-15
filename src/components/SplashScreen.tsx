import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show splash screen smoothly and fade out
    const timer = setTimeout(() => {
      setOpacity(0);
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(hideTimer);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      style={{ opacity, transition: 'opacity 0.4s ease-out' }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="flex flex-col items-center max-w-sm w-full animate-in zoom-in-95 duration-500">
        {/* Unencapsulated Clean High-Res Logo */}
        <div className="w-full max-w-[280px] sm:max-w-[340px] flex items-center justify-center mb-6">
          <img
            src="https://lgaocnmbdzakianuvzlf.supabase.co/storage/v1/object/public/logos/ibetzilogo.png"
            alt="Papelería Arcoíris"
            className="w-full h-auto object-contain filter drop-shadow-md"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#282829] tracking-tight mb-2 text-center">
          Papelería <span className="text-[#FA2400]">Arcoíris</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-gray-500 text-center mb-6">
          Punto de Venta Profesional & Control de Inventario
        </p>

        {/* Animated Rainbow Progress Bar */}
        <div className="w-48 h-1.5 rounded-full overflow-hidden bg-gray-100 relative shadow-inner">
          <div
            className="h-full w-full rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(90deg, #FA2400 0%, #FFB100 20%, #FFF300 40%, #00D700 60%, #2AB3FE 80%, #008CEB 90%, #9949E8 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
