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
  buildTransactionPayload,
  getInvestmentTotalsAfterDeposit,
  type CreditCardPayloadInput,
  type FinancialGoalPayloadInput,
  type FixedBillPayloadInput,
  type InvestmentDepositPayloadInput,
  type InvestmentPayloadInput,
  type InvoicePurchasePayloadInput,
  type TransactionPayloadInput,
} from './financialPayloads';
import type { Investment } from '../types/financial';

export type CreateFinancialTransactionInput = TransactionPayloadInput & {
  cardId?: string | null;
  currentInstallment?: number;
};

export async function createFinancialTransaction(input: CreateFinancialTransactionInput) {
  if (input.paymentMethod === 'credito') {
    if (!input.cardId) {
      throw new Error('Selecione um cartão para lançar no crédito.');
    }

    await insertInvoicePurchase({
      cardId: input.cardId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      date: input.date,
      totalInstallments: input.totalInstallments,
      currentInstallment: input.currentInstallment,
    });
  }

  const { error } = await supabase
    .from('transactions')
    .insert(buildTransactionPayload(input));

  if (error) throw error;
  emitFinancialDataChanged();
}

export async function createCreditPurchase(input: InvoicePurchasePayloadInput) {
  await insertInvoicePurchase(input);

  const { error } = await supabase
    .from('transactions')
    .insert(buildTransactionPayload({
      type: 'gasto',
      description: input.description,
      amount: input.amount,
      date: input.date,
      paymentMethod: 'credito',
      categoryId: input.categoryId,
      totalInstallments: input.totalInstallments,
    }));

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

  const { error: depositError } = await supabase
    .from('investment_deposits')
    .insert(depositPayload);

  if (depositError && !isMissingInvestmentDepositsTable(depositError)) {
    throw depositError;
  }

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
      notes: `investment_deposit:${input.investment.id}`,
    });

  if (transactionError) throw transactionError;
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
  const { error } = await supabase
    .from('invoice_items')
    .insert(buildInvoicePurchasePayload(input));

  if (error) throw error;
}

function isMissingInvestmentDepositsTable(error: { code?: string; message?: string }) {
  return error.code === '42P01'
    || error.message?.includes('investment_deposits') === true
    || error.message?.includes('Could not find the table') === true;
}
