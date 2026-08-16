import { describe, expect, it } from 'vitest';
import { getCardInvoiceSummary } from './creditCardInvoiceSummary';
import type { InvoiceItem } from '../types/financial';

describe('creditCardInvoiceSummary', () => {
  it('summarizes only the requested card', () => {
    const items: InvoiceItem[] = [
      {
        id: '1',
        card_id: 'card-a',
        description: 'Compra A1',
        amount: 100,
        date: '2026-08-01',
        total_installments: 1,
        current_installment: 1,
        user_id: 'u1',
        category_id: null,
        notes: null,
      },
      {
        id: '2',
        card_id: 'card-a',
        description: 'Compra A2',
        amount: 50,
        date: '2026-08-01',
        total_installments: 3,
        current_installment: 1,
        user_id: 'u1',
        category_id: null,
        notes: null,
      },
      {
        id: '3',
        card_id: 'card-b',
        description: 'Compra B1',
        amount: 200,
        date: '2026-08-01',
        total_installments: 1,
        current_installment: 1,
        user_id: 'u1',
        category_id: null,
        notes: null,
      },
    ];

    expect(getCardInvoiceSummary(items, 'card-a')).toEqual({
      cashPurchases: 100,
      installmentPurchases: 50,
      total: 150,
    });
  });

  it('returns zeros when card has no items', () => {
    expect(getCardInvoiceSummary([], 'card-c')).toEqual({
      cashPurchases: 0,
      installmentPurchases: 0,
      total: 0,
    });
  });
});
