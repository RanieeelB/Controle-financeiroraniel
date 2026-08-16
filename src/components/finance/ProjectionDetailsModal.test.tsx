// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectionDetailsModal } from './ProjectionDetailsModal';
import type { MonthProjection } from '../../lib/financialProjections';

describe('ProjectionDetailsModal', () => {
  it('renders header breakdown and card details with schedule forecasts', () => {
    const projection: MonthProjection = {
      monthKey: '2026-09',
      label: 'Setembro de 2026',
      total: 1550,
      salary: 5000,
      projectedLeftover: 3450,
      breakdown: {
        fixedBills: 700,
        creditCards: 450,
        cashPurchases: 150,
        installmentPurchases: 300,
        investments: 400,
      },
      details: [
        {
          description: 'Mercado',
          amount: 150,
          type: 'card',
          purchaseKind: 'cash',
          currentInstallment: null,
          totalInstallments: null,
          endingMonthKey: null,
        },
        {
          description: 'Notebook',
          amount: 250,
          type: 'card',
          purchaseKind: 'installment',
          currentInstallment: 3,
          totalInstallments: 10,
          endingMonthKey: '2027-04',
        },
        {
          description: 'Curso',
          amount: 50,
          type: 'card',
          purchaseKind: 'installment',
          currentInstallment: 1,
          totalInstallments: 3,
          endingMonthKey: null,
        },
        {
          description: 'Aluguel',
          amount: 700,
          type: 'fixed',
        },
        {
          description: 'Investimento: Reserva',
          amount: 400,
          type: 'investment',
        },
      ],
    };

    render(<ProjectionDetailsModal projection={projection} onClose={vi.fn()} />);

    // Header breakdown
    expect(screen.getByText('Detalhes: Setembro de 2026')).toBeTruthy();
    expect(screen.getByText(/450,00/)).toBeTruthy();
    expect(screen.getAllByText(/150,00/)).toHaveLength(2);
    expect(screen.getByText(/300,00/)).toBeTruthy();

    // Cash row
    expect(screen.getByText('Mercado')).toBeTruthy();
    expect(screen.getByText('Cartão • À vista')).toBeTruthy();

    // Valid installment row
    expect(screen.getByText('Notebook')).toBeTruthy();
    expect(screen.getByText(/Parcela 3 de 10/)).toBeTruthy();
    expect(screen.getByText(/Previsão de término: Abril de 2027/)).toBeTruthy();

    // Invalid ending installment row
    expect(screen.getByText('Curso')).toBeTruthy();
    expect(screen.getByText(/Parcela 1 de 3/)).toBeTruthy();
    expect(screen.getByText(/Término indisponível/)).toBeTruthy();

    // Fixed & Investment rows
    expect(screen.getByText('Aluguel')).toBeTruthy();
    expect(screen.getByText('Conta Fixa')).toBeTruthy();
    expect(screen.getByText('Investimento: Reserva')).toBeTruthy();
    expect(screen.getByText('Investimento')).toBeTruthy();
  });
});
