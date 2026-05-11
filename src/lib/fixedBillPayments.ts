import type { DynamicFixedBill, FixedBill, Transaction } from '../types/financial.js';

type FixedBillPaymentTransaction = Pick<Transaction, 'id' | 'notes' | 'status'>;

export function resolveDynamicFixedBills(input: {
  bills: FixedBill[];
  payments: FixedBillPaymentTransaction[];
  monthKey: string;
  today?: Date;
}) {
  const { bills, payments, monthKey, today = new Date() } = input;
  const [viewYear, viewMonth] = monthKey.split('-').map(Number);
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
  const isViewingPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);
  const paymentsByBillId = new Map<string, string[]>();

  payments.forEach(payment => {
    if (payment.status !== 'pago') return;
    const billId = getFixedBillIdFromNote(payment.notes);
    if (!billId) return;

    const billPayments = paymentsByBillId.get(billId) ?? [];
    billPayments.push(payment.id);
    paymentsByBillId.set(billId, billPayments);
  });

  return bills.map((bill): DynamicFixedBill => {
    const paymentTransactionIds = paymentsByBillId.get(bill.id) ?? [];
    let dynamicStatus: DynamicFixedBill['dynamicStatus'] = 'pendente';
    let daysOverdue = 0;

    if (paymentTransactionIds.length > 0) {
      dynamicStatus = 'pago';
    } else if (isViewingPastMonth) {
      dynamicStatus = 'atrasado';
    } else if (isViewingCurrentMonth && today.getDate() > bill.due_day) {
      dynamicStatus = 'atrasado';
      daysOverdue = today.getDate() - bill.due_day;
    }

    return {
      ...bill,
      amount: Number(bill.amount),
      dynamicStatus,
      daysOverdue,
      paymentTransactionIds,
    };
  });
}

function getFixedBillIdFromNote(note?: string | null) {
  if (!note?.startsWith('fixed_bill:')) return null;
  return note.replace('fixed_bill:', '');
}
