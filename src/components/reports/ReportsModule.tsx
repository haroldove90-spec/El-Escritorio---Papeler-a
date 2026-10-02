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
} from 'lucide-react';

interface ReportsModuleProps {
  sales: Sale[];
  products: Product[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  sales,
  products,
}) => {
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('mes');

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Reportes Esenciales & Ganancias
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Análisis financiero, margen bruto estimado y rotación de mercancía
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
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
                  ? 'Esta Semana'
                  : p === 'mes'
                  ? 'Este Mes'
                  : 'Todo'}
              </button>
            ))}
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
              <DollarSign className="w-4.5 h-4.5 text-[#9CC55B]" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              ${totalRevenue.toFixed(2)}
            </span>
            <p className="text-xs text-gray-300 mt-1.5 font-medium">
              {filteredSales.length} transacciones registradas
            </p>
          </div>

          {/* Gross Profit */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Ganancia Bruta Estimada</span>
              <TrendingUp className="w-4.5 h-4.5 text-[#9CC55B]" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-700">
              ${estimatedGrossProfit.toFixed(2)}
            </span>
            <p className="text-xs text-emerald-800 font-bold mt-1.5">
              Margen de ganancia: {profitMarginPercent}%
            </p>
          </div>

          {/* Total Cost */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Costo Mercancía Vendida</span>
              <Package className="w-4.5 h-4.5 text-gray-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-800">
              ${totalCost.toFixed(2)}
            </span>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">Costo base a proveedores</p>
          </div>

          {/* Payment Method Distribution */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-2">
              Desglose de Cobro
            </span>
            <div className="space-y-2 text-sm font-semibold">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Efectivo:
                </span>
                <span className="font-mono font-black text-gray-900 text-base">${cashSalesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Tarjeta:
                </span>
                <span className="font-mono font-black text-gray-900 text-base">${cardSalesTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3.5 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${totalRevenue > 0 ? (cashSalesTotal / totalRevenue) * 100 : 50}%` }}
              />
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${totalRevenue > 0 ? (cardSalesTotal / totalRevenue) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>

        {/* Services vs Physical Products Bar */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">
              Ingresos por Tipo de Venta
            </h4>
            <p className="text-xs text-gray-500">
              Productos Físicos vs. Servicios sin inventario (copias, impresiones, etc.)
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Productos Papelería</span>
              <span className="font-mono font-black text-sm text-[#1F4461]">${physicalRevenue.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Servicios Rápidos</span>
              <span className="font-mono font-black text-sm text-[#9CC55B]">${serviceRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* COMPARISON: Top 10 Best Sellers vs "Dead" Products without rotation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP 10 BEST SELLERS */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-[#1F4461]">
                  Top 10 Productos Más Vendidos
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Mayor Rotación</span>
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
      </div>
    </div>
  );
};
