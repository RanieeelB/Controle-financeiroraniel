import { supabase } from './supabase';
import { emitFinancialDataChanged } from './financialEvents';

// Helper function to add months to a YYYY-MM-DD date string
function addMonthsToDate(dateStr: string, months: number): string {
  if (months === 0) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1 + months, day);
  
  // Handle cases where the target month has fewer days than the source day
  // (e.g. Jan 31 + 1 month should be Feb 28/29, not March 3)
  const expectedMonth = (month - 1 + months) % 12;
  const normalizedExpectedMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth;
  
  if (date.getMonth() !== normalizedExpectedMonth) {
    date.setDate(0); // Set to the last day of the previous month
  }
  
  return date.toISOString().split('T')[0];
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Usuário não autenticado.');
  return session.user.id;
}
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
import type { Category, FixedBill, Investment, InvestmentDeposit, InvoiceItem, Transaction } from '../types/financial';
import { defaultCategories } from './defaultCategories';

export interface CreateCategoryInput {
  name: string;
  type: Category['type'];
  color: string;
  icon?: string;
}

export async function createCategory(input: CreateCategoryInput) {
  const userId = await getUserId();
  const payload = {
    user_id: userId,
    name: input.name.trim(),
    type: input.type,
    color: input.color,
    icon: input.icon?.trim() || 'tag',
  };

  if (!payload.name) throw new Error('Informe o nome da categoria.');

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  emitFinancialDataChanged();
  return data as Category;
}

export async function ensureDefaultCategories() {
  const userId = await getUserId();
  
  // Get existing categories for this user
  const { data: existing, error } = await supabase
    .from('categories')
    .select('name, type')
    .eq('user_id', userId);
    
  if (error) throw error;

  const missing = defaultCategories.filter(def => 
    !existing?.some(ex => ex.name === def.name && ex.type === def.type)
  );

  if (missing.length === 0) return;

  const { error: insertError } = await supabase
    .from('categories')
    .insert(missing.map(m => ({ ...m, user_id: userId })));

  if (insertError) throw insertError;
  emitFinancialDataChanged();
}

export type CreateFinancialTransactionInput = TransactionPayloadInput & {
  cardId?: string | null;
  currentInstallment?: number;
};

export async function createFinancialTransaction(input: CreateFinancialTransactionInput) {
  let invoiceItemId: string | null = null;

  if (input.paymentMethod === 'credito') {
    if (!input.cardId) {
      throw new Error('Selecione um cartão para lançar no crédito.');
    }

    await createCreditPurchase({
      cardId: input.cardId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      date: input.date,
      totalInstallments: input.totalInstallments,
      currentInstallment: input.currentInstallment,
    });
    return;
  }

  const transactionPayload = buildTransactionPayload(input);
  const userId = await getUserId();
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...transactionPayload,
      user_id: userId,
      notes: invoiceItemId ? buildLinkedRecordNote('invoice_item', invoiceItemId) : transactionPayload.notes,
    });

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createCreditPurchase(input: InvoicePurchasePayloadInput) {
  const userId = await getUserId();
  const totalInstallments = input.totalInstallments || 1;
  const currentInstallment = input.currentInstallment || 1;
  const remainingCount = totalInstallments - currentInstallment + 1;

  for (let i = 0; i < remainingCount; i++) {
    const installmentNum = currentInstallment + i;
    const date = addMonthsToDate(input.date, i);
    
    // 1. Insert into invoice_items
    const { data: itemData, error: itemError } = await supabase
      .from('invoice_items')
      .insert({ 
        ...buildInvoicePurchasePayload({ ...input, date, currentInstallment: installmentNum }), 
        user_id: userId 
      })
      .select('id')
      .single();

    if (itemError) throw itemError;

    // 2. Create the linked transaction
    const transactionPayload = buildTransactionPayload({
      type: 'gasto',
      description: input.description,
      amount: input.amount,
      date,
      paymentMethod: 'credito',
      categoryId: input.categoryId,
      totalInstallments: totalInstallments,
    });

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        ...transactionPayload,
        user_id: userId,
        notes: buildLinkedRecordNote('invoice_item', itemData.id),
      });

    if (txError) throw txError;
  }

  emitFinancialDataChanged();
}

export async function createCreditCard(input: CreditCardPayloadInput) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('credit_cards')
    .insert({ ...buildCreditCardPayload(input), user_id: userId });

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
  const userId = await getUserId();
  const { error } = await supabase
    .from('fixed_bills')
    .insert({ ...buildFixedBillPayload(input), user_id: userId });

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function payFixedBill(bill: FixedBill) {
  const userId = await getUserId();
  
  // 1. Create the transaction (gasto)
  const transactionPayload = buildTransactionPayload({
    type: 'gasto',
    description: `Pagamento: ${bill.description}`,
    amount: bill.amount,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'pix', // Default for fixed bills
    categoryId: bill.category_id
  });

  const { error: txError } = await supabase
    .from('transactions')
    .insert({ 
      ...transactionPayload, 
      user_id: userId,
      notes: `fixed_bill:${bill.id}` // Link transaction to this bill
    });

  if (txError) throw txError;

  emitFinancialDataChanged();
}

export async function createInvestment(input: InvestmentPayloadInput) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('investments')
    .insert({ ...buildInvestmentPayload(input), user_id: userId });

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createInvestmentDeposit(input: InvestmentDepositPayloadInput & { investment: Investment }) {
  const userId = await getUserId();
  const depositPayload = {
    ...buildInvestmentDepositPayload(input),
    user_id: userId,
  };

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
      user_id: userId,
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
  const userId = await getUserId();
  const { error } = await supabase
    .from('financial_goals')
    .insert({ ...buildFinancialGoalPayload(input), user_id: userId });

  if (error) throw error;
  emitFinancialDataChanged();
}

async function insertInvoicePurchase(input: InvoicePurchasePayloadInput) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('invoice_items')
    .insert({ ...buildInvoicePurchasePayload(input), user_id: userId })
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
