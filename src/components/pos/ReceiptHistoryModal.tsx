import React, { useState, useMemo } from 'react';
import { Sale, Product } from '../../types';
import {
  Receipt,
  Search,
  Printer,
  X,
  Calendar,
  User,
  CreditCard,
  Banknote,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ThermalTicket } from './ThermalTicket';

interface ReceiptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  userRole: string | null;
  onCancelSale: (saleId: string, reason: string) => void;
}

export const ReceiptHistoryModal: React.FC<ReceiptHistoryModalProps> = ({
  isOpen,
  onClose,
  sales,
  userRole,
  onCancelSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'todos' | 'efectivo' | 'tarjeta'>('todos');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  // Cancellation modal state
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen) return null;

  // Filter sales (newest sales always first)
  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          (s.folio ? s.folio.toString().includes(term) : false) ||
          (s.cashierName ? s.cashierName.toLowerCase().includes(term) : false) ||
          (s.items && s.items.some((it) => (it.name || '').toLowerCase().includes(term)));

        const matchesMethod =
          filterMethod === 'todos' || s.paymentMethod === filterMethod;

        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [sales, searchTerm, filterMethod]);

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;
    if (!cancelReason.trim()) {
      alert('Por favor ingresa el motivo de la cancelación o devolución.');
      return;
    }
    onCancelSale(saleToCancel.id, cancelReason.trim());
    setSaleToCancel(null);
    setCancelReason('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col h-[90vh]">
          {/* Header */}
          <div className="bg-[#1F4461] text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-[#9CC55B]" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">
                  Historial de Tickets y Devoluciones
                </h3>
                <p className="text-xs text-gray-300">
                  Reimprime comprobantes o realiza cancelaciones/devoluciones de inventario
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por # de Folio, producto o cajero..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F4461] outline-hidden"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMethod('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMethod === 'todos'
                    ? 'bg-[#1F4461] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Todos ({sales.length})
              </button>
              <button
                onClick={() => setFilterMethod('efectivo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterMethod === 'efectivo'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                onClick={() => setFilterMethod('tarjeta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  filterMethod === 'tarjeta'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Sales List Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredSales.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30 text-gray-400" />
                No se encontraron tickets con los filtros aplicados.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale) => {
                  const isCanceled = sale.status === 'cancelada';
                  return (
                    <div
                      key={sale.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCanceled
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#1F4461] bg-gray-100 px-2 py-0.5 rounded-md">
                            Folio #{sale.folio}
                          </span>
                          {isCanceled ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Cancelada / Devolución
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Cobrada
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(sale.date).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            @{sale.cashierName}
                          </span>
                        </div>

                        {/* Items breakdown list preview */}
                        <p className="text-xs text-gray-600 truncate max-w-xl">
                          {sale.items.map((it) => `${it.quantity}x ${it.name}`).join(' • ')}
                        </p>

                        {isCanceled && sale.canceledReason && (
                          <p className="text-xs text-rose-700 mt-1 italic font-medium">
                            Motivo de cancelación: {sale.canceledReason}
                          </p>
                        )}
                      </div>

                      {/* Right: Amounts & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
                        <div className="text-right">
                          <div className="text-base font-black font-mono text-[#1F4461]">
                            ${sale.total.toFixed(2)}
                          </div>
                          <span className="text-[10px] font-bold uppercase text-gray-500">
                            {sale.paymentMethod === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSaleForPrint(sale)}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                            title="Reimprimir Ticket"
                          >
                            <Printer className="w-4 h-4 text-[#1F4461]" />
                            <span className="hidden sm:inline">Ticket</span>
                          </button>

                          {!isCanceled && (
                            <button
                              onClick={() => setSaleToCancel(sale)}
                              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                              title="Cancelar venta y regresar stock a tienda"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span className="hidden sm:inline">Devolver</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thermal Ticket Modal for selected sale */}
      {selectedSaleForPrint && (
        <ThermalTicket
          sale={selectedSaleForPrint}
          onClose={() => setSelectedSaleForPrint(null)}
          onNewSale={() => setSelectedSaleForPrint(null)}
        />
      )}

      {/* Cancellation / Refund Confirm Modal */}
      {saleToCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#1F4461]">
                  Cancelar Ticket #{saleToCancel.folio}
                </h4>
                <p className="text-xs text-gray-500">Monto a devolver: ${saleToCancel.total.toFixed(2)}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Al confirmar esta devolución, los artículos vendidos se reintegrarán automáticamente al inventario físico de la papelería y se ajustará el saldo del arqueo de caja.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Motivo de la Cancelación / Devolución *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej. Cliente cambió de opinión / Producto equivocado / Defecto"
                  value={cancelReason || ''}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaleToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
