import React, { useState } from 'react';
import {
  Trash2,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  Server,
  ShieldAlert,
} from 'lucide-react';
import {
  isSampleDataCleared,
  clearAllSampleData,
  restoreSampleData,
} from '../../services/storage';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  clearSupabaseTables,
} from '../../services/supabaseClient';
import { SupabaseConfig } from '../../types';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const [sampleCleared, setSampleCleared] = useState(isSampleDataCleared());

  // Supabase states
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [supabaseStatus, setSupabaseStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isClearingSupabase, setIsClearingSupabase] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  // Clear sample data handler
  const handleClearSampleData = () => {
    if (
      confirm(
        '¿Estás seguro de que deseas borrar todos los datos de muestra del sistema? Esta acción dejará las tablas vacías para ingresar los productos y ventas reales de tu papelería, y el navegador no volverá a cargar los datos de prueba.'
      )
    ) {
      clearAllSampleData();
      setSampleCleared(true);
      onDataReset();
    }
  };

  // Restore sample data handler
  const handleRestoreSampleData = () => {
    if (confirm('¿Deseas restaurar los datos de demostración de papelería para probar el sistema?')) {
      restoreSampleData();
      setSampleCleared(false);
      onDataReset();
    }
  };

  // Test and save Supabase config
  const handleSaveAndTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const result = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
      setSupabaseStatus(result);
      if (result.success) {
        saveSupabaseConfig({
          ...supabaseConfig,
          isConnected: true,
        });
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // Clear Supabase remote tables
  const handleClearSupabase = async () => {
    if (
      !confirm(
        '⚠️ ATENCIÓN: Se eliminarán todos los registros almacenados en las tablas de tu proyecto Supabase (products, sales, sale_items, cash_shifts, purchases). ¿Deseas proceder?'
      )
    ) {
      return;
    }

    setIsClearingSupabase(true);
    try {
      const res = await clearSupabaseTables();
      setSupabaseStatus(res);
      if (res.success) {
        alert('Se han borrado los registros de Supabase correctamente.');
      }
    } finally {
      setIsClearingSupabase(false);
    }
  };

  const sqlSchemaText = `-- Esquema recomendado para Supabase / PostgreSQL (Papelería El Escritorio)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit_type TEXT NOT NULL DEFAULT 'pieza',
  package_units INT DEFAULT 1,
  package_cost_price NUMERIC(10,2),
  package_sale_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opened_by TEXT NOT NULL,
  closed_by TEXT,
  initial_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  sales_cash NUMERIC(10,2) DEFAULT 0,
  sales_card NUMERIC(10,2) DEFAULT 0,
  expected_cash NUMERIC(10,2) DEFAULT 0,
  counted_cash NUMERIC(10,2),
  difference NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'abierta'
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  folio INT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  total NUMERIC(10,2) NOT NULL,
  cost_total NUMERIC(10,2) NOT NULL,
  profit NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  cash_received NUMERIC(10,2),
  change NUMERIC(10,2),
  card_reference TEXT,
  cash_shift_id TEXT REFERENCES cash_shifts(id),
  cashier_name TEXT,
  status TEXT DEFAULT 'completada'
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  supplier TEXT NOT NULL,
  invoice_number TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  total NUMERIC(10,2) NOT NULL,
  notes TEXT
);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#9CC55B]" />
            <div>
              <h3 className="font-bold text-base">Gestión de Datos & Supabase</h3>
              <p className="text-xs text-gray-300">Borrado de datos de muestra y configuración de nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: SAMPLE DATA CONTROL */}
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-700 shrink-0 mt-0.5">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-red-950">
                    Borrar Datos de Muestra del Sistema
                  </h4>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    Elimina todos los productos de prueba, ventas simuladas y registros de demostración.
                    Activa la bandera permanente en el navegador para que <strong>nunca vuelvan a mostrarse</strong> al recargar la aplicación, dejando el sistema en blanco listo para tu inventario real.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-red-200/70">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-gray-600">Estado actual:</span>
                {sampleCleared ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    ✓ Datos de muestra borrados (Sistema Limpio)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                    Datos de muestra activos
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!sampleCleared ? (
                  <button
                    onClick={handleClearSampleData}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar Datos de Muestra</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRestoreSampleData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restaurar datos de prueba</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: SUPABASE CONFIGURATION */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#1F4461]" />
                <h4 className="font-bold text-sm text-[#1F4461]">
                  Conexión con Supabase (PostgreSQL)
                </h4>
              </div>
              <button
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className="text-xs font-bold text-[#1F4461] hover:underline cursor-pointer"
              >
                {showSqlSchema ? 'Ocultar SQL' : 'Ver Esquema SQL'}
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Conecta tu proyecto de Supabase para respaldar tus productos, tickets y cortes en la nube, y vaciar registros remotos con un solo clic.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value.trim() })}
                  placeholder="https://xyzabcdefg.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Supabase Anon Key:
                </label>
                <input
                  type="password"
                  value={supabaseConfig.anonKey}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value.trim() })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                />
              </div>
            </div>

            {/* Supabase status indicator */}
            {supabaseStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  supabaseStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {supabaseStatus.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{supabaseStatus.message}</span>
              </div>
            )}

            {/* Action buttons for Supabase */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
              <button
                disabled={isTestingSupabase || !supabaseConfig.url}
                onClick={handleSaveAndTestSupabase}
                className="px-4 py-2 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isTestingSupabase ? 'Verificando...' : 'Guardar y Probar Conexión'}
              </button>

              <button
                disabled={isClearingSupabase || !supabaseConfig.url}
                onClick={handleClearSupabase}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold border border-red-300 transition cursor-pointer"
                title="Borrar registros en tablas de Supabase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Registros en Supabase</span>
              </button>
            </div>

            {/* Optional SQL Schema modal drop-down */}
            {showSqlSchema && (
              <div className="mt-3 p-3 bg-gray-900 rounded-xl text-gray-200 text-xs font-mono relative">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[11px] text-gray-400">
                  <span>Esquema SQL para Supabase SQL Editor</span>
                  <button
                    onClick={copySqlToClipboard}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copiado' : 'Copiar SQL'}</span>
                  </button>
                </div>
                <pre className="max-h-48 overflow-y-auto text-[11px] leading-relaxed select-all">
                  {sqlSchemaText}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-xs font-bold transition cursor-pointer"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
