import {
  buildSalarySettingPayload,
  buildSalaryTransactionNote,
  buildSalaryTransactionPayload,
  roundCurrency,
} from './financialPayloads';
import type { SummaryCards, Transaction } from '../types/financial';

interface SummaryCardsInput {
  transactions: Array<Pick<Transaction, 'type' | 'amount' | 'status'>>;
  savedAmount: number;
  openInvoices: number;
  fixedBillsTotal: number;
}

export function calculateSummaryCards(input: SummaryCardsInput): SummaryCards {
  const totalIncome = input.transactions
    .filter(transaction => transaction.type === 'entrada')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = input.transactions
    .filter(transaction => transaction.type === 'gasto')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const receivedIncome = input.transactions
    .filter(transaction => transaction.type === 'entrada' && transaction.status === 'recebido')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const paidExpense = input.transactions
    .filter(transaction => transaction.type === 'gasto' && transaction.status === 'pago')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    currentBalance: roundCurrency(receivedIncome - paidExpense),
    projectedBalance: roundCurrency(totalIncome - totalExpense),
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
