import { describe, expect, it, vi } from 'vitest';
import { createTelegramAutomationRunner } from './telegramAutomations';

function buildRunner(now = new Date('2026-05-10T21:00:00.000Z')) {
  const repo = {
    listLinkedConnections: vi.fn().mockResolvedValue([
      { user_id: 'user-1', telegram_chat_id: '99' },
    ]),
    hasDelivery: vi.fn().mockResolvedValue(false),
    saveDelivery: vi.fn().mockResolvedValue(undefined),
    listMonthTransactions: vi.fn().mockResolvedValue([
      { id: 'income-1', type: 'entrada', amount: 6500, status: 'recebido', notes: null, description: 'Salário', date: '2026-05-05', category: { name: 'Salário' } },
      { id: 'expense-1', type: 'gasto', amount: 200, status: 'pago', notes: null, description: 'Mercado', date: '2026-05-10', category: { name: 'Mercado' } },
      { id: 'invoice-tx-1', type: 'gasto', amount: 300, status: 'pendente', notes: 'invoice_item:invoice-1', description: 'Cartão', date: '2026-05-08', payment_method: 'credito', category: { name: 'Outros' } },
    ]),
    listMonthInvoiceItems: vi.fn().mockResolvedValue([
      { id: 'invoice-1', card_id: 'card-1', amount: 300, description: 'Cartão', date: '2026-05-08', credit_card: { id: 'card-1', name: 'Nubank', last_digits: '1234', brand: 'Mastercard' } },
    ]),
    listCreditCards: vi.fn().mockResolvedValue([
      { id: 'card-1', user_id: 'user-1', name: 'Nubank', last_digits: '1234', brand: 'Mastercard', card_holder: 'Raniel', credit_limit: 4000, due_day: 12, closing_day: 3, color: '#820ad1', created_at: '2026-05-01T00:00:00Z' },
    ]),
    listFixedBills: vi.fn().mockResolvedValue([
      { id: 'bill-1', amount: 150, due_day: 11, description: 'Internet', status: 'pendente', icon: 'receipt', user_id: 'user-1', category_id: null, created_at: '2026-05-01T00:00:00Z' },
    ]),
    updateTransactionsStatus: vi.fn().mockResolvedValue(undefined),
    insertFixedBillPayment: vi.fn().mockResolvedValue({ id: 'payment-1' }),
  };
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const runner = createTelegramAutomationRunner({
    now,
    repo,
    sendMessage,
  });

  return { runner, repo, sendMessage };
}

describe('telegramAutomations', () => {
  it('sends the 18h daily summary only when the user had movement today', async () => {
    const { runner, sendMessage, repo } = buildRunner();

    const result = await runner.runDueAutomations();

    expect(result.sent).toBeGreaterThan(0);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      parseMode: 'HTML',
      text: expect.stringContaining('Resumo das 18h'),
    }));
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Saldo disponível hoje'),
    }));
    expect(repo.saveDelivery).toHaveBeenCalledWith(expect.objectContaining({
      automationKey: 'daily-summary:2026-05-10',
    }));
  });

  it('skips the 18h daily summary when there was no movement today', async () => {
    const { runner, sendMessage, repo } = buildRunner();
    repo.listMonthTransactions.mockResolvedValueOnce([
      { id: 'income-1', type: 'entrada', amount: 6500, status: 'recebido', notes: null, description: 'Salário', date: '2026-05-05', category: { name: 'Salário' } },
    ]);

    await runner.runDueAutomations();

    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Resumo das 18h'),
    }));
  });

  it('sends morning due reminders with payment confirmation buttons', async () => {
    const { runner, sendMessage } = buildRunner(new Date('2026-05-10T11:00:00.000Z'));

    await runner.runDueAutomations();

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      parseMode: 'HTML',
      text: expect.stringContaining('Agenda da manhã'),
      replyMarkup: expect.objectContaining({
        inline_keyboard: expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ callback_data: 'auto:payfix:bill-1:2026-05' }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({ callback_data: 'auto:payinv:card-1:2026-05' }),
          ]),
        ]),
      }),
    }));
  });

  it('sends a low balance alert when the projected month balance is negative', async () => {
    const { runner, sendMessage, repo } = buildRunner();
    repo.listMonthTransactions.mockResolvedValueOnce([
      { id: 'income-1', type: 'entrada', amount: 500, status: 'recebido', notes: null, description: 'Freela', date: '2026-05-10', category: { name: 'Outros' } },
      { id: 'expense-1', type: 'gasto', amount: 450, status: 'pago', notes: null, description: 'Mercado', date: '2026-05-10', category: { name: 'Mercado' } },
      { id: 'invoice-tx-1', type: 'gasto', amount: 300, status: 'pendente', notes: 'invoice_item:invoice-1', description: 'Cartão', date: '2026-05-08', payment_method: 'credito', category: { name: 'Outros' } },
    ]);

    await runner.runDueAutomations();

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Alerta de saldo'),
    }));
  });

  it('handles an invoice payment confirmation callback', async () => {
    const { runner, repo } = buildRunner();

    const result = await runner.handleAutomationCallback('user-1', 'auto:payinv:card-1:2026-05');

    expect(repo.updateTransactionsStatus).toHaveBeenCalledWith(['invoice-tx-1'], 'pago');
    expect(result.text).toContain('Fatura marcada como paga');
  });

  it('handles a fixed bill payment confirmation callback', async () => {
    const { runner, repo } = buildRunner();

    const result = await runner.handleAutomationCallback('user-1', 'auto:payfix:bill-1:2026-05');

    expect(repo.insertFixedBillPayment).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      billId: 'bill-1',
      monthKey: '2026-05',
    }));
    expect(result.text).toContain('Conta fixa marcada como paga');
  });
});
