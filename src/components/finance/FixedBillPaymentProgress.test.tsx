// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DynamicFixedBill } from '../../types/financial';
import { FixedBillPaymentProgress } from './FixedBillPaymentProgress';

const partialBill = {
  id: 'bill-1',
  user_id: 'user-1',
  description: 'Aluguel',
  category_id: 'category-1',
  amount: 700,
  due_day: 10,
  status: 'pendente',
  icon: 'home',
  created_at: '2026-08-01T00:00:00.000Z',
  dynamicStatus: 'pendente',
  daysOverdue: 0,
  paidAmount: 350,
  remainingAmount: 350,
  paymentProgress: 50,
  paymentTransactionIds: ['payment-1'],
} satisfies DynamicFixedBill;

describe('FixedBillPaymentProgress', () => {
  afterEach(cleanup);

  it('shows original, paid, and remaining amounts with an accessible progress bar', () => {
    render(
      <FixedBillPaymentProgress
        bill={partialBill}
        canAddPayment
        onAddPayment={vi.fn()}
      />,
    );

    expect(screen.getByText('R$ 700,00')).toBeTruthy();
    expect(screen.getByText('Pago R$ 350,00')).toBeTruthy();
    expect(screen.getByText('Falta R$ 350,00')).toBeTruthy();

    const progress = screen.getByRole('progressbar', { name: 'Progresso de pagamento de Aluguel' });
    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('700');
    expect(progress.getAttribute('aria-valuenow')).toBe('350');
    expect(progress.getAttribute('aria-valuetext')).toBe('R$ 350,00 pagos de R$ 700,00');
    expect((progress.firstElementChild as HTMLElement).style.width).toBe('50%');
  });

  it('requests one additional payment from its action', () => {
    const onAddPayment = vi.fn();
    render(
      <FixedBillPaymentProgress
        bill={partialBill}
        canAddPayment
        onAddPayment={onAddPayment}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar abatimento para Aluguel' }));

    expect(onAddPayment).toHaveBeenCalledTimes(1);
  });

  it('does not offer an action when payments cannot be added for the selected month', () => {
    render(
      <FixedBillPaymentProgress
        bill={partialBill}
        canAddPayment={false}
        onAddPayment={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Adicionar abatimento para Aluguel' })).toBeNull();
  });

  it('shows a paid state without an action when there is no remaining amount', () => {
    const paidBill = {
      ...partialBill,
      status: 'pago',
      dynamicStatus: 'pago',
      paidAmount: 700,
      remainingAmount: 0,
      paymentProgress: 100,
    } satisfies DynamicFixedBill;

    render(
      <FixedBillPaymentProgress
        bill={paidBill}
        canAddPayment
        onAddPayment={vi.fn()}
      />,
    );

    expect(screen.getByText('Pago')).toBeTruthy();
    expect(screen.getByText('Falta R$ 0,00')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Adicionar abatimento para Aluguel' })).toBeNull();
  });

  it('uses compact responsive classes when embedded in bill lists', () => {
    const { container } = render(
      <FixedBillPaymentProgress
        bill={partialBill}
        canAddPayment
        onAddPayment={vi.fn()}
        compact
      />,
    );

    expect(container.firstElementChild?.className).toContain('min-w-0');
    expect(container.firstElementChild?.className).toContain('space-y-xs');
    expect(screen.getByRole('button', { name: 'Adicionar abatimento para Aluguel' }).className).toContain('w-full');
    expect(screen.getByRole('button', { name: 'Adicionar abatimento para Aluguel' }).className).toContain('sm:w-auto');
  });
});
