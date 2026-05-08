// ============================================================
// Tipos TypeScript que espelham as tabelas do Supabase
// ============================================================

// === CATEGORIAS ===
export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  type: 'entrada' | 'gasto' | 'ambos';
  color: string;
  created_at: string;
}

// === TRANSAÇÕES ===
export interface Transaction {
  id: string;
  user_id: string | null;
  category_id: string | null;
  type: 'entrada' | 'gasto';
  description: string;
  amount: number;
  date: string;
  status: 'recebido' | 'pago' | 'pendente';
  payment_method: 'pix' | 'credito' | 'debito' | 'dinheiro' | 'transferencia';
  notes: string | null;
  created_at: string;
  // Joined
  category?: Category;
}

// === CARTÕES DE CRÉDITO ===
export interface CreditCard {
  id: string;
  user_id: string | null;
  name: string;
  last_digits: string;
  brand: string;
  card_holder: string;
  credit_limit: number;
  due_day: number;
  closing_day: number;
  color: string;
  created_at: string;
}

// === ITENS DA FATURA ===
export interface InvoiceItem {
  id: string;
  user_id: string | null;
  card_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  date: string;
  total_installments: number;
  current_installment: number;
  created_at: string;
  // Joined
  category?: Category;
  credit_card?: CreditCard;
}

// === CONTAS FIXAS ===
export interface FixedBill {
  id: string;
  user_id: string | null;
  description: string;
  category_id: string | null;
  amount: number;
  due_day: number;
  status: 'pago' | 'pendente' | 'atrasado';
  icon: string;
  created_at: string;
  // Joined
  category?: Category;
}

// === METAS FINANCEIRAS ===
export interface FinancialGoal {
  id: string;
  user_id: string | null;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  created_at: string;
}

// === INVESTIMENTOS ===
export type InvestmentCategory = 'renda_fixa' | 'acoes' | 'fiis' | 'cripto';

export interface Investment {
  id: string;
  user_id: string | null;
  name: string;
  ticker: string | null;
  category: InvestmentCategory;
  amount_invested: number;
  current_value: number;
  return_percentage: number;
  monthly_contribution: number;
  last_auto_contribution_at: string | null;
  created_at: string;
}

// === APORTES EM INVESTIMENTOS / CAIXINHAS ===
export interface InvestmentDeposit {
  id: string;
  user_id: string | null;
  investment_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  // Joined
  investment?: Investment;
}

// === TIPOS DE APRESENTAÇÃO (UI) ===
export interface SummaryCards {
  freeBalance: number;
  totalIncome: number;
  totalExpense: number;
  savedAmount: number;
  openInvoices: number;
  fixedBillsTotal: number;
}

export interface BalanceEvolutionData {
  label: string;
  balance: number;
}

export interface CategoryExpenseData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyAnalysis {
  title: string;
  description: string;
  actionText: string;
}

export type DynamicFixedBill = FixedBill & {
  dynamicStatus: 'pago' | 'pendente' | 'atrasado';
  daysOverdue: number;
};
