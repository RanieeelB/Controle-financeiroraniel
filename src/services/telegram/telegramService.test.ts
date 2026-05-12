import { describe, expect, it, vi } from 'vitest';
import { createTelegramService } from './telegramService';

function buildService() {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
  const answerCallbackQuery = vi.fn().mockResolvedValue(undefined);
  const deleteMessage = vi.fn().mockResolvedValue(undefined);
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
    deleteMessage,
  });

  return {
    service,
    sendMessage,
    answerCallbackQuery,
    deleteMessage,
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
    const { service, sendMessage, deleteMessage, getLinkedAccountByTelegramUserId } = buildService();
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
          message_id: 77,
          text: '/start',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(deleteMessage).toHaveBeenCalledWith({
      chatId: 99,
      messageId: 77,
      botToken: 'bot-token',
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
            expect.objectContaining({ text: '📊 Resumo', callback_data: 'summary:month' }),
            expect.objectContaining({ text: '🧮 Sobra', callback_data: 'balance:month' }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({ text: '💳 Faturas', callback_data: 'list:invoices' }),
            expect.objectContaining({ text: '💳 Cartões', callback_data: 'list:cards' }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({ text: '🏦 Investimentos', callback_data: 'list:investments' }),
            expect.objectContaining({ text: '🎯 Metas', callback_data: 'list:goals' }),
          ]),
          expect.arrayContaining([
            expect.objectContaining({ text: '🏠 Fixas', callback_data: 'list:fixed-bills' }),
            expect.objectContaining({ text: '❓ Ajuda', callback_data: 'help:examples' }),
          ]),
        ]),
      }),
    }));
  });

  it('shows an expense guide when the user taps the expense button', async () => {
    const { service, sendMessage, deleteMessage, getLinkedAccountByTelegramUserId } = buildService();
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
            message_id: 123,
            chat: { id: 99 },
          },
          from: { id: 12345 },
        },
      },
    });

    expect(deleteMessage).toHaveBeenCalledWith({
      chatId: 99,
      messageId: 123,
      botToken: 'bot-token',
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
    const { service, deleteMessage, handleParsedMessageForUser, getLinkedAccountByTelegramUserId } = buildService();
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
          message_id: 55,
          text: 'gastei 25 no almoço',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(deleteMessage).toHaveBeenCalledWith({
      chatId: 99,
      messageId: 55,
      botToken: 'bot-token',
    });
    expect(handleParsedMessageForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        intent: 'create_expense',
      }),
    );
  });

  it('continues responding when Telegram refuses to delete a message', async () => {
    const { service, sendMessage, deleteMessage, getLinkedAccountByTelegramUserId } = buildService();
    deleteMessage.mockRejectedValueOnce(new Error('message cannot be deleted'));
    getLinkedAccountByTelegramUserId.mockResolvedValueOnce({
      userId: 'user-1',
      telegramUserId: '12345',
    });

    const result = await service.handleRequest({
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': 'secret-token',
      },
      body: {
        message: {
          message_id: 88,
          text: '/help',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(result.statusCode).toBe(200);
    expect(deleteMessage).toHaveBeenCalledWith({
      chatId: 99,
      messageId: 88,
      botToken: 'bot-token',
    });
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      chatId: 99,
      text: expect.stringContaining('<b>Como usar</b>'),
    }));
  });

  it('routes unknown linked messages to the deterministic handler instead of AI', async () => {
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
          text: 'onde posso economizar esse mês?',
          chat: { id: 99 },
          from: { id: 12345 },
        },
      },
    });

    expect(handleParsedMessageForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ intent: 'unknown' }),
    );
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
