import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'papeleria_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Supabase config', e);
  }
  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === config.url && lastKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey);
    lastUrl = config.url;
    lastKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { success: false, message: 'La URL debe comenzar con https://' };
    }
    const testClient = createClient(url, key);
    // Simple query test on products or test ping
    const { error } = await testClient.from('products').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "products" does not exist')) {
      // If table doesn't exist yet, connection is still technically valid, but inform user
      if (error.message.includes('relation') || error.code === '42P01') {
        return {
          success: true,
          message: 'Conexión exitosa a Supabase (Nota: Recuerda crear las tablas en tu base de datos si aún no las has creado).',
        };
      }
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
    return { success: true, message: '¡Conexión a Supabase establecida correctamente!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, message: `No se pudo conectar: ${msg}` };
  }
}

export async function clearSupabaseTables(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    // Delete in logical cascade order
    const errors: string[] = [];

    // Delete sale_items
    const { error: err1 } = await client.from('sale_items').delete().neq('id', 'placeholder-uuid-never-match');
    if (err1 && !err1.message.includes('does not exist')) errors.push(`sale_items: ${err1.message}`);

    // Delete sales
    const { error: err2 } = await client.from('sales').delete().neq('id', 'placeholder-uuid-never-match');
    if (err2 && !err2.message.includes('does not exist')) errors.push(`sales: ${err2.message}`);

    // Delete cash_movements
    const { error: err3 } = await client.from('cash_movements').delete().neq('id', 'placeholder-uuid-never-match');
    if (err3 && !err3.message.includes('does not exist')) errors.push(`cash_movements: ${err3.message}`);

    // Delete cash_shifts
    const { error: err4 } = await client.from('cash_shifts').delete().neq('id', 'placeholder-uuid-never-match');
    if (err4 && !err4.message.includes('does not exist')) errors.push(`cash_shifts: ${err4.message}`);

    // Delete purchase_items
    const { error: err5 } = await client.from('purchase_items').delete().neq('id', 'placeholder-uuid-never-match');
    if (err5 && !err5.message.includes('does not exist')) errors.push(`purchase_items: ${err5.message}`);

    // Delete purchases
    const { error: err6 } = await client.from('purchases').delete().neq('id', 'placeholder-uuid-never-match');
    if (err6 && !err6.message.includes('does not exist')) errors.push(`purchases: ${err6.message}`);

    // Delete products
    const { error: err7 } = await client.from('products').delete().neq('id', 'placeholder-uuid-never-match');
    if (err7 && !err7.message.includes('does not exist')) errors.push(`products: ${err7.message}`);

    if (errors.length > 0) {
      return { success: false, message: `Algunas tablas reportaron notas: ${errors.join(', ')}` };
    }

    return { success: true, message: 'Todos los registros de Supabase fueron eliminados exitosamente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al vaciar Supabase';
    return { success: false, message: msg };
  }
}
