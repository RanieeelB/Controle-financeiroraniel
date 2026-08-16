import { buildMonthRange, formatMonthLabel, moveMonth } from './monthSelection';
import { roundCurrency } from './financialPayloads.js';
import { getInvoicePurchaseSchedule, summarizeInvoiceItems } from './invoiceBreakdown';

export interface BuildFinancialProjectionsInput {
  baseMonthKey: string;
  fixedBills: Array<{ description: string; amount: number }>;
  investments: Array<{ name: string; monthly_contribution: number }>;
  futureInvoiceItems: Array<{
    description: string;
    amount: number | string;
    date: string;
    current_installment: number;
    total_installments: number;
  }>;
  salaryAmount: number;
  salaryEntries?: Array<{ monthKey: string; amount: number }>;
}

export type NonCardProjectionDetail = {
  description: string;
  amount: number;
  type: 'fixed' | 'investment';
};

export type CardProjectionDetail = {
  description: string;
  amount: number;
  type: 'card';
} & (
  | { purchaseKind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { purchaseKind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null }
);

export type ProjectionDetail = NonCardProjectionDetail | CardProjectionDetail;

export interface MonthProjection {
  monthKey: string;
  label: string;
  total: number;
  salary: number;
  projectedLeftover: number;
  breakdown: {
    fixedBills: number;
    creditCards: number;
    cashPurchases: number;
    installmentPurchases: number;
    investments: number;
  };
  details: ProjectionDetail[];
}

export function buildFinancialProjections(input: BuildFinancialProjectionsInput): MonthProjection[] {
  return [1, 2, 3].map(offset => {
    const monthKey = moveMonth(input.baseMonthKey, offset);
    const monthRange = buildMonthRange(monthKey);
    const details: ProjectionDetail[] = [];

    const fixedTotal = input.fixedBills.reduce((sum, bill) => {
      const amount = Number(bill.amount);
      if (!Number.isFinite(amount) || amount <= 0) return sum;
      details.push({ description: bill.description, amount, type: 'fixed' });
      return sum + amount;
    }, 0);

    const investmentTotal = input.investments.reduce((sum, investment) => {
      const contribution = Number(investment.monthly_contribution);
      if (!Number.isFinite(contribution) || contribution <= 0) return sum;

      details.push({
        description: `Investimento: ${investment.name}`,
        amount: contribution,
        type: 'investment',
      });
      return sum + contribution;
    }, 0);

    const monthCardItems = input.futureInvoiceItems.filter(
      item => item.date >= monthRange.startDate && item.date < monthRange.endDate,
    );
    const cardSummary = summarizeInvoiceItems(monthCardItems);

    for (const item of monthCardItems) {
      const amount = Number(item.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const schedule = getInvoicePurchaseSchedule(item);
      if (schedule.kind === 'installment') {
        details.push({
          description: item.description,
          amount,
          type: 'card',
          purchaseKind: 'installment',
          currentInstallment: schedule.currentInstallment,
          totalInstallments: schedule.totalInstallments,
          endingMonthKey: schedule.endingMonthKey,
        });
      } else {
        details.push({
          description: item.description,
          amount,
          type: 'card',
          purchaseKind: 'cash',
          currentInstallment: null,
          totalInstallments: null,
          endingMonthKey: null,
        });
      }
    }

    const total = roundCurrency(fixedTotal + cardSummary.total + investmentTotal);

    let salary = roundCurrency(input.salaryAmount);
    if (input.salaryEntries) {
      const entry = input.salaryEntries.find(e => e.monthKey === monthKey);
      salary = entry ? roundCurrency(entry.amount) : 0;
    }

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      total,
      salary,
      projectedLeftover: roundCurrency(salary - total),
      breakdown: {
        fixedBills: roundCurrency(fixedTotal),
        creditCards: roundCurrency(cardSummary.total),
        cashPurchases: roundCurrency(cardSummary.cashPurchases),
        installmentPurchases: roundCurrency(cardSummary.installmentPurchases),
        investments: roundCurrency(investmentTotal),
      },
      details: details.sort((a, b) => b.amount - a.amount),
    };
  });
}
