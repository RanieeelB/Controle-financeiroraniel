import { buildMonthRange, formatMonthLabel, moveMonth } from './monthSelection';
import { roundCurrency } from './financialPayloads.js';

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
}

export interface MonthProjection {
  monthKey: string;
  label: string;
  total: number;
  salary: number;
  projectedLeftover: number;
  breakdown: {
    fixedBills: number;
    creditCards: number;
    investments: number;
  };
  details: {
    description: string;
    amount: number;
    type: 'fixed' | 'card' | 'investment';
  }[];
}

export function buildFinancialProjections(input: BuildFinancialProjectionsInput): MonthProjection[] {
  return [1, 2, 3].map(offset => {
    const monthKey = moveMonth(input.baseMonthKey, offset);
    const monthRange = buildMonthRange(monthKey);
    const details: MonthProjection['details'] = [];

    const fixedTotal = input.fixedBills.reduce((sum, bill) => {
      details.push({ description: bill.description, amount: bill.amount, type: 'fixed' });
      return sum + bill.amount;
    }, 0);

    const investmentTotal = input.investments.reduce((sum, investment) => {
      if (investment.monthly_contribution <= 0) return sum;

      details.push({
        description: `Investimento: ${investment.name}`,
        amount: investment.monthly_contribution,
        type: 'investment',
      });
      return sum + investment.monthly_contribution;
    }, 0);

    const cardTotal = input.futureInvoiceItems
      .filter(item => item.date >= monthRange.startDate && item.date < monthRange.endDate)
      .reduce((sum, item) => {
        const amount = Number(item.amount);
        details.push({
          description: `${item.description} (${item.current_installment}/${item.total_installments})`,
          amount,
          type: 'card',
        });
        return sum + amount;
      }, 0);

    const total = roundCurrency(fixedTotal + cardTotal + investmentTotal);
    const salary = roundCurrency(input.salaryAmount);

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      total,
      salary,
      projectedLeftover: roundCurrency(salary - total),
      breakdown: {
        fixedBills: roundCurrency(fixedTotal),
        creditCards: roundCurrency(cardTotal),
        investments: roundCurrency(investmentTotal),
      },
      details: details.sort((a, b) => b.amount - a.amount),
    };
  });
}
