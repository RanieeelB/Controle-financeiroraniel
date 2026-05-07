export type TransactionType = 'entrada' | 'gasto' | 'cartao' | 'fixa' | 'investimento';

export interface SummaryCards {
  freeBalance: {
    value: number;
    trend: number;
  };
  receivedMonth: number;
  committedIncome: number; // percentage
  saved: {
    value: number;
    percentage: number;
  };
  openInvoices: number;
  fixedBills: number;
}

export interface BalanceEvolutionData {
  month: string;
  balance: number;
}

export interface IncomeExpenseData {
  category: string;
  value: number;
}

export interface CategoryExpenseData {
  name: string;
  value: number;
  color: string;
}

export interface UpcomingBill {
  id: string;
  description: string;
  value: number;
  dueDate: string; // e.g., 'Dia 10'
  status: 'Pendente' | 'Pago';
  icon: string;
}

export interface CreditCardInvoice {
  id: string;
  name: string;
  value: number;
  dueDate: string;
  color: string;
  initial: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
}

export interface MonthlyAnalysis {
  title: string;
  description: string;
  actionText: string;
}
