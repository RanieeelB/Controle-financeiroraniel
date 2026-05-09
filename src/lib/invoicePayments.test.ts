import { describe, expect, it } from 'vitest';
import { getInvoicePaymentStatus, getPayableInvoiceTransactionIds } from './invoicePayments';

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
});
