import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, Product, Sale, CashShift, Purchase, UserAccount, ServiceItem } from '../types';

const STORAGE_KEY = 'papeleria_supabase_config';

// User's configured Supabase project
export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://lgaocnmbdzakianuvzlf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYW9jbm1iZHpha2lhbnV2emxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODg4MzMsImV4cCI6MjEwNjQ2NDgzM30.L12vefAzOtPoPup3OtD0fngMvKmbmKatXP8uO_m9O84',
  isConnected: true,
};

// Cleans and normalizes URL (e.g. removes /rest/v1/ suffix so createClient does not break)
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  return clean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          ...parsed,
          url: normalizeSupabaseUrl(parsed.url),
        };
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config', e);
  }
  // Return the configured project as default
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  const normalized: SupabaseConfig = {
    ...config,
    url: normalizeSupabaseUrl(config.url),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  cachedClient = null;
  lastUrl = '';
  lastKey = '';
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const cleanUrl = normalizeSupabaseUrl(config.url);

  if (cachedClient && lastUrl === cleanUrl && lastKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cleanUrl, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    lastUrl = cleanUrl;
    lastKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = normalizeSupabaseUrl(url);
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, message: 'La URL debe comenzar con https://' };
    }
    const testClient = createClient(cleanUrl, key);
    // Simple query test on products or test ping
    const { error } = await testClient.from('products').select('id', { head: true, count: 'exact' });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "products" does not exist')) {
      if (error.message.includes('relation') || error.code === '42P01') {
        return {
          success: true,
          message: '¡Conexión exitosa a Supabase! (Recuerda ejecutar el script SQL para crear las tablas).',
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

// -------------------------------------------------------------
// SYNC & CRUD METHODS TO RECORD DATA PROPERLY IN SUPABASE
// -------------------------------------------------------------

// Sync Product (Upsert)
export async function syncProductToSupabase(product: Product): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('products').upsert({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      brand: product.brand || null,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      stock: product.stock,
      min_stock: product.minStock,
      unit_type: product.unitType,
      package_units: product.packageUnits || 1,
      package_cost_price: product.packageCostPrice || null,
      package_sale_price: product.packageSalePrice || null,
      is_active: product.isActive !== false,
      is_service: !!product.isService,
      image_url: product.imageUrl || null,
      created_at: product.createdAt,
      last_restock_date: product.lastRestockDate || new Date().toISOString(),
    });
    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Delete Product
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('products').delete().eq('id', productId);
    return !error;
  } catch {
    return false;
  }
}

// Delete Multiple Products
export async function deleteMultipleProductsFromSupabase(productIds: string[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || productIds.length === 0) return false;
  try {
    const { error } = await client.from('products').delete().in('id', productIds);
    return !error;
  } catch {
    return false;
  }
}

// Sync Sale & Items
export async function syncSaleToSupabase(sale: Sale): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    // 1. Insert sale
    const { error: saleErr } = await client.from('sales').upsert({
      id: sale.id,
      folio: sale.folio,
      date: sale.date,
      total: sale.total,
      cost_total: sale.costTotal,
      profit: sale.profit,
      payment_method: sale.paymentMethod,
      cash_received: sale.cashReceived,
      change: sale.change,
      card_reference: sale.cardReference || null,
      cash_shift_id: sale.cashShiftId || null,
      cashier_name: sale.cashierName,
      status: sale.status,
      canceled_reason: sale.canceledReason || null,
    });
    if (saleErr) {
      return false;
    }

    // 2. Insert items
    if (sale.items && sale.items.length > 0) {
      const itemsPayload = sale.items.map((it) => ({
        id: it.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sale_id: sale.id,
        product_id: it.productId,
        name: it.name,
        barcode: it.barcode || null,
        price: it.price,
        cost_price: it.costPrice,
        quantity: it.quantity,
        is_service: !!it.isService,
        package_mode: it.packageMode || 'pieza',
        subtotal: it.subtotal,
      }));
      await client.from('sale_items').upsert(itemsPayload);
    }
    return true;
  } catch {
    return false;
  }
}

// Sync Cash Shift
export async function syncCashShiftToSupabase(shift: CashShift): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('cash_shifts').upsert({
      id: shift.id,
      opened_at: shift.openedAt,
      closed_at: shift.closedAt || null,
      opened_by: shift.openedBy,
      closed_by: shift.closedBy || null,
      initial_amount: shift.initialAmount,
      sales_cash: shift.salesCash,
      sales_card: shift.salesCard,
      cash_in: shift.cashIn,
      cash_out: shift.cashOut,
      expected_cash: shift.expectedCash,
      counted_cash: shift.countedCash || null,
      difference: shift.difference || null,
      status: shift.status,
      notes: shift.notes || null,
    });
    if (error) return false;

    // Sync movements
    if (shift.movements && shift.movements.length > 0) {
      const movPayload = shift.movements.map((m) => ({
        id: m.id,
        shift_id: shift.id,
        type: m.type,
        amount: m.amount,
        reason: m.reason,
        user_name: m.user,
        timestamp: m.timestamp,
      }));
      await client.from('cash_movements').upsert(movPayload);
    }
    return true;
  } catch {
    return false;
  }
}

// Sync Purchase
export async function syncPurchaseToSupabase(purchase: Purchase): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error: purErr } = await client.from('purchases').upsert({
      id: purchase.id,
      supplier: purchase.supplier,
      invoice_number: purchase.invoiceNumber || null,
      date: purchase.date,
      total: purchase.total,
      notes: purchase.notes || null,
    });
    if (purErr) return false;

    if (purchase.items && purchase.items.length > 0) {
      const itemsPayload = purchase.items.map((it, idx) => ({
        id: `${purchase.id}-item-${idx}`,
        purchase_id: purchase.id,
        product_id: it.productId,
        product_name: it.productName,
        barcode: it.barcode || null,
        quantity: it.quantity,
        cost_price: it.costPrice,
        subtotal: it.subtotal,
      }));
      await client.from('purchase_items').upsert(itemsPayload);
    }
    return true;
  } catch {
    return false;
  }
}

// Delete Multiple Purchases
export async function deleteMultiplePurchasesFromSupabase(purchaseIds: string[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || purchaseIds.length === 0) return false;
  try {
    await client.from('purchase_items').delete().in('purchase_id', purchaseIds);
    const { error } = await client.from('purchases').delete().in('id', purchaseIds);
    return !error;
  } catch {
    return false;
  }
}

// Sync User
export async function syncUserToSupabase(user: UserAccount): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No hay conexión configurada con Supabase' };
  try {
    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.fullName,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      password: user.password,
      avatar_url: user.avatarUrl || null,
      identification: user.identification || null,
      is_active: user.isActive !== false,
      created_at: user.createdAt || new Date().toISOString(),
      last_login: user.lastLogin || null,
    };
    const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al sincronizar usuario';
    return { success: false, error: msg };
  }
}

// Sync Service
export async function syncServiceToSupabase(service: ServiceItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('services').upsert({
      id: service.id,
      name: service.name,
      price: service.price,
      category: service.category,
      unit: service.unit,
      icon_name: service.iconName || 'FileText',
      description: service.description || null,
      is_active: service.isActive !== false,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// Delete Single User
export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('users').delete().eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

// Delete Multiple Users
export async function deleteMultipleUsersFromSupabase(userIds: string[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || userIds.length === 0) return false;
  try {
    const { error } = await client.from('users').delete().in('id', userIds);
    return !error;
  } catch {
    return false;
  }
}

// Sync Stock Adjustment
export async function syncAdjustmentToSupabase(adj: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('stock_adjustments').upsert({
      id: adj.id,
      product_id: adj.productId,
      product_name: adj.productName,
      barcode: adj.barcode || null,
      previous_stock: adj.previousStock,
      new_stock: adj.newStock,
      quantity_adjusted: adj.quantityAdjusted,
      reason: adj.reason,
      notes: adj.notes || null,
      user_name: adj.user,
      date: adj.date,
    });
    return !error;
  } catch {
    return false;
  }
}

// Fetch Products from Supabase (to restore remote catalog)
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('products').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      barcode: d.barcode,
      name: d.name,
      category: d.category,
      brand: d.brand || '',
      costPrice: Number(d.cost_price) || 0,
      salePrice: Number(d.sale_price) || 0,
      stock: Number(d.stock) || 0,
      minStock: Number(d.min_stock) || 5,
      unitType: d.unit_type || 'pieza',
      packageUnits: Number(d.package_units) || 1,
      packageCostPrice: d.package_cost_price ? Number(d.package_cost_price) : undefined,
      packageSalePrice: d.package_sale_price ? Number(d.package_sale_price) : undefined,
      isActive: d.is_active !== false,
      isService: !!d.is_service,
      imageUrl: d.image_url || undefined,
      createdAt: d.created_at,
      lastRestockDate: d.last_restock_date,
    }));
  } catch {
    return null;
  }
}

// Fetch Users from Supabase
export async function fetchUsersFromSupabase(): Promise<UserAccount[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('users').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map((d: any) => ({
      id: d.id,
      username: d.username,
      fullName: d.full_name,
      email: d.email,
      phone: d.phone || undefined,
      role: d.role,
      password: d.password,
      avatarUrl: d.avatar_url || undefined,
      identification: d.identification || undefined,
      isActive: d.is_active !== false,
      createdAt: d.created_at,
      lastLogin: d.last_login || undefined,
    }));
  } catch {
    return null;
  }
}

// Bulk Upload everything from Local to Supabase
export async function uploadAllLocalToSupabase(data: {
  products: Product[];
  services: ServiceItem[];
  users: UserAccount[];
  sales: Sale[];
  shifts: CashShift[];
  purchases: Purchase[];
}): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está conectado.' };
  }

  try {
    // 1. Sync users
    if (data.users.length > 0) {
      const userPayload = data.users.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        email: u.email,
        phone: u.phone || null,
        role: u.role,
        password: u.password,
        avatar_url: u.avatarUrl || null,
        identification: u.identification || null,
        is_active: u.isActive,
        created_at: u.createdAt,
      }));
      await client.from('users').upsert(userPayload);
    }

    // 2. Sync services
    if (data.services.length > 0) {
      const srvPayload = data.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        category: s.category,
        unit: s.unit,
        icon_name: s.iconName || 'FileText',
        description: s.description || null,
        is_active: s.isActive !== false,
      }));
      await client.from('services').upsert(srvPayload);
    }

    // 3. Sync products
    if (data.products.length > 0) {
      const prodPayload = data.products.map((p) => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        brand: p.brand || null,
        cost_price: p.costPrice,
        sale_price: p.salePrice,
        stock: p.stock,
        min_stock: p.minStock,
        unit_type: p.unitType,
        package_units: p.packageUnits || 1,
        package_cost_price: p.packageCostPrice || null,
        package_sale_price: p.packageSalePrice || null,
        is_active: p.isActive !== false,
        is_service: !!p.isService,
        image_url: p.imageUrl || null,
        created_at: p.createdAt,
      }));
      await client.from('products').upsert(prodPayload);
    }

    // 4. Sync shifts
    for (const sh of data.shifts) {
      await syncCashShiftToSupabase(sh);
    }

    // 5. Sync sales
    for (const s of data.sales) {
      await syncSaleToSupabase(s);
    }

    // 6. Sync purchases
    for (const p of data.purchases) {
      await syncPurchaseToSupabase(p);
    }

    return {
      success: true,
      message: `¡Sincronización completada! (${data.products.length} productos, ${data.sales.length} ventas, ${data.users.length} usuarios subidos a Supabase).`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error durante sincronización';
    return { success: false, message: msg };
  }
}

// Clear Remote Tables
export async function clearSupabaseTables(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    const errors: string[] = [];

    // Delete in order to avoid FK constraints
    const { error: err1 } = await client.from('sale_items').delete().neq('id', 'placeholder-none');
    if (err1 && !err1.message.includes('does not exist')) errors.push(`sale_items: ${err1.message}`);

    const { error: err2 } = await client.from('sales').delete().neq('id', 'placeholder-none');
    if (err2 && !err2.message.includes('does not exist')) errors.push(`sales: ${err2.message}`);

    const { error: err3 } = await client.from('cash_movements').delete().neq('id', 'placeholder-none');
    if (err3 && !err3.message.includes('does not exist')) errors.push(`cash_movements: ${err3.message}`);

    const { error: err4 } = await client.from('cash_shifts').delete().neq('id', 'placeholder-none');
    if (err4 && !err4.message.includes('does not exist')) errors.push(`cash_shifts: ${err4.message}`);

    const { error: err5 } = await client.from('purchase_items').delete().neq('id', 'placeholder-none');
    if (err5 && !err5.message.includes('does not exist')) errors.push(`purchase_items: ${err5.message}`);

    const { error: err6 } = await client.from('purchases').delete().neq('id', 'placeholder-none');
    if (err6 && !err6.message.includes('does not exist')) errors.push(`purchases: ${err6.message}`);

    const { error: err7 } = await client.from('stock_adjustments').delete().neq('id', 'placeholder-none');
    if (err7 && !err7.message.includes('does not exist')) errors.push(`stock_adjustments: ${err7.message}`);

    const { error: err8 } = await client.from('products').delete().neq('id', 'placeholder-none');
    if (err8 && !err8.message.includes('does not exist')) errors.push(`products: ${err8.message}`);

    if (errors.length > 0) {
      return { success: false, message: `Notas al vaciar: ${errors.join(', ')}` };
    }

    return { success: true, message: 'Todos los registros de Supabase fueron eliminados exitosamente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al vaciar Supabase';
    return { success: false, message: msg };
  }
}
