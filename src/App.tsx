import React, { useState, useEffect } from 'react';
import {
  Product,
  ServiceItem,
  Sale,
  CashShift,
  CashMovement,
  Purchase,
  StockAdjustment,
  UserAccount,
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
  getPurchases,
  savePurchases,
  getAdjustments,
  saveAdjustments,
  getUsers,
  saveUsers,
  getCurrentUser,
  saveCurrentUser,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  AuthSession,
} from './services/storage';
import {
  syncProductToSupabase,
  deleteProductFromSupabase,
  deleteMultipleProductsFromSupabase,
  syncSaleToSupabase,
  syncCashShiftToSupabase,
  syncPurchaseToSupabase,
  deleteMultiplePurchasesFromSupabase,
  syncUserToSupabase,
  deleteUserFromSupabase,
  deleteMultipleUsersFromSupabase,
  syncAdjustmentToSupabase,
} from './services/supabaseClient';
import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PosModule } from './components/pos/PosModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { PurchasesModule } from './components/purchases/PurchasesModule';
import { CashShiftModule } from './components/cash/CashShiftModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { EmployeesModule } from './components/employees/EmployeesModule';
import { ProfileModule } from './components/profile/ProfileModule';
import { DataManagementModal } from './components/settings/DataManagementModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Session state: Persists permanently across browser refreshes
  const [activeSession, setActiveSession] = useState<AuthSession | null>(() => getAuthSession());

  // Current active role ('Admin' | 'Cajero' | null)
  const [currentRole, setCurrentRole] = useState<string | null>(() => {
    const session = getAuthSession();
    return session?.user?.role || localStorage.getItem('papeleria_active_role') || null;
  });

  // Active module: Admin defaults to 'inventory', Cajero defaults to 'pos'
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    const session = getAuthSession();
    if (session?.user?.role === 'Admin') return 'inventory';
    return 'pos';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App State
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const session = getAuthSession();
    return session?.user || getCurrentUser();
  });

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
    const allUsers = getUsers();
    setUsers(allUsers);

    const session = getAuthSession();
    if (session?.user) {
      setCurrentUser(session.user);
      setCurrentRole(session.user.role);
    } else {
      const active = getCurrentUser();
      setCurrentUser(active);
    }
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

  // Ensure active module corresponds to user's permitted role
  useEffect(() => {
    if (currentRole === 'Admin' && activeModule === 'pos') {
      setActiveModule('inventory');
    } else if (
      currentRole === 'Cajero' &&
      (activeModule === 'inventory' ||
        activeModule === 'purchases' ||
        activeModule === 'reports' ||
        activeModule === 'employees')
    ) {
      setActiveModule('pos');
    }
  }, [currentRole, activeModule]);

  // Handle successful credential login
  const handleLoginSuccess = (user: UserAccount) => {
    saveAuthSession(user);
    setActiveSession({
      user,
      token: `token-${Date.now()}`,
      loginAt: new Date().toISOString(),
    });
    setCurrentUser(user);
    setCurrentRole(user.role);
    // Admin goes to Inventory, Cajero goes directly to POS
    setActiveModule(user.role === 'Admin' ? 'inventory' : 'pos');
  };

  // Handle explicit logout
  const handleLogout = () => {
    clearAuthSession();
    setActiveSession(null);
    setCurrentRole(null);
  };

  // Active shift
  const activeShift = shifts.find((s) => s.status === 'abierta') || null;

  // POS: Complete Sale
  const handleCompleteSale = (newSale: Sale) => {
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // Sync to Supabase in background
    syncSaleToSupabase(newSale).catch(() => {});

    // Update active shift sales totals
    if (activeShift) {
      const updatedShifts = shifts.map((s) => {
        if (s.id === activeShift.id) {
          const addCash = newSale.paymentMethod === 'efectivo' ? newSale.total : 0;
          const addCard = newSale.paymentMethod === 'tarjeta' ? newSale.total : 0;
          const newSalesCash = s.salesCash + addCash;
          const newSalesCard = s.salesCard + addCard;
          const expected = s.initialAmount + newSalesCash + s.cashIn - s.cashOut;

          const updatedShiftObj: CashShift = {
            ...s,
            salesCash: Number(newSalesCash.toFixed(2)),
            salesCard: Number(newSalesCard.toFixed(2)),
            expectedCash: Number(expected.toFixed(2)),
          };

          // Sync shift to Supabase
          syncCashShiftToSupabase(updatedShiftObj).catch(() => {});

          return updatedShiftObj;
        }
        return s;
      });
      setShifts(updatedShifts);
      saveCashShifts(updatedShifts);
    }
  };

  // POS: Deduct product stock
  const handleUpdateProductStock = (productId: string, quantityDeducted: number) => {
    let affectedProduct: Product | null = null;
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        const updated = {
          ...p,
          stock: Math.max(0, p.stock - quantityDeducted),
        };
        affectedProduct = updated;
        return updated;
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (affectedProduct) {
      syncProductToSupabase(affectedProduct).catch(() => {});
    }
  };

  // Inventory: Save Product (Create or Update)
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

    // Sync to Supabase
    syncProductToSupabase(product).catch(() => {});
  };

  // Inventory: Delete Single Product
  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);

    // Delete in Supabase
    deleteProductFromSupabase(productId).catch(() => {});
  };

  // Inventory: Delete Multiple Products (Bulk)
  const handleDeleteMultipleProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const updated = products.filter((p) => !idSet.has(p.id));
    setProducts(updated);
    saveProducts(updated);

    // Delete in Supabase
    deleteMultipleProductsFromSupabase(productIds).catch(() => {});
  };

  // Inventory: Manual Stock Adjustment (Merma, dañado, uso interno)
  const handleAdjustStock = (adjustment: StockAdjustment) => {
    const updatedAdjustments = [adjustment, ...adjustments];
    setAdjustments(updatedAdjustments);
    saveAdjustments(updatedAdjustments);

    let changedProduct: Product | null = null;
    const updatedProducts = products.map((p) => {
      if (p.id === adjustment.productId) {
        const prod = {
          ...p,
          stock: adjustment.newStock,
        };
        changedProduct = prod;
        return prod;
      }
      return p;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    if (changedProduct) {
      syncProductToSupabase(changedProduct).catch(() => {});
    }
    syncAdjustmentToSupabase(adjustment).catch(() => {});
  };

  // Purchases: Save Purchase & Update Product Stocks
  const handleSavePurchase = (newPurchase: Purchase) => {
    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);

    // Update stock & cost price of affected products
    const updatedProducts = [...products];
    newPurchase.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (idx > -1) {
        const current = updatedProducts[idx];
        const newStock = current.stock + item.quantity;
        const updated = {
          ...current,
          stock: newStock,
          costPrice: item.costPrice,
          lastRestockDate: new Date().toISOString(),
        };
        updatedProducts[idx] = updated;
        syncProductToSupabase(updated).catch(() => {});
      }
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Sync purchase to Supabase
    syncPurchaseToSupabase(newPurchase).catch(() => {});
  };

  // Purchases: Delete Multiple Purchases
  const handleDeletePurchases = (purchaseIds: string[]) => {
    const idSet = new Set(purchaseIds);
    const updated = purchases.filter((p) => !idSet.has(p.id));
    setPurchases(updated);
    savePurchases(updated);

    deleteMultiplePurchasesFromSupabase(purchaseIds).catch(() => {});
  };

  // Cash: Open shift
  const handleOpenShift = (initialAmount: number, notes?: string) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentUser.fullName || currentUser.username,
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

    const updated = [newShift, ...shifts];
    setShifts(updated);
    saveCashShifts(updated);

    syncCashShiftToSupabase(newShift).catch(() => {});
  };

  // Cash: Close shift (Corte Z)
  const handleCloseShift = (shiftId: string, countedCash: number, notes?: string) => {
    const targetShift = shifts.find((s) => s.id === shiftId) || activeShift;
    if (!targetShift) return;

    const diff = countedCash - targetShift.expectedCash;
    const closedShift: CashShift = {
      ...targetShift,
      closedAt: new Date().toISOString(),
      closedBy: currentUser.fullName || currentUser.username,
      countedCash,
      difference: Number(diff.toFixed(2)),
      status: 'cerrada',
      notes: notes || targetShift.notes,
    };

    const updated = shifts.map((s) => (s.id === targetShift.id ? closedShift : s));
    setShifts(updated);
    saveCashShifts(updated);

    syncCashShiftToSupabase(closedShift).catch(() => {});
  };

  // Cash: Add Movement (Entrada / Retiro)
  const handleAddCashMovement = (type: 'entrada' | 'retiro', amount: number, reason: string) => {
    if (!activeShift) return;

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      shiftId: activeShift.id,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
      user: currentUser.fullName || currentUser.username,
    };

    const newCashIn = type === 'entrada' ? activeShift.cashIn + amount : activeShift.cashIn;
    const newCashOut = type === 'retiro' ? activeShift.cashOut + amount : activeShift.cashOut;
    const expected = activeShift.initialAmount + activeShift.salesCash + newCashIn - newCashOut;

    const updatedShift: CashShift = {
      ...activeShift,
      cashIn: Number(newCashIn.toFixed(2)),
      cashOut: Number(newCashOut.toFixed(2)),
      expectedCash: Number(expected.toFixed(2)),
      movements: [newMovement, ...(activeShift.movements || [])],
    };

    const updatedShifts = shifts.map((s) => (s.id === activeShift.id ? updatedShift : s));
    setShifts(updatedShifts);
    saveCashShifts(updatedShifts);

    syncCashShiftToSupabase(updatedShift).catch(() => {});
  };

  // Employees: Save User (Create or Update)
  const handleSaveUser = (user: UserAccount) => {
    const existingIndex = users.findIndex((u) => u.id === user.id);
    let updated: UserAccount[];
    if (existingIndex > -1) {
      updated = [...users];
      updated[existingIndex] = user;
    } else {
      updated = [user, ...users];
    }
    setUsers(updated);
    saveUsers(updated);

    // If currently logged in user updated their own info
    if (currentUser.id === user.id) {
      setCurrentUser(user);
      saveCurrentUser(user);
      saveAuthSession(user);
    }

    syncUserToSupabase(user).catch(() => {});
  };

  // Employees: Delete Single User
  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);

    deleteUserFromSupabase(userId).catch(() => {});
  };

  // Employees: Delete Multiple Users
  const handleDeleteMultipleUsers = (userIds: string[]) => {
    const idSet = new Set(userIds);
    const updated = users.filter((u) => !idSet.has(u.id));
    setUsers(updated);
    saveUsers(updated);

    deleteMultipleUsersFromSupabase(userIds).catch(() => {});
  };

  // Employees: Toggle User Active Status
  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const modified = { ...u, isActive: !u.isActive };
        syncUserToSupabase(modified).catch(() => {});
        return modified;
      }
      return u;
    });
    setUsers(updated);
    saveUsers(updated);
  };

  // Profile: Update Personal Profile
  const handleUpdateProfile = (updatedUser: UserAccount) => {
    handleSaveUser(updatedUser);
  };

  // Count low stock items for badges
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // IF NO ROLE IS LOGGED IN, RENDER CREDENTIAL LOGIN SCREEN
  if (!currentRole || !activeSession) {
    return (
      <>
        <RoleSelector
          users={users}
          onLoginSuccess={handleLoginSuccess}
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
        currentUser={currentUser}
        activeShift={activeShift}
        onLogout={handleLogout}
        onOpenDataSettings={() => setIsDataModalOpen(true)}
        onOpenCashModal={() => setActiveModule('cash')}
        onOpenProfile={() => setActiveModule('profile')}
      />

      {/* Main Workspace: Desktop Sidebar + Active Module Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar Navigation (Role-aware) */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          lowStockCount={lowStockCount}
          userRole={currentRole}
        />

        {/* Dynamic Module Rendering */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50">
          {activeModule === 'pos' && currentRole === 'Cajero' && (
            <PosModule
              products={products}
              services={services}
              activeShift={activeShift}
              onCompleteSale={handleCompleteSale}
              onOpenShiftModal={() => setActiveModule('cash')}
              onUpdateProductStock={handleUpdateProductStock}
            />
          )}

          {activeModule === 'inventory' && currentRole === 'Admin' && (
            <InventoryModule
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onDeleteMultipleProducts={handleDeleteMultipleProducts}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {activeModule === 'purchases' && currentRole === 'Admin' && (
            <PurchasesModule
              products={products}
              purchases={purchases}
              adjustments={adjustments}
              onSavePurchase={handleSavePurchase}
              onDeletePurchases={handleDeletePurchases}
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

          {activeModule === 'reports' && currentRole === 'Admin' && (
            <ReportsModule sales={sales} products={products} />
          )}

          {activeModule === 'employees' && currentRole === 'Admin' && (
            <EmployeesModule
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onDeleteMultipleUsers={handleDeleteMultipleUsers}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {activeModule === 'profile' && (
            <ProfileModule
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>
      </div>

      {/* Touch-Optimized Mobile & Tablet Bottom Bar (Role-aware) */}
      <BottomNav
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        lowStockCount={lowStockCount}
        userRole={currentRole}
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
