import { describe, expect, it } from 'vitest';
import { resolveDynamicFixedBills } from './fixedBillPayments';

describe('fixedBillPayments', () => {
  it('marks bills as paid for the selected month and exposes the payment transaction ids', () => {
    const result = resolveDynamicFixedBills({
      bills: [
        {
          id: 'bill-1',
          user_id: 'user-1',
          description: 'Internet',
          category_id: null,
          amount: 120,
          due_day: 10,
          status: 'pendente',
          icon: 'wifi',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      payments: [
        { id: 'tx-1', notes: 'fixed_bill:bill-1', status: 'pago' },
        { id: 'tx-2', notes: 'fixed_bill:bill-1', status: 'pago' },
      ],
      monthKey: '2026-05',
      today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'bill-1',
        dynamicStatus: 'pago',
        daysOverdue: 0,
        paymentTransactionIds: ['tx-1', 'tx-2'],
      }),
    ]);
  });

  it('returns overdue bills to pending once the monthly payment transactions are removed', () => {
    const result = resolveDynamicFixedBills({
      bills: [
        {
          id: 'bill-1',
          user_id: 'user-1',
          description: 'Internet',
          category_id: null,
          amount: 120,
          due_day: 5,
          status: 'pendente',
          icon: 'wifi',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      payments: [],
      monthKey: '2026-05',
      today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'bill-1',
        dynamicStatus: 'atrasado',
        daysOverdue: 4,
        paymentTransactionIds: [],
      }),
    ]);
  });
});
