import { describe, expect, it } from 'vitest';
import {
  buildCreditCardPayload,
  buildFinancialGoalPayload,
  buildFixedBillPayload,
  buildInvestmentDepositPayload,
  buildInvestmentDepositTransactionPayload,
  buildInvestmentPayload,
  buildInvoicePurchasePayload,
  buildLinkedRecordNote,
  getInvestmentTotalsAfterDepositRemoval,
  getInvestmentTotalsAfterDeposit,
  parseLinkedRecordNote,
  buildTransactionPayload,
  parseCurrencyValue,
} from './financialPayloads';

describe('parseCurrencyValue', () => {
  it('parses Brazilian currency strings into numbers', () => {
    expect(parseCurrencyValue('1.234,56')).toBe(1234.56);
    expect(parseCurrencyValue('250')).toBe(250);
  });

  it('rejects empty, zero, and negative values', () => {
    expect(parseCurrencyValue('')).toBeNull();
    expect(parseCurrencyValue('0')).toBeNull();
    expect(parseCurrencyValue('-10')).toBeNull();
  });
});

describe('buildTransactionPayload', () => {
  it('creates a received income transaction for pix payments', () => {
    expect(buildTransactionPayload({
      type: 'entrada',
      description: 'Salario',
      amount: 5000,
      date: '2026-05-08',
      paymentMethod: 'pix',
      categoryId: '',
      notes: '',
    })).toEqual({
      type: 'entrada',
      description: 'Salario',
      amount: 5000,
      date: '2026-05-08',
      status: 'recebido',
      payment_method: 'pix',
      category_id: null,
      notes: null,
    });
  });

  it('stores card expenses as the current installment amount and pending status', () => {
    expect(buildTransactionPayload({
      type: 'gasto',
      description: 'Notebook',
      amount: 3000,
      date: '2026-05-08',
      paymentMethod: 'credito',
      categoryId: 'cat-1',
      notes: 'Work',
      totalInstallments: 3,
    })).toEqual({
      type: 'gasto',
      description: 'Notebook',
      amount: 1000,
      date: '2026-05-08',
      status: 'pendente',
      payment_method: 'credito',
      category_id: 'cat-1',
      notes: 'Work',
    });
  });
});

describe('buildInvoicePurchasePayload', () => {
  it('creates an invoice item with installment amount and current installment', () => {
    expect(buildInvoicePurchasePayload({
      cardId: 'card-1',
      categoryId: '',
      description: 'Notebook',
      amount: 3000,
      date: '2026-05-08',
      totalInstallments: 3,
      currentInstallment: 2,
    })).toEqual({
      card_id: 'card-1',
      category_id: null,
      description: 'Notebook',
      amount: 1000,
      date: '2026-05-08',
      total_installments: 3,
      current_installment: 2,
    });
  });
});

describe('entity payload builders', () => {
  it('maps the simple card fields into the existing Supabase schema', () => {
    expect(buildCreditCardPayload({
      bank: 'Nubank',
      brand: 'Mastercard',
      lastDigits: '1234',
      dueDay: 25,
    })).toMatchObject({
      name: 'Nubank',
      brand: 'Mastercard',
      last_digits: '1234',
      card_holder: '',
      credit_limit: 0,
      due_day: 25,
      closing_day: 3,
    });
  });

  it('creates fixed bill, investment, and goal payloads with normalized amounts', () => {
    expect(buildFixedBillPayload({
      description: 'Parcela do carro',
      amount: 1250,
      dueDay: 12,
      status: 'pendente',
      categoryId: '',
    })).toMatchObject({ description: 'Parcela do carro', amount: 1250, due_day: 12 });

    expect(buildInvestmentPayload({
      name: 'Caixinha reserva',
      ticker: '',
      category: 'renda_fixa',
      amountInvested: 1000,
      currentValue: 1100,
    })).toMatchObject({ return_percentage: 10 });

    expect(buildFinancialGoalPayload({
      title: 'Viagem',
      targetAmount: 10000,
      currentAmount: 1500,
      deadline: '',
    })).toMatchObject({ title: 'Viagem', deadline: null });
  });
});

describe('investment deposits', () => {
  it('creates a dated deposit payload and updates the saved balance', () => {
    expect(buildInvestmentDepositPayload({
      investmentId: 'inv-1',
      amount: 350,
      date: '2026-05-08',
      notes: 'Aporte mensal',
    })).toEqual({
      investment_id: 'inv-1',
      amount: 350,
      date: '2026-05-08',
      notes: 'Aporte mensal',
    });

    expect(getInvestmentTotalsAfterDeposit({
      amountInvested: 1000,
      currentValue: 1200,
      depositAmount: 350,
    })).toEqual({
      amount_invested: 1350,
      current_value: 1550,
      return_percentage: 14.81,
    });
  });

  it('creates a paid expense transaction to debit the free salary balance', () => {
    expect(buildInvestmentDepositTransactionPayload({
      investmentName: 'Caixinha Ferias',
      amount: 500,
      date: '2026-05-08',
      notes: '',
    })).toEqual({
      type: 'gasto',
      description: 'Aporte em Caixinha Ferias',
      amount: 500,
      date: '2026-05-08',
      status: 'pago',
      payment_method: 'transferencia',
      category_id: null,
      notes: 'Debitado do saldo livre para guardar na caixinha.',
    });
  });

  it('reverts investment totals when a deposit is removed', () => {
    expect(getInvestmentTotalsAfterDepositRemoval({
      amountInvested: 1000,
      currentValue: 1200,
      depositAmount: 300,
    })).toEqual({
      amount_invested: 700,
      current_value: 900,
      return_percentage: 28.57,
    });

    expect(getInvestmentTotalsAfterDepositRemoval({
      amountInvested: 100,
      currentValue: 80,
      depositAmount: 150,
    })).toEqual({
      amount_invested: 0,
      current_value: 0,
      return_percentage: 0,
    });
  });
});

describe('linked record notes', () => {
  it('builds and parses invoice item markers', () => {
    const note = buildLinkedRecordNote('invoice_item', 'invoice-1');

    expect(note).toBe('invoice_item:invoice-1');
    expect(parseLinkedRecordNote(note)).toEqual({
      kind: 'invoice_item',
      id: 'invoice-1',
      parentId: null,
    });
  });

  it('parses investment deposit markers with legacy investment-only support', () => {
    expect(buildLinkedRecordNote('investment_deposit', 'deposit-1', 'investment-1')).toBe('investment_deposit:investment-1:deposit-1');
    expect(parseLinkedRecordNote('investment_deposit:investment-1:deposit-1')).toEqual({
      kind: 'investment_deposit',
      id: 'deposit-1',
      parentId: 'investment-1',
    });
    expect(parseLinkedRecordNote('investment_deposit:investment-1')).toEqual({
      kind: 'investment_deposit',
      id: null,
      parentId: 'investment-1',
    });
  });
});
