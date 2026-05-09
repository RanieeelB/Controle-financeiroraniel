import { describe, expect, it } from 'vitest';
import {
  getInvoiceActionState,
  getInvoicePaymentStatus,
  getPayableInvoiceTransactionIds,
  getPaidInvoiceTransactionIds,
} from './invoicePayments';

describe('invoicePayments', () => {
  it('returns pending credit transaction ids for the selected invoice items', () => {
    expect(getPayableInvoiceTransactionIds(
      [
        { id: 'invoice-1' },
        { id: 'invoice-2' },
      ],
      [
        { id: 'tx-1', notes: 'invoice_item:invoice-1', status: 'pendente' },
        { id: 'tx-2', notes: 'invoice_item:invoice-2', status: 'pago' },
        { id: 'tx-3', notes: 'salary:auto:2026-05', status: 'pendente' },
      ],
    )).toEqual(['tx-1']);
  });

  it('marks the invoice as paid only when every linked transaction is paid', () => {
    expect(getInvoicePaymentStatus(
      [
        { id: 'invoice-1' },
        { id: 'invoice-2' },
      ],
      [
        { id: 'tx-1', notes: 'invoice_item:invoice-1', status: 'pago' },
        { id: 'tx-2', notes: 'invoice_item:invoice-2', status: 'pago' },
      ],
    )).toBe('paid');

    expect(getInvoicePaymentStatus(
      [
        { id: 'invoice-1' },
        { id: 'invoice-2' },
      ],
      [
        { id: 'tx-1', notes: 'invoice_item:invoice-1', status: 'pago' },
        { id: 'tx-2', notes: 'invoice_item:invoice-2', status: 'pendente' },
      ],
    )).toBe('open');
  });

  it('returns paid credit transaction ids so the invoice can be reopened', () => {
    expect(getPaidInvoiceTransactionIds(
      [
        { id: 'invoice-1' },
        { id: 'invoice-2' },
      ],
      [
        { id: 'tx-1', notes: 'invoice_item:invoice-1', status: 'pago' },
        { id: 'tx-2', notes: 'invoice_item:invoice-2', status: 'pendente' },
        { id: 'tx-3', notes: 'invoice_item:invoice-3', status: 'pago' },
      ],
    )).toEqual(['tx-1']);
  });

  it('falls back to matching legacy credit transactions when invoice notes are missing', () => {
    const items = [
      {
        id: 'invoice-1',
        description: 'Mensalidade da faculdade',
        amount: 445.55,
        date: '2026-05-09',
      },
    ];

    const transactions = [
      {
        id: 'tx-legacy-1',
        description: 'Mensalidade da faculdade',
        amount: 445.55,
        date: '2026-05-09',
        payment_method: 'credito' as const,
        notes: null,
        status: 'pago' as const,
      },
    ];

    expect(getInvoicePaymentStatus(items, transactions)).toBe('paid');
    expect(getPaidInvoiceTransactionIds(items, transactions)).toEqual(['tx-legacy-1']);
    expect(getPayableInvoiceTransactionIds(items, transactions)).toEqual([]);
  });

  it('allows reopening when the invoice is open but only paid transactions were matched', () => {
    expect(getInvoiceActionState({
      invoiceStatus: 'open',
      payableTransactionIds: [],
      paidTransactionIds: ['tx-legacy-1'],
      isPayingInvoice: false,
    })).toEqual({
      label: 'Reabrir fatura',
      disabled: false,
      action: 'reopen',
    });
  });
});
