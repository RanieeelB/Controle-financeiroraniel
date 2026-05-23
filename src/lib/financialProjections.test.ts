import { describe, expect, it } from 'vitest';
import { buildFinancialProjections } from './financialProjections';

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
        investments: 300,
      },
    });
    expect(projections[1].projectedLeftover).toBe(5050);
    expect(projections[2].projectedLeftover).toBe(5200);
  });
});
