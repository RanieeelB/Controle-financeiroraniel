import type {
  SummaryCards,
  BalanceEvolutionData,
  IncomeExpenseData,
  CategoryExpenseData,
  UpcomingBill,
  CreditCardInvoice,
  FinancialGoal,
  MonthlyAnalysis
} from '../types/financial';

export const summaryCardsMock: SummaryCards = {
  freeBalance: {
    value: 414.00,
    trend: 12
  },
  receivedMonth: 1814.00,
  committedIncome: 77,
  saved: {
    value: 200.00,
    percentage: 25 // Visual progress approximation
  },
  openInvoices: 420.00,
  fixedBills: 780.00
};

export const balanceEvolutionMock: BalanceEvolutionData[] = [
  { month: 'Jan', balance: 400 },
  { month: 'Fev', balance: 300 },
  { month: 'Mar', balance: 350 },
  { month: 'Abr', balance: 150 },
  { month: 'Mai', balance: 250 },
  { month: 'Jun', balance: 50 }, // For the trend shape in Recharts
];

export const incomeVsExpenseMock: IncomeExpenseData[] = [
  { category: 'Recebido', value: 1814 },
  { category: 'Gastos', value: 600 },
  { category: 'Faturas', value: 420 },
  { category: 'Investimentos', value: 200 },
];

export const categoryExpenseMock: CategoryExpenseData[] = [
  { name: 'Essencial', value: 60, color: '#00e676' }, // Primary
  { name: 'Lazer', value: 40, color: '#7bd0ff' }, // Secondary
];

export const upcomingBillsMock: UpcomingBill[] = [
  { id: '1', description: 'Internet', value: 99.90, dueDate: 'Dia 10', status: 'Pendente', icon: 'wifi' },
  { id: '2', description: 'Energia', value: 145.00, dueDate: 'Dia 12', status: 'Pendente', icon: 'zap' },
  { id: '3', description: 'Empréstimo', value: 274.00, dueDate: 'Dia 15', status: 'Pendente', icon: 'landmark' },
];

export const creditCardInvoicesMock: CreditCardInvoice[] = [
  { id: '1', name: 'Nubank', value: 280.00, dueDate: 'Vence em 02/06', color: '#8A05BE', initial: 'N' },
  { id: '2', name: 'Inter', value: 140.00, dueDate: 'Vence em 08/06', color: '#FF7A00', initial: 'I' },
];

export const financialGoalsMock: FinancialGoal[] = [
  {
    id: '1',
    title: 'Reserva de emergência',
    targetAmount: 5000,
    currentAmount: 800,
    progressPercentage: 16
  }
];

export const monthlyAnalysisMock: MonthlyAnalysis = {
  title: 'Análise do mês',
  description: 'Você já comprometeu 77% da sua renda. Antes de assumir novas parcelas, revise suas faturas e contas fixas.',
  actionText: 'Ver previsão dos próximos meses'
};
