import React, { useState, useEffect } from 'react';
import { Coins, BellRing } from 'lucide-react';
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
  getSavedActiveModule,
  saveActiveModule,
  AuthSession,
} from './services/storage';
import {
  syncProductToSupabase,
  deleteProductFromSupabase,
  deleteMultipleProductsFromSupabase,
  fetchProductsFromSupabase,
  syncSaleToSupabase,
  syncCashShiftToSupabase,
  syncPurchaseToSupabase,
  deleteMultiplePurchasesFromSupabase,
  fetchPurchasesFromSupabase,
  syncUserToSupabase,
  deleteUserFromSupabase,
  deleteMultipleUsersFromSupabase,
  syncAdjustmentToSupabase,
  fetchUsersFromSupabase,
  fetchSalesFromSupabase,
  fetchCashShiftsFromSupabase,
  subscribeToRealtimeChanges,
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
import { UserManualModule } from './components/manual/UserManualModule';
import { DataManagementModal } from './components/settings/DataManagementModal';
import { StoreSettingsModal } from './components/settings/StoreSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

// Web Audio API soft chime for instant sale notification (no external assets required)
function playSaleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch {}
}

export default function App() {
  // Session state: Persists permanently across browser refreshes
  const [activeSession, setActiveSession] = useState<AuthSession | null>(() => getAuthSession());

  // Current active role ('Admin' | 'Cajero' | null)
  const [currentRole, setCurrentRole] = useState<string | null>(() => {
    const session = getAuthSession();
    return session?.user?.role || localStorage.getItem('papeleria_active_role') || sessionStorage.getItem('papeleria_active_role') || null;
  });

  // Active module: Persists user's current section permanently across browser refreshes
  const [activeModule, setActiveModule] = useState<ActiveModule>(() => {
    const session = getAuthSession();
    const role = session?.user?.role || localStorage.getItem('papeleria_active_role');
    return getSavedActiveModule(role);
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App State
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [services, setServices] = useState<ServiceItem[]>(() => getServices());
  const [sales, setSales] = useState<Sale[]>(() => getSales());
  const [shifts, setShifts] = useState<CashShift[]>(() => getCashShifts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => getAdjustments());
  const [users, setUsers] = useState<UserAccount[]>(() => getUsers());
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const session = getAuthSession();
    return session?.user || getCurrentUser();
  });

  // Realtime Sale Toast for Admin
  const [realtimeNotification, setRealtimeNotification] = useState<{
    title: string;
    subtitle: string;
    time: string;
  } | null>(null);

  // Modals
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);

  // Dedicated module change handler that persists immediately
  const handleSelectModule = (mod: ActiveModule) => {
    setActiveModule(mod);
    saveActiveModule(mod);
  };

  // Load all data from persistent storage and sync with Supabase in background
  const loadAllData = async () => {
    setProducts(getProducts());
    setServices(getServices());
    setSales(getSales());
    setShifts(getCashShifts());
    setPurchases(getPurchases());
    setAdjustments(getAdjustments());
    const allUsers = getUsers();
    setUsers(allUsers);

    // 1. Session check & recovery
    const session = getAuthSession();
    if (session?.user) {
      setActiveSession(session);
      setCurrentUser(session.user);
      setCurrentRole(session.user.role);
    } else {
      const activeRole =
        localStorage.getItem('papeleria_active_role') ||
        sessionStorage.getItem('papeleria_active_role');
      if (activeRole) {
        const matching =
          allUsers.find((u) => u.role === activeRole && u.isActive !== false) || allUsers[0];
        if (matching) {
          const recoveredSession: AuthSession = {
            user: matching,
            token: `token-auto-${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
          saveAuthSession(matching);
          setActiveSession(recoveredSession);
          setCurrentUser(matching);
          setCurrentRole(matching.role);
        }
      }
    }

    // 2. Background sync with Supabase to ensure fresh phone, avatar, and employee data
    try {
      const remoteUsers = await fetchUsersFromSupabase();
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers((prev) => {
          const merged = [...prev];
          remoteUsers.forEach((ru) => {
            const idx = merged.findIndex(
              (u) =>
                u.id === ru.id ||
                (u.username && ru.username && u.username.toLowerCase() === ru.username.toLowerCase())
            );
            if (idx > -1) {
              merged[idx] = {
                ...merged[idx],
                ...ru,
                phone: ru.phone || merged[idx].phone,
                avatarUrl: ru.avatarUrl || merged[idx].avatarUrl,
                identification: ru.identification || merged[idx].identification,
              };
            } else {
              merged.push(ru);
            }
          });
          saveUsers(merged, false);

          const activeSessionNow = getAuthSession();
          const targetId = activeSessionNow?.user?.id;
          const targetUsername = activeSessionNow?.user?.username?.toLowerCase();
          const matchingRemote = merged.find(
            (u) =>
              (targetId && u.id === targetId) ||
              (targetUsername && u.username && u.username.toLowerCase() === targetUsername)
          );
          if (matchingRemote) {
            setCurrentUser(matchingRemote);
            saveCurrentUser(matchingRemote);
            saveAuthSession(matchingRemote);
            setActiveSession((prev) => (prev ? { ...prev, user: matchingRemote } : null));
          }

          return merged;
        });
      }
    } catch (e) {
      console.warn('Background Supabase user sync note:', e);
    }

    // 3. Background sync remote sales & cash shifts from Supabase (for multidevice consistency)
    try {
      const [remoteSales, remoteShifts] = await Promise.all([
        fetchSalesFromSupabase(),
        fetchCashShiftsFromSupabase(),
      ]);

      if (remoteSales && remoteSales.length > 0) {
        setSales((prev) => {
          const merged = [...prev];
          remoteSales.forEach((rs) => {
            const idx = merged.findIndex((s) => s.id === rs.id || s.folio === rs.folio);
            if (idx > -1) {
              merged[idx] = { ...merged[idx], ...rs };
            } else {
              merged.push(rs);
            }
          });
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          saveSales(merged);
          return merged;
        });
      }

      if (remoteShifts && remoteShifts.length > 0) {
        setShifts((prev) => {
          const merged = [...prev];
          remoteShifts.forEach((rsh) => {
            const idx = merged.findIndex((s) => s.id === rsh.id);
            if (idx > -1) {
              merged[idx] = { ...merged[idx], ...rsh };
            } else {
              merged.push(rsh);
            }
          });
          saveCashShifts(merged);
          return merged;
        });
      }
    } catch (e) {
      console.warn('Background sales/shifts sync note:', e);
    }

    // 4. Background sync remote products from Supabase (ensures products saved to cloud are fetched on reload/switch)
    try {
      const remoteProducts = await fetchProductsFromSupabase();
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts((prev) => {
          const merged = [...prev];
          remoteProducts.forEach((rp) => {
            const idx = merged.findIndex(
              (p) => p.id === rp.id || (p.barcode && p.barcode.trim() === rp.barcode.trim())
            );
            if (idx > -1) {
              merged[idx] = { ...merged[idx], ...rp };
            } else {
              merged.push(rp);
            }
          });
          saveProducts(merged);
          return merged;
        });
      }
    } catch (e) {
      console.warn('Background products sync note:', e);
    }

    // 5. Background sync remote purchases from Supabase
    try {
      const remotePurchases = await fetchPurchasesFromSupabase();
      if (remotePurchases && remotePurchases.length > 0) {
        setPurchases((prev) => {
          const merged = [...prev];
          remotePurchases.forEach((rp) => {
            const idx = merged.findIndex((p) => p.id === rp.id);
            if (idx > -1) {
              merged[idx] = { ...merged[idx], ...rp };
            } else {
              merged.push(rp);
            }
          });
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          savePurchases(merged);
          return merged;
        });
      }
    } catch (e) {
      console.warn('Background purchases sync note:', e);
    }
  };

  useEffect(() => {
    loadAllData();

    // 1. Listen for custom data change events (sync across local triggers)
    const handleDataChange = () => {
      loadAllData();
    };
    window.addEventListener('papeleria_data_change', handleDataChange);

    // 2. Cross-tab/window storage listener (syncs cashier window to admin window immediately)
    const handleStorageEvent = (e: StorageEvent) => {
      if (
        e.key === 'papeleria_sales' ||
        e.key === 'papeleria_shifts' ||
        e.key === 'papeleria_products' ||
        e.key === 'papeleria_purchases'
      ) {
        setProducts(getProducts());
        setSales(getSales());
        setShifts(getCashShifts());
        setPurchases(getPurchases());
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 3. Supabase Realtime multi-device cloud listener (receives sales instantly across devices)
    const unsubscribeRealtime = subscribeToRealtimeChanges({
      onSaleCreated: (newSale) => {
        // Trigger soft chime
        playSaleChime();

        // Show live notification toast
        setRealtimeNotification({
          title: `¡Nueva Venta! Folio #${newSale.folio} • $${newSale.total.toFixed(2)}`,
          subtitle: `Cobrado por ${newSale.cashierName} (${newSale.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta'}) • ${newSale.items.length} prod.`,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        });
        setTimeout(() => {
          setRealtimeNotification(null);
        }, 6500);

        // Update sales list
        setSales((prev) => {
          if (prev.some((s) => s.id === newSale.id || s.folio === newSale.folio)) {
            return prev;
          }
          const updated = [newSale, ...prev];
          saveSales(updated);
          return updated;
        });

        // Deduct inventory stock locally for items sold
        if (newSale.items && newSale.items.length > 0) {
          setProducts((prev) => {
            const updated = prev.map((p) => {
              const item = newSale.items.find((it) => it.productId === p.id);
              if (item) {
                return { ...p, stock: Math.max(0, p.stock - item.quantity) };
              }
              return p;
            });
            saveProducts(updated);
            return updated;
          });
        }

        // Update active shift if sale belongs to it
        setShifts((prev) => {
          const active = prev.find((s) => s.status === 'abierta');
          if (!active) return prev;
          const addCash = newSale.paymentMethod === 'efectivo' ? newSale.total : 0;
          const addCard = newSale.paymentMethod === 'tarjeta' ? newSale.total : 0;
          const updated = prev.map((s) => {
            if (s.id === active.id) {
              const newCash = s.salesCash + addCash;
              const newCard = s.salesCard + addCard;
              return {
                ...s,
                salesCash: Number(newCash.toFixed(2)),
                salesCard: Number(newCard.toFixed(2)),
                expectedCash: Number(
                  (s.initialAmount + newCash + s.cashIn - s.cashOut).toFixed(2)
                ),
              };
            }
            return s;
          });
          saveCashShifts(updated);
          return updated;
        });
      },
      onShiftUpdated: (updatedShift) => {
        setShifts((prev) => {
          const idx = prev.findIndex((s) => s.id === updatedShift.id);
          let next: CashShift[];
          if (idx > -1) {
            next = [...prev];
            next[idx] = updatedShift;
          } else {
            next = [updatedShift, ...prev];
          }
          saveCashShifts(next);
          return next;
        });
      },
      onProductUpdated: (updatedProduct) => {
        setProducts((prev) => {
          const idx = prev.findIndex((p) => p.id === updatedProduct.id);
          let next: Product[];
          if (idx > -1) {
            next = [...prev];
            next[idx] = updatedProduct;
          } else {
            next = [updatedProduct, ...prev];
          }
          saveProducts(next);
          return next;
        });
      },
      onDataSyncRequested: () => {
        loadAllData();
      },
    });

    return () => {
      window.removeEventListener('papeleria_data_change', handleDataChange);
      window.removeEventListener('storage', handleStorageEvent);
      unsubscribeRealtime();
    };
  }, []);

  // Ensure active module corresponds to user's permitted role
  useEffect(() => {
    if (!currentRole) return;
    if (
      currentRole === 'Cajero' &&
      (activeModule === 'inventory' ||
        activeModule === 'purchases' ||
        activeModule === 'reports' ||
        activeModule === 'employees')
    ) {
      handleSelectModule('pos');
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

    // Restore saved section for this role or navigate to primary module
    const targetModule = getSavedActiveModule(user.role);
    handleSelectModule(targetModule);
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

  // POS / History: Cancel Sale or Process Return
  const handleCancelSale = (saleId: string, reason: string) => {
    const saleToCancel = sales.find((s) => s.id === saleId);
    if (!saleToCancel) return;

    // 1. Mark sale status as cancelada
    const updatedSale: Sale = {
      ...saleToCancel,
      status: 'cancelada',
      canceledReason: reason,
    };

    const updatedSales = sales.map((s) => (s.id === saleId ? updatedSale : s));
    setSales(updatedSales);
    saveSales(updatedSales);
    syncSaleToSupabase(updatedSale).catch(() => {});

    // 2. Re-integrate product stock for physical items
    let updatedProducts = [...products];
    saleToCancel.items.forEach((it) => {
      if (!it.isService) {
        const pIdx = updatedProducts.findIndex((p) => p.id === it.productId);
        if (pIdx > -1) {
          const current = updatedProducts[pIdx];
          const qtyRestored =
            it.packageMode === 'paquete'
              ? it.quantity * current.packageUnits
              : it.quantity;
          const updatedProd = { ...current, stock: current.stock + qtyRestored };
          updatedProducts[pIdx] = updatedProd;
          syncProductToSupabase(updatedProd).catch(() => {});
        }
      }
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // 3. Adjust active shift if sale was from today's active shift
    if (activeShift && saleToCancel.cashShiftId === activeShift.id) {
      const deduction = saleToCancel.total;
      const isCash = saleToCancel.paymentMethod === 'efectivo';
      const updatedShifts = shifts.map((s) => {
        if (s.id === activeShift.id) {
          const newCash = isCash ? Math.max(0, s.salesCash - deduction) : s.salesCash;
          const newCard = !isCash ? Math.max(0, s.salesCard - deduction) : s.salesCard;
          const newExpected = s.initialAmount + newCash + s.cashIn - s.cashOut;
          const updatedShiftObj: CashShift = {
            ...s,
            salesCash: Number(newCash.toFixed(2)),
            salesCard: Number(newCard.toFixed(2)),
            expectedCash: Number(newExpected.toFixed(2)),
          };
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
  const handleSaveProduct = async (
    product: Product
  ): Promise<{ success: boolean; error?: string }> => {
    const existingIndex = products.findIndex(
      (p) => p.id === product.id || (p.barcode && p.barcode.trim() === product.barcode.trim())
    );
    let updated: Product[];
    if (existingIndex > -1) {
      updated = [...products];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...products];
    }
    setProducts(updated);
    saveProducts(updated);

    // Sync to Supabase cloud database
    const syncRes = await syncProductToSupabase(product);
    if (syncRes.success && syncRes.targetId && syncRes.targetId !== product.id) {
      const remapped = updated.map((p) =>
        p.id === product.id ? { ...p, id: syncRes.targetId! } : p
      );
      setProducts(remapped);
      saveProducts(remapped);
    }
    return syncRes;
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
  const handleSavePurchase = async (
    newPurchase: Purchase
  ): Promise<{ success: boolean; error?: string }> => {
    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);

    // Update stock & cost price of affected products
    const updatedProducts = [...products];
    for (const item of newPurchase.items) {
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
    }

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Sync purchase to Supabase
    const syncRes = await syncPurchaseToSupabase(newPurchase);
    return syncRes;
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
    const existingIndex = users.findIndex(
      (u) =>
        u.id === user.id ||
        (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase())
    );
    let updated: UserAccount[];
    if (existingIndex > -1) {
      updated = [...users];
      updated[existingIndex] = user;
    } else {
      updated = [user, ...users];
    }
    setUsers(updated);
    saveUsers(updated, false);

    // If currently logged in user updated their own info
    if (
      currentUser.id === user.id ||
      (currentUser.username && user.username && currentUser.username.toLowerCase() === user.username.toLowerCase())
    ) {
      setCurrentUser(user);
      saveCurrentUser(user);
      saveAuthSession(user);
      setActiveSession((prev) =>
        prev
          ? { ...prev, user }
          : {
              user,
              token: `token-${Date.now()}`,
              loginAt: new Date().toISOString(),
            }
      );
    }

    syncUserToSupabase(user).catch((err) => {
      console.error('syncUserToSupabase error in handleSaveUser:', err);
    });
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

  // IF NO AUTHENTICATED USER OR ROLE, RENDER CREDENTIAL LOGIN SCREEN
  if (!currentRole) {
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
        onOpenStoreSettings={() => setIsStoreSettingsOpen(true)}
        onOpenCashModal={() => handleSelectModule('cash')}
        onOpenProfile={() => handleSelectModule('profile')}
      />

      {/* Main Workspace: Desktop Sidebar + Active Module Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar Navigation (Role-aware) */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          lowStockCount={lowStockCount}
          userRole={currentRole}
        />

        {/* Dynamic Module Rendering */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-50">
          {activeModule === 'pos' && (
            <PosModule
              products={products}
              services={services}
              activeShift={activeShift}
              sales={sales}
              userRole={currentRole}
              onCompleteSale={handleCompleteSale}
              onOpenShiftModal={() => handleSelectModule('cash')}
              onUpdateProductStock={handleUpdateProductStock}
              onCancelSale={handleCancelSale}
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

          {activeModule === 'manual' && (
            <UserManualModule userRole={currentRole} />
          )}
        </main>
      </div>

      {/* Touch-Optimized Mobile & Tablet Bottom Bar (Role-aware) */}
      <BottomNav
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        lowStockCount={lowStockCount}
        userRole={currentRole}
      />

      {/* Data Management & Supabase Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataReset={loadAllData}
      />

      {/* Store & Fiscal Ticket Configuration Modal */}
      <StoreSettingsModal
        isOpen={isStoreSettingsOpen}
        onClose={() => setIsStoreSettingsOpen(false)}
      />

      {/* Realtime Live Sale Notification Toast */}
      {realtimeNotification && (
        <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-300 max-w-sm w-full bg-white rounded-2xl shadow-2xl border-2 border-emerald-500/40 p-4 flex items-start gap-3 select-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Coins className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Venta en Vivo • Tiempo Real
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{realtimeNotification.time}</span>
            </div>
            <h4 className="text-sm font-black text-[#1F4461] truncate">{realtimeNotification.title}</h4>
            <p className="text-xs text-gray-600 mt-0.5 font-medium leading-tight">{realtimeNotification.subtitle}</p>
          </div>
          <button
            onClick={() => setRealtimeNotification(null)}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
