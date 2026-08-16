// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectionsSection } from './ProjectionsSection';
import type { MonthProjection } from '../../lib/financialProjections';

const sampleProjection: MonthProjection = {
  monthKey: '2026-09',
  label: 'Setembro de 2026',
  total: 1500,
  salary: 5000,
  projectedLeftover: 3500,
  breakdown: {
    fixedBills: 700,
    creditCards: 500,
    cashPurchases: 200,
    installmentPurchases: 300,
    investments: 300,
  },
  details: [],
};

vi.mock('../../hooks/useProjections', () => ({
  useProjections: () => ({
    projections: [sampleProjection],
  }),
}));

describe('ProjectionsSection', () => {
  it('renders credit cards breakdown with cash and installments and opens modal', () => {
    render(<ProjectionsSection baseMonthKey="2026-08" />);

    expect(screen.getByText('Projeções Financeiras')).toBeTruthy();
    expect(screen.getByText('Setembro de 2026')).toBeTruthy();
    expect(screen.getByText('R$ 1.500,00')).toBeTruthy();
    expect(screen.getByText('Cartão:')).toBeTruthy();
    expect(screen.getByText('R$ 500,00')).toBeTruthy();
    expect(screen.getByText(/À vista:/i)).toBeTruthy();
    expect(screen.getByText('R$ 200,00')).toBeTruthy();
    expect(screen.getByText(/Parcelado:/i)).toBeTruthy();
    expect(screen.getByText('R$ 300,00')).toBeTruthy();

    const detailsButton = screen.getByRole('button', { name: /Ver detalhes/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText('Detalhes: Setembro de 2026')).toBeTruthy();
  });
});
