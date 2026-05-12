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
      { id: 'income-1', type: 'entrada', amount: 6500, status: 'recebido', notes: null, description: 'Salário', date: '2026-05-05', category: { name: 'Salário', color: '#75ff9e' } },
      { id: 'income-2', type: 'entrada', amount: 500, status: 'recebido', notes: null, description: 'Freela', date: '2026-05-08', category: { name: 'Outros recebimentos', color: '#859585' } },
      { id: 'expense-1', type: 'gasto', amount: 200, status: 'pago', notes: null, description: 'Mercado', date: '2026-05-09', category: { name: 'Mercado', color: '#75ff9e' } },
      { id: 'expense-2', type: 'gasto', amount: 80, status: 'pago', notes: null, description: 'Ifood', date: '2026-05-07', category: { name: 'Alimentação', color: '#ffb4ab' } },
      { id: 'invoice-tx-1', type: 'gasto', amount: 300, status: 'pendente', notes: 'invoice_item:invoice-1', description: 'Cartão', date: '2026-05-08', payment_method: 'credito', category: { name: 'Outros', color: '#859585' } },
      { id: 'invoice-tx-2', type: 'gasto', amount: 120, status: 'pago', notes: 'invoice_item:invoice-2', description: 'Streaming', date: '2026-05-06', payment_method: 'credito', category: { name: 'Outros', color: '#859585' } },
      { id: 'bill-payment-1', type: 'gasto', amount: 120, status: 'pago', notes: 'fixed_bill:bill-2', description: 'Água', date: '2026-05-10', category: { name: 'Contas', color: '#bacbb9' } },
    ]),
    listMonthInvoiceItems: vi.fn().mockResolvedValue([
      { id: 'invoice-1', card_id: 'card-1', amount: 300, description: 'Cartão', date: '2026-05-08', credit_card: { id: 'card-1', name: 'Nubank', last_digits: '1234', brand: 'Mastercard' } },
      { id: 'invoice-2', card_id: 'card-2', amount: 120, description: 'Streaming', date: '2026-05-06', credit_card: { id: 'card-2', name: 'Inter', last_digits: '9876', brand: 'Visa' } },
    ]),
    listCreditCards: vi.fn().mockResolvedValue([
      { id: 'card-1', user_id: 'user-1', name: 'Nubank', last_digits: '1234', brand: 'Mastercard', card_holder: 'Raniel', credit_limit: 4000, due_day: 10, closing_day: 3, color: '#820ad1', created_at: '2026-05-01T00:00:00Z' },
      { id: 'card-2', user_id: 'user-1', name: 'Inter', last_digits: '9876', brand: 'Visa', card_holder: 'Raniel', credit_limit: 2000, due_day: 15, closing_day: 8, color: '#ff7a00', created_at: '2026-05-01T00:00:00Z' },
    ]),
    listFixedBills: vi.fn().mockResolvedValue([
      { id: 'bill-1', amount: 150, due_day: 5, description: 'Internet', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
      { id: 'bill-2', amount: 120, due_day: 10, description: 'Água', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
    ]),
    listInvestments: vi.fn().mockResolvedValue([
      { id: 'inv-1', user_id: 'user-1', name: 'Ferias', ticker: null, category: 'renda_fixa', amount_invested: 1000, current_value: 1000, return_percentage: 0, monthly_contribution: 0, last_auto_contribution_at: null, created_at: '2026-05-01T00:00:00Z' },
      { id: 'inv-2', user_id: 'user-1', name: '13', ticker: null, category: 'renda_fixa', amount_invested: 500, current_value: 500, return_percentage: 0, monthly_contribution: 0, last_auto_contribution_at: null, created_at: '2026-05-01T00:00:00Z' },
    ]),
    insertInvestmentDeposit: vi.fn().mockResolvedValue({ id: 'deposit-1' }),
    updateInvestmentTotals: vi.fn().mockResolvedValue(undefined),
    listFinancialGoals: vi.fn().mockResolvedValue([
      { id: 'goal-1', user_id: 'user-1', title: 'Reserva', target_amount: 10000, current_amount: 2500, deadline: '2026-12-31', icon: 'target', created_at: '2026-05-01T00:00:00Z' },
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
    expect(response).toContain('✅ <b>Gasto registrado</b>');
    expect(response).toContain('<b>Categoria:</b> Alimentação');
    expect(response).toContain('<b>Valor:</b> R$ 25,00');
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

    expect(response).toContain('📊 <b>Resumo de maio/2026</b>');
    expect(response).toContain('💰 <b>Entradas:</b> R$ 7.000,00');
    expect(response).toContain('💸 <b>Gastos:</b> R$ 820,00');
    expect(response).toContain('🏠 <b>Contas fixas:</b> R$ 270,00');
    expect(response).toContain('💳 <b>Faturas abertas:</b> R$ 300,00');
    expect(response).toContain('🧮 <b>Sobra prevista:</b> R$ 5.730,00');
  });

  it('lists month expenses with totals and recent items', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_expenses',
      data: {
        description: 'Gastos do mês',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('💸 <b>Gastos de maio/2026</b>');
    expect(response).toContain('<b>Total:</b> R$ 820,00');
    expect(response).toContain('Mercado');
    expect(response).toContain('Ifood');
  });

  it('returns an expense distribution by category', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'get_expense_distribution',
      data: {
        description: 'Distribuição de gastos',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('🧭 <b>Distribuição de gastos</b>');
    expect(response).toContain('Mercado: R$ 200,00');
    expect(response).toContain('Alimentação: R$ 80,00');
  });

  it('lists fixed bills with month status', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_fixed_bills',
      data: {
        description: 'Contas fixas',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('🏠 <b>Contas fixas</b>');
    expect(response).toContain('Internet');
    expect(response).toContain('Água');
    expect(response).toContain('<b>Total:</b> R$ 270,00');
  });

  it('returns a specific card invoice by card name', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'get_card_invoice',
      data: {
        description: 'nubank',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('💳 <b>Fatura Nubank');
    expect(response).toContain('Cartão');
    expect(response).toContain('<b>Total:</b> R$ 300,00');
  });

  it('shows card invoice totals even when linked invoice transactions are already paid', async () => {
    const { actions } = buildActions();

    const cardsResponse = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_cards',
      data: {
        description: 'Cartões',
        date: '2026-05-10',
      },
    });
    const invoicesResponse = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_open_invoices',
      data: {
        description: 'Faturas abertas',
        date: '2026-05-10',
      },
    });

    expect(cardsResponse).toContain('Nubank');
    expect(cardsResponse).toContain('fatura R$ 300,00');
    expect(cardsResponse).toContain('Inter');
    expect(cardsResponse).toContain('fatura R$ 120,00');
    expect(invoicesResponse).toContain('Nubank: R$ 300,00');
    expect(invoicesResponse).toContain('Inter: R$ 120,00');
    expect(invoicesResponse).toContain('Paga');
  });

  it('lists investments with totals', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_investments',
      data: {
        description: 'Investimentos',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('🏦 <b>Investimentos</b>');
    expect(response).toContain('Ferias');
    expect(response).toContain('13');
    expect(response).toContain('<b>Saldo guardado:</b> R$ 1.500,00');
  });

  it('lists financial goals with progress', async () => {
    const { actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'list_goals',
      data: {
        description: 'Metas',
        date: '2026-05-10',
      },
    });

    expect(response).toContain('🎯 <b>Metas financeiras</b>');
    expect(response).toContain('Reserva');
    expect(response).toContain('25%');
  });

  it('saves an investment deposit matched by investment name and returns a confirmation message', async () => {
    const { repo, actions } = buildActions();

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'create_investment_deposit',
      data: {
        description: 'fer',
        amount: 500,
        date: '2026-05-10',
        status: 'pago',
      },
    });

    expect(repo.insertInvestmentDeposit).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      investmentId: 'inv-1',
      amount: 500,
      date: '2026-05-10',
    }));
    expect(repo.updateInvestmentTotals).toHaveBeenCalledWith({
      investmentId: 'inv-1',
      amountInvested: 1500,
      currentValue: 1500,
      returnPercentage: 0,
    });
    expect(repo.insertTransaction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      description: 'Aporte em Ferias',
      amount: 500,
      paymentMethod: 'transferencia',
    }));
    expect(response).toContain('✅ <b>Aporte registrado</b>');
    expect(response).toContain('<b>Investimento:</b> Ferias');
    expect(response).toContain('<b>Valor:</b> R$ 500,00');
  });

  it('asks for clarification when more than one investment matches the name', async () => {
    const { repo, actions } = buildActions();
    repo.listInvestments.mockResolvedValueOnce([
      { id: 'inv-1', user_id: 'user-1', name: 'Ferias', ticker: null, category: 'renda_fixa', amount_invested: 1000, current_value: 1000, return_percentage: 0, monthly_contribution: 0, last_auto_contribution_at: null, created_at: '2026-05-01T00:00:00Z' },
      { id: 'inv-3', user_id: 'user-1', name: 'Ferias Europa', ticker: null, category: 'renda_fixa', amount_invested: 2000, current_value: 2000, return_percentage: 0, monthly_contribution: 0, last_auto_contribution_at: null, created_at: '2026-05-01T00:00:00Z' },
    ]);

    const response = await actions.handleParsedMessageForUser('user-1', {
      intent: 'create_investment_deposit',
      data: {
        description: 'fer',
        amount: 500,
        date: '2026-05-10',
        status: 'pago',
      },
    });

    expect(repo.insertInvestmentDeposit).not.toHaveBeenCalled();
    expect(response).toContain('Encontrei mais de um investimento parecido');
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
