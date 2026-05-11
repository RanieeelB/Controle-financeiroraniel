import { parseTelegramMessage, sanitizeTelegramText } from './telegramParser.js';
import type { TelegramParsedMessage } from './telegramParser.js';

export interface TelegramUpdateMessage {
  message_id?: number;
  text?: string;
  chat?: {
    id?: number;
  };
  from?: {
    id?: number;
  };
}

export interface TelegramUpdate {
  update_id?: number;
  message?: TelegramUpdateMessage;
  edited_message?: TelegramUpdateMessage;
}

interface CreateTelegramServiceOptions {
  botToken: string;
  webhookSecret: string;
  maxMessageLength?: number;
  maxPayloadBytes?: number;
  now?: Date;
  handleParsedMessageForUser(userId: string, parsed: TelegramParsedMessage): Promise<string>;
  getLinkedAccountByTelegramUserId(telegramUserId: string): Promise<{ userId: string; telegramUserId: string; } | null>;
  linkTelegramUser(input: { rawToken: string; telegramUserId: string; telegramChatId: string; }): Promise<{ userId: string }>;
  sendMessage(input: { chatId: number; text: string; botToken: string }): Promise<void>;
}

interface TelegramRequestInput {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export function createTelegramService(options: CreateTelegramServiceOptions) {
  const maxMessageLength = options.maxMessageLength ?? 500;
  const maxPayloadBytes = options.maxPayloadBytes ?? 32_768;

  return {
    handleRequest: async (request: TelegramRequestInput) => {
      if (request.method !== 'POST') {
        return { statusCode: 405, payload: { ok: false } };
      }

      const contentLength = Number(getHeaderValue(request.headers, 'content-length') ?? 0);
      if (Number.isFinite(contentLength) && contentLength > maxPayloadBytes) {
        return { statusCode: 413, payload: { ok: false } };
      }

      const secret = getHeaderValue(request.headers, 'x-telegram-bot-api-secret-token');
      if (!secret || secret !== options.webhookSecret) {
        return { statusCode: 401, payload: { ok: false } };
      }

      const update = normalizeUpdate(request.body);
      const message = update.message ?? update.edited_message;
      if (!message?.text || !message.chat?.id) {
        return { statusCode: 200, payload: { ok: true } };
      }

      const fromId = String(message.from?.id ?? '');
      if (!fromId) return { statusCode: 200, payload: { ok: true } };
      const chatId = String(message.chat.id);

      const sanitizedText = sanitizeTelegramText(message.text);
      if (!sanitizedText) {
        return { statusCode: 200, payload: { ok: true } };
      }

      if (sanitizedText.length > maxMessageLength) {
        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: 'Mensagem muito longa. Envie uma mensagem menor.',
        });
        return { statusCode: 200, payload: { ok: true } };
      }

      let isAwaitingLinkToken = false;

      try {
        const command = matchSupportedCommand(sanitizedText);
        if (command === 'start') {
          const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
          await options.sendMessage({
            chatId: message.chat.id,
            botToken: options.botToken,
            text: linkedAccount ? getStartMessage() : getLinkPromptMessage(),
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        if (command === 'help') {
          const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
          await options.sendMessage({
            chatId: message.chat.id,
            botToken: options.botToken,
            text: linkedAccount ? getHelpMessage() : getLinkHelpMessage(),
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
        if (!linkedAccount) {
          isAwaitingLinkToken = true;
          await options.linkTelegramUser({
            rawToken: sanitizedText,
            telegramUserId: fromId,
            telegramChatId: chatId,
          });

          await options.sendMessage({
            chatId: message.chat.id,
            botToken: options.botToken,
            text: getLinkedSuccessMessage(),
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        const parsed = parseTelegramMessage(sanitizedText, { now: options.now });
        const responseText = await options.handleParsedMessageForUser(linkedAccount.userId, parsed);

        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: responseText,
        });

        return { statusCode: 200, payload: { ok: true } };
      } catch {
        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: isAwaitingLinkToken
            ? getInvalidTokenMessage()
            : 'Não foi possível processar sua mensagem com segurança agora.',
        });
        return { statusCode: 200, payload: { ok: true } };
      }
    },
  };
}

function normalizeUpdate(body: unknown): TelegramUpdate {
  if (!body || typeof body !== 'object') return {};
  return body as TelegramUpdate;
}

function getHeaderValue(headers: Record<string, string | string[] | undefined>, name: string) {
  const direct = headers[name];
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) return direct[0];

  const match = Object.entries(headers).find(([headerName]) => headerName.toLowerCase() === name.toLowerCase());
  if (!match) return undefined;

  const [, value] = match;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function matchSupportedCommand(text: string) {
  const normalized = text.toLowerCase();
  if (/^\/start(?:@\w+)?$/.test(normalized)) return 'start';
  if (/^\/help(?:@\w+)?$/.test(normalized)) return 'help';
  return null;
}

function getStartMessage() {
  return [
    'Bot do controle financeiro ativo.',
    '',
    'Exemplos:',
    'gastei 25 no almoço',
    'recebi 6500 salário',
    'resumo do mês',
  ].join('\n');
}

function getHelpMessage() {
  return [
    'Exemplos de uso:',
    '',
    'gastei 25 no almoço',
    'paguei 100 internet',
    'comprei 32,90 ifood',
    'recebi 6500 salário',
    'resumo do mês',
  ].join('\n');
}

function getLinkPromptMessage() {
  return [
    'Antes de usar o bot, conecte sua conta.',
    '',
    'Qual o token de acesso?',
  ].join('\n');
}

function getLinkHelpMessage() {
  return [
    'Para conectar sua conta, envie o token de acesso gerado em Configurações.',
    '',
    'Depois da conexão, você poderá enviar:',
    'gastei 25 no almoço',
    'recebi 6500 salário',
    'resumo do mês',
  ].join('\n');
}

function getLinkedSuccessMessage() {
  return [
    'Telegram conectado com sucesso à sua conta.',
    '',
    'Agora você já pode enviar:',
    'gastei 25 no almoço',
    'recebi 6500 salário',
    'resumo do mês',
  ].join('\n');
}

function getInvalidTokenMessage() {
  return [
    'Token de acesso inválido.',
    '',
    'Confira o token gerado em Configurações e tente novamente.',
  ].join('\n');
}
