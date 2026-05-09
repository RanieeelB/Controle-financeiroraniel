import type { InvoiceItem, Transaction } from '../types/financial';

type InvoicePaymentItem = Pick<InvoiceItem, 'id'> & Partial<Pick<InvoiceItem, 'description' | 'amount' | 'date'>>;
type InvoicePaymentTransaction = Pick<Transaction, 'id' | 'notes' | 'status'> & Partial<Pick<Transaction, 'description' | 'amount' | 'date' | 'payment_method'>>;

export function getPayableInvoiceTransactionIds(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  return getMatchedInvoiceTransactions(items, transactions)
    .filter(transaction => transaction.status === 'pendente')
    .map(transaction => transaction.id);
}

export function getPaidInvoiceTransactionIds(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  return getMatchedInvoiceTransactions(items, transactions)
    .filter(transaction => transaction.status === 'pago')
    .map(transaction => transaction.id);
}

export function getInvoicePaymentStatus(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  if (items.length === 0) return 'open' as const;

  const matchedTransactions = getMatchedInvoiceTransactions(items, transactions);
  if (matchedTransactions.length !== items.length) return 'open' as const;

  return matchedTransactions.every(transaction => transaction.status === 'pago')
    ? 'paid' as const
    : 'open' as const;
}

function getMatchedInvoiceTransactions(
  items: InvoicePaymentItem[],
  transactions: InvoicePaymentTransaction[],
) {
  const linkedTransactionsByItemId = new Map<string, InvoicePaymentTransaction>();
  const fallbackBuckets = new Map<string, InvoicePaymentTransaction[]>();

  transactions.forEach(transaction => {
    const linkedItemId = transaction.notes?.startsWith('invoice_item:')
      ? transaction.notes.replace('invoice_item:', '')
      : null;

    if (linkedItemId) {
      linkedTransactionsByItemId.set(linkedItemId, transaction);
      return;
    }

    if (!canUseLegacyFallback(transaction)) return;

    const signature = getLegacyInvoiceSignature(transaction);
    if (!signature) return;

    const bucket = fallbackBuckets.get(signature) ?? [];
    bucket.push(transaction);
    fallbackBuckets.set(signature, bucket);
  });

  return items.flatMap(item => {
    const linkedTransaction = linkedTransactionsByItemId.get(item.id);
    if (linkedTransaction) return [linkedTransaction];

    const signature = getLegacyInvoiceSignature(item);
    if (!signature) return [];

    const bucket = fallbackBuckets.get(signature);
    if (!bucket?.length) return [];

    const [matchedTransaction] = bucket.splice(0, 1);
    return matchedTransaction ? [matchedTransaction] : [];
  });
}

function canUseLegacyFallback(transaction: InvoicePaymentTransaction) {
  return transaction.payment_method === undefined || transaction.payment_method === 'credito';
}

function getLegacyInvoiceSignature(
  record: Partial<Pick<InvoiceItem, 'description' | 'amount' | 'date'>> | Partial<Pick<Transaction, 'description' | 'amount' | 'date'>>,
) {
  if (!record.description || typeof record.amount !== 'number' || !record.date) return null;

  return `${record.description.trim().toLocaleLowerCase('pt-BR')}|${record.amount.toFixed(2)}|${record.date}`;
}
