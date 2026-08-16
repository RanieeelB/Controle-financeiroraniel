// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentMonthKey, moveMonth } from '../../lib/monthSelection';
import type { DynamicFixedBill } from '../../types/financial';

const mocks = vi.hoisted(() => ({
  createFixedBillPayment: vi.fn(),
}));

vi.mock('../../lib/financialActions', () => ({
  createFixedBillPayment: mocks.createFixedBillPayment,
}));

import { UpcomingBills } from './UpcomingBills';

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
  paidAmount: 200,
  remainingAmount: 500,
  paymentProgress: 28.57,
  paymentTransactionIds: ['payment-1'],
} satisfies DynamicFixedBill;

function openPaymentModal() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar abatimento para Aluguel' })[0]);
  return screen.getByRole('dialog', { name: 'Adicionar abatimento' });
}

function submitPayment(value: string) {
  fireEvent.change(screen.getByLabelText('Valor do abatimento'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar abatimento' }));
}

describe('UpcomingBills payment integration', () => {
  beforeEach(() => {
    mocks.createFixedBillPayment.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the open form and error while refreshing the selected bill snapshot', async () => {
    mocks.createFixedBillPayment.mockResolvedValue({
      status: 'rejected',
      code: 'exceeds_remaining',
      remainingAmount: 300,
    });
    const onRefresh = vi.fn();

    function Harness() {
      const [bill, setBill] = useState(partialBill);
      onRefresh.mockImplementation(() => {
        setBill(current => ({
          ...current,
          paidAmount: 400,
          remainingAmount: 300,
          paymentProgress: 57.14,
        }));
      });
      return (
        <UpcomingBills
          data={[bill]}
          selectedMonthKey={getCurrentMonthKey()}
          onRefresh={onRefresh}
        />
      );
    }

    render(<Harness />);
    openPaymentModal();
    submitPayment('451');

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    const dialog = screen.getByRole('dialog', { name: 'Adicionar abatimento' });
    expect((screen.getByLabelText('Valor do abatimento') as HTMLInputElement).value).toBe('451');
    expect(screen.getByRole('alert').textContent).toContain('R$ 300,00');
    expect(dialog.textContent).toContain('R$ 400,00');
    expect(dialog.textContent).toContain('R$ 300,00');
  });

  it('submits and refreshes once after a successful payment', async () => {
    mocks.createFixedBillPayment.mockResolvedValue({ status: 'created' });
    const onRefresh = vi.fn();
    render(
      <UpcomingBills
        data={[partialBill]}
        selectedMonthKey={getCurrentMonthKey()}
        onRefresh={onRefresh}
      />,
    );

    openPaymentModal();
    submitPayment('100');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Adicionar abatimento' })).toBeNull());
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(mocks.createFixedBillPayment).toHaveBeenCalledTimes(1);
  });

  it('does not offer payments for a past month', () => {
    render(
      <UpcomingBills
        data={[partialBill]}
        selectedMonthKey={moveMonth(getCurrentMonthKey(), -1)}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Adicionar abatimento para Aluguel' })).toBeNull();
  });
});
