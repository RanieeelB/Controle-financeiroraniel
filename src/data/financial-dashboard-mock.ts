// Este arquivo foi esvaziado propositalmente.
// Todos os dados agora vêm do Supabase.
// Mantido apenas para não quebrar imports antigos durante a migração.

import type {
  SummaryCards,
  BalanceEvolutionData,
  CategoryExpenseData,
  MonthlyAnalysis
} from '../types/financial';

export const summaryCardsMock: SummaryCards = {
  currentBalance: 0,
  projectedBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  savedAmount: 0,
  openInvoices: 0,
  fixedBillsTotal: 0,
};

export const balanceEvolutionMock: BalanceEvolutionData[] = [];

export const categoryExpenseMock: CategoryExpenseData[] = [];

export const monthlyAnalysisMock: MonthlyAnalysis = {
  title: 'Sem dados',
  description: 'Adicione suas primeiras transações para ver a análise mensal.',
  actionText: 'Começar agora',
};
