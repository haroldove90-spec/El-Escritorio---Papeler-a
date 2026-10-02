import React from 'react';
import { ShoppingCart, PackageSearch, Truck, Coins, BarChart3, User } from 'lucide-react';
import { ActiveModule } from '../types';

interface BottomNavProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  lowStockCount: number;
  userRole: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeModule,
  onSelectModule,
  lowStockCount,
  userRole,
}) => {
  const allNavItems: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
    roles: string[];
  }[] = [
    {
      id: 'pos',
      label: 'Cobro POS',
      icon: ShoppingCart,
      roles: ['Cajero'],
    },
    {
      id: 'inventory',
      label: 'Catálogo',
      icon: PackageSearch,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      roles: ['Admin'],
    },
    {
      id: 'purchases',
      label: 'Compras',
      icon: Truck,
      roles: ['Admin'],
    },
    {
      id: 'cash',
      label: 'Caja',
      icon: Coins,
      roles: ['Admin', 'Cajero'],
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      roles: ['Admin'],
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: User,
      roles: ['Admin', 'Cajero'],
    },
  ];

  const navItems = allNavItems.filter((it) => it.roles.includes(userRole));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/90 shadow-lg pb-safe">
      <div
        className="grid h-15 w-full"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`flex flex-col items-center justify-center relative py-1 transition-all active:scale-90 cursor-pointer ${
                isActive ? 'text-[#1F4461] font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-105 text-[#1F4461]' : 'text-gray-400'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 transition-colors ${
                  isActive ? 'text-[#1F4461] font-bold' : 'text-gray-500 font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 rounded-t-full bg-[#9CC55B]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

