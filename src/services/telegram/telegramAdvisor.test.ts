import { describe, expect, it, vi } from 'vitest';
import { createTelegramAdvisor } from './telegramAdvisor';

function buildRepo() {
  return {
    listMonthTransactions: vi.fn().mockResolvedValue([
      { id: 'income-1', type: 'entrada', amount: 6500, status: 'recebido', notes: null, description: 'Salario', date: '2026-05-05', payment_method: 'pix' },
      { id: 'expense-1', type: 'gasto', amount: 1200, status: 'pago', notes: null, description: 'Mercado', date: '2026-05-07', payment_method: 'pix' },
      { id: 'expense-2', type: 'gasto', amount: 350, status: 'pago', notes: null, description: 'Uber', date: '2026-05-08', payment_method: 'pix' },
    ]),
    listMonthInvoiceItems: vi.fn().mockResolvedValue([
      { id: 'invoice-1', amount: 900, description: 'Notebook', date: '2026-05-09' },
    ]),
    listFixedBills: vi.fn().mockResolvedValue([
      { id: 'bill-1', amount: 180, due_day: 10, description: 'Internet', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
    ]),
    listInvestments: vi.fn().mockResolvedValue([
      { id: 'inv-1', name: 'Reserva', category: 'renda_fixa', amount_invested: 3000, current_value: 3200, return_percentage: 6.6, monthly_contribution: 500, last_auto_contribution_at: null, created_at: '2026-04-01T00:00:00Z', user_id: 'user-1', ticker: null },
    ]),
    listFinancialGoals: vi.fn().mockResolvedValue([
      { id: 'goal-1', title: 'Viagem', target_amount: 10000, current_amount: 2500, deadline: '2026-12-01', icon: 'target', created_at: '2026-01-01T00:00:00Z', user_id: 'user-1' },
    ]),
    getSalarySettings: vi.fn().mockResolvedValue({
      amount: 6500,
      day_of_month: 5,
    }),
    listRecentConversationMessages: vi.fn().mockResolvedValue([
      { role: 'user', content: 'Estou gastando demais esse mês?' },
      { role: 'assistant', content: 'Seu gasto está concentrado em mercado e transporte.' },
    ]),
    saveConversationMessage: vi.fn().mockResolvedValue(undefined),
  };
}

describe('telegramAdvisor', () => {
  it('builds financial context, calls Gemini, and persists the conversation', async () => {
    const repo = buildRepo();
    const generateContent = vi.fn().mockResolvedValue({
      text: 'Você ainda está com margem positiva, mas vale reduzir delivery e transporte.',
    });

    const advisor = createTelegramAdvisor({
      apiKey: 'fake-key',
      repo,
      client: {
        models: {
          generateContent,
        },
      },
      now: new Date('2026-05-10T12:00:00-03:00'),
    });

    const response = await advisor.reply({
      userId: 'user-1',
      telegramChatId: '99',
      telegramUserId: '12345',
      message: 'Onde eu posso economizar esse mês?',
    });

    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('Investimentos'),
    }));
    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('Contas fixas'),
    }));
    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('faturas em aberto'),
    }));
    expect(response).toBe('Você ainda está com margem positiva, mas vale reduzir delivery e transporte.');
    expect(repo.saveConversationMessage).toHaveBeenCalledTimes(2);
    expect(repo.saveConversationMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      role: 'user',
      content: 'Onde eu posso economizar esse mês?',
    }));
    expect(repo.saveConversationMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      role: 'assistant',
      content: 'Você ainda está com margem positiva, mas vale reduzir delivery e transporte.',
    }));
  });

  it('returns a safe fallback when Gemini fails', async () => {
    const repo = buildRepo();
    const advisor = createTelegramAdvisor({
      apiKey: 'fake-key',
      repo,
      client: {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('boom')),
        },
      },
      now: new Date('2026-05-10T12:00:00-03:00'),
    });

    const response = await advisor.reply({
      userId: 'user-1',
      telegramChatId: '99',
      telegramUserId: '12345',
      message: 'Me ajuda a planejar melhor',
    });

    expect(response).toContain('consultor financeiro');
  });
});
