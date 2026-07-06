import type { BalanceEvolutionData, Transaction } from '../types/financial';
import { roundCurrency } from './financialPayloads';
import { filterLegacyCarryoverTransactions } from './legacyCarryover';

type BalanceEvolutionTransaction = Pick<Transaction, 'type' | 'amount' | 'date' | 'status' | 'notes'>;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildBalanceEvolution(
  transactions: BalanceEvolutionTransaction[],
  today = new Date(),
): BalanceEvolutionData[] {
  const todayKey = toDateKey(today);
  const byDay = new Map<string, number>();

  filterLegacyCarryoverTransactions(transactions)
    .filter(transaction => transaction.date <= todayKey)
    .filter(transaction => {
      if (transaction.type === 'entrada') {
        return transaction.status === 'recebido';
      }
      return transaction.status === 'pago';
    })
    .forEach(transaction => {
      const signedAmount = transaction.type === 'entrada' ? transaction.amount : -transaction.amount;
      byDay.set(transaction.date, (byDay.get(transaction.date) ?? 0) + signedAmount);
    });

  let runningBalance = 0;
  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayNet]) => {
      runningBalance = roundCurrency(runningBalance + dayNet);
      return {
        label: date.split('-')[2],
        balance: runningBalance,
      };
    });
}
