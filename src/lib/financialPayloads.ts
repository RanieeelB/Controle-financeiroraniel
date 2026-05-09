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
  monthlyContribution?: number;
}

export interface InvestmentDepositPayloadInput {
  investmentId: string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface InvestmentTotalsInput {
  amountInvested: number;
  currentValue: number;
  depositAmount: number;
}

export type LinkedRecordKind = 'invoice_item' | 'investment_deposit';

export interface LinkedRecordNote {
  kind: LinkedRecordKind;
  id: string | null;
  parentId: string | null;
}

export interface InvestmentDepositTransactionPayloadInput {
  investmentName: string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface FinancialGoalPayloadInput {
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
}

export interface SalarySettingPayloadInput {
  amount: number;
  dayOfMonth: number;
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
  const monthlyContribution = roundCurrency(input.monthlyContribution ?? 0);
  const returnPercentage = amountInvested > 0
    ? roundCurrency(((currentValue - amountInvested) / amountInvested) * 100)
    : 0;

  return {
    name: normalizeRequiredText(input.name),
    ticker: normalizeOptionalText(input.ticker)?.toUpperCase() ?? null,
    category: input.category,
    amount_invested: amountInvested,
    current_value: currentValue,
    monthly_contribution: monthlyContribution,
    return_percentage: returnPercentage,
  };
}

export function buildInvestmentDepositPayload(input: InvestmentDepositPayloadInput) {
  return {
    investment_id: normalizeRequiredText(input.investmentId),
    amount: roundCurrency(input.amount),
    date: input.date,
    notes: normalizeOptionalText(input.notes),
  };
}

export function getInvestmentTotalsAfterDeposit(input: InvestmentTotalsInput) {
  const amountInvested = roundCurrency(input.amountInvested + input.depositAmount);
  const currentValue = roundCurrency(input.currentValue + input.depositAmount);
  const returnPercentage = amountInvested > 0
    ? roundCurrency(((currentValue - amountInvested) / amountInvested) * 100)
    : 0;

  return {
    amount_invested: amountInvested,
    current_value: currentValue,
    return_percentage: returnPercentage,
  };
}

export function getInvestmentTotalsAfterDepositRemoval(input: InvestmentTotalsInput) {
  const amountInvested = Math.max(0, roundCurrency(input.amountInvested - input.depositAmount));
  const currentValue = Math.max(0, roundCurrency(input.currentValue - input.depositAmount));
  const returnPercentage = amountInvested > 0
    ? roundCurrency(((currentValue - amountInvested) / amountInvested) * 100)
    : 0;

  return {
    amount_invested: amountInvested,
    current_value: currentValue,
    return_percentage: returnPercentage,
  };
}

export function buildInvestmentDepositTransactionPayload(input: InvestmentDepositTransactionPayloadInput) {
  return buildTransactionPayload({
    type: 'gasto',
    description: `Aporte em ${normalizeRequiredText(input.investmentName)}`,
    amount: input.amount,
    date: input.date,
    paymentMethod: 'transferencia',
    categoryId: null,
    notes: normalizeOptionalText(input.notes) ?? 'Debitado do saldo livre para guardar na caixinha.',
  });
}

export function buildLinkedRecordNote(kind: LinkedRecordKind, id: string, parentId?: string | null) {
  const normalizedId = normalizeRequiredText(id);
  const normalizedParentId = normalizeOptionalId(parentId);

  return normalizedParentId ? `${kind}:${normalizedParentId}:${normalizedId}` : `${kind}:${normalizedId}`;
}

export function parseLinkedRecordNote(note?: string | null): LinkedRecordNote | null {
  const [kind, firstId, secondId] = note?.split(':') ?? [];

  if (kind !== 'invoice_item' && kind !== 'investment_deposit') return null;
  if (!firstId) return null;

  if (kind === 'investment_deposit') {
    return {
      kind,
      parentId: firstId,
      id: secondId || null,
    };
  }

  return {
    kind,
    id: firstId,
    parentId: null,
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

export function buildSalarySettingPayload(input: SalarySettingPayloadInput) {
  return {
    amount: roundCurrency(input.amount),
    day_of_month: clampDay(input.dayOfMonth),
  };
}

export function buildSalaryTransactionNote(monthKey: string) {
  return `salary:auto:${monthKey}`;
}

export function buildSalaryTransactionPayload(input: SalarySettingPayloadInput & { monthKey: string }) {
  const payload = buildSalarySettingPayload(input);
  const [year, month] = input.monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const resolvedDay = String(Math.min(lastDay, payload.day_of_month)).padStart(2, '0');

  return {
    type: 'entrada' as const,
    description: 'Salário',
    amount: payload.amount,
    date: `${year}-${String(month).padStart(2, '0')}-${resolvedDay}`,
    status: 'pendente' as const,
    payment_method: 'transferencia' as const,
    category_id: null,
    notes: buildSalaryTransactionNote(input.monthKey),
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
