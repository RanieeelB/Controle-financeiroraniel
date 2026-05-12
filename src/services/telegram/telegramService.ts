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

export type TelegramParseMode = 'HTML';

interface CreateTelegramServiceOptions {
  botToken: string;
  webhookSecret: string;
  maxMessageLength?: number;
  maxPayloadBytes?: number;
  now?: Date;
  handleParsedMessageForUser(userId: string, parsed: TelegramParsedMessage): Promise<string>;
  getLinkedAccountByTelegramUserId(telegramUserId: string): Promise<{ userId: string; telegramUserId: string; } | null>;
  linkTelegramUser(input: { rawToken: string; telegramUserId: string; telegramChatId: string; }): Promise<{ userId: string }>;
  sendMessage(input: { chatId: number; text: string; botToken: string; replyMarkup?: TelegramReplyMarkup; parseMode?: TelegramParseMode }): Promise<void>;
  answerCallbackQuery?(input: { callbackQueryId: string; botToken: string; text?: string }): Promise<void>;
  deleteMessage?(input: { chatId: number; messageId: number; botToken: string }): Promise<void>;
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
          text: '⚠️ <b>Mensagem muito longa.</b>\n\nEnvie uma mensagem menor.',
          parseMode: 'HTML',
        });
        return { statusCode: 200, payload: { ok: true } };
      }

      let isAwaitingLinkToken = false;

      try {
        await safelyDeleteMessage(options, message.chat.id, message.message_id);

        const command = matchSupportedCommand(sanitizedText);
        if (command === 'start') {
          const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
          await options.sendMessage({
            chatId: message.chat.id,
            botToken: options.botToken,
            text: linkedAccount ? getStartMessage() : getOnboardingStartMessage(),
            replyMarkup: linkedAccount ? getMainMenuKeyboard() : getOnboardingKeyboard(),
            parseMode: 'HTML',
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
            parseMode: 'HTML',
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
            parseMode: 'HTML',
          });
          return { statusCode: 200, payload: { ok: true } };
        }

        const parsed = parseTelegramMessage(sanitizedText, { now: options.now });
        const responseText = await options.handleParsedMessageForUser(linkedAccount.userId, parsed);

        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: responseText,
          replyMarkup: getPostActionKeyboard(parsed.intent),
          parseMode: 'HTML',
        });

        return { statusCode: 200, payload: { ok: true } };
      } catch {
        await options.sendMessage({
          chatId: message.chat.id,
          botToken: options.botToken,
          text: isAwaitingLinkToken
            ? getInvalidTokenMessage()
            : '⚠️ <b>Não foi possível processar sua mensagem com segurança agora.</b>',
          parseMode: 'HTML',
        });
        return { statusCode: 200, payload: { ok: true } };
      }
    },
  };
}

async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery, options: CreateTelegramServiceOptions) {
  const callbackQueryId = callbackQuery.id;
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const fromId = String(callbackQuery.from?.id ?? '');

  if (!callbackQueryId || !chatId || !fromId) {
    return { statusCode: 200, payload: { ok: true } };
  }

  await options.answerCallbackQuery?.({
    callbackQueryId,
    botToken: options.botToken,
  });
  await safelyDeleteMessage(options, chatId, messageId);

  const linkedAccount = await options.getLinkedAccountByTelegramUserId(fromId);
  if (!linkedAccount) {
    if (callbackQuery.data === 'onboarding:has-account') {
      await options.sendMessage({
        chatId,
        botToken: options.botToken,
        text: getLinkPromptMessage(),
        replyMarkup: getLinkKeyboard(),
        parseMode: 'HTML',
      });
      return { statusCode: 200, payload: { ok: true } };
    }

    if (callbackQuery.data === 'onboarding:create-account') {
      await options.sendMessage({
        chatId,
        botToken: options.botToken,
        text: getCreateAccountStepsMessage(),
        replyMarkup: getCreateAccountKeyboard(),
        parseMode: 'HTML',
      });
      return { statusCode: 200, payload: { ok: true } };
    }

    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getOnboardingStartMessage(),
      replyMarkup: getOnboardingKeyboard(),
      parseMode: 'HTML',
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  const callbackMessages: Record<string, string> = {
    'summary:month': 'resumo do mês',
    'list:expenses': 'lista meus gastos',
    'list:incomes': 'listar entradas',
    'list:distribution': 'onde estou gastando mais',
    'list:fixed-bills': 'minhas contas fixas',
    'list:invoices': 'faturas abertas',
    'list:cards': 'quais cartões eu tenho',
    'list:investments': 'meus investimentos',
    'list:goals': 'minhas metas',
    'balance:month': 'quanto sobrou esse mês',
  };
  const callbackMessage = callbackQuery.data ? callbackMessages[callbackQuery.data] : undefined;

  if (callbackMessage) {
    const parsed = parseTelegramMessage(callbackMessage, { now: options.now });
    const responseText = await options.handleParsedMessageForUser(linkedAccount.userId, parsed);
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: responseText,
      replyMarkup: getMainMenuKeyboard(),
      parseMode: 'HTML',
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  if (callbackQuery.data === 'help:examples') {
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getHelpMessage(),
      replyMarkup: getMainMenuKeyboard(),
      parseMode: 'HTML',
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  if (callbackQuery.data === 'guide:expense') {
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getExpenseGuideMessage(),
      replyMarkup: getGuideKeyboard(),
      parseMode: 'HTML',
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  if (callbackQuery.data === 'guide:income') {
    await options.sendMessage({
      chatId,
      botToken: options.botToken,
      text: getIncomeGuideMessage(),
      replyMarkup: getGuideKeyboard(),
      parseMode: 'HTML',
    });
    return { statusCode: 200, payload: { ok: true } };
  }

  await options.sendMessage({
    chatId,
    botToken: options.botToken,
    text: getStartMessage(),
    replyMarkup: getMainMenuKeyboard(),
    parseMode: 'HTML',
  });

  return { statusCode: 200, payload: { ok: true } };
}

async function safelyDeleteMessage(options: CreateTelegramServiceOptions, chatId?: number, messageId?: number) {
  if (!options.deleteMessage || typeof chatId !== 'number' || typeof messageId !== 'number') return;

  try {
    await options.deleteMessage({
      chatId,
      messageId,
      botToken: options.botToken,
    });
  } catch {
    // Telegram can refuse deletions depending on age, chat type, or bot permissions.
  }
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
    '🤖 <b>Bot do controle financeiro ativo</b>',
    '',
    'Me mande uma movimentação, peça uma consulta ou use os botões abaixo.',
    '',
    '✨ <b>Exemplos rápidos</b>',
    '• <code>gastei 25 no almoço</code>',
    '• <code>paguei 100 internet</code>',
    '• <code>recebi 6500 salário</code>',
    '• <code>adicione 500 no investimento ferias</code>',
    '• <code>ver fatura nubank</code>',
    '• <code>onde estou gastando mais</code>',
    '• <code>resumo do mês</code>',
  ].join('\n');
}

function getHelpMessage() {
  return [
    '❓ <b>Como usar</b>',
    '',
    'Você pode escrever de forma simples:',
    '',
    '💸 <b>Gastos</b>',
    '• <code>gastei 25 no almoço</code>',
    '• <code>paguei 100 internet</code>',
    '• <code>comprei 32,90 ifood</code>',
    '',
    '💰 <b>Entradas</b>',
    '• <code>recebi 6500 salário</code>',
    '• <code>entrou 1200 freela</code>',
    '',
    '🏦 <b>Investimentos</b>',
    '• <code>adicione 500 no investimento ferias</code>',
    '• <code>meus investimentos</code>',
    '• <code>quanto tenho na caixinha 13</code>',
    '',
    '📊 <b>Consulta</b>',
    '• <code>resumo do mês</code>',
    '• <code>quanto sobrou esse mês</code>',
    '• <code>lista meus gastos</code>',
    '• <code>onde estou gastando mais</code>',
    '• <code>minhas contas fixas</code>',
    '• <code>faturas abertas</code>',
    '• <code>ver fatura nubank</code>',
    '• <code>minhas metas</code>',
  ].join('\n');
}

function getOnboardingStartMessage() {
  return [
    '👋 <b>Bem-vindo ao Saldo Real</b>',
    '',
    'Você já tem uma conta no site?',
    '',
    'Se já tiver, eu vou pedir seu token de acesso.',
    'Se ainda não tiver, eu te mostro o passo a passo para criar a conta e gerar o token.',
  ].join('\n');
}

function getLinkPromptMessage() {
  return [
    '🔐 <b>Conecte sua conta</b>',
    '',
    'Qual o <b>token de acesso</b> gerado em Configurações?',
  ].join('\n');
}

function getCreateAccountStepsMessage() {
  return [
    '🆕 <b>Criar conta e conectar o Telegram</b>',
    '',
    '1. Acesse:',
    '<a href="https://controle-financeiroraniel.vercel.app/">https://controle-financeiroraniel.vercel.app/</a>',
    '',
    '2. Clique em <b>Criar conta</b>.',
    '',
    '3. Depois de criar sua conta, vá em <b>Configurações</b> e gere seu token do Telegram.',
    '',
    '4. Copie o token gerado e me envie aqui para finalizar a integração.',
  ].join('\n');
}

function getLinkHelpMessage() {
  return [
    '🔐 <b>Primeiro, conecte sua conta</b>',
    '',
    'Envie aqui o token gerado em <b>Configurações</b>.',
    '',
    'Depois da conexão, você poderá enviar:',
    '• <code>gastei 25 no almoço</code>',
    '• <code>recebi 6500 salário</code>',
    '• <code>adicione 500 no investimento ferias</code>',
    '• <code>resumo do mês</code>',
  ].join('\n');
}

function getLinkedSuccessMessage() {
  return [
    '✅ <b>Telegram conectado com sucesso!</b>',
    '',
    'Agora você já pode registrar suas movimentações por mensagem.',
    '',
    '• <code>gastei 25 no almoço</code>',
    '• <code>recebi 6500 salário</code>',
    '• <code>adicione 500 no investimento ferias</code>',
    '• <code>resumo do mês</code>',
  ].join('\n');
}

function getOnboardingKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Já tenho conta', callback_data: 'onboarding:has-account' },
        { text: '🆕 Criar conta', callback_data: 'onboarding:create-account' },
      ],
    ],
  };
}

function getMainMenuKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: '💸 Registrar gasto', callback_data: 'guide:expense' },
        { text: '💰 Registrar entrada', callback_data: 'guide:income' },
      ],
      [
        { text: '📊 Resumo', callback_data: 'summary:month' },
        { text: '🧮 Sobra', callback_data: 'balance:month' },
      ],
      [
        { text: '💳 Faturas', callback_data: 'list:invoices' },
        { text: '💳 Cartões', callback_data: 'list:cards' },
      ],
      [
        { text: '🏦 Investimentos', callback_data: 'list:investments' },
        { text: '🎯 Metas', callback_data: 'list:goals' },
      ],
      [
        { text: '💸 Gastos', callback_data: 'list:expenses' },
        { text: '🧭 Distribuição', callback_data: 'list:distribution' },
      ],
      [
        { text: '🏠 Fixas', callback_data: 'list:fixed-bills' },
        { text: '❓ Ajuda', callback_data: 'help:examples' },
      ],
    ],
  };
}

function getCreateAccountKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [{ text: '✅ Já gerei meu token', callback_data: 'onboarding:has-account' }],
    ],
  };
}

function getLinkKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [{ text: '❓ Ajuda', callback_data: 'help:examples' }],
    ],
  };
}

function getGuideKeyboard(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: '📊 Resumo', callback_data: 'summary:month' },
        { text: '❓ Ajuda', callback_data: 'help:examples' },
      ],
    ],
  };
}

function getPostActionKeyboard(intent: TelegramParsedMessage['intent']): TelegramReplyMarkup {
  if (intent === 'create_expense' || intent === 'create_income') {
    return {
      inline_keyboard: [
        [
          { text: intent === 'create_expense' ? '💸 Novo gasto' : '💰 Nova entrada', callback_data: intent === 'create_expense' ? 'guide:expense' : 'guide:income' },
          { text: '📊 Resumo', callback_data: 'summary:month' },
        ],
      ],
    };
  }

  if (intent === 'create_investment_deposit') {
    return {
      inline_keyboard: [
        [
          { text: '🏦 Investimentos', callback_data: 'list:investments' },
          { text: '📊 Resumo', callback_data: 'summary:month' },
        ],
      ],
    };
  }

  return getMainMenuKeyboard();
}

function getInvalidTokenMessage() {
  return [
    '⚠️ <b>Token de acesso inválido.</b>',
    '',
    'Confira o token gerado em Configurações e tente novamente.',
  ].join('\n');
}

function getExpenseGuideMessage() {
  return [
    '💸 <b>Registrar gasto</b>',
    '',
    'Me envie uma mensagem com valor e descrição.',
    '',
    'Exemplos:',
    '• <code>gastei 25 no almoço</code>',
    '• <code>paguei 100 internet</code>',
    '• <code>comprei 32,90 ifood</code>',
  ].join('\n');
}

function getIncomeGuideMessage() {
  return [
    '💰 <b>Registrar entrada</b>',
    '',
    'Me envie uma mensagem com valor e descrição.',
    '',
    'Exemplos:',
    '• <code>recebi 6500 salário</code>',
    '• <code>recebi 1200 freela</code>',
  ].join('\n');
}
