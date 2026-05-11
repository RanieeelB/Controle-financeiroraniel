import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import {
  createSupabaseAdminClient,
  createTelegramWebhookRepository,
  getTelegramWebhookEnv,
} from '../_shared/telegramServer';
import { createTelegramActions } from '../../src/services/telegram/telegramActions';
import { createTelegramService } from '../../src/services/telegram/telegramService';
import { createTelegramLinkService } from '../../src/services/telegram/telegramLinkService';

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
    const linkService = createTelegramLinkService({ repo });

    const telegramActions = createTelegramActions({
      repo,
    });

    const telegramService = createTelegramService({
      botToken: env.telegramBotToken,
      webhookSecret: env.telegramWebhookSecret,
      maxPayloadBytes: MAX_PAYLOAD_BYTES,
      handleParsedMessageForUser: telegramActions.handleParsedMessageForUser,
      getLinkedAccountByTelegramUserId: async (telegramUserId) => {
        const linked = await repo.getLinkedConnectionByTelegramUserId(telegramUserId);
        return linked ? { userId: linked.user_id, telegramUserId: linked.telegram_user_id ?? telegramUserId } : null;
      },
      linkTelegramUser: async (input) => linkService.linkTelegramUser(input),
      sendMessage: async ({ chatId, text, botToken }) => {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        });

        if (!telegramResponse.ok) {
          throw new Error('Falha ao responder mensagem do Telegram.');
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
    sendJson(res, statusCode, { ok: false });
  }
}

class PayloadTooLargeError extends Error {}
class InvalidJsonError extends Error {}

async function readJsonBody(req: ServerlessRequest, maxBytes: number) {
  if (req.body !== undefined) {
    return normalizeBody(req.body, maxBytes);
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    totalBytes += bufferChunk.byteLength;
    if (totalBytes > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }
    chunks.push(bufferChunk);
  }

  if (chunks.length === 0) return {};

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return normalizeBody(rawBody, maxBytes);
}

function normalizeBody(body: unknown, maxBytes: number) {
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }

    try {
      return body.trim() ? JSON.parse(body) : {};
    } catch {
      throw new InvalidJsonError('JSON inválido.');
    }
  }

  if (Buffer.isBuffer(body)) {
    if (body.byteLength > maxBytes) {
      throw new PayloadTooLargeError('Payload maior que o permitido.');
    }
    return normalizeBody(body.toString('utf8'), maxBytes);
  }

  if (!body || typeof body !== 'object') {
    return {};
  }

  return body;
}

function toHeaderRecord(headers: IncomingHttpHeaders) {
  return Object.fromEntries(Object.entries(headers));
}

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
