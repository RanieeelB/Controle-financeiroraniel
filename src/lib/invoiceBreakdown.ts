import { moveMonth } from './monthSelection';

export interface InvoiceBreakdownItem {
  amount: number | string;
  date: string;
  total_installments: number;
  current_installment: number;
}

export type InvoicePurchaseSchedule =
  | { kind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { kind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null };

function normalizeInstallmentCount(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 1 ? Number(value) : 1;
}

export function getInvoicePurchaseSchedule(item: InvoiceBreakdownItem): InvoicePurchaseSchedule {
  const totalInstallments = normalizeInstallmentCount(item.total_installments);
  if (totalInstallments === 1) {
    return { kind: 'cash', currentInstallment: null, totalInstallments: null, endingMonthKey: null };
  }
  const rawCurrent = item.current_installment;
  const currentInstallment = Number.isInteger(rawCurrent)
    ? Math.min(totalInstallments, Math.max(1, Number(rawCurrent)))
    : 1;
  const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])(?:-|$)/.exec(item.date ?? '');
  const endingMonthKey = monthMatch
    ? moveMonth(`${monthMatch[1]}-${monthMatch[2]}`, totalInstallments - currentInstallment)
    : null;
  return { kind: 'installment', currentInstallment, totalInstallments, endingMonthKey };
}

export function summarizeInvoiceItems(items: InvoiceBreakdownItem[]) {
  let cashCents = 0;
  let installmentCents = 0;
  for (const item of items) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const cents = Math.round(amount * 100);
    if (getInvoicePurchaseSchedule(item).kind === 'installment') installmentCents += cents;
    else cashCents += cents;
  }
  return {
    cashPurchases: cashCents / 100,
    installmentPurchases: installmentCents / 100,
    total: (cashCents + installmentCents) / 100,
  };
}
