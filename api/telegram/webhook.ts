import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import {
  createSupabaseAdminClient,
  createTelegramWebhookRepository,
  getTelegramWebhookEnv,
} from '../_shared/telegramServer.js';
import { createTelegramActions } from '../../src/services/telegram/telegramActions.js';
import { createTelegramAdvisor } from '../../src/services/telegram/telegramAdvisor.js';
import { createGeminiTelegramParser } from '../../src/services/telegram/telegramGeminiParser.js';
import { createTelegramService } from '../../src/services/telegram/telegramService.js';
import { createTelegramLinkService } from '../../src/services/telegram/telegramLinkService.js';

type ServerlessRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
  headers: IncomingHttpHeaders;
};

type ServerlessResponse = ServerResponse<IncomingMessage>;

const MAX_PAYLOAD_BYTES = 32_768;

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  try {
    const env = getTelegramWebhookEnv();
    const supabase = createSupabaseAdminClient();
    const repo = createTelegramWebhookRepository(supabase);
    const linkService = createTelegramLinkService({ repo, tokenSecret: env.telegramLinkTokenSecret });

    const telegramActions = createTelegramActions({
      repo,
    });
    const geminiParser = env.geminiApiKey
      ? createGeminiTelegramParser({
          apiKey: env.geminiApiKey,
          model: env.geminiModel,
        })
      : null;
    const telegramAdvisor = env.geminiApiKey
      ? createTelegramAdvisor({
          apiKey: env.geminiApiKey,
          model: env.geminiModel,
          repo,
        })
      : null;

    const telegramService = createTelegramService({
      botToken: env.telegramBotToken,
      webhookSecret: env.telegramWebhookSecret,
      maxPayloadBytes: MAX_PAYLOAD_BYTES,
      handleParsedMessageForUser: telegramActions.handleParsedMessageForUser,
      handleAdvisorMessageForUser: telegramAdvisor
        ? (input) => telegramAdvisor.reply(input)
        : undefined,
      parseMessageWithAi: geminiParser
        ? (text, options) => geminiParser.parse(text, options)
        : undefined,
      getLinkedAccountByTelegramUserId: async (telegramUserId) => {
        const linked = await repo.getLinkedConnectionByTelegramUserId(telegramUserId);
        return linked ? { userId: linked.user_id, telegramUserId: linked.telegram_user_id ?? telegramUserId } : null;
      },
      linkTelegramUser: async (input) => linkService.linkTelegramUser(input),
      sendMessage: async ({ chatId, text, botToken, replyMarkup, parseMode }) => {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: replyMarkup,
            parse_mode: parseMode,
          }),
        });

        if (!telegramResponse.ok) {
          throw new Error('Falha ao responder mensagem do Telegram.');
        }
      },
      answerCallbackQuery: async ({ callbackQueryId, botToken, text }) => {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text,
          }),
        });

        if (!telegramResponse.ok) {
          throw new Error('Falha ao responder callback do Telegram.');
        }
      },
    });

    const body = await readJsonBody(req, MAX_PAYLOAD_BYTES);
    const result = await telegramService.handleRequest({
      method: req.method,
      headers: toHeaderRecord(req.headers),
      body,
    });

    sendJson(res, result.statusCode, result.payload);
  } catch (error) {
    const statusCode = error instanceof PayloadTooLargeError ? 413 : error instanceof InvalidJsonError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, statusCode, { ok: false, error: message });
  }
}

class PayloadTooLargeError extends Error {}
class InvalidJsonError extends Error {}

async function readJsonBody(req: ServerlessRequest, maxBytes: number) {
  if (req.body !== undefined) {
    return normalizeBody(req.body, maxBytes);
  }

  const chunks: string[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const textChunk = typeof chunk === 'string'
      ? chunk
      : chunk instanceof Uint8Array
        ? Buffer.from(chunk).toString('utf-8')
        : String(chunk);
    totalBytes += getUtf8ByteLength(textChunk);
    if (totalBytes > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }
    chunks.push(textChunk);
  }

  if (chunks.length === 0) return {};

  const rawBody = chunks.join('');
  return normalizeBody(rawBody, maxBytes);
}

function normalizeBody(body: unknown, maxBytes: number) {
  if (typeof body === 'string') {
    if (getUtf8ByteLength(body) > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }

    try {
      return body.trim() ? JSON.parse(body) : {};
    } catch {
      throw new InvalidJsonError('JSON inválido.');
    }
  }

  if (body instanceof Uint8Array) {
    if (body.byteLength > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }
    return normalizeBody(Buffer.from(body).toString('utf-8'), maxBytes);
  }

  if (!body || typeof body !== 'object') {
    return {};
  }

  return body;
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function toHeaderRecord(headers: IncomingHttpHeaders): Record<string, string | string[] | undefined> {
  return Object.fromEntries(Object.entries(headers)) as Record<string, string | string[] | undefined>;
}

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
