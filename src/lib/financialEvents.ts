export const FINANCIAL_DATA_CHANGED_EVENT = 'financial-data-changed';
let financialDataVersion = 0;

export function getFinancialDataVersion() {
  return financialDataVersion;
}

export function emitFinancialDataChanged() {
  financialDataVersion += 1;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FINANCIAL_DATA_CHANGED_EVENT));
}

export function subscribeFinancialDataChanged(callback: (version?: number) => void) {
  if (typeof window === 'undefined') return () => {};

  const listener = () => callback(financialDataVersion);
  window.addEventListener(FINANCIAL_DATA_CHANGED_EVENT, listener);
  return () => window.removeEventListener(FINANCIAL_DATA_CHANGED_EVENT, listener);
}
