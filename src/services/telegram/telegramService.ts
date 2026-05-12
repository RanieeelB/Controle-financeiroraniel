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

export interface TelegramCallbackQuery {
  id?: string;
  data?: string;
  message?: TelegramUpdateMessage;
  from?: {
    id?: number;
  };
}

export interface TelegramUpdate {
  update_id?: number;
  message?: TelegramUpdateMessage;
  edited_message?: TelegramUpdateMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

interface CreateTelegramServiceOptions {
  botToken: string;
  webhookSecret: string;
  maxMessageLength?: number;
  maxPayloadBytes?: number;
  now?: Date;
  handleParsedMessageForUser(userId: string, parsed: TelegramParsedMessage): Promise<string>;
  parseMessageWithAi?(text: string, options: { now?: Date }): Promise<TelegramParsedMessage | null>;
  getLinkedAccountByTelegramUserId(telegramUserId: string): Promise<{ userId: string; telegramUserId: string; } | null>;
  linkTelegramUser(input: { rawToken: string; telegramUserId: string; telegramChatId: string; }): Promise<{ userId: string }>;
  sendMessage(input: { chatId: number; text: string; botToken: string; replyMarkup?: TelegramReplyMarkup }): Promise<void>;
  answerCallbackQuery?(input: { callbackQueryId: string; botToken: string; text?: string }): Promise<void>;
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
      if (update.callback_query) {
        return handleCallbackQuery(update.callback_query, options);
      }

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
            replyMarkup: linkedAccount ? getMainMenuKeyboard() : getLinkKeyboard(),
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        if (command === 'help') {
          const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
          await options.sendMessage({
            chatId: message.chat.id,
            botToken: options.botToken,
            text: linkedAccount ? getHelpMessage() : getLinkHelpMessage(),
            replyMarkup: linkedAccount ? getMainMenuKeyboard() : getLinkKeyboard(),
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
            replyMarkup: getMainMenuKeyboard(),
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        let parsed = parseTelegramMessage(sanitizedText, { now: options.now });
        if (parsed.intent === 'unknown' && options.parseMessageWithAi) {
          parsed = await options.parseMessageWithAi(sanitizedText, { now: options.now }) ?? parsed;
        }

        const responseText = await options.handleParsedMessageForUser(linkedAccount.userId, parsed);

        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: responseText,
          replyMarkup: getPostActionKeyboard(parsed.intent),
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

async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery, options: CreateTelegramServiceOptions) {
  const callbackQueryId = callbackQuery.id;
  const chatId = callbackQuery.message?.chat?.id;
  const fromId = String(callbackQuery.from?.id ?? '');

  if (!callbackQueryId || !chatId || !fromId) {
    return { statusCode: 200, payload: { ok: true } };
  }

  await options.answerCallbackQuery?.({
    callbackQueryId,
    botToken: options.botToken,
  });

  const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
  if (!linkedAccount) {
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getLinkPromptMessage(),
      replyMarkup: getLinkKeyboard(),
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  if (callbackQuery.data === 'summary:month') {
    const parsed = parseTelegramMessage('resumo do mês', { now: options.now });
    const responseText = await options.handleParsedMessageForUser(linkedAccount.userId, parsed);
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: responseText,
      replyMarkup: getMainMenuKeyboard(),
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  if (callbackQuery.data === 'help:examples') {
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getHelpMessage(),
      replyMarkup: getMainMenuKeyboard(),
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  await options.sendMessage({
    chatId,
    botToken: options.botToken,
    text: getStartMessage(),
    replyMarkup: getMainMenuKeyboard(),
  });

  return { statusCode: 200, payload: { ok: true } };
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
    'Você pode mandar uma mensagem normal ou usar os botões abaixo.',
    '',
    'Exemplos:',
    'gastei 25 no almoço',
    'paguei 100 internet',
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

function getMainMenuKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Resumo do mês', callback_data: 'summary:month' },
        { text: 'Ajuda', callback_data: 'help:examples' },
      ],
    ],
  };
}

function getLinkKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Ajuda', callback_data: 'help:examples' }],
    ],
  };
}

function getPostActionKeyboard(intent: TelegramParsedMessage['intent']): TelegramReplyMarkup {
  if (intent === 'create_expense' || intent === 'create_income') {
    return {
      inline_keyboard: [
        [
          { text: 'Ver resumo', callback_data: 'summary:month' },
          { text: 'Ajuda', callback_data: 'help:examples' },
        ],
      ],
    };
  }

  return getMainMenuKeyboard();
}

function getInvalidTokenMessage() {
  return [
    'Token de acesso inválido.',
    '',
    'Confira o token gerado em Configurações e tente novamente.',
  ].join('\n');
}
