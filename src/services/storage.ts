import {
  Product,
  ServiceItem,
  Sale,
  CashShift,
  Purchase,
  StockAdjustment,
  UserAccount,
  ActiveModule,
  StoreConfig,
  HeldSale,
  Quotation,
} from '../types';
import { SAMPLE_PRODUCTS, SAMPLE_SERVICES, SAMPLE_SALES, INITIAL_CASH_SHIFT, SAMPLE_PURCHASES, SAMPLE_USERS } from './sampleData';

const KEYS = {
  PRODUCTS: 'papeleria_products',
  SERVICES: 'papeleria_services',
  SALES: 'papeleria_sales',
  SHIFTS: 'papeleria_shifts',
  ACTIVE_SHIFT: 'papeleria_active_shift',
  PURCHASES: 'papeleria_purchases',
  ADJUSTMENTS: 'papeleria_adjustments',
  USERS: 'papeleria_users',
  CURRENT_USER: 'papeleria_current_user',
  AUTH_SESSION: 'papeleria_auth_session',
  ACTIVE_MODULE: 'papeleria_active_module',
  SAMPLE_CLEARED: 'papeleria_sample_cleared',
};

// Check if sample data has been permanently cleared by user
export function isSampleDataCleared(): boolean {
  try {
    return localStorage.getItem(KEYS.SAMPLE_CLEARED) === 'true';
  } catch {
    return false;
  }
}

// Set sample data cleared state
export function setSampleDataCleared(cleared: boolean): void {
  try {
    if (cleared) {
      localStorage.setItem(KEYS.SAMPLE_CLEARED, 'true');
    } else {
      localStorage.removeItem(KEYS.SAMPLE_CLEARED);
    }
  } catch {}
}

// Session Management (stays permanently logged in on browser reload/refresh)
export interface AuthSession {
  user: UserAccount;
  token: string;
  loginAt: string;
}

export function getAuthSession(): AuthSession | null {
  try {
    // 1. Try reading from localStorage first
    const raw = localStorage.getItem(KEYS.AUTH_SESSION) || sessionStorage.getItem(KEYS.AUTH_SESSION);
    if (raw) {
      const session: AuthSession = JSON.parse(raw);
      if (session?.user?.id && session.user.username) {
        return session;
      }
      if (session?.user?.username && session?.user?.role) {
        return session;
      }
    }

    // 2. Failsafe: check papeleria_current_user
    const userRaw = localStorage.getItem(KEYS.CURRENT_USER) || sessionStorage.getItem(KEYS.CURRENT_USER);
    if (userRaw) {
      const user: UserAccount = JSON.parse(userRaw);
      if (user?.username && user?.role) {
        const session: AuthSession = {
          user,
          token: `token-restored-${Date.now()}`,
          loginAt: new Date().toISOString(),
        };
        saveAuthSession(user);
        return session;
      }
    }

    // 3. Failsafe: check papeleria_active_role to recover session automatically
    const activeRole = localStorage.getItem('papeleria_active_role') || sessionStorage.getItem('papeleria_active_role');
    if (activeRole) {
      const usersList = getUsers();
      const matched = usersList.find((u) => u.role === activeRole && u.isActive !== false) || usersList[0];
      if (matched) {
        const session: AuthSession = {
          user: matched,
          token: `token-restored-role-${Date.now()}`,
          loginAt: new Date().toISOString(),
        };
        saveAuthSession(matched);
        return session;
      }
    }
  } catch (e) {
    console.error('Error reading auth session', e);
  }
  return null;
}

export function saveAuthSession(user: UserAccount): void {
  const session: AuthSession = {
    user,
    token: `token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    loginAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(session);
  const userSerialized = JSON.stringify(user);

  try {
    localStorage.setItem(KEYS.AUTH_SESSION, serialized);
  } catch (e) {
    console.warn('localStorage saveAuthSession AUTH_SESSION failed', e);
  }

  try {
    localStorage.setItem('papeleria_active_role', user.role);
  } catch (e) {
    console.warn('localStorage saveAuthSession active_role failed', e);
  }

  try {
    localStorage.setItem(KEYS.CURRENT_USER, userSerialized);
  } catch (e) {
    console.warn('localStorage saveAuthSession CURRENT_USER failed', e);
  }

  try {
    sessionStorage.setItem(KEYS.AUTH_SESSION, serialized);
  } catch {}

  try {
    sessionStorage.setItem('papeleria_active_role', user.role);
  } catch {}

  try {
    sessionStorage.setItem(KEYS.CURRENT_USER, userSerialized);
  } catch {}
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(KEYS.AUTH_SESSION);
    localStorage.removeItem('papeleria_active_role');
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.ACTIVE_MODULE);
  } catch {}

  try {
    sessionStorage.removeItem(KEYS.AUTH_SESSION);
    sessionStorage.removeItem('papeleria_active_role');
    sessionStorage.removeItem(KEYS.CURRENT_USER);
    sessionStorage.removeItem(KEYS.ACTIVE_MODULE);
  } catch {}
}

// Active Module Navigation Persistence (keeps user on current screen on refresh)
export function getSavedActiveModule(role?: string | null): ActiveModule {
  try {
    const saved = (localStorage.getItem(KEYS.ACTIVE_MODULE) || sessionStorage.getItem(KEYS.ACTIVE_MODULE)) as ActiveModule | null;
    if (saved) {
      if (role === 'Cajero') {
        // Cajero can access POS, cash shift, personal profile and manual
        if (['pos', 'cash', 'profile', 'manual'].includes(saved)) {
          return saved;
        }
        return 'pos';
      }
      if (role === 'Admin') {
        // Admin can access all modules: pos, inventory, purchases, cash, reports, employees, profile, manual
        if (['pos', 'inventory', 'purchases', 'cash', 'reports', 'employees', 'profile', 'manual'].includes(saved)) {
          return saved;
        }
        return 'inventory';
      }
      return saved;
    }
  } catch {}
  return role === 'Admin' ? 'inventory' : 'pos';
}

export function saveActiveModule(module: ActiveModule): void {
  try {
    localStorage.setItem(KEYS.ACTIVE_MODULE, module);
  } catch {}
  try {
    sessionStorage.setItem(KEYS.ACTIVE_MODULE, module);
  } catch {}
}

// Initialize and get Users
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS) || sessionStorage.getItem(KEYS.USERS);
    if (raw) {
      const list: UserAccount[] = JSON.parse(raw);
      // Ensure Admin1, haroldo90, and cajero1 are present in the list
      const hasAdmin1 = list.some((u) => (u?.username || '').toLowerCase() === 'admin1');
      const hasHaroldo = list.some((u) => (u?.username || '').toLowerCase() === 'haroldo90');
      const hasCajero1 = list.some((u) => (u?.username || '').toLowerCase() === 'cajero1');

      if (!hasAdmin1 || !hasHaroldo || !hasCajero1) {
        const merged = [...list];
        if (!hasAdmin1) {
          const adm1 = SAMPLE_USERS.find((u) => u.username === 'Admin1');
          if (adm1) merged.push(adm1);
        }
        if (!hasHaroldo) {
          const har = SAMPLE_USERS.find((u) => u.username === 'haroldo90');
          if (har) merged.push(har);
        }
        if (!hasCajero1) {
          const caj = SAMPLE_USERS.find((u) => u.username === 'cajero1');
          if (caj) merged.push(caj);
        }
        saveUsers(merged, false);
        return merged;
      }
      return list;
    }
  } catch (e) {
    console.error('Error parsing users', e);
  }

  // Default to sample users
  saveUsers(SAMPLE_USERS, false);
  return SAMPLE_USERS;
}

export function saveUsers(users: UserAccount[], dispatchEvent = true): void {
  const serialized = JSON.stringify(users);
  try {
    localStorage.setItem(KEYS.USERS, serialized);
  } catch (e) {
    console.warn('localStorage saveUsers failed', e);
  }
  try {
    sessionStorage.setItem(KEYS.USERS, serialized);
  } catch {}

  if (dispatchEvent) {
    window.dispatchEvent(new Event('papeleria_data_change'));
  }
}

export function getCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER) || sessionStorage.getItem(KEYS.CURRENT_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing current user', e);
  }
  const users = getUsers();
  return users[0] || SAMPLE_USERS[0];
}

export function saveCurrentUser(user: UserAccount): void {
  const serialized = JSON.stringify(user);
  try {
    localStorage.setItem(KEYS.CURRENT_USER, serialized);
  } catch {}
  try {
    sessionStorage.setItem(KEYS.CURRENT_USER, serialized);
  } catch {}
}

// Initialize and get Products
export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) {
        const seenIds = new Set<string>();
        const uniqueProducts: Product[] = [];
        for (const p of parsed) {
          const validId = p.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          if (!seenIds.has(validId)) {
            seenIds.add(validId);
            uniqueProducts.push({
              ...p,
              id: validId,
              isActive: p.isActive !== false,
            });
          }
        }
        return uniqueProducts;
      }
    }
  } catch (e) {
    console.error('Error parsing products', e);
  }

  // Load default sample products with isActive: true so catalog is never empty
  const initial = SAMPLE_PRODUCTS.map((p) => ({ ...p, isActive: true }));
  saveProducts(initial);
  return initial;
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Initialize and get Services
export function getServices(): ServiceItem[] {
  try {
    const raw = localStorage.getItem(KEYS.SERVICES);
    if (raw) {
      const parsed: ServiceItem[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) {
        return parsed.map((s) => ({
          ...s,
          isActive: s.isActive !== false,
        }));
      }
    }
  } catch (e) {
    console.error('Error parsing services', e);
  }

  saveServices(SAMPLE_SERVICES);
  return SAMPLE_SERVICES;
}

export function saveServices(services: ServiceItem[]): void {
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Sales
export function getSales(): Sale[] {
  try {
    const raw = localStorage.getItem(KEYS.SALES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing sales', e);
  }

  if (isSampleDataCleared()) {
    return [];
  }

  saveSales(SAMPLE_SALES);
  return SAMPLE_SALES;
}

export function saveSales(sales: Sale[]): void {
  localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Cash Shifts
export function getCashShifts(): CashShift[] {
  try {
    const raw = localStorage.getItem(KEYS.SHIFTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing shifts', e);
  }

  if (isSampleDataCleared()) {
    return [];
  }

  const initial = [INITIAL_CASH_SHIFT];
  saveCashShifts(initial);
  return initial;
}

export function saveCashShifts(shifts: CashShift[]): void {
  localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

export function getActiveShift(): CashShift | null {
  const shifts = getCashShifts();
  return shifts.find(s => s.status === 'abierta') || null;
}

// Purchases
export function getPurchases(): Purchase[] {
  try {
    const raw = localStorage.getItem(KEYS.PURCHASES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing purchases', e);
  }

  if (isSampleDataCleared()) {
    return [];
  }

  savePurchases(SAMPLE_PURCHASES);
  return SAMPLE_PURCHASES;
}

export function savePurchases(purchases: Purchase[]): void {
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Adjustments
export function getAdjustments(): StockAdjustment[] {
  try {
    const raw = localStorage.getItem(KEYS.ADJUSTMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing adjustments', e);
  }
  return [];
}

export function saveAdjustments(adjustments: StockAdjustment[]): void {
  localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// COMPLETE CLEAR SAMPLE DATA:
// Sets permanent flag in localStorage so browser never shows sample data again
export function clearAllSampleData(): void {
  localStorage.setItem(KEYS.SAMPLE_CLEARED, 'true');
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
  localStorage.setItem(KEYS.SERVICES, JSON.stringify([]));
  localStorage.setItem(KEYS.SALES, JSON.stringify([]));
  localStorage.setItem(KEYS.SHIFTS, JSON.stringify([]));
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify([]));
  localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify([]));

  // Retain primary system accounts (Admin1, haroldo90, cajero1)
  localStorage.setItem(KEYS.USERS, JSON.stringify(SAMPLE_USERS));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(SAMPLE_USERS[0]));

  window.dispatchEvent(new Event('papeleria_data_change'));
}

// RESTORE SAMPLE DATA (For demo testing if desired)
export function restoreSampleData(): void {
  localStorage.removeItem(KEYS.SAMPLE_CLEARED);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS.map(p => ({ ...p, isActive: true }))));
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(SAMPLE_SERVICES));
  localStorage.setItem(KEYS.SALES, JSON.stringify(SAMPLE_SALES));
  localStorage.setItem(KEYS.SHIFTS, JSON.stringify([INITIAL_CASH_SHIFT]));
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(SAMPLE_PURCHASES));
  localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify([]));
  localStorage.setItem(KEYS.USERS, JSON.stringify(SAMPLE_USERS));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(SAMPLE_USERS[0]));

  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Store Configuration & Fiscal Ticket Info
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'Papelería El Escritorio',
  subtitle: 'Artículos Escolares, Oficina y Copias',
  rfc: 'EES-260101-9P0',
  address: 'Av. Universidad 405, CDMX',
  phone: '55 1234 5678',
  ticketFooter: '¡Gracias por su compra!\nConserve este ticket para cualquier aclaración.\nNo hay cambios en hojas sueltas o monografías.',
  logoUrl: 'https://appdesignproyectos.com/papelerialogo.png',
};

export function getStoreConfig(): StoreConfig {
  try {
    const raw = localStorage.getItem('papeleria_store_config');
    if (raw) return { ...DEFAULT_STORE_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STORE_CONFIG;
}

export function saveStoreConfig(config: StoreConfig): void {
  localStorage.setItem('papeleria_store_config', JSON.stringify(config));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

// Held Sales (Ventas en espera / Pausar venta)
export function getHeldSales(): HeldSale[] {
  try {
    const raw = localStorage.getItem('papeleria_held_sales');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveHeldSales(held: HeldSale[]): void {
  localStorage.setItem('papeleria_held_sales', JSON.stringify(held));
}

// Quotations (Cotizaciones / Presupuestos de listas escolares)
export function getQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem('papeleria_quotations');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveQuotations(quotes: Quotation[]): void {
  localStorage.setItem('papeleria_quotations', JSON.stringify(quotes));
}
