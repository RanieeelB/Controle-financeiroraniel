import { describe, expect, it } from 'vitest';
import type { DynamicFixedBill } from '../types/financial';
import { buildDashboardFixedBillSummary } from './dashboardFixedBillSummary';

describe('buildDashboardFixedBillSummary', () => {
  it('keeps the original bill total while exposing only the remaining commitment', () => {
    const partialBill = {
      id: 'bill-1',
      user_id: 'user-1',
      description: 'Rent',
      category_id: null,
      amount: 700,
      due_day: 10,
      status: 'pendente',
      icon: 'house',
      created_at: '2026-01-01T00:00:00.000Z',
      dynamicStatus: 'pendente',
      daysOverdue: 0,
      paidAmount: 350,
      remainingAmount: 350,
      paymentProgress: 50,
      paymentTransactionIds: ['tx-1'],
    } satisfies DynamicFixedBill;

    expect(buildDashboardFixedBillSummary([partialBill])).toEqual({
      fixedBillsTotal: 700,
      unpaidFixedBills: 350,
    });
  });
});
