import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Product,
  ServiceItem,
  CartItem,
  Sale,
  CashShift,
  HeldSale,
  ActiveModule,
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
  Receipt,
  FileSpreadsheet,
  PauseCircle,
  PlayCircle,
  Tag,
  Percent,
  X,
  Clock,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { ThermalTicket } from './ThermalTicket';
import { ReceiptHistoryModal } from './ReceiptHistoryModal';
import { QuotationModal } from './QuotationModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { getHeldSales, saveHeldSales } from '../../services/storage';
import {
  getProductColorTheme,
  getCategoryColor,
  ARCOIRIS_PALETTE,
  RAINBOW_COLORS,
} from '../../utils/arcoirisColors';

interface PosModuleProps {
  products: Product[];
  services: ServiceItem[];
  activeShift: CashShift | null;
  sales: Sale[];
  userRole: string | null;
  onCompleteSale: (sale: Sale) => void;
  onOpenShiftModal: () => void;
  onUpdateProductStock: (productId: string, quantityDeducted: number) => void;
  onCancelSale: (saleId: string, reason: string) => void;
  onReturnToSystem?: () => void;
  onSelectModule?: (module: ActiveModule) => void;
}

export const PosModule: React.FC<PosModuleProps> = ({
  products,
  services,
  activeShift,
  sales,
  userRole,
  onCompleteSale,
  onOpenShiftModal,
  onUpdateProductStock,
  onCancelSale,
  onReturnToSystem,
  onSelectModule,
}) => {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showServices, setShowServices] = useState(true);
  const [showModuleMenu, setShowModuleMenu] = useState(false);

  // Discount on Cart state
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<string>('5');

  // Checkout Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cardReference, setCardReference] = useState<string>('');

  // Ticket preview & reprint modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState<boolean>(false);

  // Held Sales (Poner venta en espera / recuperar venta)
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => getHeldSales());
  const [isHeldModalOpen, setIsHeldModalOpen] = useState<boolean>(false);
  const [heldCustomerName, setHeldCustomerName] = useState<string>('');

  // Toast alert on barcode scan
  const [lastScanAlert, setLastScanAlert] = useState<{
    message: string;
    type: 'success' | 'warn';
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (F2: Cobrar, F4: Buscar, F8: Servicios, F9: En espera / Nueva)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
      } else if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowServices((prev) => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setIsHeldModalOpen(true);
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsHistoryOpen(false);
        setIsQuotationOpen(false);
        setIsHeldModalOpen(false);
        setShowModuleMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Fast Barcode Scanner Integration
  const handleBarcodeScan = (scannedCode: string) => {
    const clean = scannedCode.trim().toLowerCase();
    if (!clean) return;

    const matchedProduct = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.name && p.name.toLowerCase().includes(clean))
    );

    if (matchedProduct) {
      if (matchedProduct.isActive === false) {
        showTemporaryAlert(`"${matchedProduct.name}" está inactivo en el catálogo.`, 'warn');
        return;
      }
      addProductToCart(matchedProduct, false);
      showTemporaryAlert(`+1 ${matchedProduct.name} agregado al ticket`, 'success');
      setSearchTerm('');
    } else {
      showTemporaryAlert(`Código de barras "${scannedCode}" no encontrado`, 'warn');
    }
  };

  useBarcodeScanner({
    onScan: handleBarcodeScan,
  });

  const showTemporaryAlert = (message: string, type: 'success' | 'warn') => {
    setLastScanAlert({ message, type });
    setTimeout(() => setLastScanAlert(null), 2500);
  };

  // Add Product to Cart (Pieza or Paquete)
  const addProductToCart = (product: Product, isPackage = false) => {
    const unitPrice =
      isPackage && product.packageSalePrice ? product.packageSalePrice : product.salePrice;
    const displayName = isPackage
      ? `${product.name} (Paquete c/${product.packageUnits || 1})`
      : product.name;

    const itemKey = `${product.id}-${isPackage ? 'pack' : 'piece'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.id === itemKey
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      const newItem: CartItem = {
        id: itemKey,
        productId: product.id,
        name: displayName,
        barcode: product.barcode || '',
        price: unitPrice,
        costPrice: product.costPrice,
        quantity: 1,
        subtotal: unitPrice,
        unitType: isPackage ? 'paquete' : product.unitType,
        isPackage,
        packageMode: isPackage ? 'paquete' : 'pieza',
        isService: false,
      };
      return [...prev, newItem];
    });
  };

  // Add Service Item to Cart (Copias, Impresiones, etc.)
  const addServiceToCart = (service: ServiceItem) => {
    const itemKey = `srv-${service.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.id === itemKey
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      const newItem: CartItem = {
        id: itemKey,
        productId: service.id,
        name: service.name,
        barcode: '',
        price: service.price,
        costPrice: service.costPrice || 0,
        quantity: 1,
        subtotal: service.price,
        unitType: service.unit,
        packageMode: 'pieza',
        isPackage: false,
        isService: true,
      };
      return [...prev, newItem];
    });
  };

  // Modify quantity of item in cart
  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.price,
            }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Clear current cart
  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  // Save current cart as Held Sale (Pausar venta)
  const handleHoldCurrentSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newHeld: HeldSale = {
      id: `held-${Date.now()}`,
      label: heldCustomerName.trim() || `Cliente #${heldSales.length + 1}`,
      customerName: heldCustomerName.trim() || `Cliente #${heldSales.length + 1}`,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: cart,
      total: totalAmount,
    };

    const updated = [newHeld, ...heldSales];
    setHeldSales(updated);
    saveHeldSales(updated);
    setCart([]);
    setIsHeldModalOpen(false);
    setHeldCustomerName('');
    showTemporaryAlert('Venta guardada en espera.', 'success');
  };

  // Resume a held sale
  const handleResumeHeldSale = (held: HeldSale) => {
    if (cart.length > 0) {
      if (!confirm('Ya tienes artículos en el ticket actual. ¿Deseas reemplazarlos con la venta en espera?')) {
        return;
      }
    }
    setCart(held.items);
    const updated = heldSales.filter((h) => h.id !== held.id);
    setHeldSales(updated);
    saveHeldSales(updated);
    setIsHeldModalOpen(false);
    showTemporaryAlert(`Venta de "${held.customerName}" restaurada al ticket`, 'success');
  };

  // Delete a held sale
  const handleDeleteHeldSale = (heldId: string) => {
    const updated = heldSales.filter((h) => h.id !== heldId);
    setHeldSales(updated);
    saveHeldSales(updated);
  };

  // Totals calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Discount calculation
  const parsedDiscountVal = parseFloat(discountValue) || 0;
  const computedDiscount = isDiscountEnabled
    ? discountType === 'percent'
      ? (totalAmount * Math.min(100, Math.max(0, parsedDiscountVal))) / 100
      : Math.min(totalAmount, Math.max(0, parsedDiscountVal))
    : 0;

  const finalPayableTotal = Math.max(0, totalAmount - computedDiscount);

  // Available categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['todos', ...cats];
  }, [products]);

  // Open Checkout Modal
  const openCheckout = () => {
    if (cart.length === 0) return;
    setCashReceived(finalPayableTotal.toFixed(2));
    setPaymentMethod('efectivo');
    setIsCheckoutOpen(true);
  };

  // Complete and record sale
  const handleFinishCheckout = () => {
    const receivedNum = parseFloat(cashReceived) || finalPayableTotal;

    if (paymentMethod === 'efectivo' && receivedNum < finalPayableTotal) {
      alert('El monto en efectivo recibido es menor al total a cobrar.');
      return;
    }

    const nextFolio =
      sales.length > 0 ? Math.max(...sales.map((s) => s.folio || 0)) + 1 : 1001;

    const costTotal = cart.reduce((sum, it) => sum + (it.costPrice || 0) * it.quantity, 0);
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      folio: nextFolio,
      date: new Date().toISOString(),
      items: [...cart],
      total: finalPayableTotal,
      costTotal,
      profit: Math.max(0, finalPayableTotal - costTotal),
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? receivedNum : finalPayableTotal,
      change: paymentMethod === 'efectivo' ? Math.max(0, receivedNum - finalPayableTotal) : 0,
      cardReference: paymentMethod === 'tarjeta' ? cardReference : undefined,
      cashierName: userRole || 'Cajero',
      cashShiftId: activeShift ? activeShift.id : 'shift-default',
      status: 'completada',
      discount: computedDiscount,
      discountType: isDiscountEnabled ? discountType : undefined,
      originalTotal: totalAmount,
    };

    onCompleteSale(newSale);
    setCompletedSale(newSale);
    setIsCheckoutOpen(false);
    setCart([]);
  };

  // Filtered Products for Catalog Search (only active products, newest first)
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        if (prod.isActive === false) return false;
        const matchesCategory = selectedCategory === 'todos' || prod.category === selectedCategory;
        const term = searchTerm.toLowerCase().trim();
        if (!term) return matchesCategory;

        const nameMatch = (prod.name || '').toLowerCase().includes(term);
        const barcodeMatch = (prod.barcode || '').toLowerCase().includes(term);
        const brandMatch = (prod.brand || '').toLowerCase().includes(term);

        return matchesCategory && (nameMatch || barcodeMatch || brandMatch);
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return b.id.localeCompare(a.id);
      });
  }, [products, selectedCategory, searchTerm]);

  const activeServices = services.filter((s) => s.isActive !== false);

  // Numeric change calculator helper
  const parsedReceived = parseFloat(cashReceived) || 0;
  const calculatedChange = Math.max(0, parsedReceived - finalPayableTotal);

  // Quick cash tender helper buttons
  const cashSuggestions = [
    { label: 'Exacto', value: finalPayableTotal },
    { label: '$20', value: 20 },
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
    { label: '$200', value: 200 },
    { label: '$500', value: 500 },
  ].filter((s) => s.value >= finalPayableTotal || s.label === 'Exacto');

  // Service icons mapper
  const getServiceIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Copy':
        return <Copy className="w-5 h-5 text-[#008CEB]" />;
      case 'Printer':
        return <Printer className="w-5 h-5 text-[#2AB3FE]" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-[#FA2400]" />;
      case 'ScanLine':
        return <ScanLine className="w-5 h-5 text-[#FFB100]" />;
      case 'ShieldCheck':
      case 'Layers':
        return <Layers className="w-5 h-5 text-[#9949E8]" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-[#00D700]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#FA2400]" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-hidden bg-gray-100 relative">
      {/* Mobile Top Segmented Switch (Visible strictly on mobile/tablet < lg) */}
      <div className="lg:hidden p-2 bg-[#282829] text-white flex items-center justify-between gap-2 border-b-2 border-[#FA2400] shrink-0 sticky top-0 z-30 shadow-md">
        {onReturnToSystem && (
          <button
            onClick={onReturnToSystem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs transition cursor-pointer"
            title="Regresar al Menú Principal del Sistema"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFF300]" />
            <span>Sistema</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'catalog'
                ? 'bg-[#FA2400] text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catálogo ({filteredProducts.length})</span>
          </button>

          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'cart'
                ? 'bg-[#00D700] text-gray-950 shadow-md font-black'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Ticket ({totalItemsCount})</span>
          </button>
        </div>
      </div>

      {/* Alert toast for barcode scanner / fast actions */}
      {lastScanAlert && (
        <div
          className={`fixed top-14 sm:top-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black transition-all animate-bounce ${
            lastScanAlert.type === 'success'
              ? 'bg-[#282829] text-white border-2 border-[#00D700]'
              : 'bg-[#FA2400] text-white'
          }`}
        >
          <span>{lastScanAlert.message}</span>
        </div>
      )}

      {/* LEFT COLUMN: Search, Categories, Services & Pro Colorful Products */}
      <div
        className={`flex-1 flex-col min-w-0 overflow-y-auto ${
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Top Sticky Pro Bar: Return Button, Search & Quick Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-gray-200 shadow-xs sticky top-0 z-20">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
            {/* Prominent Return to System Button */}
            {onReturnToSystem && (
              <div className="relative">
                <div className="flex items-center">
                  <button
                    onClick={onReturnToSystem}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 text-[#282829] font-black text-xs sm:text-sm border-2 border-[#FA2400]/30 hover:border-[#FA2400] shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                    title="Regresar al Menú y Módulos del Sistema"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#FA2400] stroke-[3]" />
                    <span className="hidden sm:inline">Regresar al Sistema</span>
                    <span className="sm:hidden font-black">Sistema</span>
                  </button>

                  {onSelectModule && (
                    <button
                      onClick={() => setShowModuleMenu(!showModuleMenu)}
                      className="ml-1 p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                      title="Abrir menú de módulos"
                    >
                      <LayoutGrid className="w-4 h-4 text-[#FA2400]" />
                    </button>
                  )}
                </div>

                {/* Quick Module Switcher Dropdown */}
                {showModuleMenu && onSelectModule && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                      Módulos del Sistema
                    </div>
                    {[
                      { id: 'inventory' as ActiveModule, label: 'Catálogo e Inventario', color: '#008CEB' },
                      { id: 'purchases' as ActiveModule, label: 'Compras y Entradas', color: '#FFB100' },
                      { id: 'cash' as ActiveModule, label: 'Control de Caja', color: '#00D700' },
                      { id: 'reports' as ActiveModule, label: 'Reportes y Finanzas', color: '#9949E8' },
                      { id: 'manual' as ActiveModule, label: 'Manual de Usuario', color: '#2AB3FE' },
                      { id: 'profile' as ActiveModule, label: 'Mi Perfil', color: '#FA2400' },
                    ].map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setShowModuleMenu(false);
                          onSelectModule(mod.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-black transition cursor-pointer text-left"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: mod.color }}
                        />
                        <span>{mod.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Large Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    handleBarcodeScan(searchTerm);
                  }
                }}
                placeholder="Escanea código o busca por nombre (F4)..."
                className="w-full pl-11 pr-14 py-2.5 sm:py-3 rounded-2xl bg-gray-50 hover:bg-white focus:bg-white border-2 border-gray-200 focus:border-[#FA2400] focus:ring-2 focus:ring-[#FA2400]/20 text-sm sm:text-base font-bold transition outline-none shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Barcode className="w-5 h-5 text-gray-400" />
                <span className="text-[11px] text-gray-500 font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded">F4</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Services Toggle Button (F8) */}
              <button
                onClick={() => setShowServices(!showServices)}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black border-2 transition cursor-pointer ${
                  showServices
                    ? 'bg-[#FA2400] text-white border-[#FA2400] shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title="Mostrar/Ocultar Venta Rápida de Servicios (Copias, Impresiones)"
              >
                <Sparkles className="w-4 h-4 text-[#FFF300]" />
                <span className="hidden md:inline">Servicios</span>
                <span className="text-[10px] opacity-90 font-mono font-bold">F8</span>
              </button>

              {/* Tickets History Button */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 transition cursor-pointer"
                title="Historial de tickets emitidos y cancelaciones"
              >
                <Receipt className="w-4 h-4 text-[#008CEB]" />
                <span className="hidden xl:inline">Tickets</span>
              </button>

              {/* Held Sales Button */}
              <button
                onClick={() => setIsHeldModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black border transition cursor-pointer relative ${
                  heldSales.length > 0
                    ? 'bg-[#FFB100]/20 border-[#FFB100] text-gray-950'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Ventas en espera"
              >
                <Clock className="w-4 h-4 text-[#FFB100]" />
                <span className="hidden xl:inline">En Espera</span>
                {heldSales.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FFB100] text-gray-950 font-black text-[10px] flex items-center justify-center">
                    {heldSales.length}
                  </span>
                )}
              </button>

              {/* Quotation Button */}
              <button
                disabled={cart.length === 0}
                onClick={() => setIsQuotationOpen(true)}
                className={`flex items-center gap-1 px-3 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black border transition cursor-pointer ${
                  cart.length > 0
                    ? 'border-[#2AB3FE] bg-cyan-50 text-cyan-950 hover:bg-cyan-100'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                }`}
                title="Cotizar lista escolar"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2AB3FE]" />
                <span className="hidden xl:inline">Cotizar</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar with Pantone Arcoíris Colors */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const catColor = getCategoryColor(cat);
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={
                    isSelected
                      ? { backgroundColor: catColor.hex, color: cat === 'todos' || cat === 'papelería' || cat === 'oficina' ? '#ffffff' : '#0f172a' }
                      : undefined
                  }
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer capitalize shadow-xs border ${
                    isSelected
                      ? 'shadow-md scale-102 border-transparent'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  {cat === 'todos' ? '🌈 Todos los Productos' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Services Panel (Large Colorful Service Buttons) */}
        {showServices && activeServices.length > 0 && (
          <div className="p-3.5 sm:p-5 bg-gradient-to-r from-red-50/40 via-amber-50/40 to-blue-50/40 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FA2400]" />
                <h4 className="text-xs sm:text-sm font-black text-[#282829] uppercase tracking-wider">
                  Venta Rápida de Servicios (Sin Inventario Físico)
                </h4>
              </div>
              <span className="text-xs text-gray-500 font-bold hidden sm:inline">
                Toca cualquier botón para agregarlo al ticket al instante
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {activeServices.map((srv, idx) => {
                const srvTheme = RAINBOW_COLORS[idx % RAINBOW_COLORS.length];
                return (
                  <button
                    key={srv.id}
                    onClick={() => addServiceToCart(srv)}
                    className="flex flex-col text-left p-3.5 rounded-2xl bg-white hover:bg-white border-2 border-gray-200 hover:border-[#FA2400] shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95 relative overflow-hidden"
                  >
                    {/* Top colored accent indicator */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: srvTheme.hex }}
                    />
                    <div className="flex items-center justify-between mb-2 mt-1">
                      <div className="p-2 rounded-xl bg-gray-50 group-hover:scale-110 transition">
                        {getServiceIcon(srv.iconName)}
                      </div>
                      <span
                        className="font-black text-base font-mono px-2 py-0.5 rounded-lg text-white"
                        style={{ backgroundColor: srvTheme.hex }}
                      >
                        ${srv.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-[#FA2400]">
                      {srv.name}
                    </span>
                    <span className="text-[11px] text-gray-500 capitalize font-bold mt-1">
                      {srv.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Full-Screen Pro Product Grid with Big Colorful Buttons */}
        <div className="p-3.5 sm:p-5 flex-1">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-xs sm:text-sm font-black text-gray-700">
              Mostrando {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'} en catálogo
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-300">
              <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-black text-gray-800">No se encontraron productos</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Verifica el término de búsqueda o asegúrate de que el producto esté activo en el catálogo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4.5">
              {filteredProducts.map((prod, index) => {
                const isLowStock = prod.stock <= prod.minStock;
                const hasPackage = prod.unitType === 'paquete' && prod.packageUnits > 1;
                const theme = getProductColorTheme(prod.id, index);

                return (
                  <div
                    key={prod.id}
                    onClick={() => addProductToCart(prod, false)}
                    className="flex flex-col justify-between p-4 sm:p-4.5 rounded-3xl bg-white border-2 border-gray-200/90 hover:border-[#FA2400] shadow-sm hover:shadow-xl transition-all duration-200 relative group cursor-pointer select-none active:scale-[0.98] overflow-hidden"
                  >
                    {/* Top Pantone Rainbow Accent Bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-2"
                      style={{ backgroundColor: theme.hex }}
                    />

                    <div>
                      {/* Brand & Stock Pill */}
                      <div className="flex items-center justify-between mb-2 pt-1">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider truncate max-w-[120px]">
                          {prod.brand || prod.category}
                        </span>
                        {isLowStock ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FFB100] text-gray-950">
                            Bajo ({prod.stock})
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono font-bold">
                            Stock: {prod.stock}
                          </span>
                        )}
                      </div>

                      {/* Product Name (Large, clear, highly readable) */}
                      <h4 className="text-sm sm:text-base font-black text-[#282829] leading-tight line-clamp-2 min-h-[40px] mb-3 group-hover:text-[#FA2400] transition-colors">
                        {prod.name}
                      </h4>
                    </div>

                    {/* Pricing Badge & Large Action Buttons */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        {/* High-visibility colored price tag */}
                        <div
                          className="px-2.5 py-1 rounded-xl text-white font-mono font-black text-base sm:text-lg shadow-xs"
                          style={{ backgroundColor: theme.hex }}
                        >
                          ${prod.salePrice.toFixed(2)}
                        </div>

                        {/* Large Touch Piece Add Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addProductToCart(prod, false);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#282829] hover:bg-[#FA2400] text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer active:scale-95"
                          title="Vender por pieza suelta"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Agregar</span>
                        </button>
                      </div>

                      {/* Package / Box Full Sale Option */}
                      {hasPackage && prod.packageSalePrice && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200"
                        >
                          <span className="text-xs font-bold text-gray-700 font-mono">
                            ${prod.packageSalePrice.toFixed(2)}{' '}
                            <span className="text-[11px] text-gray-500 font-medium">({prod.packageUnits} pz)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => addProductToCart(prod, true)}
                            className="px-2.5 py-1 rounded-lg bg-[#008CEB]/15 hover:bg-[#008CEB]/30 text-[#008CEB] text-xs font-black border border-[#008CEB]/40 transition cursor-pointer"
                            title={`Vender paquete completo de ${prod.packageUnits} piezas`}
                          >
                            + Caja
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

        {/* Mobile Sticky Cart Bar (Always unobstructed at the very bottom since BottomNav is hidden in POS) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3.5 bg-[#282829] border-t-4 border-[#FA2400] text-white flex items-center justify-between sticky bottom-0 z-30 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-2xl bg-[#FA2400] text-white font-black text-sm flex items-center justify-center shadow-md">
                {totalItemsCount}
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                  Total Ticket:
                </span>
                <span className="font-black text-xl text-[#00D700] font-mono leading-none">
                  ${finalPayableTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('cart')}
                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition cursor-pointer"
              >
                Ver Ticket
              </button>
              <button
                onClick={openCheckout}
                className="px-5 py-2.5 rounded-xl bg-[#00D700] hover:bg-[#00be00] text-gray-950 text-sm font-black transition cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <Banknote className="w-4 h-4 stroke-[2.5]" />
                <span>Cobrar (F2)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Ticket Cart, Totals & Checkout Button */}
      <div
        className={`w-full lg:w-[400px] xl:w-[440px] flex-col bg-white border-l border-gray-200 shadow-xl shrink-0 ${
          mobileTab === 'cart' ? 'flex flex-1 overflow-hidden' : 'hidden lg:flex'
        }`}
      >
        {/* Ticket Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#FA2400]" />
            <h3 className="font-black text-base text-[#282829]">Ticket Actual</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#FA2400]/10 text-[#FA2400]">
              {totalItemsCount} arts
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={cart.length === 0}
              onClick={() => setIsHeldModalOpen(true)}
              className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-40 transition cursor-pointer"
              title="Pausar venta / poner en espera (F9)"
            >
              <PauseCircle className="w-5 h-5 text-[#FFB100]" />
            </button>
            <button
              disabled={cart.length === 0}
              onClick={clearCart}
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition cursor-pointer"
              title="Vaciar ticket"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <ShoppingCart className="w-16 h-16 stroke-1 text-gray-300 mb-3" />
              <p className="font-black text-gray-700 text-base">Ticket vacío</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                Escanea un código de barras o selecciona productos del catálogo para comenzar.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-gray-200 bg-white hover:border-[#FA2400]/40 transition shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm text-[#282829] leading-tight truncate">
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-gray-500 font-mono">
                      ${item.price.toFixed(2)} c/u
                    </span>
                  </div>
                  <span className="font-black text-sm font-mono text-[#FA2400]">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer font-bold shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-black text-sm font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer font-bold shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition cursor-pointer"
                    title="Eliminar del ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Large Checkout Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 shadow-inner space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 font-semibold">
              <span>Artículos:</span>
              <span className="font-bold text-gray-900">{totalItemsCount} piezas</span>
            </div>

            {isDiscountEnabled && computedDiscount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-emerald-700 font-bold">
                <span>Descuento aplicado:</span>
                <span className="font-mono">-${computedDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
              <span className="text-xs uppercase font-black text-gray-700 tracking-wider">
                Total a Cobrar:
              </span>
              <span className="text-3xl sm:text-4xl font-black text-[#FA2400] font-mono tracking-tight">
                ${finalPayableTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Large Action Cobrar (F2) Button */}
          <button
            disabled={cart.length === 0}
            onClick={openCheckout}
            className={`w-full py-4 px-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer ${
              cart.length > 0
                ? 'bg-[#00D700] hover:bg-[#00be00] text-gray-950 hover:shadow-xl active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Banknote className="w-6 h-6 stroke-[2.5]" />
            <span>Cobrar Venta</span>
            <kbd className="text-xs bg-black text-white px-2 py-0.5 rounded font-mono font-bold">
              F2
            </kbd>
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL (Cobro con cálculo de cambio automático y tarjeta) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#FA2400] text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 rainbow-gradient" />
              <div>
                <h3 className="font-black text-xl">Cobrar Venta</h3>
                <p className="text-sm text-white/80 mt-0.5 font-medium">
                  Ticket con {totalItemsCount} productos
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/80 block uppercase font-bold tracking-wider">
                  Total a pagar:
                </span>
                <span className="text-3xl font-black text-[#FFF300] font-mono">
                  ${finalPayableTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Discount Section */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDiscountEnabled}
                      onChange={(e) => setIsDiscountEnabled(e.target.checked)}
                      className="rounded text-[#FA2400] focus:ring-[#FA2400] w-4 h-4 cursor-pointer"
                    />
                    <Tag className="w-4 h-4 text-amber-700" />
                    <span>Aplicar Descuento al Ticket</span>
                  </label>
                  {isDiscountEnabled && computedDiscount > 0 && (
                    <span className="text-xs font-black font-mono text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      Ahorro: -${computedDiscount.toFixed(2)}
                    </span>
                  )}
                </div>

                {isDiscountEnabled && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 flex items-center gap-2 flex-wrap">
                    <div className="flex rounded-xl overflow-hidden border border-amber-300 text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-3 py-1.5 transition cursor-pointer ${
                          discountType === 'percent'
                            ? 'bg-[#FA2400] text-white font-black'
                            : 'bg-white text-gray-700'
                        }`}
                      >
                        % Porcentaje
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('amount')}
                        className={`px-3 py-1.5 transition cursor-pointer ${
                          discountType === 'amount'
                            ? 'bg-[#FA2400] text-white font-black'
                            : 'bg-white text-gray-700'
                        }`}
                      >
                        $ Cantidad fija
                      </button>
                    </div>
                    <input
                      type="number"
                      step={discountType === 'percent' ? '1' : '0.50'}
                      min="0"
                      max={discountType === 'percent' ? '100' : totalAmount}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-24 px-3 py-1.5 text-xs sm:text-sm font-bold border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-[#FA2400] outline-hidden font-mono"
                      placeholder="0"
                    />
                    <span className="text-xs text-gray-600 font-medium ml-auto">
                      Subtotal:{' '}
                      <span className="line-through text-gray-400 font-mono">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 rounded-2xl">
                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-black transition cursor-pointer ${
                    paymentMethod === 'efectivo'
                      ? 'bg-white text-[#FA2400] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#00D700]" />
                  <span>Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-black transition cursor-pointer ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-white text-[#008CEB] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#008CEB]" />
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
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-2xl">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.50"
                        autoFocus
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishCheckout();
                        }}
                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-[#FA2400] text-2xl sm:text-3xl font-black font-mono text-gray-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* Fast Tender Buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    {cashSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashReceived(item.value.toString())}
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-800 border border-gray-300/80 transition cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Result Box */}
                  <div
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-colors ${
                      parsedReceived >= finalPayableTotal
                        ? 'bg-emerald-50 border-[#00D700] text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-black uppercase tracking-wide block">
                        {parsedReceived >= finalPayableTotal ? 'Cambio a entregar:' : 'Falta dinero:'}
                      </span>
                      <span className="text-xs opacity-80 font-bold">
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
                      value={cardReference || ''}
                      onChange={(e) => setCardReference(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-[#008CEB] text-base font-mono outline-none"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-center gap-2.5 font-medium">
                    <CreditCard className="w-5 h-5 text-[#008CEB] shrink-0" />
                    <span>
                      Se registrará un cobro de{' '}
                      <strong className="font-black font-mono text-base">
                        ${finalPayableTotal.toFixed(2)}
                      </strong>{' '}
                      en la terminal.
                    </span>
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
                disabled={paymentMethod === 'efectivo' && parsedReceived < finalPayableTotal}
                onClick={handleFinishCheckout}
                className={`px-6 py-3.5 rounded-xl text-base font-black shadow-md transition cursor-pointer flex items-center gap-2.5 ${
                  paymentMethod === 'efectivo' && parsedReceived < finalPayableTotal
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-[#00D700] hover:bg-[#00be00] text-gray-950 hover:shadow-lg active:scale-98'
                }`}
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
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

      {/* RECEIPT HISTORY & RETURN MODAL */}
      <ReceiptHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sales={sales}
        userRole={userRole}
        onCancelSale={onCancelSale}
      />

      {/* QUOTATION MODAL */}
      <QuotationModal
        cart={cart}
        isOpen={isQuotationOpen}
        onClose={() => setIsQuotationOpen(false)}
        onClearCart={() => setCart([])}
      />

      {/* HELD SALES (Ventas en espera) MODAL */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#FFB100] text-gray-950 flex items-center justify-between font-black">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Ventas en Espera</span>
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {cart.length > 0 && (
                <form
                  onSubmit={handleHoldCurrentSale}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5"
                >
                  <label className="block text-xs font-black uppercase text-gray-700">
                    Pausar Venta Actual ({totalItemsCount} artículos • ${totalAmount.toFixed(2)})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nombre o nota del cliente (ej: Sra. Carmen)"
                      value={heldCustomerName}
                      onChange={(e) => setHeldCustomerName(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-gray-300 outline-none focus:border-[#FA2400]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#FA2400] text-white text-xs font-black hover:bg-[#d81f00] transition cursor-pointer"
                    >
                      Pausar
                    </button>
                  </div>
                </form>
              )}

              <div>
                <h5 className="text-xs font-black uppercase text-gray-500 mb-2">
                  Ventas Pausadas Guardadas ({heldSales.length})
                </h5>
                {heldSales.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-xs font-semibold">
                    No hay ventas en espera actualmente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {heldSales.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-[#FFB100]"
                      >
                        <div>
                          <p className="font-black text-sm text-gray-900">{h.customerName || h.label || 'Venta en espera'}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {h.items.length} productos • ${(h.total || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleResumeHeldSale(h)}
                            className="px-3 py-1.5 rounded-xl bg-[#00D700] hover:bg-[#00be00] text-gray-950 font-black text-xs transition cursor-pointer"
                          >
                            Reanudar
                          </button>
                          <button
                            onClick={() => handleDeleteHeldSale(h.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
