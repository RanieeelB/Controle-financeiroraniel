const LEGACY_CARRYOVER_PREFIX = 'carryover:auto:';

export function isLegacyCarryoverTransaction(transaction: { notes?: string | null }) {
  return transaction.notes?.startsWith(LEGACY_CARRYOVER_PREFIX) === true;
}

export function filterLegacyCarryoverTransactions<T extends { notes?: string | null }>(transactions: T[]) {
  return transactions.filter(transaction => !isLegacyCarryoverTransaction(transaction));
}
