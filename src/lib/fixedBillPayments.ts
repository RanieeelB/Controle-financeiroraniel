import type { DynamicFixedBill, FixedBill, Transaction } from '../types/financial.js';

export type FixedBillPaymentRecord = Pick<Transaction, 'id' | 'type' | 'status' | 'amount' | 'notes'>;

const FIXED_BILL_NOTE_PATTERN = /^fixed_bill:([^:]+)$/;

function toCents(value: number) {
  return Math.round(value * 100);
}

function fromCents(value: number) {
  return value / 100;
}

export function getFixedBillIdFromNote(note?: string | null) {
  return note?.match(FIXED_BILL_NOTE_PATTERN)?.[1] ?? null;
}

export function sumEligibleFixedBillPayments(input: {
  billId: string;
  payments: FixedBillPaymentRecord[];
  maximumAmount: number;
}) {
  const maximumCents = Math.max(0, toCents(input.maximumAmount));
  let paidCents = 0;
  const paymentTransactionIds: string[] = [];

  for (const payment of input.payments) {
    if (
      getFixedBillIdFromNote(payment.notes) !== input.billId
      || payment.type !== 'gasto'
      || payment.status !== 'pago'
      || typeof payment.amount !== 'number'
      || !Number.isFinite(payment.amount)
      || payment.amount <= 0
    ) {
      continue;
    }

    paidCents += toCents(payment.amount);
    paymentTransactionIds.push(payment.id);
  }

  return {
    paidAmount: fromCents(Math.min(paidCents, maximumCents)),
    paymentTransactionIds,
  };
}

export function validateFixedBillPayment(input: {
  billAmount: number;
  paidAmount: number;
  paymentAmount: number;
}) {
  if (
    typeof input.paymentAmount !== 'number'
    || !Number.isFinite(input.paymentAmount)
    || input.paymentAmount <= 0
  ) {
    return { ok: false as const, code: 'invalid_amount' as const };
  }

  const billCents = Math.max(0, toCents(input.billAmount));
  const paidCents = Math.max(0, Math.min(toCents(input.paidAmount), billCents));
  const paymentCents = toCents(input.paymentAmount);
  if (paymentCents <= 0) {
    return { ok: false as const, code: 'invalid_amount' as const };
  }

  const remainingCents = billCents - paidCents;
  if (paymentCents > remainingCents) {
    return {
      ok: false as const,
      code: 'exceeds_remaining' as const,
      remainingAmount: fromCents(remainingCents),
    };
  }

  return {
    ok: true as const,
    amount: fromCents(paymentCents),
    remainingAfterPayment: fromCents(remainingCents - paymentCents),
  };
}

export function resolveDynamicFixedBills(input: {
  bills: FixedBill[];
  payments: FixedBillPaymentRecord[];
  monthKey: string;
  today?: Date;
}) {
  const { bills, payments, monthKey, today = new Date() } = input;
  const [viewYear, viewMonth] = monthKey.split('-').map(Number);
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
  const isViewingPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

  return bills.map((bill): DynamicFixedBill => {
    const amountCents = Math.max(0, toCents(Number(bill.amount)));
    const amount = fromCents(amountCents);
    const { paidAmount, paymentTransactionIds } = sumEligibleFixedBillPayments({
      billId: bill.id,
      payments,
      maximumAmount: amount,
    });
    const paidCents = toCents(paidAmount);
    const remainingAmount = fromCents(amountCents - paidCents);
    const paymentProgress = amountCents > 0
      ? Math.min(100, Math.round((paidCents / amountCents) * 10_000) / 100)
      : 0;
    let dynamicStatus: DynamicFixedBill['dynamicStatus'] = 'pendente';
    let daysOverdue = 0;

    if (remainingAmount === 0) {
      dynamicStatus = 'pago';
    } else if (isViewingPastMonth) {
      dynamicStatus = 'atrasado';
    } else if (isViewingCurrentMonth && today.getDate() > bill.due_day) {
      dynamicStatus = 'atrasado';
      daysOverdue = today.getDate() - bill.due_day;
    }

    return {
      ...bill,
      amount,
      dynamicStatus,
      daysOverdue,
      paidAmount,
      remainingAmount,
      paymentProgress,
      paymentTransactionIds,
    };
  });
}
