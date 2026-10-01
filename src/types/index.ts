export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unitType: 'pieza' | 'paquete';
  packageUnits: number; // e.g. 12 units per box
  packageCostPrice?: number;
  packageSalePrice?: number;
  isService?: boolean;
  createdAt: string;
  lastRestockDate?: string;
  imageUrl?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  iconName: string;
  description?: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  quantity: number;
  isService: boolean;
  packageMode: 'pieza' | 'paquete';
  subtotal: number;
  brand?: string;
}

export interface Sale {
  id: string;
  folio: number;
  date: string; // ISO string
  items: CartItem[];
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'mixto';
  cashReceived: number;
  change: number;
  cardReference?: string;
  cashShiftId: string;
  cashierName: string;
  status: 'completada' | 'cancelada';
}

export interface CashMovement {
  id: string;
  shiftId: string;
  type: 'entrada' | 'retiro';
  amount: number;
  reason: string;
  timestamp: string;
  user: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialAmount: number; // Fondo inicial
  salesCash: number;
  salesCard: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number; // initial + salesCash + cashIn - cashOut
  countedCash?: number;
  difference?: number; // countedCash - expectedCash
  status: 'abierta' | 'cerrada';
  notes?: string;
  movements: CashMovement[];
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplier: string;
  invoiceNumber?: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  previousStock: number;
  newStock: number;
  quantityAdjusted: number;
  reason: 'merma' | 'producto dañado' | 'uso interno' | 'conteo de inventario' | 'otro';
  notes?: string;
  date: string;
  user: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type ActiveModule = 'pos' | 'inventory' | 'purchases' | 'cash' | 'reports';
