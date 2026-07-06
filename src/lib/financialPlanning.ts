import {
  buildSalarySettingPayload,
  buildSalaryTransactionNote,
  buildSalaryTransactionPayload,
  roundCurrency,
} from './financialPayloads.js';
import { filterLegacyCarryoverTransactions } from './legacyCarryover.js';
import type { SummaryCards, Transaction } from '../types/financial.js';

interface SummaryCardsInput {
  transactions: Array<Pick<Transaction, 'type' | 'amount' | 'status' | 'notes'>>;
  savedAmount: number;
  openInvoices: number;
  fixedBillsTotal: number;
  unpaidFixedBills: number;
}

export function calculateSummaryCards(input: SummaryCardsInput): SummaryCards {
  const visibleTransactions = filterLegacyCarryoverTransactions(input.transactions);

  const totalIncome = visibleTransactions
    .filter(transaction => transaction.type === 'entrada')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = visibleTransactions
    .filter(transaction => transaction.type === 'gasto')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const receivedIncome = visibleTransactions
    .filter(transaction => transaction.type === 'entrada' && transaction.status === 'recebido')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const paidExpense = visibleTransactions
    .filter(transaction => transaction.type === 'gasto' && transaction.status === 'pago')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    currentBalance: roundCurrency(receivedIncome - paidExpense),
    projectedBalance: roundCurrency(totalIncome - (totalExpense + input.unpaidFixedBills)),
    totalIncome: roundCurrency(totalIncome),
    totalExpense: roundCurrency(totalExpense),
    savedAmount: roundCurrency(input.savedAmount),
    openInvoices: roundCurrency(input.openInvoices),
    fixedBillsTotal: roundCurrency(input.fixedBillsTotal),
  };
}

export {
  buildSalarySettingPayload,
  buildSalaryTransactionNote,
  buildSalaryTransactionPayload,
};
