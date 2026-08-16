import type { DynamicFixedBill, FixedBill, Transaction } from '../types/financial.js';

export type FixedBillPaymentRecord = Pick<Transaction, 'id' | 'type' | 'status' | 'amount' | 'notes'>;

const FIXED_BILL_NOTE_PATTERN = /^fixed_bill:([^:]+)$/;

function toCents(value: number) {
  return Math.round(value * 100);
}

function toNonNegativeCents(value: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  const cents = toCents(value);
  return Number.isFinite(cents) ? cents : 0;
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
  return collectEligibleFixedBillPayments(input).paidAmount;
}

function collectEligibleFixedBillPayments(input: {
  billId: string;
  payments: FixedBillPaymentRecord[];
  maximumAmount: number;
}) {
  const maximumCents = toNonNegativeCents(input.maximumAmount);
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
  const hasValidBillAmount = typeof input.billAmount === 'number'
    && Number.isFinite(input.billAmount)
    && input.billAmount >= 0;
  const hasValidPaidAmount = typeof input.paidAmount === 'number'
    && Number.isFinite(input.paidAmount)
    && input.paidAmount >= 0;
  const billCents = hasValidBillAmount ? toNonNegativeCents(input.billAmount) : 0;
  const paidCents = hasValidPaidAmount
    ? Math.min(toNonNegativeCents(input.paidAmount), billCents)
    : 0;
  const remainingCents = billCents - paidCents;

  if (
    !hasValidBillAmount
    || !hasValidPaidAmount
    || typeof input.paymentAmount !== 'number'
    || !Number.isFinite(input.paymentAmount)
    || input.paymentAmount <= 0
  ) {
    return {
      ok: false as const,
      code: 'invalid_amount' as const,
      remainingAmount: fromCents(remainingCents),
    };
  }

  const paymentCents = toCents(input.paymentAmount);
  if (paymentCents <= 0) {
    return {
      ok: false as const,
      code: 'invalid_amount' as const,
      remainingAmount: fromCents(remainingCents),
    };
  }

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
    const amountCents = toNonNegativeCents(Number(bill.amount));
    const amount = fromCents(amountCents);
    const { paidAmount, paymentTransactionIds } = collectEligibleFixedBillPayments({
      billId: bill.id,
      payments,
      maximumAmount: amount,
    });
    const paidCents = toCents(paidAmount);
    const remainingAmount = fromCents(amountCents - paidCents);
    let paymentProgress = 0;
    if (remainingAmount === 0) {
      paymentProgress = 100;
    } else if (amountCents > 0) {
      paymentProgress = Math.min(100, Math.round((paidCents / amountCents) * 10_000) / 100);
    }
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
