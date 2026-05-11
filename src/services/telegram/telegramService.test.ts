import { describe, expect, it, vi } from 'vitest';
import { createTelegramService } from './telegramService';

function buildService() {
  const sendMessage = vi.fn().mockResolvedValue(undefined);
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
  });

  return {
    service,
    sendMessage,
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
      text: expect.stringContaining('Qual o token de acesso?'),
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
      text: expect.stringContaining('Bot do controle financeiro ativo.'),
    }));
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
