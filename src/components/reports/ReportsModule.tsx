import React, { useState } from 'react';
import { Sale, Product } from '../../types';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  Banknote,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  Skull,
  Award,
  Download,
  Printer,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import { ThermalTicket } from '../pos/ThermalTicket';

interface ReportsModuleProps {
  sales: Sale[];
  products: Product[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  products,
}) => {
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('mes');
  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<Sale | null>(null);

  // Filter sales by selected period
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfDay - now.getDay() * 24 * 3600 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredSales = sales.filter((s) => {
    if (s.status === 'cancelada') return false;
    const saleTime = new Date(s.date).getTime();
    if (period === 'hoy') return saleTime >= startOfDay;
    if (period === 'semana') return saleTime >= startOfWeek;
    if (period === 'mes') return saleTime >= startOfMonth;
    return true; // todos
  });

  // Calculate Aggregates
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + (s.costTotal || s.total * 0.6), 0);
  const estimatedGrossProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? ((estimatedGrossProfit / totalRevenue) * 100).toFixed(1) : '0';

  const cashSalesTotal = filteredSales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const cardSalesTotal = filteredSales
    .filter((s) => s.paymentMethod === 'tarjeta')
    .reduce((acc, s) => acc + s.total, 0);

  // Group sales items to find Top 10 Best Sellers
  const productSalesMap = new Map<
    string,
    { id: string; name: string; quantity: number; revenue: number; isService: boolean }
  >();

  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        id: item.productId,
        name: item.name,
        quantity: 0,
        revenue: 0,
        isService: item.isService,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.subtotal;
      productSalesMap.set(item.productId, existing);
    });
  });

  const sortedSales = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity);
  const top10Products = sortedSales.slice(0, 10);

  // Identify "Dead" Products (productos en stock físico sin rotación / 0 ventas en el período evaluado)
  const soldProductIds = new Set(filteredSales.flatMap((s) => s.items.map((it) => it.productId)));
  const deadProducts = products.filter((p) => !p.isService && p.stock > 0 && !soldProductIds.has(p.id));

  // Service vs Product Revenue
  let serviceRevenue = 0;
  let physicalRevenue = 0;
  filteredSales.forEach((s) => {
    s.items.forEach((it) => {
      if (it.isService) {
        serviceRevenue += it.subtotal;
      } else {
        physicalRevenue += it.subtotal;
      }
    });
  });

  // Export Sales to CSV
  const exportSalesToCSV = () => {
    if (sales.length === 0) {
      alert('No hay ventas registradas para exportar.');
      return;
    }
    const headers = [
      'Folio',
      'Fecha',
      'Hora',
      'Cajero',
      'Articulos',
      'Metodo de Pago',
      'Subtotal',
      'Descuento',
      'Total',
      'Costo Total',
      'Ganancia Bruta',
      'Estatus',
      'Motivo Cancelacion',
    ];

    const rows = sales.map((s) => {
      const d = new Date(s.date);
      const dateStr = d.toLocaleDateString('es-MX');
      const timeStr = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const itemsStr = s.items.map((it) => `${it.quantity}x ${it.name}`).join('; ');
      return [
        s.folio,
        dateStr,
        timeStr,
        `"${s.cashierName}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        s.paymentMethod,
        (s.originalTotal || s.total + (s.discount || 0)).toFixed(2),
        (s.discount || 0).toFixed(2),
        s.total.toFixed(2),
        s.costTotal.toFixed(2),
        s.profit.toFixed(2),
        s.status,
        `"${(s.canceledReason || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_ventas_papeleria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Inventory to CSV
  const exportInventoryToCSV = () => {
    if (products.length === 0) {
      alert('No hay productos en inventario.');
      return;
    }
    const headers = [
      'Codigo de Barras',
      'Producto',
      'Marca',
      'Categoria',
      'Precio Costo',
      'Precio Venta',
      'Stock Actual',
      'Stock Minimo',
      'Unidad',
    ];
    const rows = products.map((p) => [
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      p.costPrice.toFixed(2),
      p.salePrice.toFixed(2),
      p.stock,
      p.minStock,
      p.unitType,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_papeleria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Reportes Esenciales & Ganancias
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Análisis financiero, margen bruto estimado, rotación de mercancía y exportación
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {(['hoy', 'semana', 'mes', 'todos'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition capitalize cursor-pointer ${
                    period === p
                      ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {p === 'hoy'
                    ? 'Hoy'
                    : p === 'semana'
                    ? 'Semana'
                    : p === 'mes'
                    ? 'Mes'
                    : 'Todo'}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <button
              onClick={exportSalesToCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              title="Descargar reporte completo en formato compatible con Excel"
            >
              <Download className="w-4 h-4" />
              <span>Excel Ventas</span>
            </button>
            <button
              onClick={exportInventoryToCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              title="Descargar catálogo de inventario en Excel"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Excel Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1F4461] to-[#163248] text-white shadow-sm">
            <div className="flex items-center justify-between text-gray-300 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Ventas Totales</span>
              <DollarSign className="w-5 h-5 text-[#9CC55B]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-300 mt-2 font-medium">
              {filteredSales.length} transacciones en el período
            </p>
          </div>

          {/* Estimated Gross Profit */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Utilidad Bruta</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
              ${estimatedGrossProfit.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Margen promedio: <strong className="text-gray-900">{profitMarginPercent}%</strong>
            </p>
          </div>

          {/* Payment breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
              Formas de Pago
            </span>
            <div className="space-y-1.5 my-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <Banknote className="w-4 h-4 text-emerald-600" /> Efectivo:
                </span>
                <span className="font-mono font-bold text-gray-900">
                  ${cashSalesTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Tarjeta:
                </span>
                <span className="font-mono font-bold text-gray-900">
                  ${cardSalesTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">Desglose de ingresos directos</span>
          </div>

          {/* Products vs Services */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
              Productos vs Servicios
            </span>
            <div className="space-y-1.5 my-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <Package className="w-4 h-4 text-[#1F4461]" /> Artículos:
                </span>
                <span className="font-mono font-bold text-gray-900">
                  ${physicalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Servicios:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  ${serviceRevenue.toFixed(2)}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">
              Copias, impresiones y encuadernado
            </span>
          </div>
        </div>

        {/* TOP SELLERS & DEAD PRODUCTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* TOP 10 BEST SELLERS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-[#1F4461]">
                  Top 10 Productos Más Vendidos
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">Por volumen</span>
            </div>

            <div className="p-2 overflow-x-auto">
              {top10Products.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No hay ventas registradas en este período.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Producto / Servicio</th>
                      <th className="py-2 px-3 text-center">Unidades</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {top10Products.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="py-2.5 px-3 font-bold text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-900 block truncate max-w-[220px]">
                            {p.name}
                          </span>
                          {p.isService && (
                            <span className="text-[10px] font-bold text-emerald-700">Servicio</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#1F4461]">
                          {p.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          ${p.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* DEAD PRODUCTS (Productos sin rotación) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-amber-700" />
                <h3 className="font-extrabold text-sm text-[#1F4461]">
                  Productos "Muertos" (Sin Rotación)
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-800">
                {deadProducts.length} productos parados
              </span>
            </div>

            <div className="p-2 overflow-x-auto">
              {deadProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-emerald-700 font-medium">
                  ✓ ¡Excelente rotación! Todos los productos en stock han tenido movimiento.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                    <tr>
                      <th className="py-2 px-3">Producto en Existencia</th>
                      <th className="py-2 px-3">Marca / Categoría</th>
                      <th className="py-2 px-3 text-center">Stock Atorado</th>
                      <th className="py-2 px-3 text-right">Capital Parado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deadProducts.slice(0, 10).map((prod) => (
                      <tr key={prod.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-gray-800 block truncate max-w-[200px]">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{prod.barcode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">{prod.brand || prod.category}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800">
                          {prod.stock} pzas
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-700">
                          ${(prod.stock * prod.costPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
              💡 <strong>Consejo comercial:</strong> Considera crear promociones, paquetes escolares o rebajas para estos productos para recuperar liquidez.
            </div>
          </div>
        </div>

        {/* DETALLE DE TRANSACCIONES DEL PERÍODO */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1F4461]" />
              <h3 className="font-extrabold text-sm text-[#1F4461]">
                Detalle de Ventas del Período ({filteredSales.length})
              </h3>
            </div>
            <span className="text-xs text-gray-500">Haz clic en Ticket para reimprimir</span>
          </div>

          <div className="p-2 overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                No hay ventas en el período seleccionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-3">Folio</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Cajero</th>
                    <th className="py-2.5 px-3">Artículos</th>
                    <th className="py-2.5 px-3">Forma de Pago</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Ganancia</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.slice(0, 50).map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1F4461]">
                        #{sale.folio}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                        {new Date(sale.date).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 font-medium">
                        @{sale.cashierName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 max-w-[200px] truncate">
                        {sale.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sale.paymentMethod === 'efectivo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +${sale.profit.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedSaleForTicket(sale)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#1F4461] hover:text-white text-gray-700 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Re-Print Modal */}
      {selectedSaleForTicket && (
        <ThermalTicket
          sale={selectedSaleForTicket}
          onClose={() => setSelectedSaleForTicket(null)}
          onNewSale={() => setSelectedSaleForTicket(null)}
        />
      )}
    </div>
  );
};
