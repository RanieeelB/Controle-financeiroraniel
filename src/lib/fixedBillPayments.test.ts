import { describe, expect, it } from 'vitest';
import type { DynamicFixedBill, FixedBill } from '../types/financial';
import {
  getFixedBillIdFromNote,
  resolveDynamicFixedBills,
  summarizeFixedBills,
  sumEligibleFixedBillPayments,
  validateFixedBillPayment,
  type FixedBillPaymentRecord,
} from './fixedBillPayments';

const bill = (overrides: Partial<FixedBill> = {}): FixedBill => ({
  id: 'bill-1',
  user_id: 'user-1',
  description: 'Internet',
  category_id: null,
  amount: 120,
  due_day: 10,
  status: 'pendente',
  icon: 'wifi',
  created_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const payment = (overrides: Partial<FixedBillPaymentRecord> = {}): FixedBillPaymentRecord => ({
  id: 'tx-1',
  type: 'gasto',
  status: 'pago',
  amount: 50,
  notes: 'fixed_bill:bill-1',
  ...overrides,
});

describe('fixedBillPayments', () => {
  it('summarizes partial and fully paid bills in cents', () => {
    const bills = [
      {
        ...bill({ id: 'partial-bill', amount: 700 }),
        dynamicStatus: 'pendente',
        daysOverdue: 0,
        paidAmount: 350,
        remainingAmount: 350,
        paymentProgress: 50,
        paymentTransactionIds: ['partial-payment'],
      },
      {
        ...bill({ id: 'paid-bill', amount: 200 }),
        dynamicStatus: 'pago',
        daysOverdue: 0,
        paidAmount: 200,
        remainingAmount: 0,
        paymentProgress: 100,
        paymentTransactionIds: ['full-payment'],
      },
    ] satisfies DynamicFixedBill[];

    expect(summarizeFixedBills(bills)).toEqual({
      total: 900,
      paid: 550,
      paidCount: 1,
      pending: 350,
      count: 2,
    });
  });

  it('extracts a bill id only from an exact fixed-bill note', () => {
    expect(getFixedBillIdFromNote('fixed_bill:bill-1')).toBe('bill-1');
    expect(getFixedBillIdFromNote('fixed_bill:')).toBeNull();
    expect(getFixedBillIdFromNote('fixed_bill:bill-1:extra')).toBeNull();
    expect(getFixedBillIdFromNote('prefix fixed_bill:bill-1')).toBeNull();
    expect(getFixedBillIdFromNote(null)).toBeNull();
  });

  it('returns the full pending balance when there is no payment', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill()], payments: [], monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      dynamicStatus: 'pendente', paidAmount: 0, remainingAmount: 120,
      paymentProgress: 0, paymentTransactionIds: [],
    });
  });

  it('aggregates partial and multiple payments in cents', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill({ amount: 100.1 })],
      payments: [payment({ id: 'tx-1', amount: 30.03 }), payment({ id: 'tx-2', amount: 20.02 })],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      dynamicStatus: 'pendente', paidAmount: 50.05, remainingAmount: 50.05,
      paymentProgress: 50, paymentTransactionIds: ['tx-1', 'tx-2'],
    });
  });

  it('marks a bill paid only after exact payment', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill()], payments: [payment({ amount: 120 })],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      dynamicStatus: 'pago', paidAmount: 120, remainingAmount: 0, paymentProgress: 100,
    });
  });

  it('reports a normalized zero-value bill as fully paid', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill({ amount: 0 })], payments: [],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      amount: 0, paidAmount: 0, remainingAmount: 0,
      paymentProgress: 100, dynamicStatus: 'pago',
    });
  });

  it('recalculates the balance and status after payments are deleted', () => {
    const input = {
      bills: [bill({ due_day: 5 })], monthKey: '2026-05',
      today: new Date('2026-05-09T12:00:00.000Z'),
    };
    const [paid] = resolveDynamicFixedBills({ ...input, payments: [payment({ amount: 120 })] });
    const [recalculated] = resolveDynamicFixedBills({ ...input, payments: [] });

    expect(paid.dynamicStatus).toBe('pago');
    expect(recalculated).toMatchObject({
      dynamicStatus: 'atrasado', daysOverdue: 4, paidAmount: 0,
      remainingAmount: 120, paymentTransactionIds: [],
    });
  });

  it('keeps a partial bill overdue in current and past viewed months', () => {
    const [current] = resolveDynamicFixedBills({
      bills: [bill({ due_day: 5 })], payments: [payment()],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });
    const [past] = resolveDynamicFixedBills({
      bills: [bill()], payments: [payment()],
      monthKey: '2026-04', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(current).toMatchObject({ dynamicStatus: 'atrasado', daysOverdue: 4, remainingAmount: 70 });
    expect(past).toMatchObject({ dynamicStatus: 'atrasado', daysOverdue: 0, remainingAmount: 70 });
  });

  it('ignores payments that do not satisfy every eligibility rule', () => {
    const invalidPayments = [
      payment({ id: 'wrong-id', notes: 'fixed_bill:bill-2' }),
      payment({ id: 'malformed', notes: 'fixed_bill:bill-1:extra' }),
      payment({ id: 'income', type: 'entrada' }),
      payment({ id: 'pending', status: 'pendente' }),
      payment({ id: 'zero', amount: 0 }),
      payment({ id: 'negative', amount: -10 }),
      payment({ id: 'nan', amount: Number.NaN }),
      payment({ id: 'numeric-string', amount: '10' as unknown as number }),
      { id: 'missing', type: 'gasto', status: 'pago', notes: 'fixed_bill:bill-1' } as FixedBillPaymentRecord,
    ];

    expect(sumEligibleFixedBillPayments({ billId: 'bill-1', payments: invalidPayments, maximumAmount: 120 }))
      .toBe(0);

    const [result] = resolveDynamicFixedBills({
      bills: [bill()], payments: invalidPayments,
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });
    expect(result.paymentTransactionIds).toEqual([]);
  });

  it('returns the capped paid amount from the public sum helper', () => {
    expect(sumEligibleFixedBillPayments({
      billId: 'bill-1',
      payments: [payment({ id: 'tx-1', amount: 70 }), payment({ id: 'tx-2', amount: 50 })],
      maximumAmount: 100,
    })).toBe(100);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'returns zero for nonfinite maximum amount %s',
    maximumAmount => {
      expect(sumEligibleFixedBillPayments({
        billId: 'bill-1', payments: [payment({ amount: 10 })], maximumAmount,
      })).toBe(0);
    },
  );

  it('caps legacy overpayment while preserving the bill amount invariant', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill({ amount: 100 })],
      payments: [payment({ id: 'tx-1', amount: 70 }), payment({ id: 'tx-2', amount: 50 })],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result).toMatchObject({
      paidAmount: 100, remainingAmount: 0, paymentProgress: 100,
      dynamicStatus: 'pago', paymentTransactionIds: ['tx-1', 'tx-2'],
    });
    expect(result.paidAmount + result.remainingAmount).toBe(result.amount);
  });

  it('rounds payment progress to two decimals', () => {
    const [result] = resolveDynamicFixedBills({
      bills: [bill({ amount: 3 })], payments: [payment({ amount: 1 })],
      monthKey: '2026-05', today: new Date('2026-05-09T12:00:00.000Z'),
    });

    expect(result.paymentProgress).toBe(33.33);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1])(
    'rejects invalid payment amount %s',
    paymentAmount => {
      expect(validateFixedBillPayment({ billAmount: 100, paidAmount: 20, paymentAmount }))
        .toEqual({ ok: false, code: 'invalid_amount', remainingAmount: 80 });
    },
  );

  it('rejects a payment above the remaining balance', () => {
    expect(validateFixedBillPayment({ billAmount: 100, paidAmount: 70, paymentAmount: 30.01 }))
      .toEqual({ ok: false, code: 'exceeds_remaining', remainingAmount: 30 });
  });

  it('returns normalized currency values for a valid payment', () => {
    expect(validateFixedBillPayment({ billAmount: 100, paidAmount: 70, paymentAmount: 29.999 }))
      .toEqual({ ok: true, amount: 30, remainingAfterPayment: 0 });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects nonfinite bill amount %s with a finite remaining balance',
    billAmount => {
      const result = validateFixedBillPayment({ billAmount, paidAmount: 0, paymentAmount: 10 });

      expect(result).toMatchObject({ ok: false, code: 'invalid_amount' });
      expect(Number.isFinite(result.remainingAmount)).toBe(true);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects nonfinite paid amount %s with a finite remaining balance',
    paidAmount => {
      const result = validateFixedBillPayment({ billAmount: 100, paidAmount, paymentAmount: 10 });

      expect(result).toMatchObject({ ok: false, code: 'invalid_amount' });
      expect(Number.isFinite(result.remainingAmount)).toBe(true);
    },
  );
});
