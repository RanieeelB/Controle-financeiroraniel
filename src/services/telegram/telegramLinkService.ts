export interface TelegramConnectionRecord {
  id: string;
  user_id: string;
  link_token_hash: string | null;
  token_generated_at: string | null;
  telegram_user_id: string | null;
  telegram_chat_id: string | null;
  linked_at: string | null;
}

export interface TelegramLinkRepository {
  getConnectionByUserId(userId: string): Promise<TelegramConnectionRecord | null>;
  saveGeneratedToken(input: {
    userId: string;
    tokenHash: string;
    generatedAt: string;
  }): Promise<TelegramConnectionRecord>;
  getConnectionByTelegramUserId(telegramUserId: string): Promise<Pick<TelegramConnectionRecord, 'id' | 'user_id' | 'telegram_user_id'> | null>;
  getConnectionByTokenHash(tokenHash: string): Promise<TelegramConnectionRecord | null>;
  consumeTokenLink(input: {
    connectionId: string;
    telegramUserId: string;
    telegramChatId: string;
    linkedAt: string;
  }): Promise<void>;
}

interface CreateTelegramLinkServiceOptions {
  repo: TelegramLinkRepository;
  now?: Date;
}

export function createTelegramLinkService(options: CreateTelegramLinkServiceOptions) {
  return {
    async generateTokenForUser(userId: string) {
      const existingConnection = await options.repo.getConnectionByUserId(userId);

      if (existingConnection?.telegram_user_id) {
        throw new Error('Conta já vinculada ao Telegram.');
      }

      if (existingConnection?.link_token_hash) {
        throw new Error('Token do Telegram já foi gerado para esta conta.');
      }

      const rawToken = generateTelegramLinkToken();
      const tokenHash = await hashTelegramLinkToken(rawToken);
      const generatedAt = resolveNow(options.now).toISOString();

      await options.repo.saveGeneratedToken({
        userId,
        tokenHash,
        generatedAt,
      });

      return {
        rawToken,
        tokenHash,
        generatedAt,
      };
    },

    async linkTelegramUser(input: {
      rawToken: string;
      telegramUserId: string;
      telegramChatId: string;
    }) {
      const telegramUserId = input.telegramUserId.trim();
      const telegramChatId = input.telegramChatId.trim();
      const rawToken = input.rawToken.trim();

      if (!telegramUserId || !telegramChatId || !rawToken) {
        throw new Error('Dados inválidos para vincular o Telegram.');
      }

      const existingTelegramLink = await options.repo.getConnectionByTelegramUserId(telegramUserId);
      if (existingTelegramLink) {
        throw new Error('Este Telegram já está conectado a outra conta.');
      }

      const tokenHash = await hashTelegramLinkToken(rawToken);
      const connection = await options.repo.getConnectionByTokenHash(tokenHash);

      if (!connection?.id || !connection.user_id || !connection.link_token_hash) {
        throw new Error('Token de acesso inválido.');
      }

      if (!(await verifyTelegramLinkToken(rawToken, connection.link_token_hash))) {
        throw new Error('Token de acesso inválido.');
      }

      const linkedAt = resolveNow(options.now).toISOString();
      await options.repo.consumeTokenLink({
        connectionId: connection.id,
        telegramUserId,
        telegramChatId,
        linkedAt,
      });

      return {
        connectionId: connection.id,
        userId: connection.user_id,
        telegramUserId,
        telegramChatId,
      };
    },
  };
}

export function generateTelegramLinkToken() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `tglnk_${hex}`;
}

export async function hashTelegramLinkToken(rawToken: string) {
  const normalized = rawToken.trim();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyTelegramLinkToken(rawToken: string, tokenHash: string) {
  const received = await hashTelegramLinkToken(rawToken);
  return constantTimeEqual(received, tokenHash);
}

function resolveNow(reference?: Date) {
  return reference ? new Date(reference) : new Date();
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}
