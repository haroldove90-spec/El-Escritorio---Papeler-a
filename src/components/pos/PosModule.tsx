import React, { useState, useRef, useEffect } from 'react';
import {
  Product,
  ServiceItem,
  CartItem,
  Sale,
  CashShift,
} from '../../types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  CreditCard,
  Banknote,
  AlertCircle,
  Copy,
  Printer,
  ShieldCheck,
  Package,
  Layers,
  FileText,
  ScanLine,
  BookOpen,
  ShoppingCart,
  ArrowLeft,
} from 'lucide-react';
import { ThermalTicket } from './ThermalTicket';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

interface PosModuleProps {
  products: Product[];
  services: ServiceItem[];
  activeShift: CashShift | null;
  onCompleteSale: (sale: Sale) => void;
  onOpenShiftModal: () => void;
  onUpdateProductStock: (productId: string, quantityDeducted: number) => void;
}

export const PosModule: React.FC<PosModuleProps> = ({
  products,
  services,
  activeShift,
  onCompleteSale,
  onOpenShiftModal,
  onUpdateProductStock,
}) => {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showServices, setShowServices] = useState(true);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cardReference, setCardReference] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Sound/notification alert
  const [lastScanAlert, setLastScanAlert] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  // Focus ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = ['todos', 'Escolares', 'Papelería', 'Oficina', 'Arte y Dibujo', 'Tecnología'];

  // Global barcode scanner & keyboard shortcuts
  useBarcodeScanner({
    onScan: (barcode) => {
      handleBarcodeScan(barcode);
    },
    onF2: () => {
      if (cart.length > 0) {
        openCheckout();
      }
    },
    onF4: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onF8: () => {
      setShowServices((prev) => !prev);
    },
    onF9: () => {
      handleClearCart();
    },
    onEscape: () => {
      if (isCheckoutOpen) {
        setIsCheckoutOpen(false);
      }
      if (completedSale) {
        setCompletedSale(null);
      }
    },
  });

  // Calculate Cart Totals
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

  // Handle Barcode Scan
  const handleBarcodeScan = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    // Search by barcode in products
    const product = products.find(
      (p) => p.barcode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (product) {
      if (product.isActive === false) {
        showScanNotice(`⚠️ ${product.name} está desactivado en el inventario`, 'warn');
        return;
      }
      addProductToCart(product);
      showScanNotice(`✓ ${product.name} agregado`, 'success');
      setSearchTerm('');
    } else {
      // Check if it's an alias or part of name
      const byName = products.find(
        (p) => p.name.toLowerCase().includes(cleanCode.toLowerCase()) && p.isActive !== false
      );
      if (byName) {
        addProductToCart(byName);
        showScanNotice(`✓ ${byName.name} agregado`, 'success');
        setSearchTerm('');
      } else {
        showScanNotice(`Código ${cleanCode} no encontrado en catálogo`, 'warn');
      }
    }
  };

  const showScanNotice = (message: string, type: 'success' | 'warn') => {
    setLastScanAlert({ message, type });
    setTimeout(() => {
      setLastScanAlert((curr) => (curr?.message === message ? null : curr));
    }, 2800);
  };

  // Add Product to Cart
  const addProductToCart = (product: Product, asPackage = false) => {
    setCart((prev) => {
      const isPkg = asPackage && product.unitType === 'paquete';
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.packageMode === (isPkg ? 'paquete' : 'pieza')
      );

      const price = isPkg ? (product.packageSalePrice || product.salePrice * product.packageUnits) : product.salePrice;
      const cost = isPkg ? (product.packageCostPrice || product.costPrice * product.packageUnits) : product.costPrice;

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantity + 1;
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          subtotal: Number((newQty * price).toFixed(2)),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${isPkg ? 'pkg' : 'pza'}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          price: price,
          costPrice: cost,
          quantity: 1,
          isService: false,
          packageMode: isPkg ? 'paquete' : 'pieza',
          subtotal: price,
          brand: product.brand,
        };
        return [...prev, newItem];
      }
    });
  };

  // Add Service to Cart
  const addServiceToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === service.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantity + 1;
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQty,
          subtotal: Number((newQty * service.price).toFixed(2)),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `${service.id}-${Date.now()}`,
          productId: service.id,
          name: service.name,
          barcode: `SRV-${service.id}`,
          price: service.price,
          costPrice: Number((service.price * 0.2).toFixed(2)), // Estimated 20% consumables cost
          quantity: 1,
          isService: true,
          packageMode: 'pieza',
          subtotal: service.price,
        };
        return [...prev, newItem];
      }
    });
    showScanNotice(`✓ ${service.name} agregado`, 'success');
  };

  // Update item quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: Number((newQty * item.price).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item
  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Clear Cart (F9)
  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      showScanNotice('Carrito vaciado', 'warn');
    }
  };

  // Open Checkout (F2)
  const openCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(totalAmount.toFixed(2));
    setCardReference('');
    setPaymentMethod('efectivo');
    setIsCheckoutOpen(true);
  };

  // Execute Checkout
  const handleFinishCheckout = () => {
    if (!activeShift) {
      alert('Debes abrir un turno de caja antes de cobrar.');
      onOpenShiftModal();
      return;
    }

    const receivedNum = parseFloat(cashReceived) || 0;
    if (paymentMethod === 'efectivo' && receivedNum < totalAmount) {
      alert('El efectivo recibido es menor al total de la venta.');
      return;
    }

    const change = paymentMethod === 'efectivo' ? Math.max(0, receivedNum - totalAmount) : 0;

    const newSale: Sale = {
      id: `TK-${Date.now().toString().slice(-6)}`,
      folio: Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      items: [...cart],
      total: Number(totalAmount.toFixed(2)),
      costTotal: Number(totalCost.toFixed(2)),
      profit: Number((totalAmount - totalCost).toFixed(2)),
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? receivedNum : totalAmount,
      change: Number(change.toFixed(2)),
      cardReference: paymentMethod === 'tarjeta' ? cardReference : undefined,
      cashShiftId: activeShift.id,
      cashierName: activeShift.openedBy || 'Admin',
      status: 'completada',
    };

    // Deduct stock for physical products
    cart.forEach((item) => {
      if (!item.isService) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const deduction = item.packageMode === 'paquete' ? item.quantity * prod.packageUnits : item.quantity;
          onUpdateProductStock(item.productId, deduction);
        }
      }
    });

    onCompleteSale(newSale);
    setCompletedSale(newSale);
    setIsCheckoutOpen(false);
    setCart([]);
  };

  // Filtered Products for Catalog Search (only active products)
  const filteredProducts = products.filter((prod) => {
    if (prod.isActive === false) return false;
    const matchesCategory = selectedCategory === 'todos' || prod.category === selectedCategory;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesCategory;

    return (
      matchesCategory &&
      (prod.name.toLowerCase().includes(term) ||
        prod.barcode.toLowerCase().includes(term) ||
        prod.brand.toLowerCase().includes(term))
    );
  });

  const activeServices = services.filter((s) => s.isActive !== false);

  // Numeric change calculator helper
  const parsedReceived = parseFloat(cashReceived) || 0;
  const calculatedChange = Math.max(0, parsedReceived - totalAmount);

  // Quick cash tender helper buttons
  const cashSuggestions = [
    { label: 'Exacto', value: totalAmount },
    { label: '$20', value: 20 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
    { label: '$200', value: 200 },
    { label: '$500', value: 500 },
  ].filter((s) => s.value >= totalAmount || s.label === 'Exacto');

  // Render Service Icon
  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Copy':
        return <Copy className="w-4 h-4 text-[#1F4461]" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-[#9CC55B]" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-[#1F4461]" />;
      case 'ScanLine':
        return <ScanLine className="w-4 h-4 text-[#F3C16C]" />;
      case 'ShieldCheck':
      case 'Layers':
        return <Layers className="w-4 h-4 text-[#9CC55B]" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-[#1F4461]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#9CC55B]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 pb-16 md:pb-0 relative">
      {/* Mobile Segmented Switch (Visible strictly on mobile & tablet screens < lg) */}
      <div className="lg:hidden p-2 bg-[#1F4461] text-white flex items-center gap-2 border-b border-[#163248] shrink-0 sticky top-0 z-20">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-[#9CC55B] text-[#1F4461] shadow-md'
              : 'bg-white/10 text-gray-200 hover:bg-white/20'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Productos ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-[#9CC55B] text-[#1F4461] shadow-md'
              : 'bg-white/10 text-gray-200 hover:bg-white/20'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Ticket ({totalItemsCount}) • ${totalAmount.toFixed(2)}</span>
        </button>
      </div>

      {/* Alert toast for barcode scanner / fast actions */}
      {lastScanAlert && (
        <div
          className={`fixed top-14 sm:top-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold transition-all animate-bounce ${
            lastScanAlert.type === 'success'
              ? 'bg-[#1F4461] text-white border border-[#9CC55B]'
              : 'bg-amber-600 text-white'
          }`}
        >
          <span>{lastScanAlert.message}</span>
        </div>
      )}

      {/* LEFT COLUMN: Search, Services & Product Selector */}
      <div
        className={`flex-1 flex-col min-w-0 overflow-y-auto border-r border-gray-200 ${
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Top Search & Barcode Input Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-gray-200 shadow-xs sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    handleBarcodeScan(searchTerm);
                  }
                }}
                placeholder="Escanea código de barras o busca por nombre (F4)..."
                className="w-full pl-11 pr-14 py-2.5 sm:py-3 rounded-xl bg-gray-100 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1F4461] focus:ring-2 focus:ring-[#1F4461]/20 text-sm sm:text-base font-medium transition outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Barcode className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500 font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded">F4</span>
              </div>
            </div>

            {/* Services Toggle Button (F8) */}
            <button
              onClick={() => setShowServices(!showServices)}
              className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-bold border transition cursor-pointer shrink-0 ${
                showServices
                  ? 'bg-[#1F4461] text-white border-[#1F4461]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#F3C16C]" />
              <span className="hidden sm:inline">Servicios</span>
              <span className="text-xs opacity-75 font-mono font-bold">F8</span>
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                  selectedCategory === cat
                    ? 'bg-[#1F4461] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Services Panel (Physical-Inventory-Free: Copias, Impresiones, Enmicados) */}
        {showServices && activeServices.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1F4461]" />
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1F4461] uppercase tracking-wider">
                  Venta Rápida de Servicios (Sin Inventario)
                </h4>
              </div>
              <span className="text-xs text-gray-600 font-medium">1-clic para agregar al ticket</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {activeServices.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => addServiceToCart(srv)}
                  className="flex flex-col text-left p-3 rounded-xl bg-white hover:bg-white/95 border border-emerald-200/90 shadow-2xs hover:shadow-sm hover:border-[#9CC55B] transition-all group cursor-pointer active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 rounded-lg bg-gray-50 group-hover:bg-[#9CC55B]/15 transition">
                      {getServiceIcon(srv.iconName)}
                    </div>
                    <span className="font-extrabold text-sm text-[#1F4461] font-mono">${srv.price.toFixed(2)}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#1F4461]">
                    {srv.name}
                  </span>
                  <span className="text-xs text-gray-500 capitalize font-medium">{srv.unit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="p-3.5 sm:p-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs sm:text-sm font-bold text-gray-600">
              Mostrando {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-300">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2.5" />
              <p className="text-base font-bold text-gray-800">No se encontraron productos</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Prueba con otra palabra o verifica el código de barras.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((prod) => {
                const isLowStock = prod.stock <= prod.minStock;
                const hasPackage = prod.unitType === 'paquete' && prod.packageUnits > 1;

                return (
                  <div
                    key={prod.id}
                    className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#1F4461]/40 hover:shadow-md transition-all relative group"
                  >
                    <div>
                      {/* Brand and low stock flag */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate max-w-[110px]">
                          {prod.brand || prod.category}
                        </span>
                        {isLowStock ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900">
                            Bajo ({prod.stock})
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono font-medium">Stock: {prod.stock}</span>
                        )}
                      </div>

                      {/* Product Name (Clean, readable, well proportioned) */}
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-2.5 min-h-[42px]">
                        {prod.name}
                      </h4>
                    </div>

                    {/* Pricing & Add buttons */}
                    <div className="mt-1 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-black text-[#1F4461] font-mono">${prod.salePrice.toFixed(2)}</span>
                        <button
                          onClick={() => addProductToCart(prod, false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white text-xs sm:text-sm font-bold transition shadow-2xs cursor-pointer active:scale-95"
                          title="Vender por pieza suelta"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pieza</span>
                        </button>
                      </div>

                      {/* Option to sell complete package / box */}
                      {hasPackage && prod.packageSalePrice && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-gray-200">
                          <span className="text-xs sm:text-sm font-bold text-emerald-800 font-mono">
                            ${prod.packageSalePrice.toFixed(2)}{' '}
                            <span className="text-xs text-gray-500 font-normal">({prod.packageUnits} pz)</span>
                          </span>
                          <button
                            onClick={() => addProductToCart(prod, true)}
                            className="px-2.5 py-1 rounded-lg bg-[#9CC55B]/25 hover:bg-[#9CC55B]/40 text-[#1F4461] text-xs font-bold border border-[#9CC55B]/50 transition cursor-pointer"
                            title={`Vender paquete completo de ${prod.packageUnits} piezas`}
                          >
                            Caja
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Sticky Cart Bar (only shown on mobile in catalog view when cart has items) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3.5 bg-[#1F4461] border-t border-[#163248] text-white flex items-center justify-between sticky bottom-0 z-20 shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#9CC55B] text-[#1F4461] font-extrabold text-sm flex items-center justify-center">
                {totalItemsCount}
              </span>
              <span className="text-sm font-semibold">Total:</span>
              <span className="font-black text-lg text-[#9CC55B] font-mono">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('cart')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold text-gray-200 transition cursor-pointer"
              >
                Ver Ticket
              </button>
              <button
                onClick={openCheckout}
                className="px-4 py-2 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] text-sm font-black transition cursor-pointer shadow-md active:scale-95"
              >
                Cobrar (F2)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Ticket Cart, Totals & Checkout Button */}
      <div
        className={`w-full lg:w-[380px] xl:w-[420px] flex-col bg-white border-l border-gray-200 shadow-sm shrink-0 ${
          mobileTab === 'cart' ? 'flex flex-1 overflow-hidden' : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileTab('catalog')}
              className="lg:hidden flex items-center gap-1 text-sm text-[#1F4461] font-bold px-2.5 py-1 rounded-lg bg-gray-200/80 hover:bg-gray-300 transition cursor-pointer"
              title="Volver al catálogo"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Catálogo</span>
            </button>
            <span className="font-bold text-base text-[#1F4461]">Ticket Actual</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1F4461] text-white">
              {totalItemsCount}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
              title="Vaciar ticket completo (F9)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar (F9)</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[calc(100vh-320px)] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Barcode className="w-12 h-12 text-gray-300 stroke-[1.2] mb-2.5 animate-pulse" />
              <p className="text-sm font-bold text-gray-700">El carrito está vacío</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                Escanea un código de barras o selecciona servicios rápidos para comenzar.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2 hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5 font-medium">
                      <span className="font-bold text-gray-800">${item.price.toFixed(2)} c/u</span>
                      {item.packageMode === 'paquete' && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Caja / Pq</span>
                      )}
                      {item.isService && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Servicio</span>
                      )}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <span className="text-base font-bold text-[#1F4461] shrink-0 font-mono">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 bg-white rounded-lg border border-gray-300 p-0.5 shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                      title="Disminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                      title="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar del ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 shadow-inner space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 font-medium">
              <span>Artículos:</span>
              <span className="font-bold text-gray-900">{totalItemsCount} piezas</span>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-gray-200">
              <span className="text-xs uppercase font-bold text-gray-700 tracking-wider">Total a Cobrar:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#1F4461] font-mono tracking-tight">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Large Action Cobrar (F2) Button */}
          <button
            disabled={cart.length === 0}
            onClick={openCheckout}
            className={`w-full py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              cart.length > 0
                ? 'bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] hover:shadow active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Banknote className="w-5 h-5 stroke-[2.5]" />
            <span>Cobrar Venta</span>
            <kbd className="text-[11px] bg-[#1F4461] text-white px-2 py-0.5 rounded font-mono font-bold">F2</kbd>
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL (Cobro con cálculo de cambio automático y tarjeta) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#1F4461] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-xl">Cobrar Venta</h3>
                <p className="text-sm text-gray-300 mt-0.5">Ticket con {totalItemsCount} productos</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-300 block uppercase font-bold tracking-wider">Total a pagar:</span>
                <span className="text-3xl font-black text-[#9CC55B] font-mono">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Payment Method Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                    paymentMethod === 'efectivo'
                      ? 'bg-white text-[#1F4461] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#9CC55B]" />
                  <span>Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-white text-[#1F4461] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#1F4461]" />
                  <span>Terminal Bancaria</span>
                </button>
              </div>

              {/* Cash payment details */}
              {paymentMethod === 'efectivo' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">
                      Efectivo Recibido ($):
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-2xl">$</span>
                      <input
                        type="number"
                        step="0.50"
                        autoFocus
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishCheckout();
                        }}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-[#1F4461] text-2xl sm:text-3xl font-black font-mono text-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Fast Tender Buttons ($20, $50, $100, $200, $500, Exacto) */}
                  <div className="flex flex-wrap gap-2.5">
                    {cashSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCashReceived(item.value.toString())}
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-800 border border-gray-300/80 transition cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Output Card */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      parsedReceived >= totalAmount
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-extrabold uppercase tracking-wide block">
                        {parsedReceived >= totalAmount ? 'Cambio a entregar:' : 'Falta dinero:'}
                      </span>
                      <span className="text-xs opacity-75 font-semibold">
                        Recibido: ${parsedReceived.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-3xl font-black font-mono">
                      ${calculatedChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Card payment details */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">
                      Últimos 4 dígitos o referencia de aprobación:
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="Ej. 4829 o REF-1092"
                      value={cardReference}
                      onChange={(e) => setCardReference(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-[#1F4461] text-base font-mono outline-none"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-2.5 font-medium">
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Se registrará un cargo de <strong className="font-extrabold font-mono text-base">${totalAmount.toFixed(2)}</strong> a la terminal bancaria.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3.5">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                Cancelar (ESC)
              </button>
              <button
                disabled={paymentMethod === 'efectivo' && parsedReceived < totalAmount}
                onClick={handleFinishCheckout}
                className={`px-6 py-3.5 rounded-xl text-base font-black shadow-md transition cursor-pointer flex items-center gap-2.5 ${
                  paymentMethod === 'efectivo' && parsedReceived < totalAmount
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] hover:shadow-lg active:scale-98'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Confirmar Pago e Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE TICKET PREVIEW */}
      {completedSale && (
        <ThermalTicket
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
