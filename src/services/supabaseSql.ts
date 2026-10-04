// SCRIPT EXCLUSIVO PARA LA TABLA DE PRODUCTOS
export const PRODUCTS_ONLY_SQL = `-- ==============================================================================
-- SCRIPT SQL PARA TABLA DE PRODUCTOS (CATÁLOGO E INVENTARIO) EN SUPABASE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit_type TEXT NOT NULL DEFAULT 'pieza', -- 'pieza' o 'paquete'
  package_units INT DEFAULT 1,
  package_cost_price NUMERIC(10,2),
  package_sale_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_service BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_restock_date TIMESTAMPTZ DEFAULT now()
);

-- Índices recomendados para búsquedas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Desactivar Row Level Security (RLS) para permitir guardar directamente desde el sistema
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Política de acceso total para roles anon y authenticated
DROP POLICY IF EXISTS "anon_full_access_products" ON products;
CREATE POLICY "anon_full_access_products" ON products
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
`;

// SCRIPT EXCLUSIVO PARA TABLAS DE COMPRAS Y ENTRADAS DE MERCANCÍA
export const PURCHASES_ONLY_SQL = `-- ==============================================================================
-- TABLAS DE COMPRAS Y RECEPCIÓN DE MERCANCÍA EN SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. Tabla de Facturas y Compras a Proveedores
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  supplier TEXT NOT NULL,
  invoice_number TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT
);

-- 2. Tabla de Artículos Ingresados en la Compra
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity INT NOT NULL DEFAULT 1,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases (date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items (purchase_id);

-- Desactivar Row Level Security (RLS) para permitir escritura directa
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;

-- Políticas universales de acceso anon y authenticated
DROP POLICY IF EXISTS "anon_full_access_purchases" ON purchases;
CREATE POLICY "anon_full_access_purchases" ON purchases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_full_access_purchase_items" ON purchase_items;
CREATE POLICY "anon_full_access_purchase_items" ON purchase_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

export const FULL_SUPABASE_SQL_WITH_SAMPLE_DATA = `-- ==============================================================================
-- BASE DE DATOS COMPLETA PARA PAPELERÍA EL ESCRITORIO (SUPABASE / POSTGRESQL)
-- Proyecto: papeleria@appdesignsoftware.com's Project (lgaocnmbdzakianuvzlf)
-- Incluye Tablas DDL, Desactivación de RLS para API Anon, y Datos de Prueba Iniciales
-- ==============================================================================

-- 1. TABLA DE USUARIOS / EMPLEADOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Cajero', -- 'Admin' o 'Cajero'
  password TEXT NOT NULL,
  avatar_url TEXT,
  identification TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);

-- 2. TABLA DE PRODUCTOS (CATÁLOGO E INVENTARIO)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit_type TEXT NOT NULL DEFAULT 'pieza', -- 'pieza' o 'paquete'
  package_units INT DEFAULT 1,
  package_cost_price NUMERIC(10,2),
  package_sale_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_service BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_restock_date TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE SERVICIOS RÁPIDOS (SIN INVENTARIO)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'hoja',
  icon_name TEXT DEFAULT 'FileText',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 4. TABLA DE CORTES DE CAJA (SHIFTS)
CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opened_by TEXT NOT NULL,
  closed_by TEXT,
  initial_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  sales_cash NUMERIC(10,2) DEFAULT 0.00,
  sales_card NUMERIC(10,2) DEFAULT 0.00,
  cash_in NUMERIC(10,2) DEFAULT 0.00,
  cash_out NUMERIC(10,2) DEFAULT 0.00,
  expected_cash NUMERIC(10,2) DEFAULT 0.00,
  counted_cash NUMERIC(10,2),
  difference NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'abierta', -- 'abierta' o 'cerrada'
  notes TEXT
);

-- 5. TABLA DE MOVIMIENTOS DE CAJA CHICA (ENTRADAS / RETIROS)
CREATE TABLE IF NOT EXISTS cash_movements (
  id TEXT PRIMARY KEY,
  shift_id TEXT REFERENCES cash_shifts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'entrada' o 'retiro'
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  user_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 6. TABLA DE VENTAS (TICKETS)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  folio INT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  total NUMERIC(10,2) NOT NULL,
  cost_total NUMERIC(10,2) NOT NULL,
  profit NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo' o 'tarjeta'
  cash_received NUMERIC(10,2) NOT NULL,
  change NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  card_reference TEXT,
  cash_shift_id TEXT,
  cashier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completada', -- 'completada' o 'cancelada'
  canceled_reason TEXT,
  original_total NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0.00,
  discount_type TEXT -- 'percent' o 'amount'
);

-- Migraciones seguras para tablas ya existentes
ALTER TABLE sales ADD COLUMN IF NOT EXISTS canceled_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS original_total NUMERIC(10,2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_type TEXT;

-- 7. TABLA DE ARTÍCULOS VENDIDOS POR TICKET
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL,
  is_service BOOLEAN NOT NULL DEFAULT false,
  package_mode TEXT NOT NULL DEFAULT 'pieza',
  subtotal NUMERIC(10,2) NOT NULL
);

-- 8. TABLA DE COMPRAS A PROVEEDORES
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  supplier TEXT NOT NULL,
  invoice_number TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  total NUMERIC(10,2) NOT NULL,
  notes TEXT
);

-- 9. TABLA DE DETALLE DE COMPRAS
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity INT NOT NULL,
  cost_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- 10. TABLA DE AJUSTES MANUALES DE STOCK (MERMAS / DAÑADOS)
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  barcode TEXT,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  quantity_adjusted INT NOT NULL,
  reason TEXT NOT NULL, -- 'merma', 'producto dañado', 'uso interno', 'conteo de inventario'
  notes TEXT,
  user_name TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- DESACTIVAR ROW LEVEL SECURITY (RLS) Y CREAR POLÍTICAS PERMISIVAS TOTALES (ANON)
-- ==============================================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_adjustments DISABLE ROW LEVEL SECURITY;

-- Políticas universales de acceso completo (en caso de que Supabase re-active RLS en el dashboard)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_full_access" ON %I;', t);
    EXECUTE format('CREATE POLICY "anon_full_access" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- ==============================================================================
-- REGISTROS DE PRUEBA INICIALES (DML) - PAPELERÍA EL ESCRITORIO
-- ==============================================================================

-- 1. Inserción de Usuarios Solicitados (Admin1, haroldo90 y cajero1)
INSERT INTO users (id, username, full_name, email, phone, role, password, avatar_url, identification, is_active)
VALUES
('usr-admin1', 'Admin1', 'Administrador Principal', 'admin@elescritorio.mx', '55 1234 5678', 'Admin', 'Chevropar#1970', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces', 'ADM-2026-01', true),
('usr-haroldo90', 'haroldo90', 'Haroldo Administrador', 'haroldo@elescritorio.mx', '55 9876 5432', 'Admin', 'Chevropar#1970', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', 'ADM-2026-02', true),
('usr-cajero1', 'cajero1', 'Carlos Mendoza Ramos', 'carlos.mendoza@elescritorio.mx', '55 8765 4321', 'Cajero', 'Chevropar#1970', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces', 'CAJ-2026-01', true)
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, is_active = EXCLUDED.is_active;

-- 2. Inserción de Servicios Rápidos
INSERT INTO services (id, name, price, category, unit, icon_name, description, is_active)
VALUES
('srv-1', 'Copia B/N Carta', 1.50, 'Copias e Impresiones', 'hoja', 'Copy', 'Fotocopia blanco y negro tamaño carta', true),
('srv-2', 'Copia Color Carta', 5.00, 'Copias e Impresiones', 'hoja', 'Printer', 'Fotocopia a color papel bond', true),
('srv-3', 'Copia INE / IFE (Ambos lados)', 3.00, 'Copias e Impresiones', 'juego', 'IdCard', 'Copia ampliada o estándar al 200%', true),
('srv-4', 'Impresión B/N Carta', 2.50, 'Copias e Impresiones', 'hoja', 'FileText', 'Desde USB, WhatsApp o correo', true),
('srv-5', 'Impresión Color Carta', 7.00, 'Copias e Impresiones', 'hoja', 'FileSpreadsheet', 'Alta definición en papel bond', true),
('srv-6', 'Escaneo de Documento a PDF/JPG', 5.00, 'Digitalización', 'hoja', 'ScanLine', 'Envío directo a WhatsApp o correo', true),
('srv-7', 'Enmicado Credencial', 12.00, 'Acabados', 'pieza', 'ShieldCheck', 'Térmico grueso alta durabilidad', true),
('srv-8', 'Enmicado Carta', 25.00, 'Acabados', 'hoja', 'Layers', 'Mica térmica tamaño carta', true),
('srv-9', 'Enmicado Oficio', 30.00, 'Acabados', 'hoja', 'Layers', 'Mica térmica tamaño oficio', true),
('srv-10', 'Engargolado Espiral Plástico', 25.00, 'Acabados', 'trabajo', 'BookOpen', 'Incluye pastas transparentes', true)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

-- 3. Inserción de Catálogo de Productos
INSERT INTO products (id, barcode, name, category, brand, cost_price, sale_price, stock, min_stock, unit_type, package_units, package_cost_price, package_sale_price, is_active)
VALUES
('prod-1', '7501000100012', 'Cuaderno Profesional Raya 100 Hojas', 'Escolares', 'Scribe', 22.00, 35.00, 45, 15, 'pieza', 1, NULL, NULL, true),
('prod-2', '7501000100029', 'Cuaderno Profesional Cuadro Chico 100 Hojas', 'Escolares', 'Scribe', 22.00, 35.00, 28, 15, 'pieza', 1, NULL, NULL, true),
('prod-3', '7501000100036', 'Bolígrafo Cristal Mediano Azul', 'Papelería', 'BIC', 4.50, 8.00, 84, 20, 'paquete', 12, 48.00, 80.00, true),
('prod-4', '7501000100043', 'Bolígrafo Cristal Mediano Negro', 'Papelería', 'BIC', 4.50, 8.00, 62, 20, 'paquete', 12, 48.00, 80.00, true),
('prod-5', '7501000100050', 'Bolígrafo Cristal Mediano Rojo', 'Papelería', 'BIC', 4.50, 8.00, 35, 15, 'paquete', 12, 48.00, 80.00, true),
('prod-6', '7501000100067', 'Lápiz de Grafito No. 2 HB', 'Escolares', 'Dixon Ticonderoga', 3.50, 7.00, 50, 15, 'paquete', 12, 36.00, 65.00, true),
('prod-7', '7501000100074', 'Lápiz Adhesivo Pritt 42g', 'Papelería', 'Henkel Pritt', 28.00, 44.00, 14, 8, 'pieza', 1, NULL, NULL, true),
('prod-8', '7501000100081', 'Cartulina Blanca Estándar (Pliego)', 'Papelería', 'Kimberly Clark', 3.00, 7.00, 6, 10, 'pieza', 1, NULL, NULL, true),
('prod-9', '7501000100098', 'Cartulina Colores Variados (Pliego)', 'Papelería', 'Genérica', 3.50, 8.50, 4, 10, 'pieza', 1, NULL, NULL, true),
('prod-10', '7501000100104', 'Marcador Permanente Negro Punta Fina', 'Oficina', 'Sharpie', 16.00, 26.00, 22, 10, 'paquete', 12, 175.00, 280.00, true),
('prod-11', '7501000100111', 'Resaltador Fluorescente Amarillo', 'Oficina', 'Pelikan', 11.00, 18.00, 19, 8, 'pieza', 1, NULL, NULL, true),
('prod-12', '7501000100128', 'Tijeras Escolares Punta Roma 5 Pulgadas', 'Escolares', 'Mae', 14.00, 24.00, 15, 6, 'pieza', 1, NULL, NULL, true),
('prod-13', '7501000100135', 'Goma de Borrar Blanca Migajón Factis', 'Escolares', 'Factis', 5.00, 9.00, 42, 15, 'paquete', 20, 85.00, 150.00, true),
('prod-14', '7501000100142', 'Regla de Plástico Transparente 30 cm', 'Escolares', 'Baco', 6.00, 12.00, 30, 10, 'pieza', 1, NULL, NULL, true),
('prod-15', '7501000100159', 'Juego de Geometría Flexible 5 Piezas', 'Escolares', 'Mae', 29.00, 48.00, 11, 5, 'pieza', 1, NULL, NULL, true),
('prod-16', '7501000100166', 'Cinta Adhesiva Transparente 18mm x 33m', 'Oficina', 'Janel', 9.00, 16.00, 25, 8, 'pieza', 1, NULL, NULL, true),
('prod-17', '7501000100173', 'Cinta Canela de Empaque 48mm x 50m', 'Oficina', 'Navitek', 21.00, 36.00, 16, 6, 'pieza', 1, NULL, NULL, true),
('prod-18', '7501000100180', 'Paquete Hojas Blancas Carta 500 Hojas 75g', 'Papelería', 'BioPapel', 85.00, 125.00, 18, 10, 'paquete', 500, 85.00, 125.00, true),
('prod-19', '7501000100197', 'Folder Tamaño Carta Crema (Paquete 25)', 'Oficina', 'Kores', 45.00, 75.00, 12, 5, 'paquete', 25, 45.00, 75.00, true),
('prod-20', '7501000100203', 'Calculadora Científica 240 Funciones', 'Tecnología', 'Casio', 220.00, 320.00, 7, 3, 'pieza', 1, NULL, NULL, true),
('prod-21', '7501000100210', 'Papel Crepé Colores Surtidos (Pliego)', 'Arte y Dibujo', 'Pascual', 4.00, 8.00, 3, 8, 'pieza', 1, NULL, NULL, true),
('prod-22', '7501000100227', 'Plastilina Barra 10 Colores', 'Arte y Dibujo', 'Vinci', 18.00, 30.00, 14, 6, 'pieza', 1, NULL, NULL, true),
('prod-23', '7501000100234', 'Papel Lustre Colores Variados', 'Papelería', 'Genérica', 3.00, 7.00, 22, 10, 'pieza', 1, NULL, NULL, true),
('prod-24', '7501000100241', 'Sacapuntas Metálico con Depósito', 'Escolares', 'Maped', 12.00, 20.00, 18, 6, 'pieza', 1, NULL, NULL, true)
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, sale_price = EXCLUDED.sale_price;

-- 4. Inserción de Turno de Caja Inicial
INSERT INTO cash_shifts (id, opened_at, opened_by, initial_amount, sales_cash, sales_card, cash_in, cash_out, expected_cash, status, notes)
VALUES
('shift-today', now() - interval '6 hour', 'Admin1', 400.00, 356.50, 280.00, 50.00, 45.00, 761.50, 'abierta', 'Turno matutino activo')
ON CONFLICT (id) DO NOTHING;

-- 5. Inserción de Movimientos de Caja Chica
INSERT INTO cash_movements (id, shift_id, type, amount, reason, user_name, timestamp)
VALUES
('mov-1', 'shift-today', 'entrada', 50.00, 'Reposición de monedas de $1 y $2 para cambio', 'Admin1', now() - interval '4 hour'),
('mov-2', 'shift-today', 'retiro', 45.00, 'Pago garrafón de agua purificada para tienda', 'Admin1', now() - interval '2 hour')
ON CONFLICT (id) DO NOTHING;

-- 6. Inserción de Ventas de Muestra
INSERT INTO sales (id, folio, date, total, cost_total, profit, payment_method, cash_received, change, cash_shift_id, cashier_name, status)
VALUES
('sale-101', 1001, now() - interval '3 hour', 114.00, 68.50, 45.50, 'efectivo', 200.00, 86.00, 'shift-today', 'Admin1', 'completada'),
('sale-102', 1002, now() - interval '2 hour', 280.00, 175.00, 105.00, 'tarjeta', 280.00, 0.00, 'shift-today', 'Admin1', 'completada'),
('sale-103', 1003, now() - interval '40 minute', 242.50, 137.00, 105.50, 'efectivo', 250.00, 7.50, 'shift-today', 'haroldo90', 'completada')
ON CONFLICT (id) DO NOTHING;

-- 7. Inserción de Artículos Vendidos de Muestra
INSERT INTO sale_items (id, sale_id, product_id, name, barcode, price, cost_price, quantity, is_service, package_mode, subtotal)
VALUES
('si-1', 'sale-101', 'prod-1', 'Cuaderno Profesional Raya 100 Hojas', '7501000100012', 35.00, 22.00, 2, false, 'pieza', 70.00),
('si-2', 'sale-101', 'prod-7', 'Lápiz Adhesivo Pritt 42g', '7501000100074', 44.00, 28.00, 1, false, 'pieza', 44.00),
('si-3', 'sale-102', 'prod-10', 'Marcador Permanente Negro Punta Fina (Paq 12)', '7501000100104', 280.00, 175.00, 1, false, 'paquete', 280.00),
('si-4', 'sale-103', 'prod-18', 'Paquete Hojas Blancas Carta 500 Hojas 75g', '7501000100180', 125.00, 85.00, 1, false, 'paquete', 125.00),
('si-5', 'sale-103', 'prod-15', 'Juego de Geometría Flexible 5 Piezas', '7501000100159', 48.00, 29.00, 2, false, 'pieza', 96.00),
('si-6', 'sale-103', 'srv-4', 'Impresión B/N Carta', NULL, 2.50, 0.50, 7, true, 'pieza', 17.50),
('si-7', 'sale-103', 'srv-7', 'Enmicado Credencial', NULL, 12.00, 3.00, 2, true, 'pieza', 24.00)
ON CONFLICT (id) DO NOTHING;

-- 8. Inserción de Compras a Proveedores
INSERT INTO purchases (id, supplier, invoice_number, date, total, notes)
VALUES
('pur-1', 'Distribuidora Papelera Nacional S.A.', 'FAC-8921', now() - interval '2 day', 2650.00, 'Surtido mensual de cuadernos y hojas bond'),
('pur-2', 'Mayorista Escolar del Centro', 'FAC-4402', now() - interval '1 day', 1480.00, 'Bolígrafos BIC y adhesivos Pritt')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- HABILITACIÓN SEGURA DE SUPABASE REALTIME (IDEMPOTENTE - EVITA ERROR 42710)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sales') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE sales;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sale_items') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'purchases') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'purchase_items') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE purchase_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cash_shifts') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
  END IF;
END $$;
`;
