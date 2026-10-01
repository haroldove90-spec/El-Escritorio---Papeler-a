import { Product, ServiceItem, Sale, CashShift, Purchase, StockAdjustment } from '../types';
import { SAMPLE_PRODUCTS, SAMPLE_SERVICES, SAMPLE_SALES, INITIAL_CASH_SHIFT, SAMPLE_PURCHASES } from './sampleData';

const KEYS = {
  PRODUCTS: 'papeleria_products',
  SERVICES: 'papeleria_services',
  SALES: 'papeleria_sales',
  SHIFTS: 'papeleria_shifts',
  ACTIVE_SHIFT: 'papeleria_active_shift',
  PURCHASES: 'papeleria_purchases',
  ADJUSTMENTS: 'papeleria_adjustments',
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

// Initialize and get Products
export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing products', e);
  }

  // If user previously chose to clear sample data, do not restore sample products!
  if (isSampleDataCleared()) {
    return [];
  }

  // Otherwise, load default sample products
  saveProducts(SAMPLE_PRODUCTS);
  return SAMPLE_PRODUCTS;
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
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing services', e);
  }

  if (isSampleDataCleared()) {
    return [];
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

  window.dispatchEvent(new Event('papeleria_data_change'));
}

// RESTORE SAMPLE DATA (For demo testing if desired)
export function restoreSampleData(): void {
  localStorage.removeItem(KEYS.SAMPLE_CLEARED);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS));
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(SAMPLE_SERVICES));
  localStorage.setItem(KEYS.SALES, JSON.stringify(SAMPLE_SALES));
  localStorage.setItem(KEYS.SHIFTS, JSON.stringify([INITIAL_CASH_SHIFT]));
  localStorage.setItem(KEYS.PURCHASES, JSON.stringify(SAMPLE_PURCHASES));
  localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify([]));

  window.dispatchEvent(new Event('papeleria_data_change'));
}
