import { GoogleGenAI } from '@google/genai';
import { inferTelegramCategory, sanitizeTelegramText } from './telegramParser.js';
import type { TelegramParsedMessage } from './telegramParser.js';

interface GenerateContentClient {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config?: {
        responseMimeType?: string;
        temperature?: number;
      };
    }): Promise<{ text?: string | (() => string) }>;
  };
}

interface CreateGeminiTelegramParserOptions {
  apiKey: string;
  model?: string;
  client?: GenerateContentClient;
}

interface ParseOptions {
  now?: Date;
  timeZone?: string;
}

type GeminiIntent = TelegramParsedMessage['intent'];

interface GeminiParsedJson {
  intent?: GeminiIntent;
  description?: unknown;
  amount?: unknown;
  category?: unknown;
  date?: unknown;
  status?: unknown;
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export function createGeminiTelegramParser(options: CreateGeminiTelegramParserOptions) {
  const client = options.client ?? new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model?.trim() || DEFAULT_GEMINI_MODEL;

  return {
    parse: async (text: string, parseOptions: ParseOptions = {}): Promise<TelegramParsedMessage> => {
      const date = getDateKey(parseOptions.now ?? new Date(), parseOptions.timeZone);

      try {
        const response = await client.models.generateContent({
          model,
          contents: buildPrompt(text, date),
          config: {
            responseMimeType: 'application/json',
            temperature: 0,
          },
        });

        return normalizeGeminiResponse(readResponseText(response), date);
      } catch {
        return buildUnknown(date);
      }
    },
  };
}

function buildPrompt(text: string, date: string) {
  return [
    'Você interpreta mensagens de um usuário brasileiro para um app de controle financeiro.',
    'Retorne somente JSON válido, sem markdown.',
    '',
    'Schema:',
    '{ "intent": "create_expense" | "create_income" | "get_monthly_summary" | "unknown", "description": string, "amount": number | null, "category": string | null, "date": "YYYY-MM-DD", "status": "pago" | "recebido" | null }',
    '',
    'Regras:',
    `Use ${date} como data atual quando a data não estiver clara.`,
    'Use create_expense para gastos pagos e create_income para entradas recebidas.',
    'Use get_monthly_summary para pedidos de resumo mensal.',
    'Se não houver valor claro em dinheiro para gasto/entrada, use unknown.',
    'Não invente valor, descrição nem data.',
    'Categorias preferidas: Alimentação, Transporte, Mercado, Saúde, Contas, Salário, Outros recebimentos, Outros.',
    '',
    `Mensagem: ${sanitizeTelegramText(text)}`,
  ].join('\n');
}

function readResponseText(response: { text?: string | (() => string) }) {
  if (typeof response.text === 'function') return response.text();
  return response.text ?? '';
}

function normalizeGeminiResponse(rawText: string, fallbackDate: string): TelegramParsedMessage {
  const parsed = parseJson(rawText);
  if (!parsed) return buildUnknown(fallbackDate);

  if (parsed.intent === 'get_monthly_summary') {
    return {
      intent: 'get_monthly_summary',
      data: {
        description: 'Resumo do mês',
        date: normalizeDate(parsed.date, fallbackDate),
      },
    };
  }

  if (parsed.intent === 'create_investment_deposit') {
    const description = typeof parsed.description === 'string'
      ? sanitizeTelegramText(parsed.description)
      : '';
    const amount = normalizeAmount(parsed.amount);
    const date = normalizeDate(parsed.date, fallbackDate);

    if (!description || !amount || !date) {
      return buildUnknown(fallbackDate);
    }

    return {
      intent: 'create_investment_deposit',
      data: {
        description,
        amount,
        date,
        status: 'pago',
      },
    };
  }

  if (parsed.intent !== 'create_expense' && parsed.intent !== 'create_income') {
    return buildUnknown(fallbackDate);
  }

  const description = typeof parsed.description === 'string'
    ? sanitizeTelegramText(parsed.description)
    : '';
  const amount = normalizeAmount(parsed.amount);
  const date = normalizeDate(parsed.date, fallbackDate);
  const expectedStatus = parsed.intent === 'create_income' ? 'recebido' : 'pago';

  if (!description || !amount || !date) {
    return buildUnknown(fallbackDate);
  }

  const type = parsed.intent === 'create_income' ? 'entrada' : 'gasto';
  const category = typeof parsed.category === 'string' && sanitizeTelegramText(parsed.category)
    ? sanitizeTelegramText(parsed.category)
    : inferTelegramCategory(description, type);

  return {
    intent: parsed.intent,
    data: {
      description,
      amount,
      category,
      date,
      status: expectedStatus,
    },
  };
}

function parseJson(rawText: string): GeminiParsedJson | null {
  const normalized = rawText
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(normalized);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as GeminiParsedJson;
  } catch {
    return null;
  }
}

function normalizeAmount(value: unknown) {
  const amount = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.replace(/\./g, '').replace(',', '.'))
      : NaN;

  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function normalizeDate(value: unknown, fallbackDate: string) {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : fallbackDate;

  if (Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return fallbackDate;
  return date;
}

function buildUnknown(date: string): TelegramParsedMessage {
  return {
    intent: 'unknown',
    data: {
      description: 'Mensagem não reconhecida',
      date,
    },
  };
}

function getDateKey(date: Date, timeZone = 'America/Fortaleza') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}
