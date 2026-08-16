import { describe, expect, it } from 'vitest';
import {
  getInvoicePurchaseSchedule,
  summarizeInvoiceItems,
  type InvoiceBreakdownItem,
} from './invoiceBreakdown';

function makeItem(overrides: Partial<InvoiceBreakdownItem> = {}): InvoiceBreakdownItem {
  return {
    amount: 100,
    date: '2026-08-01',
    total_installments: 1,
    current_installment: 1,
    ...overrides,
  };
}

describe('invoiceBreakdown', () => {
  it('keeps total equal to cash plus installments using cents', () => {
    expect(summarizeInvoiceItems([
      { amount: '10.10', date: '2026-08-01', total_installments: 1, current_installment: 1 },
      { amount: '20.20', date: '2026-08-01', total_installments: 10, current_installment: 3 },
    ])).toEqual({ cashPurchases: 10.1, installmentPurchases: 20.2, total: 30.3 });
  });

  it('predicts an ending month across a year boundary', () => {
    expect(getInvoicePurchaseSchedule({
      amount: 100,
      date: '2026-08-05',
      total_installments: 10,
      current_installment: 3,
    })).toEqual({
      kind: 'installment',
      currentInstallment: 3,
      totalInstallments: 10,
      endingMonthKey: '2027-03',
    });
  });

  it('predicts ending month when installment ends in same month', () => {
    expect(getInvoicePurchaseSchedule({
      amount: 100,
      date: '2026-08-05',
      total_installments: 5,
      current_installment: 5,
    })).toEqual({
      kind: 'installment',
      currentInstallment: 5,
      totalInstallments: 5,
      endingMonthKey: '2026-08',
    });
  });

  it('keeps an invalid-date installment with unavailable ending', () => {
    expect(getInvoicePurchaseSchedule({
      amount: 100,
      date: 'bad',
      total_installments: 3,
      current_installment: 1,
    })).toEqual({
      kind: 'installment',
      currentInstallment: 1,
      totalInstallments: 3,
      endingMonthKey: null,
    });
  });

  it.each([
    [undefined, 'cash'],
    [0, 'cash'],
    [-2, 'cash'],
    [2.5, 'cash'],
    ['3', 'cash'],
    [3, 'installment'],
  ])('normalizes total_installments=%s', (total, kind) => {
    expect(getInvoicePurchaseSchedule(makeItem({ total_installments: total as unknown as number }))).toMatchObject({ kind });
  });

  it.each([
    [undefined, 1],
    [0, 1],
    [-1, 1],
    [2.5, 1],
    ['3', 1],
    ['bad', 1],
    [99, 10],
    [3, 3],
  ])('normalizes current_installment=%s', (current, expected) => {
    expect(getInvoicePurchaseSchedule(makeItem({
      total_installments: 10,
      current_installment: current as unknown as number,
    }))).toMatchObject({ currentInstallment: expected, totalInstallments: 10 });
  });

  it.each([0, -1, 'bad', Number.NaN, Number.POSITIVE_INFINITY])('ignores invalid amount %s', amount => {
    expect(summarizeInvoiceItems([makeItem({ amount: amount as unknown as number })])).toEqual({
      cashPurchases: 0,
      installmentPurchases: 0,
      total: 0,
    });
  });

  it('handles empty items array', () => {
    expect(summarizeInvoiceItems([])).toEqual({
      cashPurchases: 0,
      installmentPurchases: 0,
      total: 0,
    });
  });

  it('handles cash-only items', () => {
    expect(summarizeInvoiceItems([
      makeItem({ amount: 50, total_installments: 1 }),
      makeItem({ amount: 75.5, total_installments: 1 }),
    ])).toEqual({
      cashPurchases: 125.5,
      installmentPurchases: 0,
      total: 125.5,
    });
  });

  it('handles installment-only items', () => {
    expect(summarizeInvoiceItems([
      makeItem({ amount: 40, total_installments: 3, current_installment: 1 }),
      makeItem({ amount: 60, total_installments: 6, current_installment: 2 }),
    ])).toEqual({
      cashPurchases: 0,
      installmentPurchases: 100,
      total: 100,
    });
  });
});
