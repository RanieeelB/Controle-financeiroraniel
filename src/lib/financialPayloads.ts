import type { InvestmentCategory, Transaction } from '../types/financial';

export interface TransactionPayloadInput {
  type: Transaction['type'];
  description: string;
  amount: number;
  date: string;
  paymentMethod: Transaction['payment_method'];
  categoryId?: string | null;
  notes?: string | null;
  totalInstallments?: number;
}

export interface InvoicePurchasePayloadInput {
  cardId: string;
  categoryId?: string | null;
  description: string;
  amount: number;
  date: string;
  totalInstallments?: number;
  currentInstallment?: number;
}

export interface CreditCardPayloadInput {
  bank: string;
  brand: string;
  lastDigits: string;
}

export interface FixedBillPayloadInput {
  description: string;
  categoryId?: string | null;
  amount: number;
  dueDay: number;
  status: 'pago' | 'pendente' | 'atrasado';
}

export interface InvestmentPayloadInput {
  name: string;
  ticker?: string | null;
  category: InvestmentCategory;
  amountInvested: number;
  currentValue: number;
}

export interface FinancialGoalPayloadInput {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
}

const cardBrandColors: Record<string, string> = {
  mastercard: '#ffba79',
  visa: '#7bd0ff',
  elo: '#75ff9e',
  amex: '#859585',
  hipercard: '#ffb4ab',
};

export function parseCurrencyValue(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return roundCurrency(amount);
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getInstallmentAmount(totalAmount: number, totalInstallments = 1) {
  return roundCurrency(totalAmount / normalizeInstallments(totalInstallments));
}

export function buildTransactionPayload(input: TransactionPayloadInput) {
  const isCardExpense = input.type === 'gasto' && input.paymentMethod === 'credito';

  return {
    type: input.type,
    description: normalizeRequiredText(input.description),
    amount: isCardExpense ? getInstallmentAmount(input.amount, input.totalInstallments) : roundCurrency(input.amount),
    date: input.date,
    status: input.type === 'entrada' ? 'recebido' : isCardExpense ? 'pendente' : 'pago',
    payment_method: input.paymentMethod,
    category_id: normalizeOptionalId(input.categoryId),
    notes: normalizeOptionalText(input.notes),
  };
}

export function buildInvoicePurchasePayload(input: InvoicePurchasePayloadInput) {
  const totalInstallments = normalizeInstallments(input.totalInstallments);
  const currentInstallment = normalizeCurrentInstallment(input.currentInstallment, totalInstallments);

  return {
    card_id: normalizeRequiredText(input.cardId),
    category_id: normalizeOptionalId(input.categoryId),
    description: normalizeRequiredText(input.description),
    amount: getInstallmentAmount(input.amount, totalInstallments),
    date: input.date,
    total_installments: totalInstallments,
    current_installment: currentInstallment,
  };
}

export function buildCreditCardPayload(input: CreditCardPayloadInput) {
  const brand = normalizeRequiredText(input.brand);
  const bank = normalizeRequiredText(input.bank);
  const normalizedBrand = brand.toLowerCase();

  return {
    name: bank,
    last_digits: normalizeCardDigits(input.lastDigits),
    brand,
    card_holder: '',
    credit_limit: 0,
    due_day: 10,
    closing_day: 3,
    color: cardBrandColors[normalizedBrand] ?? '#75ff9e',
  };
}

export function buildFixedBillPayload(input: FixedBillPayloadInput) {
  return {
    description: normalizeRequiredText(input.description),
    category_id: normalizeOptionalId(input.categoryId),
    amount: roundCurrency(input.amount),
    due_day: clampDay(input.dueDay),
    status: input.status,
    icon: 'receipt',
  };
}

export function buildInvestmentPayload(input: InvestmentPayloadInput) {
  const amountInvested = roundCurrency(input.amountInvested);
  const currentValue = roundCurrency(input.currentValue);
  const returnPercentage = amountInvested > 0
    ? roundCurrency(((currentValue - amountInvested) / amountInvested) * 100)
    : 0;

  return {
    name: normalizeRequiredText(input.name),
    ticker: normalizeOptionalText(input.ticker)?.toUpperCase() ?? null,
    category: input.category,
    amount_invested: amountInvested,
    current_value: currentValue,
    return_percentage: returnPercentage,
  };
}

export function buildFinancialGoalPayload(input: FinancialGoalPayloadInput) {
  return {
    title: normalizeRequiredText(input.title),
    target_amount: roundCurrency(input.targetAmount),
    current_amount: roundCurrency(input.currentAmount),
    deadline: normalizeOptionalText(input.deadline),
    icon: 'target',
  };
}

function normalizeRequiredText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalId(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeCardDigits(value: string) {
  const digits = value.replace(/\D/g, '').slice(-4);
  return digits.padStart(4, '0');
}

function normalizeInstallments(value = 1) {
  return Math.max(1, Math.min(48, Math.trunc(value)));
}

function normalizeCurrentInstallment(value = 1, totalInstallments: number) {
  return Math.max(1, Math.min(totalInstallments, Math.trunc(value)));
}

function clampDay(value: number) {
  return Math.max(1, Math.min(31, Math.trunc(value)));
}
