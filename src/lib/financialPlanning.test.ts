import { describe, expect, it } from 'vitest';
import {
  buildSalarySettingPayload,
  buildSalaryTransactionNote,
  buildSalaryTransactionPayload,
  calculateSummaryCards,
} from './financialPlanning';

describe('salary planning helpers', () => {
  it('normalizes the fixed salary setting payload', () => {
    expect(buildSalarySettingPayload({
      amount: 5234.567,
      dayOfMonth: 40,
    })).toEqual({
      amount: 5234.57,
      day_of_month: 31,
      daily_rate: null,
      work_start_day: null,
      work_end_day: null,
    });
  });

  it('creates a monthly pending salary transaction for the selected month', () => {
    expect(buildSalaryTransactionPayload({
      amount: 4500,
      dayOfMonth: 31,
      monthKey: '2026-02',
    })).toEqual({
      type: 'entrada',
      description: 'Salário',
      amount: 4500,
      date: '2026-02-28',
      status: 'pendente',
      payment_method: 'transferencia',
      category_id: null,
      notes: buildSalaryTransactionNote('2026-02'),
    });
  });

  it('separates current balance from projected leftover in the dashboard summary', () => {
    expect(calculateSummaryCards({
      transactions: [
        { type: 'entrada', amount: 5000, status: 'recebido' },
        { type: 'entrada', amount: 5000, status: 'pendente' },
        { type: 'gasto', amount: 1200, status: 'pago' },
        { type: 'gasto', amount: 1800, status: 'pendente' },
      ],
      savedAmount: 900,
      openInvoices: 1800,
      fixedBillsTotal: 700,
      unpaidFixedBills: 300,
    })).toEqual({
      currentBalance: 3800,
      projectedBalance: 6700,
      totalIncome: 10000,
      totalExpense: 3000,
      savedAmount: 900,
      openInvoices: 1800,
      fixedBillsTotal: 700,
    });
  });

  it('projects a partial fixed bill payment plus its remaining balance only once', () => {
    expect(calculateSummaryCards({
      transactions: [
        {
          type: 'gasto',
          amount: 350,
          status: 'pago',
          notes: 'fixed_bill:bill-1',
        },
      ],
      savedAmount: 0,
      openInvoices: 0,
      fixedBillsTotal: 700,
      unpaidFixedBills: 350,
    })).toEqual({
      currentBalance: -350,
      projectedBalance: -700,
      totalIncome: 0,
      totalExpense: 350,
      savedAmount: 0,
      openInvoices: 0,
      fixedBillsTotal: 700,
    });
  });

  it('ignores legacy carryover entries in the dashboard summary', () => {
    expect(calculateSummaryCards({
      transactions: [
        { type: 'entrada', amount: 800, status: 'recebido', notes: 'carryover:auto:2026-06' },
        { type: 'entrada', amount: 5000, status: 'recebido', notes: 'salary:auto:2026-06' },
        { type: 'gasto', amount: 1200, status: 'pago', notes: null },
      ],
      savedAmount: 0,
      openInvoices: 0,
      fixedBillsTotal: 0,
      unpaidFixedBills: 0,
    })).toEqual({
      currentBalance: 3800,
      projectedBalance: 3800,
      totalIncome: 5000,
      totalExpense: 1200,
      savedAmount: 0,
      openInvoices: 0,
      fixedBillsTotal: 0,
    });
  });
});
