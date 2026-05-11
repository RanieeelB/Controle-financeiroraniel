export type TelegramIntent =
  | 'create_expense'
  | 'create_income'
  | 'get_monthly_summary'
  | 'unknown';

export interface TelegramParsedData {
  description: string;
  amount?: number;
  category?: string;
  date: string;
  status?: string;
}

export interface TelegramParsedMessage {
  intent: TelegramIntent;
  data: TelegramParsedData;
}

interface ParseTelegramMessageOptions {
  now?: Date;
  timeZone?: string;
}

const expensePattern = /^(gastei|paguei|comprei)\s+([0-9][0-9.,]*)\s+(?:no|na|em|de|do|da)?\s*(.+)$/i;
const incomePattern = /^recebi\s+([0-9][0-9.,]*)\s+(.+)$/i;
const summaryPattern = /^resumo\s+do\s+m[eê]s$/i;

export function sanitizeTelegramText(text: string) {
  return [...text]
    .map(char => {
      const code = char.charCodeAt(0);
      return (code <= 31 || (code >= 127 && code <= 159)) ? ' ' : char;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTelegramMessage(text: string, options: ParseTelegramMessageOptions = {}): TelegramParsedMessage {
  const sanitized = sanitizeTelegramText(text);
  const date = getDateKey(options.now ?? new Date(), options.timeZone);

  if (!sanitized) {
    return buildUnknown(date);
  }

  if (summaryPattern.test(sanitized)) {
    return {
      intent: 'get_monthly_summary',
      data: {
        description: 'Resumo do mês',
        date,
      },
    };
  }

  const expenseMatch = sanitized.match(expensePattern);
  if (expenseMatch) {
    const amount = parseTelegramAmount(expenseMatch[2]);
    const description = normalizeDescription(expenseMatch[3]);
    if (!amount || !description) {
      return buildUnknown(date);
    }

    return {
      intent: 'create_expense',
      data: {
        description,
        amount,
        category: inferTelegramCategory(description, 'gasto'),
        date,
        status: 'pago',
      },
    };
  }

  const incomeMatch = sanitized.match(incomePattern);
  if (incomeMatch) {
    const amount = parseTelegramAmount(incomeMatch[1]);
    const description = normalizeDescription(incomeMatch[2]);
    if (!amount || !description) {
      return buildUnknown(date);
    }

    return {
      intent: 'create_income',
      data: {
        description,
        amount,
        category: inferTelegramCategory(description, 'entrada'),
        date,
        status: 'recebido',
      },
    };
  }

  return buildUnknown(date);
}

export function inferTelegramCategory(description: string, type: 'entrada' | 'gasto') {
  const normalized = description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (type === 'entrada') {
    if (normalized.includes('salario')) return 'Salário';
    return 'Outros recebimentos';
  }

  if (/(ifood|almoco|lanche|jantar|comida)/.test(normalized)) return 'Alimentação';
  if (/(uber|99|gasolina|combustivel)/.test(normalized)) return 'Transporte';
  if (/(mercado|supermercado)/.test(normalized)) return 'Mercado';
  if (/(farmacia|remedio|creatina)/.test(normalized)) return 'Saúde';
  if (/(internet|energia|agua|aluguel)/.test(normalized)) return 'Contas';
  return 'Outros';
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

function normalizeDescription(value: string) {
  return sanitizeTelegramText(value).replace(/^(no|na|em|de|do|da)\s+/i, '').trim();
}

function parseTelegramAmount(value: string) {
  const normalized = value.replace(/\s/g, '');
  if (!normalized) return null;

  let serialized = normalized;

  if (serialized.includes(',') && serialized.includes('.')) {
    serialized = serialized.replace(/\./g, '').replace(',', '.');
  } else if (serialized.includes(',')) {
    serialized = serialized.replace(',', '.');
  } else if (serialized.split('.').length > 2) {
    serialized = serialized.replace(/\./g, '');
  } else if (serialized.includes('.')) {
    const [, decimals = ''] = serialized.split('.');
    if (decimals.length === 3) {
      serialized = serialized.replace(/\./g, '');
    }
  }

  const amount = Number(serialized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round((amount + Number.EPSILON) * 100) / 100;
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
