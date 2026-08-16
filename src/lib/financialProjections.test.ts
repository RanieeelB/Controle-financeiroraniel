import { describe, expect, it } from 'vitest';
import { buildFinancialProjections, type BuildFinancialProjectionsInput } from './financialProjections';

function makeInput(overrides: Partial<BuildFinancialProjectionsInput> = {}): BuildFinancialProjectionsInput {
  return {
    baseMonthKey: '2026-08',
    fixedBills: [],
    investments: [],
    futureInvoiceItems: [],
    salaryAmount: 0,
    ...overrides,
  };
}

describe('buildFinancialProjections', () => {
  it('projects the three months after the selected dashboard month with salary and leftover', () => {
    const projections = buildFinancialProjections({
      baseMonthKey: '2026-07',
      fixedBills: [
        { description: 'Aluguel', amount: 1000 },
      ],
      investments: [
        { name: 'Reserva', monthly_contribution: 300 },
      ],
      futureInvoiceItems: [
        {
          description: 'Notebook',
          amount: 250,
          date: '2026-08-12',
          current_installment: 2,
          total_installments: 10,
        },
        {
          description: 'Curso',
          amount: 150,
          date: '2026-09-05',
          current_installment: 1,
          total_installments: 3,
        },
      ],
      salaryAmount: 6500,
    });

    expect(projections.map(projection => projection.monthKey)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(projections[0]).toMatchObject({
      monthKey: '2026-08',
      total: 1550,
      salary: 6500,
      projectedLeftover: 4950,
      breakdown: {
        fixedBills: 1000,
        creditCards: 250,
        cashPurchases: 0,
        installmentPurchases: 250,
        investments: 300,
      },
    });
    expect(projections[1].projectedLeftover).toBe(5050);
    expect(projections[2].projectedLeftover).toBe(5200);
  });

  it('separates cash and installment cards without changing projection total', () => {
    const [projection] = buildFinancialProjections(makeInput({
      futureInvoiceItems: [
        { description: 'Cash', amount: '100', date: '2026-09-01', total_installments: 1, current_installment: 1 },
        { description: 'Installment', amount: '50', date: '2026-09-01', total_installments: 10, current_installment: 3 },
      ],
    }));

    expect(projection.breakdown).toMatchObject({
      creditCards: 150,
      cashPurchases: 100,
      installmentPurchases: 50,
    });
    expect(projection.total).toBe(
      projection.breakdown.fixedBills + projection.breakdown.creditCards + projection.breakdown.investments,
    );
    expect(projection.details.find(detail => detail.description === 'Installment')).toMatchObject({
      type: 'card',
      purchaseKind: 'installment',
      currentInstallment: 3,
      totalInstallments: 10,
      endingMonthKey: '2027-04',
    });
    expect(projection.details.find(detail => detail.description === 'Cash')).toMatchObject({
      type: 'card',
      purchaseKind: 'cash',
      currentInstallment: null,
      totalInstallments: null,
      endingMonthKey: null,
    });
    expect(projection.breakdown).not.toHaveProperty('futureInstallmentBalance');
  });

  it('preserves fixed bills, investments, salary entries, and leftover', () => {
    const [projection] = buildFinancialProjections(makeInput({
      fixedBills: [{ description: 'Rent', amount: 700 }],
      investments: [{ name: 'Reserve', monthly_contribution: 200 }],
      salaryAmount: 5000,
      salaryEntries: [{ monthKey: '2026-09', amount: 4500 }],
      futureInvoiceItems: [
        { description: 'Cash', amount: 100, date: '2026-09-01', total_installments: 1, current_installment: 1 },
      ],
    }));
    expect(projection.breakdown).toEqual({
      fixedBills: 700,
      creditCards: 100,
      cashPurchases: 100,
      installmentPurchases: 0,
      investments: 200,
    });
    expect(projection).toMatchObject({ total: 1000, salary: 4500, projectedLeftover: 3500 });
    const fixedDetail = projection.details.find(detail => detail.type === 'fixed');
    expect(fixedDetail).not.toHaveProperty('purchaseKind');
  });

  it('ignores invalid amounts without producing NaN', () => {
    const [projection] = buildFinancialProjections(makeInput({
      futureInvoiceItems: [
        { description: 'Invalid', amount: 'bad', date: '2026-09-01', total_installments: 1, current_installment: 1 },
        { description: 'Negative', amount: -50, date: '2026-09-01', total_installments: 1, current_installment: 1 },
      ],
    }));
    expect(projection.breakdown.creditCards).toBe(0);
    expect(projection.breakdown.cashPurchases).toBe(0);
    expect(projection.breakdown.installmentPurchases).toBe(0);
    expect(projection.total).toBe(0);
  });
});
