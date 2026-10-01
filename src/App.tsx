import React, { useState, useEffect } from 'react';
import {
  Product,
  ServiceItem,
  Sale,
  CashShift,
  Purchase,
  StockAdjustment,
  ActiveModule,
} from './types';
import {
  getProducts,
  saveProducts,
  getServices,
  getSales,
  saveSales,
  getCashShifts,
  saveCashShifts,
  getActiveShift,
  getPurchases,
  savePurchases,
  getAdjustments,
  saveAdjustments,
} from './services/storage';
import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PosModule } from './components/pos/PosModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { PurchasesModule } from './components/purchases/PurchasesModule';
import { CashShiftModule } from './components/cash/CashShiftModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { DataManagementModal } from './components/settings/DataManagementModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Current active role (null = role selector home screen)
  const [currentRole, setCurrentRole] = useState<string | null>(() => {
    return localStorage.getItem('papeleria_active_role') || null;
  });

  // Active module
  const [activeModule, setActiveModule] = useState<ActiveModule>('pos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  // Modals
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Load all data from persistent storage
  const loadAllData = () => {
    setProducts(getProducts());
    setServices(getServices());
    setSales(getSales());
    setShifts(getCashShifts());
    setPurchases(getPurchases());
    setAdjustments(getAdjustments());
  };

  useEffect(() => {
    loadAllData();

    // Listen for custom data change events (sync across triggers)
    const handleDataChange = () => {
      loadAllData();
    };

    window.addEventListener('papeleria_data_change', handleDataChange);
    return () => {
      window.removeEventListener('papeleria_data_change', handleDataChange);
    };
  }, []);

  // Handle role selection
  const handleSelectRole = (role: string) => {
    setCurrentRole(role);
    localStorage.setItem('papeleria_active_role', role);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentRole(null);
    localStorage.removeItem('papeleria_active_role');
  };

  // Active shift
  const activeShift = shifts.find((s) => s.status === 'abierta') || null;

  // POS: Complete Sale
  const handleCompleteSale = (newSale: Sale) => {
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // Update active shift sales totals
    if (activeShift) {
      const updatedShifts = shifts.map((s) => {
        if (s.id === activeShift.id) {
          const addCash = newSale.paymentMethod === 'efectivo' ? newSale.total : 0;
          const addCard = newSale.paymentMethod === 'tarjeta' ? newSale.total : 0;
          const newSalesCash = s.salesCash + addCash;
          const newSalesCard = s.salesCard + addCard;
          const expected = s.initialAmount + newSalesCash + s.cashIn - s.cashOut;

          return {
            ...s,
            salesCash: Number(newSalesCash.toFixed(2)),
            salesCard: Number(newSalesCard.toFixed(2)),
            expectedCash: Number(expected.toFixed(2)),
          };
        }
        return s;
      });
      setShifts(updatedShifts);
      saveCashShifts(updatedShifts);
    }
  };

  // POS: Deduct product stock
  const handleUpdateProductStock = (productId: string, quantityDeducted: number) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock - quantityDeducted),
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  // Inventory: Save Product
  const handleSaveProduct = (product: Product) => {
    const existingIndex = products.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (existingIndex > -1) {
      updated = [...products];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...products];
    }
    setProducts(updated);
    saveProducts(updated);
  };

  // Inventory: Delete Product
  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Inventory: Manual Stock Adjustment (Merma, dañado, uso interno)
  const handleAdjustStock = (adjustment: StockAdjustment) => {
    // 1. Log adjustment
    const updatedAdjustments = [adjustment, ...adjustments];
    setAdjustments(updatedAdjustments);
    saveAdjustments(updatedAdjustments);

    // 2. Update product stock
    const updatedProducts = products.map((p) => {
      if (p.id === adjustment.productId) {
        return {
          ...p,
          stock: adjustment.newStock,
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  // Purchases: Save purchase and automatically update stock and cost
  const handleSavePurchase = (purchase: Purchase) => {
    // 1. Save purchase record
    const updatedPurchases = [purchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);

    // 2. Restock products and update costs
    const updatedProducts = products.map((prod) => {
      const match = purchase.items.find((item) => item.productId === prod.id);
      if (match) {
        return {
          ...prod,
          stock: prod.stock + match.quantity,
          costPrice: match.costPrice,
          lastRestockDate: new Date().toISOString(),
        };
      }
      return prod;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  // Cash: Open Shift
  const handleOpenShift = (initialAmount: number, notes?: string) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentRole || 'Admin',
      initialAmount,
      salesCash: 0,
      salesCard: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: initialAmount,
      status: 'abierta',
      notes,
      movements: [],
    };
    const updatedShifts = [newShift, ...shifts];
    setShifts(updatedShifts);
    saveCashShifts(updatedShifts);
  };

  // Cash: Close Shift (Corte Z)
  const handleCloseShift = (shiftId: string, countedCash: number, notes?: string) => {
    const updatedShifts = shifts.map((s) => {
      if (s.id === shiftId) {
        const difference = Number((countedCash - s.expectedCash).toFixed(2));
        return {
          ...s,
          closedAt: new Date().toISOString(),
          closedBy: currentRole || 'Admin',
          countedCash,
          difference,
          status: 'cerrada' as const,
          notes: notes || s.notes,
        };
      }
      return s;
    });
    setShifts(updatedShifts);
    saveCashShifts(updatedShifts);
  };

  // Cash: Add movement (Entrada / Retiro de caja chica)
  const handleAddCashMovement = (type: 'entrada' | 'retiro', amount: number, reason: string) => {
    if (!activeShift) return;

    const newMovement = {
      id: `mov-${Date.now()}`,
      shiftId: activeShift.id,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
      user: currentRole || 'Admin',
    };

    const updatedShifts = shifts.map((s) => {
      if (s.id === activeShift.id) {
        const newCashIn = type === 'entrada' ? s.cashIn + amount : s.cashIn;
        const newCashOut = type === 'retiro' ? s.cashOut + amount : s.cashOut;
        const newExpected = s.initialAmount + s.salesCash + newCashIn - newCashOut;

        return {
          ...s,
          cashIn: Number(newCashIn.toFixed(2)),
          cashOut: Number(newCashOut.toFixed(2)),
          expectedCash: Number(newExpected.toFixed(2)),
          movements: [newMovement, ...s.movements],
        };
      }
      return s;
    });

    setShifts(updatedShifts);
    saveCashShifts(updatedShifts);
  };

  // Count low stock items for badges
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // IF NO ROLE IS SELECTED, RENDER HOME ROLE SELECTOR SCREEN
  if (!currentRole) {
    return (
      <>
        <RoleSelector
          onSelectRole={handleSelectRole}
          onOpenDataSettings={() => setIsDataModalOpen(true)}
        />
        <DataManagementModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          onDataReset={loadAllData}
        />
        <OfflineIndicator />
      </>
    );
  }

  // MAIN APPLICATION LAYOUT (ROLE LOGGED IN)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 text-[#282829]">
      {/* Unified Institutional Header */}
      <Header
        currentRole={currentRole}
        activeShift={activeShift}
        onLogout={handleLogout}
        onOpenDataSettings={() => setIsDataModalOpen(true)}
        onOpenCashModal={() => setActiveModule('cash')}
      />

      {/* Main Workspace: Desktop Sidebar + Active Module Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic Module Rendering */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50">
          {activeModule === 'pos' && (
            <PosModule
              products={products}
              services={services}
              activeShift={activeShift}
              onCompleteSale={handleCompleteSale}
              onOpenShiftModal={() => setActiveModule('cash')}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}

          {activeModule === 'inventory' && (
            <InventoryModule
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeModule === 'purchases' && (
            <PurchasesModule
              products={products}
              purchases={purchases}
              adjustments={adjustments}
              onSavePurchase={handleSavePurchase}
            />
          )}

          {activeModule === 'cash' && (
            <CashShiftModule
              activeShift={activeShift}
              shiftHistory={shifts.filter((s) => s.status === 'cerrada')}
              todaySales={sales}
              onOpenShift={handleOpenShift}
              onCloseShift={handleCloseShift}
              onAddCashMovement={handleAddCashMovement}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule sales={sales} products={products} />
          )}
        </main>
      </div>

      {/* Touch-Optimized Mobile & Tablet Bottom Bar */}
      <BottomNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        lowStockCount={lowStockCount}
      />

      {/* Data Management & Supabase Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataReset={loadAllData}
      />

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
