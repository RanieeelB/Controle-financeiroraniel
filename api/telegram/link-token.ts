import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { createTelegramLinkTokenService, resolveSessionUserFromHeaders } from '../_shared/telegramServer.js';

type ServerlessRequest = IncomingMessage & {
  method?: string;
  headers: IncomingHttpHeaders;
};

type ServerlessResponse = ServerResponse<IncomingMessage>;

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false });
    }

    const user = await resolveSessionUserFromHeaders(toHeaderRecord(req.headers));
    const service = createTelegramLinkTokenService();
    const generated = await service.generateTokenForUser(user.id);

    return sendJson(res, 200, {
      ok: true,
      token: generated.rawToken,
      generatedAt: generated.generatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível gerar o token do Telegram.';
    const statusCode = /autenticado|Sessão inválida/i.test(message) ? 401 : /já foi gerado|já vinculada/i.test(message) ? 409 : 500;
    return sendJson(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}

function toHeaderRecord(headers: IncomingHttpHeaders): Record<string, string | string[] | undefined> {
  return Object.fromEntries(Object.entries(headers)) as Record<string, string | string[] | undefined>;
}

function sendJson(res: ServerlessResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
