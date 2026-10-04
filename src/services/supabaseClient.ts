import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SupabaseConfig,
  Product,
  Sale,
  CashShift,
  Purchase,
  PurchaseItem,
  UserAccount,
  ServiceItem,
} from '../types';

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
      // If user's stored URL matches the configured project, ensure the active working anon key is used
      if (
        parsed.url &&
        normalizeSupabaseUrl(parsed.url) === normalizeSupabaseUrl(DEFAULT_SUPABASE_CONFIG.url)
      ) {
        if (parsed.anonKey !== DEFAULT_SUPABASE_CONFIG.anonKey) {
          parsed.anonKey = DEFAULT_SUPABASE_CONFIG.anonKey;
          parsed.isConnected = true;
          saveSupabaseConfig(parsed);
        }
        return {
          ...parsed,
          url: normalizeSupabaseUrl(parsed.url),
        };
      }

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

export interface SyncProductResult {
  success: boolean;
  error?: string;
  targetId?: string;
}

// Sync Product (Upsert with smart conflict resolution for barcode uniqueness)
export async function syncProductToSupabase(product: Product): Promise<SyncProductResult> {
  const cleanBarcode = (product.barcode || '').trim();
  const payload = {
    id: product.id,
    barcode: cleanBarcode,
    name: product.name.trim(),
    category: product.category,
    brand: product.brand ? product.brand.trim() : null,
    cost_price: Number(product.costPrice) || 0,
    sale_price: Number(product.salePrice) || 0,
    stock: Number(product.stock) || 0,
    min_stock: Number(product.minStock) || 5,
    unit_type: product.unitType || 'pieza',
    package_units: Number(product.packageUnits) || 1,
    package_cost_price: product.packageCostPrice ? Number(product.packageCostPrice) : null,
    package_sale_price: product.packageSalePrice ? Number(product.packageSalePrice) : null,
    is_active: product.isActive !== false,
    is_service: !!product.isService,
    image_url: product.imageUrl || null,
    created_at: product.createdAt || new Date().toISOString(),
    last_restock_date: product.lastRestockDate || new Date().toISOString(),
  };

  // 1. Try server-side API proxy first (avoids browser iframe / CORS / adblocker fetch blocks)
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, targetId: data.targetId || product.id };
      }
    }
  } catch (apiErr) {
    console.warn('API proxy /api/products note:', apiErr);
  }

  // 2. Direct Supabase Client fallback (for offline or standalone)
  const client = getSupabaseClient();
  if (!client) {
    return { success: true, targetId: product.id };
  }

  try {
    let targetId = product.id;
    if (cleanBarcode) {
      try {
        const { data: existing } = await client
          .from('products')
          .select('id, barcode')
          .or(`id.eq.${product.id},barcode.eq.${cleanBarcode}`)
          .maybeSingle();

        if (existing) {
          targetId = existing.id;
          payload.id = targetId;
        }
      } catch {}
    }

    const { error } = await client.from('products').upsert(payload);
    if (error) {
      console.warn('Error directo Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, targetId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al sincronizar producto';
    console.warn('Excepción guardando producto:', msg);
    // If it's a TypeError: Failed to fetch (browser network block), let the user know product is saved locally
    if (msg.includes('Failed to fetch')) {
      return { success: true, targetId: product.id };
    }
    return { success: false, error: msg };
  }
}

// Delete Product
export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return true;
    }
  } catch {}

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
  for (const id of productIds) {
    await deleteProductFromSupabase(id);
  }
  return true;
}

// Sync Sale & Items
export async function syncSaleToSupabase(sale: Sale): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    // 1. Insert sale
    const salePayload: Record<string, any> = {
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
    };

    if (sale.discount !== undefined) {
      salePayload.discount = sale.discount;
      salePayload.discount_type = sale.discountType || null;
      salePayload.original_total = sale.originalTotal || null;
    }

    let { error: saleErr } = await client.from('sales').upsert(salePayload);
    // Graceful fallback if database schema does not have discount columns yet
    if (saleErr && (saleErr.message.includes('column') || saleErr.code === '42703')) {
      delete salePayload.discount;
      delete salePayload.discount_type;
      delete salePayload.original_total;
      const res = await client.from('sales').upsert(salePayload);
      saleErr = res.error;
    }
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
export async function syncPurchaseToSupabase(
  purchase: Purchase
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está conectado o configurado.' };
  }
  try {
    const { error: purErr } = await client.from('purchases').upsert({
      id: purchase.id,
      supplier: purchase.supplier.trim(),
      invoice_number: purchase.invoiceNumber ? purchase.invoiceNumber.trim() : null,
      date: purchase.date,
      total: Number(purchase.total) || 0,
      notes: purchase.notes ? purchase.notes.trim() : null,
    });
    if (purErr) {
      console.error('Error insertando compra en Supabase:', purErr);
      return { success: false, error: purErr.message };
    }

    if (purchase.items && purchase.items.length > 0) {
      const itemsPayload = purchase.items.map((it, idx) => ({
        id: `${purchase.id}-item-${idx}`,
        purchase_id: purchase.id,
        product_id: it.productId || null,
        product_name: it.productName,
        barcode: it.barcode ? it.barcode.trim() : null,
        quantity: Number(it.quantity) || 1,
        cost_price: Number(it.costPrice) || 0,
        subtotal: Number(it.subtotal) || 0,
      }));
      const { error: itemsErr } = await client.from('purchase_items').upsert(itemsPayload);
      if (itemsErr) {
        console.error('Error insertando artículos de compra en Supabase:', itemsErr);
        return { success: false, error: itemsErr.message };
      }
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al registrar compra';
    console.error('Excepción guardando compra en Supabase:', msg);
    return { success: false, error: msg };
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
      phone: user.phone ? user.phone.trim() : null,
      role: user.role,
      password: user.password,
      avatar_url: user.avatarUrl || null,
      identification: user.identification || null,
      is_active: user.isActive !== false,
      created_at: user.createdAt || new Date().toISOString(),
      last_login: user.lastLogin || null,
    };

    // First check if user exists in Supabase by matching ID or username
    const { data: existingUser } = await client
      .from('users')
      .select('id, username')
      .or(`id.eq.${user.id},username.ilike.${user.username}`)
      .maybeSingle();

    if (existingUser) {
      // Update by existing user's ID to preserve relations and avoid unique key conflicts
      const { error: updateError } = await client
        .from('users')
        .update({
          username: user.username,
          full_name: user.fullName,
          email: user.email,
          phone: user.phone ? user.phone.trim() : null,
          role: user.role,
          password: user.password,
          avatar_url: user.avatarUrl || null,
          identification: user.identification || null,
          is_active: user.isActive !== false,
          last_login: user.lastLogin || null,
        })
        .eq('id', existingUser.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return { success: true };
    }

    // Otherwise insert new user
    const { error: insertError } = await client.from('users').insert(payload);
    if (insertError) {
      return { success: false, error: insertError.message };
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
  // 1. Try server proxy first
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((d: any) => ({
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
      }
    }
  } catch {}

  // 2. Fallback to direct client
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

// Fetch Purchases from Supabase
export async function fetchPurchasesFromSupabase(): Promise<Purchase[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: purData, error: purErr } = await client
      .from('purchases')
      .select('*')
      .order('date', { ascending: false });

    if (purErr || !purData || purData.length === 0) return null;

    // Fetch items for purchases
    const { data: itemsData } = await client.from('purchase_items').select('*');

    const itemsMap: Record<string, PurchaseItem[]> = {};
    if (itemsData && itemsData.length > 0) {
      itemsData.forEach((it: any) => {
        if (!itemsMap[it.purchase_id]) {
          itemsMap[it.purchase_id] = [];
        }
        itemsMap[it.purchase_id].push({
          productId: it.product_id || '',
          productName: it.product_name,
          barcode: it.barcode || '',
          quantity: Number(it.quantity) || 1,
          costPrice: Number(it.cost_price) || 0,
          subtotal: Number(it.subtotal) || 0,
        });
      });
    }

    return purData.map((d: any) => ({
      id: d.id,
      supplier: d.supplier,
      invoiceNumber: d.invoice_number || undefined,
      date: d.date,
      total: Number(d.total) || 0,
      notes: d.notes || undefined,
      items: itemsMap[d.id] || [],
    }));
  } catch (err) {
    console.error('Error obteniendo compras de Supabase:', err);
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

// Map Supabase record to Sale
export function mapSupabaseSaleToLocal(d: any): Sale {
  return {
    id: d.id,
    folio: Number(d.folio) || 1,
    date: d.date,
    items: (d.sale_items || []).map((it: any) => ({
      productId: it.product_id,
      name: it.name,
      barcode: it.barcode || undefined,
      price: Number(it.price) || 0,
      costPrice: Number(it.cost_price) || 0,
      quantity: Number(it.quantity) || 1,
      subtotal: Number(it.subtotal) || 0,
      isService: !!it.is_service,
      packageMode: it.package_mode || 'pieza',
    })),
    total: Number(d.total) || 0,
    costTotal: Number(d.cost_total) || 0,
    profit: Number(d.profit) || 0,
    paymentMethod: d.payment_method || 'efectivo',
    cashReceived: d.cash_received != null ? Number(d.cash_received) : (Number(d.total) || 0),
    change: d.change != null ? Number(d.change) : 0,
    cardReference: d.card_reference || undefined,
    cashShiftId: d.cash_shift_id || 'shift-today',
    cashierName: d.cashier_name || 'Cajero',
    status: d.status || 'completada',
    canceledReason: d.canceled_reason || undefined,
    discount: d.discount != null ? Number(d.discount) : undefined,
    discountType: d.discount_type || undefined,
    originalTotal: d.original_total != null ? Number(d.original_total) : undefined,
  };
}

// Map Supabase record to CashShift
export function mapSupabaseShiftToLocal(d: any): CashShift {
  return {
    id: d.id,
    openedAt: d.opened_at,
    closedAt: d.closed_at || undefined,
    openedBy: d.opened_by || 'Usuario',
    closedBy: d.closed_by || undefined,
    initialAmount: Number(d.initial_amount) || 0,
    salesCash: Number(d.sales_cash) || 0,
    salesCard: Number(d.sales_card) || 0,
    cashIn: Number(d.cash_in) || 0,
    cashOut: Number(d.cash_out) || 0,
    expectedCash: Number(d.expected_cash) || 0,
    countedCash: d.counted_cash != null ? Number(d.counted_cash) : undefined,
    difference: d.difference != null ? Number(d.difference) : undefined,
    status: d.status || 'abierta',
    notes: d.notes || undefined,
    movements: (d.cash_movements || []).map((m: any) => ({
      id: m.id,
      shiftId: m.shift_id,
      type: m.type,
      amount: Number(m.amount) || 0,
      reason: m.reason || '',
      timestamp: m.timestamp || new Date().toISOString(),
      user: m.user_name || 'Usuario',
    })),
  };
}

// Fetch Sales from Supabase
export async function fetchSalesFromSupabase(): Promise<Sale[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('sales')
      .select('*, sale_items(*)')
      .order('date', { ascending: false })
      .limit(200);
    if (error || !data) return null;
    return data.map(mapSupabaseSaleToLocal);
  } catch {
    return null;
  }
}

// Fetch Cash Shifts from Supabase
export async function fetchCashShiftsFromSupabase(): Promise<CashShift[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('cash_shifts')
      .select('*, cash_movements(*)')
      .order('opened_at', { ascending: false })
      .limit(100);
    if (error || !data) return null;
    return data.map(mapSupabaseShiftToLocal);
  } catch {
    return null;
  }
}

// Realtime Subscriptions for Sales, Shifts & Products across all devices
export interface RealtimeSubscriptionHandlers {
  onSaleCreated?: (sale: Sale) => void;
  onShiftUpdated?: (shift: CashShift) => void;
  onProductUpdated?: (product: Product) => void;
  onDataSyncRequested?: () => void;
}

export function subscribeToRealtimeChanges(handlers: RealtimeSubscriptionHandlers): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channelId = `papeleria_realtime_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const channel = client.channel(channelId);

  channel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sales' },
      async (payload) => {
        const saleId = (payload.new as any)?.id;
        if (!saleId) return;
        try {
          const { data } = await client
            .from('sales')
            .select('*, sale_items(*)')
            .eq('id', saleId)
            .single();
          if (data && handlers.onSaleCreated) {
            handlers.onSaleCreated(mapSupabaseSaleToLocal(data));
          } else {
            handlers.onDataSyncRequested?.();
          }
        } catch {
          handlers.onDataSyncRequested?.();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cash_shifts' },
      async (payload) => {
        const shiftId = (payload.new as any)?.id || (payload.old as any)?.id;
        if (!shiftId) return;
        try {
          const { data } = await client
            .from('cash_shifts')
            .select('*, cash_movements(*)')
            .eq('id', shiftId)
            .single();
          if (data && handlers.onShiftUpdated) {
            handlers.onShiftUpdated(mapSupabaseShiftToLocal(data));
          } else {
            handlers.onDataSyncRequested?.();
          }
        } catch {
          handlers.onDataSyncRequested?.();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'cash_movements' },
      () => {
        handlers.onDataSyncRequested?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.new && handlers.onProductUpdated) {
          const p = payload.new as any;
          const mapped: Product = {
            id: p.id,
            barcode: p.barcode,
            name: p.name,
            category: p.category,
            brand: p.brand || '',
            costPrice: Number(p.cost_price) || 0,
            salePrice: Number(p.sale_price) || 0,
            stock: Number(p.stock) || 0,
            minStock: Number(p.min_stock) || 5,
            unitType: p.unit_type || 'pieza',
            packageUnits: Number(p.package_units) || 1,
            packageCostPrice: p.package_cost_price ? Number(p.package_cost_price) : undefined,
            packageSalePrice: p.package_sale_price ? Number(p.package_sale_price) : undefined,
            isActive: p.is_active !== false,
            isService: !!p.is_service,
            imageUrl: p.image_url || undefined,
            createdAt: p.created_at,
            lastRestockDate: p.last_restock_date,
          };
          handlers.onProductUpdated(mapped);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✓ Supabase Realtime conectado: escuchando ventas y caja');
      }
    });

  return () => {
    try {
      client.removeChannel(channel);
    } catch {}
  };
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
