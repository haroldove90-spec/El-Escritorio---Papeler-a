import React, { useState } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  Shield,
  User,
  CheckCircle2,
  Barcode,
  Keyboard,
  Coins,
  Receipt,
  FileSpreadsheet,
  PauseCircle,
  Percent,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  FileText,
  Building2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getStoreConfig } from '../../services/storage';

interface UserManualModuleProps {
  userRole: string | null;
}

export const UserManualModule: React.FC<UserManualModuleProps> = ({ userRole }) => {
  // Default to user's role or 'cajero' if not admin
  const [activeTab, setActiveTab] = useState<'cajero' | 'admin' | 'checklist'>(
    userRole === 'Admin' ? 'admin' : 'cajero'
  );

  const store = getStoreConfig();

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Bar / Screen Header */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1F4461] text-[#9CC55B] flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1F4461] tracking-tight">
                  Manual de Usuario & Operación
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                  Rol Actual: {userRole || 'Operador'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Guía interactiva de consulta paso a paso y descarga en PDF oficial
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab switchers */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                onClick={() => setActiveTab('cajero')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'cajero'
                    ? 'bg-[#1F4461] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4 text-[#9CC55B]" />
                <span>Manual Cajero</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#1F4461] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <Shield className="w-4 h-4 text-[#F3C16C]" />
                <span>Manual Admin</span>
              </button>

              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'checklist'
                    ? 'bg-[#1F4461] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Ficha Comercial</span>
              </button>
            </div>

            {/* Download PDF / Print button */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer active:scale-95 shrink-0"
              title="Descargar este manual en formato PDF o imprimirlo"
            >
              <Download className="w-4 h-4" />
              <span>Descargar en PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div id="printable-manual" className="max-w-4xl mx-auto space-y-6">
          {/* Print-Only Official Cover Header */}
          <div className="hidden print:block pb-4 mb-4 border-b-2 border-[#1F4461]">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-[#1F4461] tracking-tight uppercase">
                  {store.name}
                </h1>
                <p className="text-xs text-gray-600 font-medium">{store.subtitle}</p>
                <p className="text-[11px] text-gray-500">RFC: {store.rfc} • Tel: {store.phone} • {store.address}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F4461] bg-gray-100 px-3 py-1 rounded-md">
                  Documento Oficial de Operación
                </span>
                <p className="text-[10px] text-gray-400 mt-1">Generado: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: MANUAL DE OPERACIONES PARA CAJERO / VENDEDOR */}
          {/* ============================================================ */}
          {activeTab === 'cajero' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#1F4461] to-[#163248] text-white shadow-md print:bg-none print:text-gray-900 print:p-0 print:border-b print:pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9CC55B] text-[#1F4461]">
                    Módulo Operativo
                  </span>
                  <span className="text-xs text-gray-300">Nivel de Acceso: Cajero / Mostrador</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-[#1F4461]">
                  Manual Operativo de Mostrador & Punto de Venta
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 print:text-gray-600 mt-1">
                  Guía paso a paso para apertura de caja, escaneo de artículos, cobro rápido, servicios, presupuestos y arqueo de turno.
                </p>
              </div>

              {/* Step 1: Apertura de Caja */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-sm">
                    1
                  </span>
                  <h3>Apertura Obligatoria de Turno de Caja</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  El sistema bloquea las ventas si la caja no ha sido formalmente abierta para garantizar que todo el dinero esté justificado.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <strong className="block text-gray-800 font-bold mb-1">¿Cómo abrir el turno?</strong>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600">
                      <li>Haz clic en el botón superior <strong>"Abrir Turno de Caja"</strong>.</li>
                      <li>Ingresa el <strong>Fondo Inicial</strong> (cambio recibido en monedas y billetes).</li>
                      <li>Escribe notas iniciales si aplica y presiona <strong>"Confirmar Apertura"</strong>.</li>
                    </ol>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-950">
                    <strong className="block font-bold mb-1">💡 Consejo del Turno:</strong>
                    Cuenta bien las monedas de $1, $2, $5 y $10. Todo lo que registres como fondo inicial servirá de base exacta para el arqueo al final del día.
                  </div>
                </div>
              </div>

              {/* Step 2: Escaneo & Atajos de Teclado */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-mono text-sm">
                    2
                  </span>
                  <h3>Venta Rápida por Escáner y Atajos de Teclado</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Puedes operar el mostrador sin usar el mouse para agilizar el despacho de clientes en horas pico:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Tecla</th>
                        <th className="py-2 px-3">Acción Rápida</th>
                        <th className="py-2 px-3">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">Escáner de Barras</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Lectura Automática</td>
                        <td className="py-2 px-3 text-gray-600">Apunta la pistola al código de barras del producto; se agrega al carrito al instante.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">F2</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Cobrar Venta</td>
                        <td className="py-2 px-3 text-gray-600">Abre la ventana de cobro para ingresar efectivo o tarjeta.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">F4</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Buscador Rápido</td>
                        <td className="py-2 px-3 text-gray-600">Pone el cursor en la barra para buscar por nombre (ej. "cuaderno sico").</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">F8</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Botonera de Servicios</td>
                        <td className="py-2 px-3 text-gray-600">Muestra/oculta las copias, impresiones y enmicados.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">F9</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Limpiar / Nuevo</td>
                        <td className="py-2 px-3 text-gray-600">Vacia el ticket actual para comenzar una nueva venta limpia.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-bold text-[#1F4461]">ESC</td>
                        <td className="py-2 px-3 font-bold text-gray-800">Cerrar Ventana</td>
                        <td className="py-2 px-3 text-gray-600">Cierra cualquier ventana modal o cancela el cobro activo.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Venta por Paquete / Mayoreo y Servicios */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-mono text-sm">
                    3
                  </span>
                  <h3>Venta por Pieza, Caja Completa (Mayoreo) y Servicios</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <strong className="text-gray-900 font-bold block">📦 Venta por Paquete / Caja:</strong>
                    <p className="text-gray-600 leading-relaxed">
                      Si el cliente compra una caja cerrada de lápices o plumones, haz clic en el botón <strong>"Caja ($XX)"</strong> en lugar de marcar pieza por pieza. El sistema aplicará el precio mayoreo y descontará las unidades exactas de inventario.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <strong className="text-gray-900 font-bold block">📄 Cobro de Servicios (Copias e Impresiones):</strong>
                    <p className="text-gray-600 leading-relaxed">
                      En la barra superior presiona <strong>"Servicios (F8)"</strong>. Selecciona Copia B/N, Color, Engargolado o Enmicado. Puedes ajustar las páginas/unidades en el carrito con los botones <strong>(+)</strong> y <strong>(-)</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Ventas en Espera & Cotizaciones */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-mono text-sm">
                    4
                  </span>
                  <h3>Pausar Ventas ("En Espera") & Cotizaciones de Útiles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <PauseCircle className="w-4 h-4 text-amber-700" />
                      <span>¿El cliente olvidó algo en los pasillos?</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      No borres el carrito ni hagas esperar la fila: presiona <strong>"Pausar"</strong> en la cabecera del ticket. El sistema guarda la venta en la bandeja <strong>"En Espera"</strong>. Atiende al siguiente cliente y luego presiona <strong>"Retomar"</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                      <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                      <span>Cotizaciones de Listas Escolares:</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Cuando un padre de familia pida presupuesto de su lista escolar, agrega los artículos y presiona <strong>"Cotizar"</strong>. Escribe su nombre, colegio y vigencia. Se imprimirá un presupuesto formal sin descontar inventario ni cobrar dinero.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5: Cobro con Descuentos, Cambio y Reimpresión */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono text-sm">
                    5
                  </span>
                  <h3>Cobro, Descuentos, Ticket y Reimpresiones</h3>
                </div>
                <ul className="space-y-2 text-xs text-gray-600 leading-relaxed list-disc list-inside">
                  <li><strong>Aplicar Descuentos:</strong> Al presionar Cobrar (F2), puedes marcar la casilla <em>"Aplicar Descuento"</em> para ingresar un porcentaje (% por lista completa) o rebaja fija en pesos ($).</li>
                  <li><strong>Cálculo de Cambio:</strong> Al escribir el dinero recibido o pulsar los billetes rápidos ($100, $200, $500), la pantalla muestra el <strong>cambio a entregar</strong> en letras grandes y lo imprime en el ticket.</li>
                  <li><strong>Reimpresión de Tickets:</strong> En la barra superior haz clic en <strong>"Tickets"</strong>. Puedes buscar cualquier folio pasado y presionar <strong>"Ticket"</strong> para volver a imprimirlo en caso de extravío.</li>
                </ul>
              </div>

              {/* Step 6: Arqueo X y Cierre Z */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-mono text-sm">
                    6
                  </span>
                  <h3>Corte de Turno (Corte X y Corte Z)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <strong className="block text-gray-900 font-bold mb-1">Corte X (Arqueo Parcial en Vivo):</strong>
                    <p className="text-gray-600">
                      En el botón de saldo en la barra superior puedes consultar en cualquier momento cuánto dinero debe haber en el cajón sin cerrar el turno.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <strong className="block text-gray-900 font-bold mb-1">Corte Z (Cierre Definitivo):</strong>
                    <p className="text-gray-600">
                      Al terminar tu jornada, presiona <strong>"Cerrar Turno (Corte Z)"</strong>. Realiza el conteo físico de billetes y monedas. El sistema calculará automáticamente si el arqueo es exacto o si existe faltante/sobrante para auditoría.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MANUAL DE ADMINISTRACIÓN Y SUPERVISIÓN (ADMIN) */}
          {/* ============================================================ */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#163248] to-[#1F4461] text-white shadow-md print:bg-none print:text-gray-900 print:p-0 print:border-b print:pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3C16C] text-[#1F4461]">
                    Módulo de Dirección & Auditoría
                  </span>
                  <span className="text-xs text-gray-300">Nivel de Acceso: Administrador Propietario</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-[#1F4461]">
                  Manual de Administración, Finanzas & Auditoría
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 print:text-gray-600 mt-1">
                  Control en tiempo real, gestión de inventario, compras a proveedores, cancelación de tickets y reportes financieros en Excel.
                </p>
              </div>

              {/* Section 1: Monitoreo en Tiempo Real */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3>1. Supervisión de Ventas en Vivo (Multi-dispositivo)</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Gracias a la conexión cloud con <strong>Supabase Realtime</strong>, el Administrador puede tener abierta su sesión en su laptop de oficina o teléfono celular y ver en tiempo real cada venta cobrada por los cajeros:
                </p>
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1.5">
                  <p>✓ <strong>Aviso sonoro y notificación visual:</strong> En cuanto un cajero cobra, suena un suave aviso y aparece la tarjeta con Folio, Cajero y Monto.</p>
                  <p>✓ <strong>Sincronización de caja:</strong> El saldo esperado del turno se actualiza al instante sin tener que recargar la página.</p>
                </div>
              </div>

              {/* Section 2: Cancelación de Tickets & Devoluciones */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  <h3>2. Cancelaciones de Tickets y Devoluciones con Auditoría</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Para evitar fugas de dinero o desajustes de stock cuando un cliente devuelve mercancía:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <li>Entra al <strong>"Historial de Tickets"</strong> (en el POS o en el módulo Reportes).</li>
                  <li>Localiza el ticket por número de folio o nombre del cajero.</li>
                  <li>Presiona el botón <strong>"Devolver / Cancelar"</strong>.</li>
                  <li>Ingresa el <strong>motivo obligatorio</strong> (ej. <em>"Cuaderno dañado por fábrica"</em>).</li>
                  <li>El sistema <strong>reintegrará las piezas al inventario</strong> físico y <strong>descontará el monto del arqueo de caja</strong>.</li>
                </ol>
              </div>

              {/* Section 3: Inventario & Compras */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <Package className="w-5 h-5 text-[#1F4461]" />
                  <h3>3. Control de Catálogo, Alertas de Stock & Compras</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <strong className="text-gray-900 font-bold block">📦 Inventario y Alertas:</strong>
                    <p className="text-gray-600 leading-relaxed">
                      Configura el <strong>stock mínimo</strong> en cada artículo. Cuando las existencias bajen de ese límite, aparecerá un indicador naranja para pedir mercancía antes de que se agote.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <strong className="text-gray-900 font-bold block">🚚 Compras a Proveedores:</strong>
                    <p className="text-gray-600 leading-relaxed">
                      Al recibir pedidos con factura o remisión, regístralas en <strong>"Compras"</strong>. El sistema sumará el stock automáticamente y actualizará el costo unitario de compra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Reportes Financieros y Excel */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h3>4. Rentabilidad, "Productos Muertos" y Exportación a Excel</h3>
                </div>
                <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
                  <p>
                    • <strong>Margen Bruto Real:</strong> El módulo de Reportes calcula la ganancia real descontando el costo exacto de cada artículo vendido.
                  </p>
                  <p>
                    • <strong>Detección de Productos Muertos:</strong> Identifica automáticamente qué productos tienen meses parados en anaquel sin rotación y cuánto dinero tienes atorado para crear promociones y recuperar liquidez.
                  </p>
                  <p>
                    • <strong>Exportar a Excel (CSV):</strong> Presiona <strong>"Excel Ventas"</strong> o <strong>"Excel Stock"</strong> para descargar hojas de cálculo compatibles con Microsoft Excel y Google Sheets para tu contador.
                  </p>
                </div>
              </div>

              {/* Section 5: Configuración del Ticket & Datos Fiscales */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break">
                <div className="flex items-center gap-2.5 text-[#1F4461] font-black text-base mb-3">
                  <Building2 className="w-5 h-5 text-[#1F4461]" />
                  <h3>5. Personalización de Datos Fiscales del Negocio</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  En la cabecera del sistema pulsa el botón <strong>"Ticket"</strong> para editar el nombre de la papelería, RFC, dirección, teléfono, logo y mensaje de agradecimiento sin tener que alterar el código.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: FICHA TÉCNICA COMERCIAL & CHECKLIST OFICIAL */}
          {/* ============================================================ */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-[#1F4461] text-white shadow-md print:bg-none print:text-gray-900 print:p-0 print:border-b print:pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-900">
                    Ficha Técnica Comercial
                  </span>
                  <span className="text-xs text-gray-200">Aprobación & Entrega de Software</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-[#1F4461]">
                  Ficha Técnica de Características & Entregables
                </h2>
                <p className="text-xs sm:text-sm text-gray-200 print:text-gray-600 mt-1">
                  Documento formal para validación de especificaciones técnicas y entrega de solución al cliente final.
                </p>
              </div>

              {/* Table of Roles & Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Role: Cajero */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="w-5 h-5 text-[#1F4461]" />
                    <h3 className="font-extrabold text-sm text-[#1F4461] uppercase tracking-wider">
                      Módulo Cajero / Mostrador
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Punto de Venta con Lector de Barras:</strong> Escaneo continuo y compatible con lectores USB y Bluetooth.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Atajos de Teclado:</strong> F2 (Cobro), F4 (Buscar), F8 (Servicios), F9 (Limpiar) y ESC.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Venta por Pieza y Mayoreo:</strong> Botón rápido de venta por caja/paquete cerrado.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Servicios de Papelería:</strong> Teclado táctil para copias, impresiones y encuadernados.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pausar Carrito (En Espera):</strong> Permite atender a otro cliente y retomar ventas en pausa.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Cotizaciones de Útiles:</strong> Genera presupuestos formales con vigencia para colegios.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Descuentos en Mostrador:</strong> Descuento en porcentaje (%) o cantidad fija ($).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Caja Chica & Cortes:</strong> Arqueo en vivo (Corte X) y Cierre con balance (Corte Z).</span>
                    </li>
                  </ul>
                </div>

                {/* Role: Admin */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs print-avoid-break space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Shield className="w-5 h-5 text-[#1F4461]" />
                    <h3 className="font-extrabold text-sm text-[#1F4461] uppercase tracking-wider">
                      Módulo Administrador / Gerente
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Sincronización en Tiempo Real:</strong> Recibe ventas en vivo en laptop o celular vía Supabase Realtime.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Cancelaciones & Devoluciones:</strong> Ajuste automático de stock físico y salida de dinero en caja.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Control de Inventario:</strong> Catálogo con stock crítico, alertas y ajustes por merma.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Compras a Proveedores:</strong> Facturas de entradas con cálculo de costo promedio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Análisis de Ganancias:</strong> Margen bruto real, Top 10 más vendidos y "Productos Muertos".</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Exportación a Excel / CSV:</strong> Descarga instantánea de ventas y catálogo completo.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Ticket Personalizable:</strong> Edición de RFC, dirección, logo y mensaje de pie de ticket.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Funcionamiento Offline & PWA:</strong> Instalable en Windows, macOS, Android e iOS.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Technical Specifications Footer Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs text-xs space-y-2 print-avoid-break">
                <div className="flex items-center gap-2 font-bold text-[#1F4461]">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Especificaciones Técnicas de Implementación:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-gray-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Arquitectura</span>
                    <span className="font-semibold text-gray-800">React 18 + TypeScript + Vite</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Base de Datos</span>
                    <span className="font-semibold text-gray-800">PostgreSQL (Supabase Cloud)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Impresión</span>
                    <span className="font-semibold text-gray-800">Térmica 58mm / 80mm ESC/POS</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Seguridad</span>
                    <span className="font-semibold text-gray-800">RBAC (Roles Seguros)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Institutional Print Footer */}
          <div className="hidden print:block pt-6 mt-6 border-t border-gray-300 text-center text-[10px] text-gray-500">
            <p className="font-bold text-gray-700">{store.name} • Sistema de Gestión Comercial y Punto de Venta</p>
            <p>Este documento es confidencial y para uso exclusivo del personal operativo y directivo autorizado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
