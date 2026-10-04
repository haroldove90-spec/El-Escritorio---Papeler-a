import React from 'react';
import { Sale } from '../../types';
import { Printer, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { getStoreConfig } from '../../services/storage';

interface ThermalTicketProps {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  sale,
  onClose,
  onNewSale,
}) => {
  const store = getStoreConfig();

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCanceled = sale.status === 'cancelada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header toolbar */}
        <div className={`p-4 flex items-center justify-between text-white ${isCanceled ? 'bg-rose-700' : 'bg-[#1F4461]'}`}>
          <div className="flex items-center gap-2">
            {isCanceled ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Ticket Cancelado / Devolución</h3>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#9CC55B]" />
                <h3 className="font-bold text-sm">Comprobante de Venta #{sale.folio}</h3>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50 flex justify-center">
          <div
            id="ticket-print-area"
            className="w-full max-w-[320px] bg-white p-4 shadow-sm border border-gray-200 text-xs font-mono text-gray-800 leading-tight"
          >
            {/* Canceled Watermark */}
            {isCanceled && (
              <div className="mb-2 p-2 bg-rose-50 border-2 border-dashed border-rose-500 rounded text-center">
                <p className="font-black text-rose-700 text-xs tracking-wider uppercase">*** TICKET CANCELADO ***</p>
                {sale.canceledReason && (
                  <p className="text-[10px] text-rose-600 mt-0.5">Motivo: {sale.canceledReason}</p>
                )}
              </div>
            )}

            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              {store.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-10 w-auto object-contain"
                  />
                </div>
              )}
              <p className="font-bold text-sm tracking-wider uppercase">{store.name}</p>
              {store.subtitle && <p className="text-[10px] text-gray-500">{store.subtitle}</p>}
              {store.rfc && <p className="text-[10px] text-gray-600 font-semibold">RFC: {store.rfc}</p>}
              {store.address && <p className="text-[10px] text-gray-500">{store.address}</p>}
              {store.phone && <p className="text-[10px] text-gray-500">Tel: {store.phone}</p>}
            </div>

            {/* Folio and metadata */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>FOLIO:</span>
                <span className="font-bold font-mono">#{sale.folio}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span className="uppercase">{sale.cashierName}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 mb-1">
                <span className="col-span-2">CANT</span>
                <span className="col-span-6">DESCRIPCIÓN</span>
                <span className="col-span-4 text-right">TOTAL</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 leading-tight">
                    <span className="col-span-2 font-bold">{item.quantity}</span>
                    <span className="col-span-6 truncate pr-1">
                      {item.name}
                      {item.packageMode === 'paquete' ? ' (Caja/Pq)' : ''}
                    </span>
                    <span className="col-span-4 text-right font-medium">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Discounts */}
            <div className="py-2 space-y-1 text-xs border-b border-dashed border-gray-400">
              {sale.discount && sale.discount > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>SUBTOTAL:</span>
                    <span>${(sale.originalTotal || sale.total + sale.discount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                    <span>DESCUENTO:</span>
                    <span>-${sale.discount.toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-black pt-1">
                <span>TOTAL:</span>
                <span className="text-[#1F4461]">${sale.total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span className="uppercase">FORMA DE PAGO:</span>
                <span className="font-bold uppercase">{sale.paymentMethod}</span>
              </div>

              {sale.paymentMethod === 'efectivo' && (
                <>
                  <div className="flex justify-between text-[11px]">
                    <span>EFECTIVO RECIBIDO:</span>
                    <span>${sale.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                    <span>CAMBIO:</span>
                    <span>${sale.change.toFixed(2)}</span>
                  </div>
                </>
              )}

              {sale.paymentMethod === 'tarjeta' && sale.cardReference && (
                <div className="flex justify-between text-[11px]">
                  <span>REF. TERMINAL:</span>
                  <span>**** {sale.cardReference}</span>
                </div>
              )}
            </div>

            {/* Footer message */}
            <div className="pt-3 text-center text-[10px] text-gray-500 space-y-1 whitespace-pre-line">
              <p className="font-semibold text-gray-700">{store.ticketFooter}</p>
              <p className="text-[9px] text-gray-400 pt-1">Sistema POS Papelería • Ais</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-sm shadow-md transition cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 py-3 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-bold text-sm shadow-md transition cursor-pointer active:scale-98"
          >
            Continuar (F9)
          </button>
        </div>
      </div>
    </div>
  );
};
