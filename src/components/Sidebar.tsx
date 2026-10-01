import React from 'react';
import { ShoppingCart, PackageSearch, Truck, Coins, BarChart3, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { ActiveModule } from '../types';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (module: ActiveModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  lowStockCount,
}) => {
  const menuItems: { id: ActiveModule; label: string; icon: React.ElementType; badge?: number; shortcut?: string }[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      icon: ShoppingCart,
      shortcut: 'F1',
    },
    {
      id: 'inventory',
      label: 'Catálogo e Inventario',
      icon: PackageSearch,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'purchases',
      label: 'Compras y Entradas',
      icon: Truck,
    },
    {
      id: 'cash',
      label: 'Caja y Cortes X / Z',
      icon: Coins,
    },
    {
      id: 'reports',
      label: 'Reportes Esenciales',
      icon: BarChart3,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Module Navigation List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#1F4461] text-white shadow-sm font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#1F4461]'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
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
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white animate-pulse"
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && !isActive && (
                    <span className="text-[10px] text-gray-400 font-mono hidden xl:inline">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed view badge indicator */}
              {isCollapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick POS guide widget when not collapsed */}
      {!isCollapsed && (
        <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200/80 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#1F4461] mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#9CC55B]" />
            <span>Ayuda de Teclado</span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Presiona <strong className="text-gray-800">F2</strong> para cobrar y calcular cambio al instante.
          </p>
        </div>
      )}

      {/* Collapse/Expand Toggle Bar */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
