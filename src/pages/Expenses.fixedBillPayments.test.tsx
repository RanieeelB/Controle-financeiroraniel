// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '../types/financial';

const mocks = vi.hoisted(() => ({
  deleteFinancialTransaction: vi.fn(),
  markTransactionStatus: vi.fn(),
  refetch: vi.fn(),
  useTransactions: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutletContext: () => ({
      selectedMonthRange: {
        monthKey: '2026-08',
        start: '2026-08-01',
        end: '2026-08-31',
      },
    }),
  };
});

vi.mock('../hooks/useTransactions', () => ({
  useTransactions: mocks.useTransactions,
}));

vi.mock('../lib/financialActions', () => ({
  deleteFinancialTransaction: mocks.deleteFinancialTransaction,
  markTransactionStatus: mocks.markTransactionStatus,
}));

import { Expenses } from './Expenses';

const category = {
  id: 'category-1',
  user_id: 'user-1',
  name: 'Moradia',
  icon: 'home',
  type: 'gasto' as const,
  color: '#00e676',
  created_at: '2026-08-01T00:00:00.000Z',
};

const partialPayment: Transaction = {
  id: 'partial-payment',
  user_id: 'user-1',
  category_id: category.id,
  type: 'gasto',
  description: 'Abatimento: Aluguel',
  amount: 250,
  date: '2026-08-05',
  status: 'pago',
  payment_method: 'pix',
  notes: 'fixed_bill:bill-1',
  created_at: '2026-08-05T00:00:00.000Z',
  category,
};

const legacyPayment: Transaction = {
  ...partialPayment,
  id: 'legacy-payment',
  description: 'Pagamento: Energia',
  amount: 180,
  notes: 'fixed_bill:bill-2',
};

const normalExpense: Transaction = {
  ...partialPayment,
  id: 'normal-expense',
  description: 'Academia',
  amount: 90,
  status: 'pendente',
  notes: null,
};

const unapprovedLinkedExpense: Transaction = {
  ...normalExpense,
  id: 'unapproved-linked-expense',
  description: 'Academia vinculada',
  notes: 'fixed_bill:forged-id',
};

function renderedCopies(description: string) {
  return screen.getAllByText(description).map(node => {
    const record = node.closest('article, tr');
    if (!record) throw new Error(`Missing record container for ${description}`);
    return record as HTMLElement;
  });
}

describe('Expenses fixed bill payment history', () => {
  beforeEach(() => {
    mocks.deleteFinancialTransaction.mockReset().mockResolvedValue(undefined);
    mocks.markTransactionStatus.mockReset().mockResolvedValue(undefined);
    mocks.refetch.mockReset().mockResolvedValue(undefined);
    mocks.useTransactions.mockReset().mockReturnValue({
      transactions: [partialPayment, legacyPayment, normalExpense, unapprovedLinkedExpense],
      isLoading: false,
      totals: { paid: 430, pending: 90, pendingCount: 1 },
      topCategory: { name: 'Moradia', amount: 520, percentage: 100 },
      refetch: mocks.refetch,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('distinguishes partial and legacy fixed-bill payments on mobile and desktop', () => {
    render(<Expenses />);

    const partialCopies = renderedCopies('Abatimento: Aluguel');
    const legacyCopies = renderedCopies('Pagamento: Energia');
    expect(partialCopies).toHaveLength(2);
    expect(legacyCopies).toHaveLength(2);

    for (const record of partialCopies) {
      expect(record.className).toContain('border-l-4');
      expect(record.className).toContain('border-l-primary');
      expect(within(record).getByText('Pagamento parcial')).toBeTruthy();
      expect(within(record).getByText('Vinculado à conta fixa')).toBeTruthy();
      expect(within(record).queryByRole('img')).toBeNull();
      expect(record.querySelector('svg.lucide-landmark')?.getAttribute('aria-hidden')).toBe('true');
    }

    for (const record of legacyCopies) {
      expect(record.className).toContain('border-l-4');
      expect(record.className).toContain('border-l-primary');
      expect(within(record).getByText('Conta fixa')).toBeTruthy();
      expect(within(record).getByText('Vinculado à conta fixa')).toBeTruthy();
      expect(within(record).queryByRole('img')).toBeNull();
      expect(record.querySelector('svg.lucide-landmark')?.getAttribute('aria-hidden')).toBe('true');
    }

    for (const description of ['Academia', 'Academia vinculada']) {
      for (const record of renderedCopies(description)) {
        expect(record.className).not.toContain('border-l-primary');
        expect(within(record).queryByText('Vinculado à conta fixa')).toBeNull();
        expect(record.querySelector('svg.lucide-landmark')).toBeNull();
      }
    }
  });

  it('keeps linked payments delete-only while normal expenses retain the status action', () => {
    render(<Expenses />);

    for (const record of renderedCopies('Abatimento: Aluguel')) {
      fireEvent.click(within(record).getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));
      expect(within(record).getByRole('menuitem', { name: 'Excluir abatimento' })).toBeTruthy();
      expect(within(record).queryByRole('menuitem', { name: /Marcar como/ })).toBeNull();
    }

    for (const record of renderedCopies('Pagamento: Energia')) {
      fireEvent.click(within(record).getByRole('button', { name: 'Ações de Pagamento: Energia' }));
      expect(within(record).getByRole('menuitem', { name: 'Excluir pagamento' })).toBeTruthy();
      expect(within(record).queryByRole('menuitem', { name: /Marcar como/ })).toBeNull();
    }

    for (const description of ['Academia', 'Academia vinculada']) {
      for (const record of renderedCopies(description)) {
        fireEvent.click(within(record).getByRole('button', { name: `Ações de ${description}` }));
        expect(within(record).getByRole('menuitem', { name: 'Marcar como pago' })).toBeTruthy();
        expect(within(record).getByRole('menuitem', { name: 'Excluir' })).toBeTruthy();
      }
    }
  });

  it('deletes only the confirmed partial payment and refetches', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Expenses />);
    const mobilePayment = renderedCopies('Abatimento: Aluguel')[0];

    fireEvent.click(within(mobilePayment).getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));
    fireEvent.click(within(mobilePayment).getByRole('menuitem', { name: 'Excluir abatimento' }));

    await waitFor(() => expect(mocks.deleteFinancialTransaction).toHaveBeenCalledTimes(1));
    expect(mocks.deleteFinancialTransaction).toHaveBeenCalledWith(partialPayment);
    expect(mocks.markTransactionStatus).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));
  });

  it('focuses the stable search field when deletion refresh unmounts the record trigger', async () => {
    let completeRefetch: (() => void) | undefined;

    function useDeletingTransactions() {
      const [transactions, setTransactions] = useState([
        partialPayment,
        legacyPayment,
        normalExpense,
      ]);
      const [isLoading, setIsLoading] = useState(false);

      return {
        transactions,
        isLoading,
        totals: { paid: 430, pending: 90, pendingCount: 1 },
        topCategory: { name: 'Moradia', amount: 520, percentage: 100 },
        refetch: () => {
          mocks.refetch();
          setIsLoading(true);
          return new Promise<void>(resolve => {
            completeRefetch = () => {
              setTransactions(current => current.filter(transaction => transaction.id !== partialPayment.id));
              setIsLoading(false);
              resolve();
            };
          });
        },
      };
    }

    mocks.useTransactions.mockImplementation(useDeletingTransactions);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Expenses />);
    const mobilePayment = renderedCopies('Abatimento: Aluguel')[0];

    fireEvent.click(within(mobilePayment).getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));
    fireEvent.click(within(mobilePayment).getByRole('menuitem', { name: 'Excluir abatimento' }));

    await waitFor(() => expect(screen.queryByPlaceholderText('Buscar gasto...')).toBeNull());
    expect(completeRefetch).toBeTypeOf('function');

    await act(async () => completeRefetch?.());

    const search = await screen.findByPlaceholderText('Buscar gasto...');
    await waitFor(() => expect(document.activeElement).toBe(search));
    expect(screen.queryByText('Abatimento: Aluguel')).toBeNull();
  });
});
