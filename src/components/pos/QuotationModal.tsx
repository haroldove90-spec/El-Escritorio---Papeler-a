import React, { useState } from 'react';
import { CartItem, Quotation } from '../../types';
import { FileSpreadsheet, Printer, X, CheckCircle, Calendar, User, School, Sparkles } from 'lucide-react';
import { getStoreConfig, saveQuotations, getQuotations } from '../../services/storage';

interface QuotationModalProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onClearCart?: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  cart,
  isOpen,
  onClose,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [schoolOrGrade, setSchoolOrGrade] = useState('');
  const [notes, setNotes] = useState('Presupuesto de útiles escolares sujeto a disponibilidad de existencias.');
  const [validityDays, setValidityDays] = useState(15);
  const [generatedQuotation, setGeneratedQuotation] = useState<Quotation | null>(null);

  const store = getStoreConfig();

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, it) => sum + it.subtotal, 0);
  const total = subtotal;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor escribe el nombre del cliente o escuela');
      return;
    }

    const quotes = getQuotations();
    const newFolio = quotes.length > 0 ? Math.max(...quotes.map((q) => q.folio)) + 1 : 2001;

    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      folio: newFolio,
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      schoolOrGrade: schoolOrGrade.trim() || undefined,
      notes: notes.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: 0,
      total,
      validityDays,
    };

    saveQuotations([newQuote, ...quotes]);
    setGeneratedQuotation(newQuote);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#9CC55B]" />
            <h3 className="font-bold text-base">
              {generatedQuotation ? `Cotización #${generatedQuotation.folio}` : 'Generar Cotización / Presupuesto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {!generatedQuotation ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Genera un presupuesto formal para listas de útiles escolares o pedidos para oficinas sin descontar mercancía de tu inventario ni registrar movimiento en caja.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Cliente o Padre de Familia *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sra. Carmen López"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F4461] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Colegio / Grado (Opcional)
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Ej. Primaria Benito Juárez - 3°A"
                      value={schoolOrGrade}
                      onChange={(e) => setSchoolOrGrade(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F4461] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Vigencia de Precios
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <select
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F4461] outline-hidden bg-white"
                    >
                      <option value={7}>7 días naturales</option>
                      <option value={15}>15 días naturales</option>
                      <option value={30}>30 días naturales</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observaciones o Condiciones
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F4461] outline-hidden"
                />
              </div>

              {/* Items Preview */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                  <span>Artículos a Cotizar ({cart.length})</span>
                  <span className="text-[#1F4461] font-mono font-black text-sm">${total.toFixed(2)}</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                  {cart.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-gray-600">
                      <span className="truncate pr-2">
                        {it.quantity}x {it.name}
                      </span>
                      <span className="font-mono shrink-0">${it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Generar Cotización
                </button>
              </div>
            </form>
          ) : (
            /* Printable Preview */
            <div className="space-y-4">
              <div
                id="ticket-print-area"
                className="w-full bg-white p-4 shadow-xs border border-gray-200 text-xs font-mono text-gray-800 leading-tight"
              >
                <div className="text-center pb-3 border-b border-dashed border-gray-400">
                  <p className="font-black text-sm tracking-wider uppercase">{store.name}</p>
                  <p className="text-[10px] text-gray-500 font-sans uppercase font-bold text-blue-800 tracking-wider">
                    *** PRESUPUESTO / COTIZACIÓN ***
                  </p>
                  {store.phone && <p className="text-[10px] text-gray-500">Tel: {store.phone}</p>}
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>COTIZACIÓN:</span>
                    <span className="font-bold">#{generatedQuotation.folio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>{new Date(generatedQuotation.date).toLocaleDateString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span className="font-bold uppercase truncate max-w-[170px]">{generatedQuotation.customerName}</span>
                  </div>
                  {generatedQuotation.schoolOrGrade && (
                    <div className="flex justify-between">
                      <span>COLEGIO/GRADO:</span>
                      <span className="truncate max-w-[170px]">{generatedQuotation.schoolOrGrade}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-blue-700 font-bold">
                    <span>VIGENCIA:</span>
                    <span>{generatedQuotation.validityDays} días</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-gray-500 mb-1">
                    <span className="col-span-2">CANT</span>
                    <span className="col-span-7">PRODUCTO</span>
                    <span className="col-span-3 text-right">TOTAL</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {generatedQuotation.items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 leading-tight">
                        <span className="col-span-2 font-bold">{it.quantity}</span>
                        <span className="col-span-7 truncate pr-1">{it.name}</span>
                        <span className="col-span-3 text-right">${it.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between text-base font-black text-[#1F4461]">
                    <span>TOTAL PRESUPUESTO:</span>
                    <span>${generatedQuotation.total.toFixed(2)}</span>
                  </div>
                </div>

                {generatedQuotation.notes && (
                  <div className="pt-2 text-[10px] text-gray-500 italic">
                    Nota: {generatedQuotation.notes}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Cotización</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearCart?.();
                    onClose();
                  }}
                  className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
