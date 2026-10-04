import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Supabase configuration - connecting directly from Node.js (no iframe or CORS restrictions)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lgaocnmbdzakianuvzlf.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnYW9jbm1iZHpha2lhbnV2emxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODg4MzMsImV4cCI6MjEwNjQ2NDgzM30.L12vefAzOtPoPup3OtD0fngMvKmbmKatXP8uO_m9O84';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// -------------------------------------------------------------
// SERVER-SIDE PROXY API FOR SUPABASE (Bypasses iframe/browser fetch blocks)
// -------------------------------------------------------------

// Products API
app.get('/api/products', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al obtener productos';
    res.status(500).json({ success: false, error: msg });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const payload = req.body;
    const cleanBarcode = (payload.barcode || '').trim();

    // Check if barcode already exists in Supabase to resolve ID conflicts
    let targetId = payload.id;
    if (cleanBarcode) {
      try {
        const { data: existing } = await Promise.race([
          supabase.from('products').select('id, barcode').eq('barcode', cleanBarcode).maybeSingle(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
        ]);
        if (existing) {
          targetId = existing.id;
        }
      } catch {}
    }

    const itemToUpsert = {
      id: targetId,
      barcode: cleanBarcode,
      name: (payload.name || '').trim(),
      category: payload.category || 'Otros',
      brand: payload.brand ? String(payload.brand).trim() : null,
      cost_price: Number(payload.cost_price ?? payload.costPrice) || 0,
      sale_price: Number(payload.sale_price ?? payload.salePrice) || 0,
      stock: Number(payload.stock) || 0,
      min_stock: Number(payload.min_stock ?? payload.minStock) || 5,
      unit_type: payload.unit_type || payload.unitType || 'pieza',
      package_units: Number(payload.package_units ?? payload.packageUnits) || 1,
      package_cost_price:
        payload.package_cost_price != null || payload.packageCostPrice != null
          ? Number(payload.package_cost_price ?? payload.packageCostPrice)
          : null,
      package_sale_price:
        payload.package_sale_price != null || payload.packageSalePrice != null
          ? Number(payload.package_sale_price ?? payload.packageSalePrice)
          : null,
      is_active: payload.is_active !== false && payload.isActive !== false,
      is_service: !!(payload.is_service || payload.isService),
      image_url: payload.image_url || payload.imageUrl || null,
      created_at: payload.created_at || payload.createdAt || new Date().toISOString(),
      last_restock_date: payload.last_restock_date || payload.lastRestockDate || new Date().toISOString(),
    };

    const { error } = await Promise.race([
      supabase.from('products').upsert(itemToUpsert),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Supabase request timeout')), 3500)),
    ]);

    if (error) throw error;
    res.json({ success: true, targetId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar producto';
    console.error('API /api/products error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
    res.status(500).json({ success: false, error: msg });
  }
});

// Sales & Sale Items API
app.get('/api/sales', async (_req, res) => {
  try {
    const { data: sales, error: sErr } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(200);
    if (sErr) throw sErr;

    const { data: items, error: iErr } = await supabase.from('sale_items').select('*');
    if (iErr) throw iErr;

    res.json({ success: true, sales: sales || [], items: items || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar ventas';
    res.status(500).json({ success: false, error: msg });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { sale, items } = req.body;
    if (!sale) return res.status(400).json({ success: false, error: 'Datos de venta requeridos' });

    const { error: sErr } = await supabase.from('sales').upsert(sale);
    if (sErr) throw sErr;

    if (items && items.length > 0) {
      await supabase.from('sale_items').delete().eq('sale_id', sale.id);
      const { error: iErr } = await supabase.from('sale_items').insert(items);
      if (iErr) throw iErr;
    }

    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al registrar venta';
    res.status(500).json({ success: false, error: msg });
  }
});

// Purchases & Purchase Items API
app.get('/api/purchases', async (_req, res) => {
  try {
    const { data: purchases, error: pErr } = await supabase
      .from('purchases')
      .select('*')
      .order('date', { ascending: false });
    if (pErr) throw pErr;

    const { data: items, error: iErr } = await supabase.from('purchase_items').select('*');
    if (iErr) throw iErr;

    res.json({ success: true, purchases: purchases || [], items: items || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar compras';
    res.status(500).json({ success: false, error: msg });
  }
});

app.post('/api/purchases', async (req, res) => {
  try {
    const { purchase, items } = req.body;
    if (!purchase) return res.status(400).json({ success: false, error: 'Datos de compra requeridos' });

    const { error: pErr } = await supabase.from('purchases').upsert(purchase);
    if (pErr) throw pErr;

    if (items && items.length > 0) {
      await supabase.from('purchase_items').delete().eq('purchase_id', purchase.id);
      const { error: iErr } = await supabase.from('purchase_items').insert(items);
      if (iErr) throw iErr;
    }

    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar compra';
    res.status(500).json({ success: false, error: msg });
  }
});

// Cash Shifts & Movements API
app.get('/api/cash-shifts', async (_req, res) => {
  try {
    const { data: shifts, error: sErr } = await supabase
      .from('cash_shifts')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(100);
    if (sErr) throw sErr;

    const { data: movements, error: mErr } = await supabase.from('cash_movements').select('*').order('timestamp');
    if (mErr) throw mErr;

    res.json({ success: true, shifts: shifts || [], movements: movements || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar turnos de caja';
    res.status(500).json({ success: false, error: msg });
  }
});

app.post('/api/cash-shifts', async (req, res) => {
  try {
    const { shift, movements } = req.body;
    if (shift) {
      const { error: sErr } = await supabase.from('cash_shifts').upsert(shift);
      if (sErr) throw sErr;
    }
    if (movements && movements.length > 0) {
      const { error: mErr } = await supabase.from('cash_movements').upsert(movements);
      if (mErr) throw mErr;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar turno';
    res.status(500).json({ success: false, error: msg });
  }
});

// Users API
app.get('/api/users', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('full_name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar empleados';
    res.status(500).json({ success: false, error: msg });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar empleado';
    res.status(500).json({ success: false, error: msg });
  }
});

// Services API
app.get('/api/services', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al consultar servicios';
    res.status(500).json({ success: false, error: msg });
  }
});

// Stock Adjustments API
app.post('/api/stock-adjustments', async (req, res) => {
  try {
    const adj = req.body;
    const { error } = await supabase.from('stock_adjustments').insert([adj]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al registrar ajuste';
    res.status(500).json({ success: false, error: msg });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSETS
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
