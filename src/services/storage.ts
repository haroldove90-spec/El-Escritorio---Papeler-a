import { Product, ServiceItem, Sale, CashShift, Purchase, StockAdjustment, UserAccount } from '../types';
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
  SAMPLE_CLEARED: 'papeleria_sample_cleared',
};

// Check if sample data has been permanently cleared by user
export function isSampleDataCleared(): boolean {
  return localStorage.getItem(KEYS.SAMPLE_CLEARED) === 'true';
}

// Set sample data cleared state
export function setSampleDataCleared(cleared: boolean): void {
  if (cleared) {
    localStorage.setItem(KEYS.SAMPLE_CLEARED, 'true');
  } else {
    localStorage.removeItem(KEYS.SAMPLE_CLEARED);
  }
}

// Session Management (stays logged in on browser reload/refresh)
export interface AuthSession {
  user: UserAccount;
  token: string;
  loginAt: string;
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(KEYS.AUTH_SESSION);
    if (raw) {
      const session: AuthSession = JSON.parse(raw);
      if (session?.user?.id && session.user.username) {
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
  localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify(session));
  localStorage.setItem('papeleria_active_role', user.role);
  saveCurrentUser(user);
}

export function clearAuthSession(): void {
  localStorage.removeItem(KEYS.AUTH_SESSION);
  localStorage.removeItem('papeleria_active_role');
  localStorage.removeItem(KEYS.CURRENT_USER);
}

// Initialize and get Users
export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    if (raw) {
      const list: UserAccount[] = JSON.parse(raw);
      // Ensure Admin1, haroldo90, and cajero1 are present in the list
      const hasAdmin1 = list.some((u) => u.username.toLowerCase() === 'admin1');
      const hasHaroldo = list.some((u) => u.username.toLowerCase() === 'haroldo90');
      const hasCajero1 = list.some((u) => u.username.toLowerCase() === 'cajero1');

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
        saveUsers(merged);
        return merged;
      }
      return list;
    }
  } catch (e) {
    console.error('Error parsing users', e);
  }

  // Default to sample users
  saveUsers(SAMPLE_USERS);
  return SAMPLE_USERS;
}

export function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  window.dispatchEvent(new Event('papeleria_data_change'));
}

export function getCurrentUser(): UserAccount {
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
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
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  // Also sync in users list
  const users = getUsers();
  const updated = users.map(u => u.id === user.id ? user : u);
  saveUsers(updated);
}

// Initialize and get Products
export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          isActive: p.isActive !== false,
        }));
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
