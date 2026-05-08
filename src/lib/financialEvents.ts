export const FINANCIAL_DATA_CHANGED_EVENT = 'financial-data-changed';

export function emitFinancialDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FINANCIAL_DATA_CHANGED_EVENT));
}

export function subscribeFinancialDataChanged(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(FINANCIAL_DATA_CHANGED_EVENT, callback);
  return () => window.removeEventListener(FINANCIAL_DATA_CHANGED_EVENT, callback);
}
