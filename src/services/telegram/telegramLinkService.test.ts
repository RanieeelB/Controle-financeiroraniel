import { describe, expect, it, vi } from 'vitest';
import {
  createTelegramLinkService,
  decryptTelegramLinkToken,
  encryptTelegramLinkToken,
  hashTelegramLinkToken,
  verifyTelegramLinkToken,
} from './telegramLinkService';

describe('telegramLinkService', () => {
  it('hashes tokens without preserving the raw value', async () => {
    const rawToken = 'tglnk_example_token';
    const hashedToken = await hashTelegramLinkToken(rawToken);

    expect(hashedToken).not.toBe(rawToken);
    expect(hashedToken).toHaveLength(64);
    await expect(verifyTelegramLinkToken(rawToken, hashedToken)).resolves.toBe(true);
    await expect(verifyTelegramLinkToken('another-token', hashedToken)).resolves.toBe(false);
  });

  it('encrypts tokens reversibly for secure server-side retrieval', async () => {
    const secret = '12345678901234567890123456789012';
    const encrypted = await encryptTelegramLinkToken('tglnk_example_token', secret);

    expect(encrypted).not.toBe('tglnk_example_token');
    await expect(decryptTelegramLinkToken(encrypted, secret)).resolves.toBe('tglnk_example_token');
  });

  it('generates a token only once per account', async () => {
    const repo = {
      getConnectionByUserId: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'conn-1',
          user_id: 'user-1',
          link_token_hash: 'already-generated',
          token_generated_at: '2026-05-11T18:00:00.000Z',
          telegram_user_id: null,
          telegram_chat_id: null,
          linked_at: null,
        }),
      saveGeneratedToken: vi.fn().mockImplementation(async ({ userId, tokenHash, generatedAt }) => ({
        id: 'conn-1',
        user_id: userId,
        link_token_hash: tokenHash,
        token_encrypted: 'cipher',
        token_generated_at: generatedAt,
        telegram_user_id: null,
        telegram_chat_id: null,
        linked_at: null,
      })),
      getConnectionByTelegramUserId: vi.fn(),
      getConnectionByTokenHash: vi.fn(),
      consumeTokenLink: vi.fn(),
    };

    const service = createTelegramLinkService({
      repo,
      now: new Date('2026-05-11T18:00:00.000Z'),
      tokenSecret: '12345678901234567890123456789012',
    });

    const first = await service.generateTokenForUser('user-1');

    expect(first.rawToken).toMatch(/^tglnk_[a-z0-9]+$/);
    expect(repo.saveGeneratedToken).toHaveBeenCalledTimes(1);

    await expect(service.generateTokenForUser('user-1')).rejects.toThrow('Token do Telegram já foi gerado');
  });

  it('consumes a valid token once and links the telegram account', async () => {
    const rawToken = 'tglnk_valid_token';
    const tokenHash = await hashTelegramLinkToken(rawToken);
    const repo = {
      getConnectionByUserId: vi.fn(),
      saveGeneratedToken: vi.fn(),
      getConnectionByTelegramUserId: vi.fn().mockResolvedValue(null),
      getConnectionByTokenHash: vi.fn()
        .mockResolvedValueOnce({
          id: 'conn-1',
          user_id: 'user-1',
          link_token_hash: tokenHash,
          token_encrypted: 'cipher',
          token_generated_at: '2026-05-11T18:00:00.000Z',
          telegram_user_id: null,
          telegram_chat_id: null,
          linked_at: null,
        })
        .mockResolvedValueOnce(null),
      consumeTokenLink: vi.fn().mockResolvedValue(undefined),
    };

    const service = createTelegramLinkService({
      repo,
      now: new Date('2026-05-11T18:00:00.000Z'),
      tokenSecret: '12345678901234567890123456789012',
    });

    const firstLink = await service.linkTelegramUser({
      rawToken,
      telegramUserId: '123',
      telegramChatId: '456',
    });

    expect(firstLink).toEqual({
      connectionId: 'conn-1',
      userId: 'user-1',
      telegramUserId: '123',
      telegramChatId: '456',
    });
    expect(repo.consumeTokenLink).toHaveBeenCalledWith({
      connectionId: 'conn-1',
      telegramUserId: '123',
      telegramChatId: '456',
      linkedAt: '2026-05-11T18:00:00.000Z',
    });

    await expect(service.linkTelegramUser({
      rawToken,
      telegramUserId: '123',
      telegramChatId: '456',
    })).rejects.toThrow('Token de acesso inválido');
  });

  it('rejects linking when the telegram user is already connected elsewhere', async () => {
    const rawToken = 'tglnk_valid_token';
    const repo = {
      getConnectionByUserId: vi.fn(),
      saveGeneratedToken: vi.fn(),
      getConnectionByTelegramUserId: vi.fn().mockResolvedValue({
        id: 'conn-2',
        user_id: 'user-2',
        telegram_user_id: '123',
      }),
      getConnectionByTokenHash: vi.fn(),
      consumeTokenLink: vi.fn(),
    };

    const service = createTelegramLinkService({
      repo,
      now: new Date('2026-05-11T18:00:00.000Z'),
      tokenSecret: '12345678901234567890123456789012',
    });

    await expect(service.linkTelegramUser({
      rawToken,
      telegramUserId: '123',
      telegramChatId: '456',
    })).rejects.toThrow('Este Telegram já está conectado a outra conta');
  });

  it('returns the existing pending token for the account owner', async () => {
    const secret = '12345678901234567890123456789012';
    const encrypted = await encryptTelegramLinkToken('tglnk_existing_token', secret);
    const repo = {
      getConnectionByUserId: vi.fn().mockResolvedValue({
        id: 'conn-1',
        user_id: 'user-1',
        link_token_hash: 'hash',
        token_encrypted: encrypted,
        token_generated_at: '2026-05-11T18:00:00.000Z',
        telegram_user_id: null,
        telegram_chat_id: null,
        linked_at: null,
      }),
      saveGeneratedToken: vi.fn(),
      getConnectionByTelegramUserId: vi.fn(),
      getConnectionByTokenHash: vi.fn(),
      consumeTokenLink: vi.fn(),
    };

    const service = createTelegramLinkService({
      repo,
      tokenSecret: secret,
    });

    await expect(service.getPendingTokenForUser('user-1')).resolves.toEqual({
      rawToken: 'tglnk_existing_token',
      generatedAt: '2026-05-11T18:00:00.000Z',
    });
  });
});
