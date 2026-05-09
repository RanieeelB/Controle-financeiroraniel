import type { InvoiceItem, Transaction } from '../types/financial';

type InvoicePaymentItem = Pick<InvoiceItem, 'id'>;
type InvoicePaymentTransaction = Pick<Transaction, 'id' | 'notes' | 'status'>;

export function getPayableInvoiceTransactionIds(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  return getInvoiceTransactionIdsByStatus(items, transactions, 'pendente');
}

export function getPaidInvoiceTransactionIds(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  return getInvoiceTransactionIdsByStatus(items, transactions, 'pago');
}

export function getInvoicePaymentStatus(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  if (items.length === 0) return 'open' as const;

  const itemIds = new Set(items.map(item => item.id));
  const invoiceTransactions = transactions.filter(transaction => {
    const linkedItemId = transaction.notes?.startsWith('invoice_item:')
      ? transaction.notes.replace('invoice_item:', '')
      : null;

    return linkedItemId !== null && itemIds.has(linkedItemId);
  });

  if (invoiceTransactions.length !== items.length) return 'open' as const;
  return invoiceTransactions.every(transaction => transaction.status === 'pago') ? 'paid' as const : 'open' as const;
}

function getInvoiceTransactionIdsByStatus(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
  status: InvoicePaymentTransaction['status'],
) {
  const itemIds = new Set(items.map(item => item.id));

  return transactions
    .filter(transaction => {
      const linkedItemId = transaction.notes?.startsWith('invoice_item:')
        ? transaction.notes.replace('invoice_item:', '')
        : null;

      return linkedItemId !== null
        && itemIds.has(linkedItemId)
        && transaction.status === status;
    })
    .map(transaction => transaction.id);
}
