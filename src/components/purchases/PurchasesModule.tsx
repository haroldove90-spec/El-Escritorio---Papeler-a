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
} from 'lucide-react';

interface PurchasesModuleProps {
  products: Product[];
  purchases: Purchase[];
  adjustments: StockAdjustment[];
  onSavePurchase: (purchase: Purchase) => void;
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

  // Item selector in modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('10');
  const [itemCostPrice, setItemCostPrice] = useState('');

  const openNewPurchaseModal = () => {
    setSupplier('Distribuidora Papelera Nacional');
    setInvoiceNumber(`FAC-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseNotes('');
    setPurchaseItems([]);
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

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || purchaseItems.length === 0) {
      alert('Debes indicar proveedor y al menos un producto a ingresar.');
      return;
    }

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      supplier: supplier.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      date: new Date().toISOString(),
      items: purchaseItems,
      total: Number(totalPurchase.toFixed(2)),
      notes: purchaseNotes.trim() || undefined,
    };

    onSavePurchase(newPurchase);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1F4461] tracking-tight">
              Compras y Entradas de Mercancía
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Recepción a proveedores con actualización automática de existencias y costos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openNewPurchaseModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Registrar Entrada / Compra</span>
            </button>
          </div>
        </div>

        {/* Tab switch between purchases and adjustment history */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('compras')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compras'
                ? 'bg-[#1F4461] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Facturas de Proveedores ({purchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ajustes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ajustes'
                ? 'bg-[#1F4461] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
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
                          <tr key={idx}>
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
                    value={supplier}
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
                    value={invoiceNumber}
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
                      value={selectedProductId}
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
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-mono font-bold outline-none bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Costo Unit. ($):</label>
                    <input
                      type="number"
                      step="0.10"
                      value={itemCostPrice}
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
                        key={index}
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
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Detalles de entrega, condiciones o número de guía..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
                    purchaseItems.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461]'
                  }`}
                >
                  Confirmar Entrada de Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
