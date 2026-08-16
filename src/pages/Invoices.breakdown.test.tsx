// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Invoices } from './Invoices';
import type { CreditCard, InvoiceItem, Transaction } from '../types/financial';

const mockState = vi.hoisted(() => ({
  cards: [] as CreditCard[],
  invoiceItems: [] as InvoiceItem[],
  creditTransactions: [] as Array<Pick<Transaction, 'id' | 'notes' | 'status' | 'description' | 'amount' | 'date' | 'payment_method'>>,
  isLoading: false,
  refetch: vi.fn(async () => {}),
  payCreditInvoiceTransactions: vi.fn(async () => {}),
  reopenCreditInvoiceTransactions: vi.fn(async () => {}),
  deleteInvoicePurchase: vi.fn(async () => {}),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: [], error: null })),
      })),
    })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  },
}));

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));

vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    selectedMonthRange: {
      monthKey: '2026-08',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      label: 'Agosto de 2026',
    },
  }),
}));

vi.mock('../hooks/useCreditCards', () => ({
  useCreditCards: () => {
    const getCardItems = (cardId: string) => mockState.invoiceItems.filter(item => item.card_id === cardId);
    const getCardInvoiceSummary = (cardId: string) => {
      const items = getCardItems(cardId);
      const cash = items.filter(i => (i.total_installments ?? 1) <= 1).reduce((s, i) => s + Number(i.amount), 0);
      const inst = items.filter(i => (i.total_installments ?? 1) > 1).reduce((s, i) => s + Number(i.amount), 0);
      return {
        cashPurchases: cash,
        installmentPurchases: inst,
        total: cash + inst,
      };
    };
    const getCardTotal = (cardId: string) => getCardInvoiceSummary(cardId).total;

    return {
      cards: mockState.cards,
      invoiceItems: mockState.invoiceItems,
      creditTransactions: mockState.creditTransactions,
      isLoading: mockState.isLoading,
      getCardItems,
      getCardInvoiceSummary,
      getCardTotal,
      refetch: mockState.refetch,
    };
  },
}));

vi.mock('../lib/financialActions', () => ({
  payCreditInvoiceTransactions: (...args: unknown[]) => mockState.payCreditInvoiceTransactions(...args),
  reopenCreditInvoiceTransactions: (...args: unknown[]) => mockState.reopenCreditInvoiceTransactions(...args),
  deleteInvoicePurchase: (...args: unknown[]) => mockState.deleteInvoicePurchase(...args),
  createCreditPurchasesBatch: vi.fn(),
  updateCreditCard: vi.fn(),
  createCreditCard: vi.fn(),
}));

describe('Invoices breakdown presentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.cards = [
      {
        id: 'card-1',
        name: 'Nubank',
        brand: 'Mastercard',
        last_digits: '1234',
        due_day: 10,
        color: '#820ad1',
        credit_limit: 5000,
        user_id: 'user-1',
        created_at: '2026-01-01',
      },
    ];
    mockState.invoiceItems = [
      {
        id: 'item-1',
        card_id: 'card-1',
        description: 'Mercado',
        amount: 100,
        date: '2026-08-05',
        total_installments: 1,
        current_installment: 1,
        user_id: 'user-1',
        category_id: null,
        notes: null,
      },
      {
        id: 'item-2',
        card_id: 'card-1',
        description: 'Notebook',
        amount: 250,
        date: '2026-08-05',
        total_installments: 10,
        current_installment: 3,
        user_id: 'user-1',
        category_id: null,
        notes: null,
      },
      {
        id: 'item-3',
        card_id: 'card-1',
        description: 'Curso',
        amount: 50,
        date: 'invalid-date',
        total_installments: 3,
        current_installment: 1,
        user_id: 'user-1',
        category_id: null,
        notes: null,
      },
    ];
    mockState.creditTransactions = [];
  });

  it('renders total, cash, installments and purchase count on invoice cards and opens details', async () => {
    render(<Invoices />);

    expect(screen.getByText(/Total da fatura/i)).toBeTruthy();
    expect(screen.getByText(/Compras à vista/i)).toBeTruthy();
    expect(screen.getByText(/Compras parceladas/i)).toBeTruthy();
    expect(screen.getByText(/3 compra\(s\)/i)).toBeTruthy();

    const viewButton = screen.getByRole('button', { name: /Ver fatura/i });
    expect(viewButton).toBeTruthy();
    fireEvent.click(viewButton);

    // Modal should repeat total, cash, installments and details
    expect(screen.getByText('Fatura de Nubank')).toBeTruthy();
    expect(screen.getAllByText(/Mercado/)).toHaveLength(2);
    expect(screen.getAllByText(/Notebook/)).toHaveLength(2);
    expect(screen.getByText(/Parcela 3 de 10/)).toBeTruthy();
    expect(screen.getByText(/Previsão de término:/i)).toBeTruthy();
    expect(screen.getByText(/Término indisponível/i)).toBeTruthy();
  });

  it('pays open invoice and refetches', async () => {
    mockState.creditTransactions = [
      {
        id: 'tx-1',
        notes: 'invoice_item:item-1',
        status: 'pendente',
        description: 'Mercado',
        amount: 100,
        date: '2026-08-05',
        payment_method: 'credito',
      },
    ];

    render(<Invoices />);
    const payButton = screen.getByRole('button', { name: /Marcar fatura como paga/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockState.payCreditInvoiceTransactions).toHaveBeenCalledWith(['tx-1']);
      expect(mockState.refetch).toHaveBeenCalled();
    });
  });

  it('reopens paid invoice and refetches', async () => {
    mockState.creditTransactions = [
      {
        id: 'tx-1',
        notes: 'invoice_item:item-1',
        status: 'pago',
        description: 'Mercado',
        amount: 100,
        date: '2026-08-05',
        payment_method: 'credito',
      },
    ];

    render(<Invoices />);
    const reopenButton = screen.getByRole('button', { name: /Reabrir fatura/i });
    fireEvent.click(reopenButton);

    await waitFor(() => {
      expect(mockState.reopenCreditInvoiceTransactions).toHaveBeenCalledWith(['tx-1']);
      expect(mockState.refetch).toHaveBeenCalled();
    });
  });
});
