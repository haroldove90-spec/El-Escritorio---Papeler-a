import React from 'react';
import {
  ShoppingCart,
  PackageSearch,
  Truck,
  Coins,
  BarChart3,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { ActiveModule } from '../types';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  lowStockCount: number;
  userRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  lowStockCount,
  userRole,
}) => {
  const allMenuItems: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
    shortcut?: string;
    roles: string[];
  }[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      icon: ShoppingCart,
      shortcut: 'F1',
      roles: ['Cajero'],
    },
    {
      id: 'inventory',
      label: 'Catálogo e Inventario',
      icon: PackageSearch,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      roles: ['Admin'],
    },
    {
      id: 'purchases',
      label: 'Compras y Entradas',
      icon: Truck,
      roles: ['Admin'],
    },
    {
      id: 'cash',
      label: 'Caja y Cortes X / Z',
      icon: Coins,
      roles: ['Admin', 'Cajero'],
    },
    {
      id: 'reports',
      label: 'Reportes Esenciales',
      icon: BarChart3,
      roles: ['Admin'],
    },
    {
      id: 'employees',
      label: 'Empleados & Roles',
      icon: Users,
      roles: ['Admin'],
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: User,
      roles: ['Admin', 'Cajero'],
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Module Navigation List */}
      <div className="flex-1 py-3.5 px-2.5 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#1F4461] font-semibold'
              } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 ${
                    isActive ? 'text-[#9CC55B]' : 'text-gray-500'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge !== undefined && (
                    <span
                      title="Productos con stock bajo"
                      className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-500 text-white animate-pulse"
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && !isActive && (
                    <span className="text-[11px] text-gray-400 font-mono hidden xl:inline font-bold">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed view badge indicator */}
              {isCollapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick POS guide widget when not collapsed */}
      {!isCollapsed && (
        <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#1F4461] mb-1">
            <HelpCircle className="w-4 h-4 text-[#9CC55B]" />
            <span className="text-xs font-bold">Atajo Rápido</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Presiona <strong className="text-gray-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">F2</strong> para cobrar y <strong className="text-gray-900 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">F4</strong> para buscar.
          </p>
        </div>
      )}

      {/* Collapse/Expand Toggle Bar */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

