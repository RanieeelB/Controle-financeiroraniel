import { supabase } from './supabase';
import { emitFinancialDataChanged } from './financialEvents';
import {
  buildCreditCardPayload,
  buildFinancialGoalPayload,
  buildFixedBillPayload,
  buildInvestmentPayload,
  buildInvestmentDepositPayload,
  buildInvestmentDepositTransactionPayload,
  buildInvoicePurchasePayload,
  buildLinkedRecordNote,
  buildTransactionPayload,
  getInvestmentTotalsAfterDeposit,
  getInvestmentTotalsAfterDepositRemoval,
  parseLinkedRecordNote,
  type CreditCardPayloadInput,
  type FinancialGoalPayloadInput,
  type FixedBillPayloadInput,
  type InvestmentDepositPayloadInput,
  type InvestmentPayloadInput,
  type InvoicePurchasePayloadInput,
  type TransactionPayloadInput,
} from './financialPayloads';
import { buildCategoryPayload, getMissingDefaultCategories } from './defaultCategories';
import type { Category, Investment, InvestmentDeposit, InvoiceItem, Transaction } from '../types/financial';

export type CreateFinancialTransactionInput = TransactionPayloadInput & {
  cardId?: string | null;
  currentInstallment?: number;
};

export interface CreateCategoryInput {
  name: string;
  type: Category['type'];
  color: string;
  icon?: string | null;
}

let defaultCategoriesEnsured = false;
let defaultCategoriesPromise: Promise<void> | null = null;

export async function ensureDefaultCategories() {
  if (defaultCategoriesEnsured) return;
  if (defaultCategoriesPromise) return defaultCategoriesPromise;

  defaultCategoriesPromise = ensureDefaultCategoriesOnce().finally(() => {
    defaultCategoriesPromise = null;
  });

  return defaultCategoriesPromise;
}

export async function createCategory(input: CreateCategoryInput) {
  const payload = buildCategoryPayload(input);

  if (!payload.name) {
    throw new Error('Informe o nome da categoria.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  emitFinancialDataChanged();

  return data as Category;
}

export async function createFinancialTransaction(input: CreateFinancialTransactionInput) {
  let invoiceItemId: string | null = null;

  if (input.paymentMethod === 'credito') {
    if (!input.cardId) {
      throw new Error('Selecione um cartão para lançar no crédito.');
    }

    const invoiceItem = await insertInvoicePurchase({
      cardId: input.cardId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      date: input.date,
      totalInstallments: input.totalInstallments,
      currentInstallment: input.currentInstallment,
    });

    invoiceItemId = invoiceItem.id;
  }

  const transactionPayload = buildTransactionPayload(input);
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...transactionPayload,
      notes: invoiceItemId ? buildLinkedRecordNote('invoice_item', invoiceItemId) : transactionPayload.notes,
    });

  if (error) throw error;
  emitFinancialDataChanged();
}

async function ensureDefaultCategoriesOnce() {
  const { data, error } = await supabase
    .from('categories')
    .select('name,type');

  if (error) throw error;

  const missingCategories = getMissingDefaultCategories(
    (data ?? []) as Array<{ name: string; type: Category['type'] }>,
  );

  if (missingCategories.length > 0) {
    const { error: insertError } = await supabase
      .from('categories')
      .insert(missingCategories.map(category => buildCategoryPayload(category)));

    if (insertError) throw insertError;
    emitFinancialDataChanged();
  }

  defaultCategoriesEnsured = true;
}

export async function createCreditPurchase(input: InvoicePurchasePayloadInput) {
  const invoiceItem = await insertInvoicePurchase(input);

  const transactionPayload = buildTransactionPayload({
    type: 'gasto',
    description: input.description,
    amount: input.amount,
    date: input.date,
    paymentMethod: 'credito',
    categoryId: input.categoryId,
    totalInstallments: input.totalInstallments,
  });
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...transactionPayload,
      notes: buildLinkedRecordNote('invoice_item', invoiceItem.id),
    });

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createCreditCard(input: CreditCardPayloadInput) {
  const { error } = await supabase
    .from('credit_cards')
    .insert(buildCreditCardPayload(input));

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function updateCreditCard(cardId: string, input: CreditCardPayloadInput) {
  const { error } = await supabase
    .from('credit_cards')
    .update(buildCreditCardPayload(input))
    .eq('id', cardId);

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createFixedBill(input: FixedBillPayloadInput) {
  const { error } = await supabase
    .from('fixed_bills')
    .insert(buildFixedBillPayload(input));

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createInvestment(input: InvestmentPayloadInput) {
  const { error } = await supabase
    .from('investments')
    .insert(buildInvestmentPayload(input));

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createInvestmentDeposit(input: InvestmentDepositPayloadInput & { investment: Investment }) {
  const depositPayload = buildInvestmentDepositPayload(input);

  const { data: depositData, error: depositError } = await supabase
    .from('investment_deposits')
    .insert(depositPayload)
    .select('id')
    .single();

  if (depositError && !isMissingInvestmentDepositsTable(depositError)) {
    throw depositError;
  }
  const depositId = (depositData?.id as string | undefined) ?? null;

  const updatedTotals = getInvestmentTotalsAfterDeposit({
    amountInvested: input.investment.amount_invested,
    currentValue: input.investment.current_value,
    depositAmount: input.amount,
  });

  const { error: investmentError } = await supabase
    .from('investments')
    .update(updatedTotals)
    .eq('id', input.investment.id);

  if (investmentError) throw investmentError;

  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      ...buildInvestmentDepositTransactionPayload({
        investmentName: input.investment.name,
        amount: input.amount,
        date: input.date,
        notes: input.notes,
      }),
      notes: depositId
        ? buildLinkedRecordNote('investment_deposit', depositId, input.investment.id)
        : buildLinkedRecordNote('investment_deposit', input.investment.id),
    });

  if (transactionError) throw transactionError;
  emitFinancialDataChanged();
}

export async function deleteFinancialTransaction(transaction: Transaction) {
  const linkedRecord = parseLinkedRecordNote(transaction.notes);

  if (linkedRecord?.kind === 'invoice_item' && linkedRecord.id) {
    const { error: invoiceError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', linkedRecord.id);

    if (invoiceError) throw invoiceError;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transaction.id);

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function deleteInvoicePurchase(item: InvoiceItem) {
  const { error: invoiceError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('id', item.id);

  if (invoiceError) throw invoiceError;

  await deleteLinkedInvoiceTransaction(item);
  emitFinancialDataChanged();
}

export async function deleteInvestmentDeposit(input: { deposit: InvestmentDeposit; investment: Investment }) {
  const { deposit, investment } = input;

  const { error: depositError } = await supabase
    .from('investment_deposits')
    .delete()
    .eq('id', deposit.id);

  if (depositError && !isMissingInvestmentDepositsTable(depositError)) {
    throw depositError;
  }

  const updatedTotals = getInvestmentTotalsAfterDepositRemoval({
    amountInvested: investment.amount_invested,
    currentValue: investment.current_value,
    depositAmount: deposit.amount,
  });

  const { error: investmentError } = await supabase
    .from('investments')
    .update(updatedTotals)
    .eq('id', investment.id);

  if (investmentError) throw investmentError;

  await deleteLinkedInvestmentDepositTransaction({ deposit, investment });
  emitFinancialDataChanged();
}

export async function createFinancialGoal(input: FinancialGoalPayloadInput) {
  const { error } = await supabase
    .from('financial_goals')
    .insert(buildFinancialGoalPayload(input));

  if (error) throw error;
  emitFinancialDataChanged();
}

async function insertInvoicePurchase(input: InvoicePurchasePayloadInput) {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(buildInvoicePurchasePayload(input))
    .select('id')
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error('Não foi possível identificar o lançamento da fatura.');

  return { id: data.id as string };
}

function isMissingInvestmentDepositsTable(error: { code?: string; message?: string }) {
  return error.code === '42P01'
    || error.message?.includes('investment_deposits') === true
    || error.message?.includes('Could not find the table') === true;
}

async function deleteLinkedInvoiceTransaction(item: InvoiceItem) {
  const linkedNote = buildLinkedRecordNote('invoice_item', item.id);

  const deletedLinkedTransaction = await deleteFirstMatchingTransaction({ notes: linkedNote });
  if (deletedLinkedTransaction) return;

  await deleteFirstMatchingTransaction({
    description: item.description,
    amount: item.amount,
    date: item.date,
    paymentMethod: 'credito',
  });
}

async function deleteLinkedInvestmentDepositTransaction(input: { deposit: InvestmentDeposit; investment: Investment }) {
  const { deposit, investment } = input;
  const linkedNote = buildLinkedRecordNote('investment_deposit', deposit.id, investment.id);
  const legacyNote = buildLinkedRecordNote('investment_deposit', investment.id);

  const deletedFallbackTransaction = await deleteTransactionById(deposit.id);
  if (deletedFallbackTransaction) return;

  const deletedLinkedTransaction = await deleteFirstMatchingTransaction({ notes: linkedNote });
  if (deletedLinkedTransaction) return;

  await deleteFirstMatchingTransaction({
    description: `Aporte em ${investment.name}`,
    amount: deposit.amount,
    date: deposit.date,
    paymentMethod: 'transferencia',
    notes: legacyNote,
  });
}

async function deleteFirstMatchingTransaction(input: {
  description?: string;
  amount?: number;
  date?: string;
  paymentMethod?: Transaction['payment_method'];
  notes?: string;
}) {
  let query = supabase
    .from('transactions')
    .select('id')
    .limit(1);

  if (input.description) query = query.eq('description', input.description);
  if (typeof input.amount === 'number') query = query.eq('amount', input.amount);
  if (input.date) query = query.eq('date', input.date);
  if (input.paymentMethod) query = query.eq('payment_method', input.paymentMethod);

  if (input.notes) {
    query = query.eq('notes', input.notes);
  }

  const { data, error } = await query;
  if (error) throw error;

  const transactionId = (data?.[0] as { id?: string } | undefined)?.id;
  if (!transactionId) return false;

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (deleteError) throw deleteError;
  return true;
}

async function deleteTransactionById(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', transactionId)
    .limit(1);

  if (error) throw error;
  if (!data?.[0]) return false;

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (deleteError) throw deleteError;
  return true;
}
