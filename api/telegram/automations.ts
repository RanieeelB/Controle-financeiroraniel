import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import {
  createSupabaseAdminClient,
  createTelegramWebhookRepository,
  getTelegramWebhookEnv,
} from '../_shared/telegramServer.js';
import { createTelegramAutomationRunner } from '../../src/services/telegram/telegramAutomations.js';

type ServerlessRequest = IncomingMessage & {
  method?: string;
  headers: IncomingHttpHeaders;
};

type ServerlessResponse = ServerResponse<IncomingMessage>;

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      sendJson(res, 405, { ok: false });
      return;
    }

    if (!isAuthorized(req.headers)) {
      sendJson(res, 401, { ok: false });
      return;
    }

    const env = getTelegramWebhookEnv();
    const supabase = createSupabaseAdminClient();
    const repo = createTelegramWebhookRepository(supabase);
    const runner = createTelegramAutomationRunner({
      repo,
      sendMessage: async ({ chatId, text, replyMarkup, parseMode }) => {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
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
          throw new Error('Falha ao enviar automação do Telegram.');
        }
      },
    });

    const result = await runner.runDueAutomations();
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 500, { ok: false, error: message });
  }
}

function isAuthorized(headers: IncomingHttpHeaders) {
  const configuredSecret = process.env.TELEGRAM_AUTOMATION_SECRET?.trim();
  const vercelCronHeader = getHeaderValue(headers, 'x-vercel-cron');
  if (vercelCronHeader === '1') return true;
  if (!configuredSecret) return process.env.NODE_ENV !== 'production';

  const authorization = getHeaderValue(headers, 'authorization');
  return authorization === `Bearer ${configuredSecret}`;
}

function getHeaderValue(headers: IncomingHttpHeaders, name: string) {
  const direct = headers[name];
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) return direct[0];

  const match = Object.entries(headers).find(([headerName]) => headerName.toLowerCase() === name.toLowerCase());
  const value = match?.[1];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
