import { describe, expect, it, vi } from 'vitest';
import { createTelegramActions } from './telegramActions';

function buildActions() {
  const repo = {
    findCategoryByNameOrAliases: vi.fn().mockResolvedValue(null),
    createCategory: vi.fn().mockImplementation(async ({ userId, name, type }) => ({
      id: `${type}-${name}`,
      user_id: userId,
      name,
      type,
    })),
    insertTransaction: vi.fn().mockResolvedValue({ id: 'tx-1' }),
    listMonthTransactions: vi.fn().mockResolvedValue([
      { id: 'income-1', type: 'entrada', amount: 6500, status: 'recebido', notes: null },
      { id: 'expense-1', type: 'gasto', amount: 200, status: 'pago', notes: null },
      { id: 'invoice-tx-1', type: 'gasto', amount: 300, status: 'pendente', notes: 'invoice_item:invoice-1' },
      { id: 'bill-payment-1', type: 'gasto', amount: 120, status: 'pago', notes: 'fixed_bill:bill-2' },
    ]),
    listMonthInvoiceItems: vi.fn().mockResolvedValue([
      { id: 'invoice-1', amount: 300, description: 'Cartão', date: '2026-05-08' },
    ]),
    listFixedBills: vi.fn().mockResolvedValue([
      { id: 'bill-1', amount: 150, due_day: 5, description: 'Internet', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
      { id: 'bill-2', amount: 120, due_day: 10, description: 'Água', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
    ]),
  };

  const actions = createTelegramActions({
    now: new Date('2026-05-10T12:00:00-03:00'),
    repo,
  });

  return { repo, actions };
}

describe('telegramActions', () => {
  it('saves a parsed expense and returns a confirmation message', async () => {
    const { repo, actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'create_expense',
      data: {
        description: 'almoço',
        amount: 25,
        category: 'Alimentação',
        date: '2026-05-10',
        status: 'pago',
      },
    });

    expect(repo.insertTransaction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      type: 'gasto',
      description: 'almoço',
      amount: 25,
      status: 'pago',
      paymentMethod: 'pix',
    }));
    expect(response).toContain('Gasto registrado com sucesso.');
    expect(response).toContain('Categoria: Alimentação');
    expect(response).toContain('Valor: R$ 25,00');
  });

  it('returns the monthly summary based on real repository data', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'get_monthly_summary',
      data: {
        description: 'Resumo do mês',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('Resumo de maio/2026');
    expect(response).toContain('Entradas: R$ 6.500,00');
    expect(response).toContain('Gastos: R$ 620,00');
    expect(response).toContain('Contas fixas: R$ 270,00');
    expect(response).toContain('Faturas abertas: R$ 300,00');
    expect(response).toContain('Sobra prevista: R$ 5.430,00');
  });

  it('fails safely when the user id is missing', async () => {
    const { actions } = buildActions();

    await expect(actions.handleParsedMessageForUser('', {
      intent: 'create_income',
      data: {
        description: 'salário',
        amount: 6500,
        category: 'Salário',
        date: '2026-05-10',
        status: 'recebido',
      },
    })).rejects.toThrow('Usuário interno inválido para lançamento do Telegram.');
  });
});
