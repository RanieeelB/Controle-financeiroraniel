import { summarizeInvoiceItems } from './invoiceBreakdown';
import type { InvoiceItem } from '../types/financial';

export function getCardInvoiceSummary(items: InvoiceItem[], cardId: string) {
  return summarizeInvoiceItems(items.filter(item => item.card_id === cardId));
}
