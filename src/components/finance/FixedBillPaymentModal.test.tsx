// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DynamicFixedBill } from '../../types/financial';

const mocks = vi.hoisted(() => ({
  createFixedBillPayment: vi.fn(),
}));

vi.mock('../../lib/financialActions', () => ({
  createFixedBillPayment: mocks.createFixedBillPayment,
}));

import { FixedBillPaymentModal } from './FixedBillPaymentModal';

const bill = {
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

function renderModal(overrides: Partial<{
  onClose: () => void;
  onRefresh: () => Promise<unknown> | unknown;
}> = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const onRefresh = overrides.onRefresh ?? vi.fn();

  render(
    <FixedBillPaymentModal
      bill={bill}
      selectedMonthKey="2026-08"
      onClose={onClose}
      onRefresh={onRefresh}
    />,
  );

  return { onClose, onRefresh };
}

function submitValue(value: string) {
  const input = screen.getByLabelText('Valor do abatimento');
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar abatimento' }));
  return input;
}

describe('FixedBillPaymentModal', () => {
  beforeEach(() => {
    mocks.createFixedBillPayment.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts empty and validates before calling the action', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Adicionar abatimento' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Adicionar abatimento' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fechar modal' })).toBeTruthy();
    expect(screen.getByText('Original')).toBeTruthy();
    expect(screen.getByText('Pago')).toBeTruthy();
    expect(screen.getByText('Falta')).toBeTruthy();
    expect(screen.getByText('R$ 700,00')).toBeTruthy();
    expect(screen.getByText('R$ 200,00')).toBeTruthy();
    expect(screen.getByText('R$ 500,00')).toBeTruthy();

    const input = screen.getByLabelText('Valor do abatimento') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(document.querySelectorAll('input:not([disabled]):not([readonly])')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar abatimento' }));

    expect(screen.getByRole('alert').textContent).toBe('Informe um valor maior que zero.');
    expect(mocks.createFixedBillPayment).not.toHaveBeenCalled();
  });

  it('keeps stale input, applies the fresh remainder, and isolates a rejecting refresh', async () => {
    const refreshError = new Error('refresh failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createFixedBillPayment.mockResolvedValue({
      status: 'rejected',
      code: 'exceeds_remaining',
      remainingAmount: 300,
    });
    const onClose = vi.fn();
    const onRefresh = vi.fn().mockRejectedValue(refreshError);
    renderModal({ onClose, onRefresh });

    const input = submitValue('451') as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toBe('451');
      expect(screen.getByText('R$ 300,00')).toBeTruthy();
      expect(screen.getByRole('alert').textContent).toBe(
        'O valor excede o saldo restante de R$ 300,00.',
      );
    });
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(refreshError));

    expect(mocks.createFixedBillPayment).toHaveBeenCalledTimes(1);
    expect(mocks.createFixedBillPayment).toHaveBeenCalledWith({
      billId: 'bill-1',
      amount: 451,
      selectedMonthKey: '2026-08',
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the modal and typed value after a persistence failure', async () => {
    mocks.createFixedBillPayment.mockRejectedValue(new Error('insert failed'));
    const { onClose, onRefresh } = renderModal();

    const input = submitValue('100') as HTMLInputElement;

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(
        'Não foi possível salvar o abatimento. Tente novamente.',
      );
    });
    expect(input.value).toBe('100');
    expect(screen.getByRole('dialog', { name: 'Adicionar abatimento' })).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('closes once and isolates a rejecting refresh after creation', async () => {
    const refreshError = new Error('refresh failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createFixedBillPayment.mockResolvedValue({ status: 'created' });
    const onClose = vi.fn();
    const onRefresh = vi.fn().mockRejectedValue(refreshError);
    renderModal({ onClose, onRefresh });

    submitValue('100,50');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(refreshError));

    expect(mocks.createFixedBillPayment).toHaveBeenCalledTimes(1);
    expect(mocks.createFixedBillPayment).toHaveBeenCalledWith({
      billId: 'bill-1',
      amount: 100.5,
      selectedMonthKey: '2026-08',
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('catches and logs a synchronous refresh failure', async () => {
    const refreshError = new Error('sync refresh failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createFixedBillPayment.mockResolvedValue({ status: 'created' });
    const onRefresh = vi.fn(() => {
      throw refreshError;
    });
    renderModal({ onRefresh });

    submitValue('100');

    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(refreshError));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('guards a deferred action against immediate double submission', async () => {
    let resolveAction!: (result: { status: 'created' }) => void;
    mocks.createFixedBillPayment.mockReturnValue(new Promise(resolve => {
      resolveAction = resolve;
    }));
    const { onClose } = renderModal();
    const input = screen.getByLabelText('Valor do abatimento');
    fireEvent.change(input, { target: { value: '100' } });
    const submit = screen.getByRole('button', { name: 'Salvar abatimento' }) as HTMLButtonElement;

    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(mocks.createFixedBillPayment).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Fechar modal' }) as HTMLButtonElement).disabled).toBe(true);

    resolveAction({ status: 'created' });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('keeps server-side rejections open with the reducer message', async () => {
    mocks.createFixedBillPayment.mockResolvedValue({
      status: 'rejected',
      code: 'invalid_month',
    });
    const { onClose } = renderModal();

    submitValue('100');

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe(
        'Selecione o mês atual para adicionar um abatimento.',
      );
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
