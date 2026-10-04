import React, { useState } from 'react';
import { Product, Purchase, PurchaseItem, StockAdjustment } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  FileText,
  DollarSign,
  PackagePlus,
  Trash2,
  X,
  History,
  AlertTriangle,
  Loader2,
  Cloud,
  Database,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  fetchPurchasesFromSupabase,
  syncPurchaseToSupabase,
} from '../../services/supabaseClient';
import { PURCHASES_ONLY_SQL, FULL_SUPABASE_SQL_WITH_SAMPLE_DATA } from '../../services/supabaseSql';

interface PurchasesModuleProps {
  products: Product[];
  purchases: Purchase[];
  adjustments: StockAdjustment[];
  onSavePurchase: (purchase: Purchase) => Promise<{ success: boolean; error?: string } | void> | void;
  onDeletePurchases?: (purchaseIds: string[]) => void;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  products,
  purchases,
  adjustments,
  onSavePurchase,
  onDeletePurchases,
}) => {
  const [activeTab, setActiveTab] = useState<'compras' | 'ajustes'>('compras');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);

  // New Purchase Form state
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Supabase SQL Modal state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedSqlTab, setSelectedSqlTab] = useState<'purchases' | 'full'>('purchases');
  const [copiedSql, setCopiedSql] = useState(false);
  const supabaseConfig = getStoredSupabaseConfig();

  const showNotification = (message: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setSyncNotice({ message, type });
    setTimeout(() => {
      setSyncNotice((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  const handleManualSyncWithSupabase = async () => {
    setIsSyncingAll(true);
    try {
      let count = 0;
      for (const pur of purchases) {
        const res = await syncPurchaseToSupabase(pur);
        if (res.success) count++;
      }
      const remote = await fetchPurchasesFromSupabase();
      window.dispatchEvent(new Event('papeleria_data_change'));
      showNotification(
        `✓ Sincronización exitosa: ${remote?.length || count} compras confirmadas en Supabase Cloud.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar';
      showNotification(`⚠️ Error al sincronizar compras con Supabase: ${msg}`, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Item selector in modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('10');
  const [itemCostPrice, setItemCostPrice] = useState('');

  const openNewPurchaseModal = () => {
    setSupplier('Distribuidora Papelera Nacional');
    setInvoiceNumber(`FAC-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseNotes('');
    setPurchaseItems([]);
    setFormError(null);
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setItemCostPrice(products[0].costPrice.toString());
    }
    setIsModalOpen(true);
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemCostPrice(prod.costPrice.toString());
    }
  };

  const handleAddItemToPurchase = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(itemQuantity, 10) || 1;
    const cost = parseFloat(itemCostPrice) || prod.costPrice;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      barcode: prod.barcode,
      quantity: qty,
      costPrice: cost,
      subtotal: Number((qty * cost).toFixed(2)),
    };

    setPurchaseItems((prev) => [...prev, newItem]);
    setItemQuantity('10');
  };

  const handleRemovePurchaseItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPurchase = purchaseItems.reduce((acc, it) => acc + it.subtotal, 0);

  // Multi-selection handlers for purchases
  const allPurchasesSelected =
    purchases.length > 0 && purchases.every((p) => selectedPurchaseIds.includes(p.id));

  const handleToggleSelectAllPurchases = () => {
    if (allPurchasesSelected) {
      setSelectedPurchaseIds([]);
    } else {
      setSelectedPurchaseIds(purchases.map((p) => p.id));
    }
  };

  const handleToggleSelectPurchase = (id: string) => {
    setSelectedPurchaseIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedPurchases = () => {
    if (selectedPurchaseIds.length === 0) return;
    if (
      confirm(
        `¿Eliminar definitivamente las ${selectedPurchaseIds.length} compras seleccionadas?`
      )
    ) {
      if (onDeletePurchases) {
        onDeletePurchases(selectedPurchaseIds);
      }
      setSelectedPurchaseIds([]);
    }
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      setFormError('Debes indicar el nombre del proveedor.');
      return;
    }
    if (purchaseItems.length === 0) {
      setFormError('Debes agregar al menos un producto a la lista de la compra.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      supplier: supplier.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      date: new Date().toISOString(),
      items: purchaseItems,
      total: Number(totalPurchase.toFixed(2)),
      notes: purchaseNotes.trim() || undefined,
    };

    try {
      const res = await onSavePurchase(newPurchase);
      if (res && res.success === false) {
        setFormError(
          res.error || 'No se pudo guardar la compra en Supabase. Revisa las tablas o permisos.'
        );
        return;
      }
      setIsModalOpen(false);
      showNotification(
        `✓ Entrada de mercancía de "${newPurchase.supplier}" ($${newPurchase.total.toFixed(2)}) guardada y sincronizada en Supabase Cloud.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setFormError(`Error al sincronizar con Supabase: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
                Compras y Entradas de Mercancía
              </h1>
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  supabaseConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
                title={supabaseConfig.isConnected ? 'Conectado a Supabase PostgreSQL Cloud' : 'Supabase no conectado'}
              >
                <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{supabaseConfig.isConnected ? 'Supabase Cloud Activo' : 'Modo Local'}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Recepción a proveedores con actualización automática de existencias, costos y guardado en Supabase
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* View / Copy SQL Button */}
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1F4461] border border-blue-200 font-bold text-xs sm:text-sm transition cursor-pointer shadow-2xs"
              title="Ver y copiar script SQL para crear las tablas purchases y purchase_items en Supabase"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>Script SQL Supabase</span>
            </button>

            {/* Sync with Supabase Button */}
            <button
              onClick={handleManualSyncWithSupabase}
              disabled={isSyncingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Sincronizar y respaldar todas las compras con Supabase Cloud"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Compras'}</span>
            </button>

            {/* New Purchase Button */}
            <button
              onClick={openNewPurchaseModal}
              className="flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer active:scale-95"
            >
              <PackagePlus className="w-4.5 h-4.5" />
              <span>Registrar Entrada / Compra</span>
            </button>
          </div>
        </div>

        {/* Sync notification banner if active */}
        {syncNotice && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-200 ${
              syncNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : syncNotice.type === 'warn'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <span>{syncNotice.message}</span>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab switch between purchases and adjustment history */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('compras')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compras'
                ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Facturas de Proveedores ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ajustes')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ajustes'
                ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Mermas y Ajustes ({adjustments.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'compras' ? (
          <div className="space-y-4">
            {/* Purchases Bulk Action Bar */}
            {purchases.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={allPurchasesSelected && purchases.length > 0}
                    onChange={handleToggleSelectAllPurchases}
                    className="w-4 h-4 rounded text-[#1F4461] cursor-pointer"
                  />
                  <span>
                    {allPurchasesSelected ? 'Deseleccionar todas las compras' : 'Seleccionar todas las compras'}
                  </span>
                </label>

                {selectedPurchaseIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedPurchaseIds.length} seleccionada(s)
                    </span>
                    <button
                      onClick={handleDeleteSelectedPurchases}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar Seleccionadas</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {purchases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No hay compras registradas aún</p>
                <p className="text-xs text-gray-400 mt-1">
                  Haz clic en "Registrar Entrada / Compra" para ingresar producto a tu inventario.
                </p>
              </div>
            ) : (
              purchases.map((pur) => {
                const isSelected = selectedPurchaseIds.includes(pur.id);
                return (
                  <div
                    key={pur.id}
                    className={`rounded-2xl border transition p-4 sm:p-5 ${
                      isSelected
                        ? 'bg-[#1F4461]/5 border-[#1F4461]/30 shadow-md'
                        : 'bg-white border-gray-200 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectPurchase(pur.id)}
                          className="w-4 h-4 rounded text-[#1F4461] cursor-pointer mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#1F4461]" />
                            <h3 className="font-extrabold text-sm text-[#1F4461]">{pur.supplier}</h3>
                            {pur.invoiceNumber && (
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px] font-bold">
                                {pur.invoiceNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(pur.date).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Total de Compra:</span>
                        <span className="text-lg font-black text-[#1F4461] font-mono">
                          ${pur.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                  {/* Purchased items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead className="text-[10px] text-gray-400 uppercase font-bold">
                        <tr>
                          <th className="py-1">Producto</th>
                          <th className="py-1 text-center">Cantidad Ingresada</th>
                          <th className="py-1 text-right">Costo Unitario</th>
                          <th className="py-1 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pur.items.map((item, idx) => (
                          <tr key={`${pur.id}-item-${item.productId || idx}-${idx}`}>
                            <td className="py-1.5 font-medium text-gray-800">{item.productName}</td>
                            <td className="py-1.5 text-center font-mono font-bold text-emerald-700">
                              +{item.quantity} pzas
                            </td>
                            <td className="py-1.5 text-right font-mono text-gray-500">
                              ${item.costPrice.toFixed(2)}
                            </td>
                            <td className="py-1.5 text-right font-mono font-bold text-gray-800">
                              ${item.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pur.notes && (
                    <div className="mt-3 pt-2 text-[11px] text-gray-500 border-t border-gray-100 italic">
                      Nota: {pur.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        ) : (
          /* Adjustments History Tab */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4 text-center">Cantidad Deducida</th>
                    <th className="py-3 px-4 text-center">Stock Resultante</th>
                    <th className="py-3 px-4">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No hay registros de mermas o ajustes manuales todavía.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {new Date(adj.date).toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{adj.productName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 capitalize">
                            {adj.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-red-600">
                          -{adj.quantityAdjusted}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium text-gray-600">
                          {adj.newStock} pzas
                        </td>
                        <td className="py-3 px-4 text-gray-500 italic">{adj.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* NEW PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Registrar Compra a Proveedor</h3>
                <p className="text-xs text-gray-300">
                  Actualiza el inventario y costo de los productos automáticamente
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Proveedor:
                  </label>
                  <input
                    type="text"
                    required
                    value={supplier || ''}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Ej. Distribuidora Papelera Nacional"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    No. Factura / Remisión:
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber || ''}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej. FAC-1092"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Add item to entry box */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-3">
                <span className="text-xs font-bold text-[#1F4461] block">
                  Agregar Producto a la Entrada
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Producto:</label>
                    <select
                      value={selectedProductId || ''}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium outline-none bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Cantidad:</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity || ''}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-mono font-bold outline-none bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Costo Unit. ($):</label>
                    <input
                      type="number"
                      step="0.10"
                      value={itemCostPrice || ''}
                      onChange={(e) => setItemCostPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-mono font-bold outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToPurchase}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F4461] hover:bg-[#163248] text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar a la lista</span>
                  </button>
                </div>
              </div>

              {/* Items List in current modal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Artículos en esta Compra ({purchaseItems.length}):
                </label>
                {purchaseItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    Agrega al menos un producto arriba para registrar la compra.
                  </p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {purchaseItems.map((item, index) => (
                      <div
                        key={`new-pur-item-${item.productId}-${index}`}
                        className="p-2.5 flex items-center justify-between text-xs bg-white"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{item.productName}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {item.quantity} pzas x ${item.costPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-gray-900">
                            ${item.subtotal.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePurchaseItem(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Purchase */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-bold text-xs uppercase text-gray-700">Total Factura:</span>
                <span className="text-xl font-black font-mono text-[#1F4461]">
                  ${totalPurchase.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas de la compra:</label>
                <textarea
                  rows={2}
                  value={purchaseNotes || ''}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Detalles de entrega, condiciones o número de guía..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              {/* Cloud Storage Notice */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2 text-blue-900">
                  <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Guardado persistente en Supabase Cloud</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Esta entrada registrará la compra y sus artículos en Supabase, e incrementará de forma automática las existencias de cada producto en la nube.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(true)}
                  className="text-blue-700 hover:text-blue-900 underline font-bold text-[11px] shrink-0"
                >
                  Ver Script SQL
                </button>
              </div>

              {/* Form or Supabase Error Box */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No se pudo guardar la compra:</p>
                      <p className="text-[11px] mt-0.5 text-red-700">{formError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] shrink-0 transition"
                  >
                    Ver SQL
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0 || isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#9CC55B]" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#9CC55B]" />
                      <span>Confirmar Entrada de Inventario</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPABASE SQL SCRIPT MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1F4461] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-[#9CC55B]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">Script SQL para Compras en Supabase</h3>
                  <p className="text-xs text-gray-300">
                    Instrucciones para habilitar las tablas 'purchases' y 'purchase_items'
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                <h4 className="font-bold flex items-center gap-2 text-xs sm:text-sm text-[#1F4461]">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  ¿Cómo ejecutar este SQL en Supabase en 3 pasos?
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-blue-800">
                  <li>
                    Ingresa a tu consola de Supabase en{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-blue-900 inline-flex items-center gap-0.5"
                    >
                      supabase.com/dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>En el menú de la izquierda, selecciona <strong>SQL Editor</strong> y haz clic en <strong>New query</strong>.</li>
                  <li>Pega el código copiado a continuación y presiona el botón verde <strong>RUN</strong>.</li>
                </ol>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setSelectedSqlTab('purchases')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSqlTab === 'purchases'
                      ? 'bg-[#1F4461] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 bg-gray-100'
                  }`}
                >
                  Tablas de Compras ('purchases' y 'purchase_items')
                </button>
                <button
                  onClick={() => setSelectedSqlTab('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedSqlTab === 'full'
                      ? 'bg-[#1F4461] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 bg-gray-100'
                  }`}
                >
                  Base de Datos Completa
                </button>
              </div>

              {/* Code viewer */}
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 sm:max-h-72 select-all leading-relaxed border border-gray-800">
                  {selectedSqlTab === 'purchases' ? PURCHASES_ONLY_SQL : FULL_SUPABASE_SQL_WITH_SAMPLE_DATA}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-gray-500 font-medium">
                {selectedSqlTab === 'purchases'
                  ? 'Crea tablas purchases, purchase_items y políticas RLS'
                  : 'Script DDL completo con todas las tablas del sistema'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const code =
                      selectedSqlTab === 'purchases'
                        ? PURCHASES_ONLY_SQL
                        : FULL_SUPABASE_SQL_WITH_SAMPLE_DATA;
                    navigator.clipboard.writeText(code);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡SQL Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
