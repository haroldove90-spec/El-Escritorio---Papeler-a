import React, { useState } from 'react';
import { CashShift, CashMovement, Sale } from '../../types';
import {
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Lock,
  Unlock,
  History,
  Clock,
  User,
  CreditCard,
  Banknote,
  Receipt,
  FileCheck2,
} from 'lucide-react';

interface CashShiftModuleProps {
  activeShift: CashShift | null;
  shiftHistory: CashShift[];
  todaySales: Sale[];
  onOpenShift: (initialAmount: number, notes?: string) => void;
  onCloseShift: (shiftId: string, countedCash: number, notes?: string) => void;
  onAddCashMovement: (type: 'entrada' | 'retiro', amount: number, reason: string) => void;
}

export const CashShiftModule: React.FC<CashShiftModuleProps> = ({
  activeShift,
  shiftHistory,
  todaySales,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
}) => {
  const [activeTab, setActiveTab] = useState<'actual' | 'historial'>('actual');

  // Open Shift Form state
  const [initialAmountInput, setInitialAmountInput] = useState('400.00');
  const [openShiftNotes, setOpenShiftNotes] = useState('');

  // Cash Movement Modal state
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'entrada' | 'retiro'>('entrada');
  const [movementAmount, setMovementAmount] = useState('50.00');
  const [movementReason, setMovementReason] = useState('');

  // Corte Z (Close Shift) Modal state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closeShiftNotes, setCloseShiftNotes] = useState('');

  // Print view state for Corte X or Z
  const [printShiftData, setPrintShiftData] = useState<{ shift: CashShift; type: 'X' | 'Z' } | null>(null);

  // Compute live amounts for active shift
  const shiftSales = activeShift
    ? todaySales.filter((s) => s.cashShiftId === activeShift.id && s.status === 'completada')
    : [];

  const liveCashSales = shiftSales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((sum, s) => sum + s.total, 0);

  const liveCardSales = shiftSales
    .filter((s) => s.paymentMethod === 'tarjeta')
    .reduce((sum, s) => sum + s.total, 0);

  const liveCashIn = activeShift
    ? activeShift.movements
        .filter((m) => m.type === 'entrada')
        .reduce((sum, m) => sum + m.amount, 0)
    : 0;

  const liveCashOut = activeShift
    ? activeShift.movements
        .filter((m) => m.type === 'retiro')
        .reduce((sum, m) => sum + m.amount, 0)
    : 0;

  const initialAmount = activeShift ? activeShift.initialAmount : 0;
  const liveExpectedCash = initialAmount + liveCashSales + liveCashIn - liveCashOut;
  const liveTotalSales = liveCashSales + liveCardSales;

  // Handle Opening Cash Drawer
  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(initialAmountInput) || 0;
    if (amount < 0) {
      alert('El fondo inicial no puede ser negativo.');
      return;
    }
    onOpenShift(amount, openShiftNotes);
  };

  // Handle Movement Submit
  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(movementAmount) || 0;
    if (amount <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }
    if (!movementReason.trim()) {
      alert('Ingresa un motivo para el movimiento.');
      return;
    }
    onAddCashMovement(movementType, amount, movementReason);
    setIsMovementModalOpen(false);
    setMovementReason('');
  };

  // Handle Close Shift (Corte Z)
  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const counted = parseFloat(countedCashInput) || 0;
    onCloseShift(activeShift.id, counted, closeShiftNotes);
    setIsCloseModalOpen(false);
  };

  const countedVal = parseFloat(countedCashInput) || 0;
  const liveDifference = countedVal - liveExpectedCash;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
              Control de caja
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
              Apertura de turno, arqueo en vivo, gastos de caja chica y cierre definitivo
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('actual')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'actual'
                  ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Turno Actual</span>
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'historial'
                  ? 'bg-[#1F4461] text-white shadow-xs font-bold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial de Cortes ({shiftHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {activeTab === 'actual' ? (
          activeShift ? (
            /* ACTIVE SHIFT VIEW */
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Status Banner */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Unlock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#1F4461]">
                        Turno de Caja Abierto
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">
                        EN VIVO
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Iniciado:{' '}
                        {new Date(activeShift.openedAt).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Cajero: {activeShift.openedBy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Corte X, Corte Z, Entradas / Retiros */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setMovementType('entrada');
                      setIsMovementModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Entrada $</span>
                  </button>

                  <button
                    onClick={() => {
                      setMovementType('retiro');
                      setIsMovementModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Gasto / Retiro $</span>
                  </button>

                  <button
                    onClick={() =>
                      setPrintShiftData({
                        shift: {
                          ...activeShift,
                          salesCash: liveCashSales,
                          salesCard: liveCardSales,
                          cashIn: liveCashIn,
                          cashOut: liveCashOut,
                          expectedCash: liveExpectedCash,
                        },
                        type: 'X',
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-sm font-bold transition cursor-pointer"
                    title="Imprimir o ver Corte X Parcial"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Corte X (Parcial)</span>
                  </button>

                  <button
                    onClick={() => {
                      setCountedCashInput(liveExpectedCash.toFixed(2));
                      setIsCloseModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-sm font-extrabold shadow-md transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#9CC55B]" />
                    <span>Corte Z (Cerrar Día)</span>
                  </button>
                </div>
              </div>

              {/* Financial Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Expected Cash in Drawer */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1F4461] to-[#163248] text-white shadow-md">
                  <span className="text-xs sm:text-sm text-gray-300 uppercase font-extrabold tracking-wider block mb-1.5">
                    Efectivo Esperado en Caja
                  </span>
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#9CC55B]">
                    ${liveExpectedCash.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-300 mt-2.5 font-medium leading-relaxed">
                    Fondo (${initialAmount.toFixed(0)}) + Ventas (${liveCashSales.toFixed(0)}) + Entradas - Gastos
                  </p>
                </div>

                {/* Cash Sales */}
                <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1.5">
                    <span className="text-xs sm:text-sm font-bold uppercase text-gray-700">Ventas en Efectivo</span>
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-gray-900">
                    ${liveCashSales.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Cobrado directo en caja</p>
                </div>

                {/* Card Sales */}
                <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1.5">
                    <span className="text-xs sm:text-sm font-bold uppercase text-gray-700">Ventas con Tarjeta</span>
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-gray-900">
                    ${liveCardSales.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Terminal bancaria</p>
                </div>

                {/* Total Revenue */}
                <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1.5">
                    <span className="text-xs sm:text-sm font-bold uppercase text-gray-700">Total Vendido en Turno</span>
                    <Receipt className="w-5 h-5 text-[#F3C16C]" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-[#1F4461]">
                    ${liveTotalSales.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2 font-medium">{shiftSales.length} tickets emitidos</p>
                </div>
              </div>

              {/* Cash Movements Table (Entradas y Retiros de caja chica) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#1F4461]" />
                    <h4 className="font-bold text-xs uppercase text-gray-800 tracking-wider">
                      Movimientos de Caja Chica en este Turno
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500">
                    Entradas: +${liveCashIn.toFixed(2)} | Retiros: -${liveCashOut.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead className="bg-gray-50/60 border-b border-gray-100 text-gray-500 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Hora</th>
                        <th className="py-2.5 px-4">Tipo</th>
                        <th className="py-2.5 px-4">Motivo / Descripción</th>
                        <th className="py-2.5 px-4">Usuario</th>
                        <th className="py-2.5 px-4 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeShift.movements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No se han registrado entradas ni retiros manuales en este turno.
                          </td>
                        </tr>
                      ) : (
                        activeShift.movements.map((mov) => (
                          <tr key={mov.id} className="hover:bg-gray-50 transition">
                            <td className="py-2.5 px-4 font-mono text-gray-500">
                              {new Date(mov.timestamp).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-4">
                              {mov.type === 'entrada' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <ArrowDownRight className="w-3 h-3" />
                                  Entrada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Retiro / Gasto
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-gray-800">{mov.reason}</td>
                            <td className="py-2.5 px-4 text-gray-500">{mov.user}</td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono font-bold ${
                                mov.type === 'entrada' ? 'text-emerald-700' : 'text-amber-800'
                              }`}
                            >
                              {mov.type === 'entrada' ? '+' : '-'}${mov.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* NO ACTIVE SHIFT: PROMPT TO OPEN CASH DRAWER */
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#1F4461] mb-1">Caja Cerrada</h2>
              <p className="text-xs text-gray-500 mb-6">
                Para iniciar la jornada y poder cobrar ventas, ingresa el fondo inicial de cambio:
              </p>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fondo Inicial de Caja ($):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      step="10.00"
                      required
                      value={initialAmountInput || ''}
                      onChange={(e) => setInitialAmountInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#1F4461] text-xl font-mono font-bold outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Monto con el que abres para dar cambio (ej. $400.00 en monedas y billetes)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Notas de apertura (opcional):
                  </label>
                  <input
                    type="text"
                    value={openShiftNotes || ''}
                    onChange={(e) => setOpenShiftNotes(e.target.value)}
                    placeholder="Ej. Turno matutino con monedas surtidas"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-extrabold text-sm shadow-md transition cursor-pointer active:scale-98"
                >
                  Abrir Turno de Caja
                </button>
              </form>
            </div>
          )
        ) : (
          /* SHIFT HISTORY TAB */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Fecha y Horario</th>
                    <th className="py-3 px-4">Cajero</th>
                    <th className="py-3 px-4 text-right">Fondo Inicial</th>
                    <th className="py-3 px-4 text-right">Venta Efectivo</th>
                    <th className="py-3 px-4 text-right">Venta Tarjeta</th>
                    <th className="py-3 px-4 text-right">Esperado</th>
                    <th className="py-3 px-4 text-right">Contado</th>
                    <th className="py-3 px-4 text-center">Diferencia</th>
                    <th className="py-3 px-4 text-center">Reporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400">
                        No hay historial de turnos cerrados todavía.
                      </td>
                    </tr>
                  ) : (
                    shiftHistory.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-800">
                            {new Date(shift.openedAt).toLocaleDateString('es-MX', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(shift.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            {shift.closedAt
                              ? ` - ${new Date(shift.closedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
                              : ' (Abierta)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{shift.openedBy}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          ${shift.initialAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                          ${shift.salesCash.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">
                          ${shift.salesCard.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          ${shift.expectedCash.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {shift.countedCash !== undefined ? `$${shift.countedCash.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {shift.difference !== undefined ? (
                            shift.difference === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Exacto ($0)
                              </span>
                            ) : shift.difference > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                +${shift.difference.toFixed(2)} Sobrante
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                -${Math.abs(shift.difference).toFixed(2)} Faltante
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setPrintShiftData({ shift, type: 'Z' })}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F4461] hover:bg-gray-100 transition"
                            title="Ver e Imprimir Ticket Corte Z"
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CASH MOVEMENT MODAL (Entrada / Retiro) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {movementType === 'entrada' ? 'Entrada de Efectivo' : 'Retiro / Gasto de Caja Chica'}
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Monto ($):</label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#1F4461] text-base font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Concepto:</label>
                <input
                  type="text"
                  required
                  value={movementReason || ''}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder={
                    movementType === 'entrada'
                      ? 'Ej. Cambio de billete por monedas en tienda vecina'
                      : 'Ej. Pago garrafón de agua o taxi de emergencia'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                    movementType === 'entrada'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORTE Z (CIERRE DEFINITIVO) MODAL */}
      {isCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Corte Z — Cierre Definitivo del Turno</h3>
                <p className="text-xs text-gray-300">Arqueo físico de caja y cuadre de efectivo</p>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="p-5 space-y-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fondo Inicial:</span>
                  <span className="font-mono font-semibold">${initialAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) Ventas en Efectivo:</span>
                  <span className="font-mono font-bold text-emerald-700">+${liveCashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(+) Entradas de Efectivo:</span>
                  <span className="font-mono text-emerald-600">+${liveCashIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">(-) Gastos / Retiros:</span>
                  <span className="font-mono text-amber-700">-${liveCashOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-[#1F4461]">
                  <span>Efectivo Esperado en Caja:</span>
                  <span className="font-mono text-base">${liveExpectedCash.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Efectivo Real Contado en Caja ($):
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={countedCashInput || ''}
                  onChange={(e) => setCountedCashInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#1F4461] text-xl font-mono font-black outline-none"
                />
              </div>

              {/* Live difference indicator */}
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
                  liveDifference === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : liveDifference > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <span>
                  {liveDifference === 0
                    ? '✓ Cuadre Exacto'
                    : liveDifference > 0
                    ? 'Sobrante de Caja'
                    : 'Faltante de Caja'}
                  :
                </span>
                <span className="text-base font-mono">
                  {liveDifference >= 0 ? `+$${liveDifference.toFixed(2)}` : `-$${Math.abs(liveDifference).toFixed(2)}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observaciones de cierre:</label>
                <textarea
                  rows={2}
                  value={closeShiftNotes || ''}
                  onChange={(e) => setCloseShiftNotes(e.target.value)}
                  placeholder="Detalles sobre billetes o entrega de dinero a administración..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#9CC55B]" />
                  <span>Confirmar y Cerrar Turno</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CORTE X / Z MODAL */}
      {printShiftData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1F4461] text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-xs">
                Ticket de Corte {printShiftData.type} ({printShiftData.type === 'X' ? 'Parcial' : 'Final'})
              </span>
              <button
                onClick={() => setPrintShiftData(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50 flex justify-center">
              <div
                id="ticket-print-area"
                className="w-full max-w-[300px] bg-white p-4 shadow-sm border border-gray-200 text-xs font-mono text-gray-800 leading-tight space-y-3"
              >
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  <p className="font-bold text-sm uppercase">Papelería El Escritorio</p>
                  <p className="text-[10px] text-gray-500">
                    REPORTE DE CORTE {printShiftData.type}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {new Date().toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    CAJERO: {printShiftData.shift.openedBy}
                  </p>
                </div>

                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between">
                    <span>FONDO INICIAL:</span>
                    <span>${printShiftData.shift.initialAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>VENTAS EFECTIVO:</span>
                    <span>+${printShiftData.shift.salesCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-800 font-bold">
                    <span>VENTAS TARJETA:</span>
                    <span>+${printShiftData.shift.salesCard.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ENTRADAS EFECTIVO:</span>
                    <span>+${printShiftData.shift.cashIn.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>RETIROS / GASTOS:</span>
                    <span>-${printShiftData.shift.cashOut.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs pb-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between font-bold">
                    <span>EFECTIVO ESPERADO:</span>
                    <span className="text-[#1F4461]">${printShiftData.shift.expectedCash.toFixed(2)}</span>
                  </div>
                  {printShiftData.shift.countedCash !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span>EFECTIVO CONTADO:</span>
                        <span>${printShiftData.shift.countedCash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>DIFERENCIA:</span>
                        <span>${(printShiftData.shift.difference || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center text-[10px] text-gray-400 pt-2">
                  <p>*** Fin de Reporte de Caja ***</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setPrintShiftData(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
