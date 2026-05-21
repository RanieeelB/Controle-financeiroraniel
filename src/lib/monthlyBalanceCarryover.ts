import type { MonthRange } from './monthSelection';
import { roundCurrency } from './financialPayloads';
import type { Transaction } from '../types/financial';

type CarryoverTransaction = Pick<Transaction, 'type' | 'amount' | 'status'>;

interface BalanceCarryoverPayloadInput {
  targetMonthKey: string;
  previousMonthTransactions: CarryoverTransaction[];
}

export function buildBalanceCarryoverTransactionNote(monthKey: string) {
  return `carryover:auto:${monthKey}`;
}

export function getPreviousMonthRange(targetMonthKey: string): MonthRange {
  const [year, month] = targetMonthKey.split('-').map(Number);
  const previous = new Date(year, month - 2, 1);
  const current = new Date(year, month - 1, 1);

  return {
    monthKey: toMonthKey(previous),
    startDate: toDateKey(previous),
    endDate: toDateKey(current),
  };
}

export function buildBalanceCarryoverPayload(input: BalanceCarryoverPayloadInput) {
  const balance = calculatePreviousMonthAvailableBalance(input.previousMonthTransactions);
  if (balance <= 0) return null;

  const [year, month] = input.targetMonthKey.split('-').map(Number);
  const previousMonthName = formatPreviousMonthName(input.targetMonthKey);

  return {
    type: 'entrada' as const,
    description: `Sobra do mês ${previousMonthName}`,
    amount: balance,
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    status: 'recebido' as const,
    payment_method: 'transferencia' as const,
    category_id: null,
    notes: buildBalanceCarryoverTransactionNote(input.targetMonthKey),
  };
}

function calculatePreviousMonthAvailableBalance(transactions: CarryoverTransaction[]) {
  const receivedIncome = transactions
    .filter(transaction => transaction.type === 'entrada' && transaction.status === 'recebido')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const paidExpenses = transactions
    .filter(transaction => transaction.type === 'gasto' && transaction.status === 'pago')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return roundCurrency(receivedIncome - paidExpenses);
}

function formatPreviousMonthName(targetMonthKey: string) {
  const previousRange = getPreviousMonthRange(targetMonthKey);
  const [year, month] = previousRange.monthKey.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toDateKey(date: Date) {
  return `${toMonthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
}
