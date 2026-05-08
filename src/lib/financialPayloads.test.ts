import { describe, expect, it } from 'vitest';
import {
  buildCreditCardPayload,
  buildFinancialGoalPayload,
  buildFixedBillPayload,
  buildInvestmentPayload,
  buildInvoicePurchasePayload,
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
    })).toMatchObject({
      name: 'Nubank',
      brand: 'Mastercard',
      last_digits: '1234',
      card_holder: '',
      credit_limit: 0,
      due_day: 10,
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
