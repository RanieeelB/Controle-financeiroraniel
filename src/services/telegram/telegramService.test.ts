import { describe, expect, it, vi } from 'vitest';
import { createTelegramService } from './telegramService';

function buildService() {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const answerCallbackQuery = vi.fn().mockResolvedValue(undefined);
  const handleParsedMessageForUser = vi.fn().mockResolvedValue('ok');
  const getLinkedAccountByTelegramUserId = vi.fn().mockResolvedValue(null);
  const linkTelegramUser = vi.fn().mockResolvedValue({
    connectionId: 'conn-1',
    userId: 'user-1',
    telegramUserId: '12345',
    telegramChatId: '99',
  });

  const service = createTelegramService({
    botToken: 'bot-token',
    webhookSecret: 'secret-token',
    handleParsedMessageForUser,
    getLinkedAccountByTelegramUserId,
    linkTelegramUser,
    sendMessage,
    answerCallbackQuery,
  });

  return {
    service,
    sendMessage,
    answerCallbackQuery,
    handleParsedMessageForUser,
    getLinkedAccountByTelegramUserId,
    linkTelegramUser,
  };
}

describe('telegramService', () => {
  it('asks for the access token on /start when the telegram user is not linked', async () => {
    const { service, sendMessage } = buildService();

    const result = await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: '/start',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(result.statusCode).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      parseMode: 'HTML',
      text: expect.stringContaining('token de acesso'),
    }));
  });

  it('responds to /start for already linked users', async () => {
    const { service, sendMessage, getLinkedAccountByTelegramUserId } = buildService();
    getLinkedAccountByTelegramUserId.mockResolvedValueOnce({
      userId: 'user-1',
      telegramUserId: '12345',
    });

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: '/start',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      parseMode: 'HTML',
      text: expect.stringContaining('<b>Bot do controle financeiro ativo</b>'),
      replyMarkup: expect.objectContaining({
        inline_keyboard: expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ text: '💸 Registrar gasto', callback_data: 'guide:expense' }),
            expect.objectContaining({ text: '💰 Registrar entrada', callback_data: 'guide:income' }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({ text: '📊 Resumo do mês', callback_data: 'summary:month' }),
            expect.objectContaining({ text: '❓ Ajuda', callback_data: 'help:examples' }),
          ]),
        ]),
      }),
    }));
  });

  it('shows an expense guide when the user taps the expense button', async () => {
    const { service, sendMessage, getLinkedAccountByTelegramUserId } = buildService();
    getLinkedAccountByTelegramUserId.mockResolvedValueOnce({
      userId: 'user-1',
      telegramUserId: '12345',
    });

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        callback_query: {
          id: 'callback-1',
          data: 'guide:expense',
          message: {
            chat: { id: 99 },
          },
          from: { id: 12345 },
        },
      },
    });

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      parseMode: 'HTML',
      text: expect.stringContaining('<b>Registrar gasto</b>'),
    }));
  });

  it('handles summary button callbacks for linked users', async () => {
    const { service, answerCallbackQuery, handleParsedMessageForUser, getLinkedAccountByTelegramUserId } = buildService();
    getLinkedAccountByTelegramUserId.mockResolvedValueOnce({
      userId: 'user-1',
      telegramUserId: '12345',
    });

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        callback_query: {
          id: 'callback-1',
          data: 'summary:month',
          message: {
            chat: { id: 99 },
          },
          from: { id: 12345 },
        },
      },
    });

    expect(answerCallbackQuery).toHaveBeenCalledWith(expect.objectContaining({
      callbackQueryId: 'callback-1',
      botToken: 'bot-token',
    }));
    expect(handleParsedMessageForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ intent: 'get_monthly_summary' }),
    );
  });

  it('uses a token message to link an unlinked telegram user', async () => {
    const { service, sendMessage, linkTelegramUser, handleParsedMessageForUser } = buildService();

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: 'tglnk_123456abcdef',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(linkTelegramUser).toHaveBeenCalledWith({
      rawToken: 'tglnk_123456abcdef',
      telegramUserId: '12345',
      telegramChatId: '99',
    });
    expect(handleParsedMessageForUser).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      text: expect.stringContaining('Telegram conectado com sucesso'),
    }));
  });

  it('returns an invalid token message when linking fails', async () => {
    const { service, sendMessage, linkTelegramUser } = buildService();
    linkTelegramUser.mockRejectedValueOnce(new Error('Token de acesso inválido.'));

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: 'tglnk_invalid',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      text: expect.stringContaining('Token de acesso inválido.'),
    }));
  });

  it('routes parsed financial messages only after the telegram user is linked', async () => {
    const { service, handleParsedMessageForUser, getLinkedAccountByTelegramUserId } = buildService();
    getLinkedAccountByTelegramUserId.mockResolvedValueOnce({
      userId: 'user-1',
      telegramUserId: '12345',
    });

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: 'gastei 25 no almoço',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(handleParsedMessageForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        intent: 'create_expense',
      }),
    );
  });

  it('uses the AI parser as fallback for linked users when regex parsing is unknown', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const handleParsedMessageForUser = vi.fn().mockResolvedValue('registrado');
    const parseMessageWithAi = vi.fn().mockResolvedValue({
      intent: 'create_expense',
      data: {
        description: 'cinema',
        amount: 80,
        category: 'Lazer',
        date: '2026-05-10',
        status: 'pago',
      },
    });

    const service = createTelegramService({
      botToken: 'bot-token',
      webhookSecret: 'secret-token',
      handleParsedMessageForUser,
      getLinkedAccountByTelegramUserId: vi.fn().mockResolvedValue({
        userId: 'user-1',
        telegramUserId: '12345',
      }),
      linkTelegramUser: vi.fn(),
      sendMessage,
      parseMessageWithAi,
      now: new Date('2026-05-10T12:00:00-03:00'),
    });

    await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          text: 'ontem fui no cinema e paguei oitenta reais',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(parseMessageWithAi).toHaveBeenCalledWith(
      'ontem fui no cinema e paguei oitenta reais',
      expect.objectContaining({ now: new Date('2026-05-10T12:00:00-03:00') }),
    );
    expect(handleParsedMessageForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ intent: 'create_expense' }),
    );
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      text: 'registrado',
      parseMode: 'HTML',
      replyMarkup: expect.objectContaining({
        inline_keyboard: expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ text: '📊 Ver resumo', callback_data: 'summary:month' }),
          ]),
        ]),
      }),
    }));
  });

  it('returns ok for updates without text', async () => {
    const { service, sendMessage, handleParsedMessageForUser } = buildService();

    const result = await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(result.statusCode).toBe(200);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(handleParsedMessageForUser).not.toHaveBeenCalled();
  });
});
