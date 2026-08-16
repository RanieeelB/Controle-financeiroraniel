import type { DynamicFixedBill } from '../types/financial.js';
import { summarizeFixedBills } from './fixedBillPayments.js';

export function buildDashboardFixedBillSummary(bills: DynamicFixedBill[]) {
  const totals = summarizeFixedBills(bills);

  return {
    fixedBillsTotal: totals.total,
    unpaidFixedBills: totals.pending,
  };
}
