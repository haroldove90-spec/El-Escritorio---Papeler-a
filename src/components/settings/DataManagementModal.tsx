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
  getProducts,
  getServices,
  getUsers,
  getSales,
  getCashShifts,
  getPurchases,
} from '../../services/storage';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  clearSupabaseTables,
  uploadAllLocalToSupabase,
  normalizeSupabaseUrl,
} from '../../services/supabaseClient';
import { FULL_SUPABASE_SQL_WITH_SAMPLE_DATA } from '../../services/supabaseSql';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);

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

  // Upload all local data to Supabase
  const handleUploadToSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await uploadAllLocalToSupabase({
        products: getProducts(),
        services: getServices(),
        users: getUsers(),
        sales: getSales(),
        shifts: getCashShifts(),
        purchases: getPurchases(),
      });
      setSupabaseStatus(res);
      if (res.success) {
        alert(res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlSchemaText = FULL_SUPABASE_SQL_WITH_SAMPLE_DATA;

  const RLS_FIX_SQL = `-- ==============================================================================
-- SOLUCIÓN INMEDIATA PARA ERROR "ROW-LEVEL SECURITY POLICY" EN SUPABASE
-- Ejecuta este comando en Supabase > SQL Editor para permitir lectura/escritura
-- ==============================================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_adjustments DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_full_access" ON %I;', t);
    EXECUTE format('CREATE POLICY "anon_full_access" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const copyRlsSqlToClipboard = () => {
    navigator.clipboard.writeText(RLS_FIX_SQL);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 2500);
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={isTestingSupabase || !supabaseConfig.url}
                  onClick={handleSaveAndTestSupabase}
                  className="px-4 py-2 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isTestingSupabase ? 'Verificando...' : 'Guardar y Probar'}
                </button>

                <button
                  disabled={isSyncing || !supabaseConfig.url}
                  onClick={handleUploadToSupabase}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] text-xs font-extrabold transition shadow-xs cursor-pointer"
                  title="Sube todos los productos, servicios, usuarios y ventas locales a tu base de datos Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Subir Todo a Supabase'}</span>
                </button>
              </div>

              <button
                disabled={isClearingSupabase || !supabaseConfig.url}
                onClick={handleClearSupabase}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold border border-red-300 transition cursor-pointer"
                title="Borrar registros en tablas de Supabase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar en Supabase</span>
              </button>
            </div>

            {/* RLS Solution Card */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    ¿Error "violates row-level security policy" en Supabase?
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Ejecuta este comando en Supabase &gt; SQL Editor para desactivar RLS y autorizar la API Key.
                  </p>
                </div>
              </div>
              <button
                onClick={copyRlsSqlToClipboard}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
              >
                {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRlsSql ? '¡Copiado!' : 'Copiar Solución RLS'}</span>
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
