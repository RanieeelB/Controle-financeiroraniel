import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  emitFinancialDataChanged: vi.fn(),
  fixedBillEq: vi.fn(),
  fixedBillSelect: vi.fn(),
  fixedBillSingle: vi.fn(),
  from: vi.fn(),
  getSession: vi.fn(),
  paymentNoteEq: vi.fn(),
  paymentGte: vi.fn(),
  paymentLt: vi.fn(),
  paymentOrder: vi.fn(),
  paymentRange: vi.fn(),
  paymentSelect: vi.fn(),
  paymentStatusEq: vi.fn(),
  paymentTypeEq: vi.fn(),
  transactionInsert: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    from: mocks.from,
  },
}));

vi.mock('./financialEvents', () => ({
  emitFinancialDataChanged: mocks.emitFinancialDataChanged,
}));

import { createFinancialTransaction, createFixedBillPayment } from './financialActions';

const persistedBill = {
  id: 'bill-1',
  description: 'Energia',
  amount: 700,
  category_id: 'category-persisted',
};

function setPaymentRows(data: unknown[]) {
  mocks.paymentRange.mockResolvedValueOnce({ data, error: null });
}

describe('createFixedBillPayment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 15, 12));
    vi.resetAllMocks();

    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'session-user' } } },
    });
    mocks.fixedBillSingle.mockResolvedValue({ data: persistedBill, error: null });
    mocks.paymentRange.mockResolvedValue({ data: [], error: null });
    mocks.transactionInsert.mockResolvedValue({ error: null });

    mocks.fixedBillSelect.mockReturnValue({ eq: mocks.fixedBillEq });
    mocks.fixedBillEq.mockReturnValue({ single: mocks.fixedBillSingle });
    mocks.paymentSelect.mockReturnValue({ eq: mocks.paymentNoteEq });
    mocks.paymentNoteEq.mockReturnValue({ eq: mocks.paymentTypeEq });
    mocks.paymentTypeEq.mockReturnValue({ eq: mocks.paymentStatusEq });
    mocks.paymentStatusEq.mockReturnValue({ gte: mocks.paymentGte });
    mocks.paymentGte.mockReturnValue({ lt: mocks.paymentLt });
    mocks.paymentLt.mockReturnValue({ order: mocks.paymentOrder });
    mocks.paymentOrder.mockReturnValue({ range: mocks.paymentRange });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'fixed_bills') return { select: mocks.fixedBillSelect };
      if (table === 'transactions') {
        return {
          insert: mocks.transactionInsert,
          select: mocks.paymentSelect,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    'fixed_bill:forged-id',
    'fixed_bill:',
    ' fixed_bill:forged-id',
    '\tfixed_bill:forged-id',
    '\nfixed_bill:forged-id',
    '\uFEFFfixed_bill:forged-id',
  ])(
    'reserves the fixed-bill note namespace before auth and table access: %s',
    async notes => {
      await expect(createFinancialTransaction({
        type: 'gasto',
        description: 'Academia',
        amount: 90,
        date: '2026-08-15',
        paymentMethod: 'pix',
        notes,
      })).rejects.toThrow('A marca "fixed_bill:" é reservada para pagamentos de contas fixas.');

      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
    },
  );

  it.each([
    [new Date(2026, 7, 31, 23, 59, 59), new Date(2026, 8, 1, 0, 0, 1), '2026-08', '2026-08-31', '2026-08-01', '2026-09-01'],
    [new Date(2026, 8, 1, 0, 0, 1), new Date(2026, 9, 1, 0, 0, 1), '2026-09', '2026-09-01', '2026-09-01', '2026-10-01'],
    [new Date(2027, 0, 1, 0, 0, 1), new Date(2027, 1, 1, 0, 0, 1), '2027-01', '2027-01-01', '2027-01-01', '2027-02-01'],
  ])(
    'uses one coherent local month and date at %s',
    async (now, afterSessionLookup, selectedMonthKey, dateKey, rangeStart, rangeEnd) => {
      vi.setSystemTime(now);
      mocks.getSession.mockImplementationOnce(async () => {
        vi.setSystemTime(afterSessionLookup);
        return { data: { session: { user: { id: 'session-user' } } } };
      });

      await expect(createFixedBillPayment({
        billId: persistedBill.id,
        amount: 10,
        selectedMonthKey,
      })).resolves.toEqual({ status: 'created' });

      expect(mocks.paymentGte).toHaveBeenCalledWith('date', rangeStart);
      expect(mocks.paymentLt).toHaveBeenCalledWith('date', rangeEnd);
      expect(mocks.transactionInsert).toHaveBeenCalledWith(expect.objectContaining({ date: dateKey }));
    },
  );

  it('rejects a non-current selected month before any table call', async () => {
    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 10,
      selectedMonthKey: '2026-07',
    })).resolves.toEqual({ status: 'rejected', code: 'invalid_month' });

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it.each([0, -1, 0.001, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the invalid input amount %s before persistence',
    async amount => {
      await expect(createFixedBillPayment({
        billId: persistedBill.id,
        amount,
        selectedMonthKey: '2026-08',
      })).resolves.toEqual({ status: 'rejected', code: 'invalid_amount' });

      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
    },
  );

  it.each([
    [{ data: null, error: { code: 'PGRST116', message: 'No rows' } }],
    [{ data: null, error: null }],
  ])('returns bill_not_found when the persisted bill is absent', async response => {
    mocks.fixedBillSingle.mockResolvedValue(response);

    await expect(createFixedBillPayment({
      billId: 'missing-bill',
      amount: 10,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({ status: 'rejected', code: 'bill_not_found' });

    expect(mocks.paymentSelect).not.toHaveBeenCalled();
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('throws a generic persisted-bill read error', async () => {
    const readError = { code: '42501', message: 'permission denied' };
    mocks.fixedBillSingle.mockResolvedValue({ data: null, error: readError });

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 10,
      selectedMonthKey: '2026-08',
    })).rejects.toBe(readError);

    expect(mocks.paymentSelect).not.toHaveBeenCalled();
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('throws a payment read error', async () => {
    const readError = { code: '57014', message: 'query cancelled' };
    mocks.paymentRange.mockResolvedValue({ data: null, error: readError });

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 10,
      selectedMonthKey: '2026-08',
    })).rejects.toBe(readError);

    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('accepts the fresh remaining R$350 payment for a R$700 bill', async () => {
    setPaymentRows([{
      id: 'payment-1',
      notes: 'fixed_bill:bill-1',
      status: 'pago',
      type: 'gasto',
      amount: 350,
    }]);

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 350,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({ status: 'created' });

    expect(mocks.transactionInsert).toHaveBeenCalledTimes(1);
    expect(mocks.emitFinancialDataChanged).toHaveBeenCalledTimes(1);
  });

  it('rejects R$351 against a fresh R$350 remainder without inserting', async () => {
    setPaymentRows([{
      id: 'payment-1',
      notes: 'fixed_bill:bill-1',
      status: 'pago',
      type: 'gasto',
      amount: 350,
    }]);

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 351,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({
      status: 'rejected',
      code: 'exceeds_remaining',
      remainingAmount: 350,
    });

    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('includes later payment pages when validating the fresh remainder', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `payment-${String(index).padStart(4, '0')}`,
      notes: 'fixed_bill:bill-1',
      status: 'pago',
      type: 'gasto',
      amount: 1,
    }));
    const secondPage = [{
      id: 'payment-1000',
      notes: 'fixed_bill:bill-1',
      status: 'pago',
      type: 'gasto',
      amount: 500,
    }];
    mocks.fixedBillSingle.mockResolvedValue({
      data: { ...persistedBill, amount: 2000 },
      error: null,
    });
    mocks.paymentRange
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 600,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({
      status: 'rejected',
      code: 'exceeds_remaining',
      remainingAmount: 500,
    });

    expect(mocks.paymentOrder.mock.calls).toEqual([
      ['id', { ascending: true }],
      ['id', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(mocks.paymentRange.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [1001, 2000],
    ]);
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('continues after a nonempty page below the requested client page size', async () => {
    const firstPage = [
      {
        id: 'payment-0000',
        notes: 'fixed_bill:bill-1',
        status: 'pago',
        type: 'gasto',
        amount: 100,
      },
      {
        id: 'payment-0001',
        notes: 'fixed_bill:bill-1',
        status: 'pago',
        type: 'gasto',
        amount: 100,
      },
    ];
    const secondPage = [{
      id: 'payment-0002',
      notes: 'fixed_bill:bill-1',
      status: 'pago',
      type: 'gasto',
      amount: 300,
    }];
    mocks.fixedBillSingle.mockResolvedValue({
      data: { ...persistedBill, amount: 1000 },
      error: null,
    });
    mocks.paymentRange
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 600,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({
      status: 'rejected',
      code: 'exceeds_remaining',
      remainingAmount: 500,
    });

    expect(mocks.paymentOrder.mock.calls).toEqual([
      ['id', { ascending: true }],
      ['id', { ascending: true }],
      ['id', { ascending: true }],
    ]);
    expect(mocks.paymentRange.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002],
    ]);
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });

  it('trusts persisted bill fields and inserts one exact normalized payment payload', async () => {
    vi.setSystemTime(new Date(2026, 7, 31, 23, 59, 59));
    mocks.fixedBillSingle.mockResolvedValue({
      data: {
        id: 'persisted-id',
        description: 'Internet premium',
        amount: 700,
        category_id: 'persisted-category',
      },
      error: null,
    });

    await expect(createFixedBillPayment({
      billId: 'persisted-id',
      amount: 349.999,
      selectedMonthKey: '2026-08',
    })).resolves.toEqual({ status: 'created' });

    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.fixedBillSelect).toHaveBeenCalledWith('id, description, amount, category_id');
    expect(mocks.fixedBillEq).toHaveBeenCalledWith('id', 'persisted-id');
    expect(mocks.fixedBillSingle).toHaveBeenCalledTimes(1);
    expect(mocks.paymentSelect).toHaveBeenCalledWith('id, notes, status, type, amount');
    expect(mocks.paymentNoteEq).toHaveBeenCalledWith('notes', 'fixed_bill:persisted-id');
    expect(mocks.paymentTypeEq).toHaveBeenCalledWith('type', 'gasto');
    expect(mocks.paymentStatusEq).toHaveBeenCalledWith('status', 'pago');
    expect(mocks.paymentGte).toHaveBeenCalledWith('date', '2026-08-01');
    expect(mocks.paymentLt).toHaveBeenCalledWith('date', '2026-09-01');
    expect(mocks.paymentOrder).toHaveBeenCalledWith('id', { ascending: true });
    expect(mocks.paymentRange).toHaveBeenCalledWith(0, 999);
    expect(mocks.transactionInsert).toHaveBeenCalledTimes(1);
    expect(mocks.transactionInsert).toHaveBeenCalledWith({
      type: 'gasto',
      description: 'Abatimento: Internet premium',
      amount: 350,
      date: '2026-08-31',
      status: 'pago',
      payment_method: 'pix',
      category_id: 'persisted-category',
      notes: 'fixed_bill:persisted-id',
      user_id: 'session-user',
    });
    expect(mocks.emitFinancialDataChanged).toHaveBeenCalledTimes(1);
  });

  it('throws an insert error without emitting an event', async () => {
    const insertError = { code: '23514', message: 'check violation' };
    mocks.transactionInsert.mockResolvedValue({ error: insertError });

    await expect(createFixedBillPayment({
      billId: persistedBill.id,
      amount: 10,
      selectedMonthKey: '2026-08',
    })).rejects.toBe(insertError);

    expect(mocks.transactionInsert).toHaveBeenCalledTimes(1);
    expect(mocks.emitFinancialDataChanged).not.toHaveBeenCalled();
  });
});
