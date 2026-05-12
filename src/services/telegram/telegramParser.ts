export type TelegramIntent =
  | 'create_expense'
  | 'create_income'
  | 'create_investment_deposit'
  | 'get_monthly_summary'
  | 'list_expenses'
  | 'list_incomes'
  | 'get_expense_distribution'
  | 'list_fixed_bills'
  | 'list_open_invoices'
  | 'get_card_invoice'
  | 'list_cards'
  | 'list_investments'
  | 'get_investment_summary'
  | 'list_goals'
  | 'get_balance'
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

const currencyAmount = String.raw`(?:r\$\s*)?([0-9][0-9.,]*)`;
const expensePatterns = [
  new RegExp(String.raw`^(?:gastei|paguei|comprei|desembolsei|torrei|foi|saiu)\s+${currencyAmount}\s+(?:com|no|na|em|de|do|da)?\s*(.+)$`, 'i'),
  new RegExp(String.raw`^(.+?)\s+(?:custou|deu|ficou|foi)\s+${currencyAmount}$`, 'i'),
] as const;
const incomePatterns = [
  new RegExp(String.raw`^(?:recebi|ganhei|entrou|caiu|depositaram)\s+${currencyAmount}\s+(.+)$`, 'i'),
] as const;
const investmentDepositPattern = new RegExp(String.raw`^(?:adicione|adicionar|aporte|aportar|investi|guardei|guardar|coloquei|colocar|botei|botar)\s+${currencyAmount}\s+(?:no|na|em|para|pro|pra)?\s*(?:investimento|caixinha)?\s*(.+)$`, 'i');
const summaryPattern = /^(?:resumo|resumao|resumão|balanço|balanco)(?:\s+do)?\s+m[eê]s$|^como\s+(?:esta|está|ta|tá)\s+(?:meu|o)\s+m[eê]s$/i;

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

  const expenseMatch = matchExpense(sanitized);
  if (expenseMatch) {
    const amount = parseTelegramAmount(expenseMatch.amount);
    const description = normalizeDescription(expenseMatch.description);
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

  const incomeMatch = matchIncome(sanitized);
  if (incomeMatch) {
    const amount = parseTelegramAmount(incomeMatch.amount);
    const description = normalizeDescription(incomeMatch.description);
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

  const investmentMatch = sanitized.match(investmentDepositPattern);
  if (investmentMatch) {
    const amount = parseTelegramAmount(investmentMatch[1]);
    const description = normalizeInvestmentName(investmentMatch[2]);
    if (!amount || !description) {
      return buildUnknown(date);
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

  const consultive = parseConsultiveIntent(sanitized, date);
  if (consultive) return consultive;

  return buildUnknown(date);
}

function matchExpense(text: string) {
  const leadingVerbMatch = text.match(expensePatterns[0]);
  if (leadingVerbMatch) {
    return {
      amount: leadingVerbMatch[1],
      description: leadingVerbMatch[2],
    };
  }

  const trailingAmountMatch = text.match(expensePatterns[1]);
  if (trailingAmountMatch) {
    return {
      amount: trailingAmountMatch[2],
      description: trailingAmountMatch[1],
    };
  }

  return null;
}

function matchIncome(text: string) {
  for (const pattern of incomePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        amount: match[1],
        description: match[2],
      };
    }
  }

  return null;
}

function parseConsultiveIntent(text: string, date: string): TelegramParsedMessage | null {
  const normalized = normalizeIntentText(text);
  const specificCard = extractCardInvoiceTarget(text);
  if (specificCard) {
    return buildConsultive('get_card_invoice', specificCard, date);
  }

  const investmentTarget = extractInvestmentTarget(text);
  if (investmentTarget) {
    return buildConsultive('get_investment_summary', investmentTarget, date);
  }

  if (/(quanto sobrou|sobra|saldo do mes|saldo do mês|posso gastar|quanto posso gastar)/.test(normalized)) {
    return buildConsultive('get_balance', 'Sobra do mês', date);
  }

  if (/(distribuicao|distribuição|categorias|onde.*gast|gastando mais|gasto mais|maiores gastos|top gastos|ranking gastos)/.test(normalized)) {
    return buildConsultive('get_expense_distribution', 'Distribuição de gastos', date);
  }

  if (/(contas fixas|fixas|boletos recorrentes|contas recorrentes)/.test(normalized)) {
    return buildConsultive('list_fixed_bills', 'Contas fixas', date);
  }

  if (/(faturas abertas|faturas em aberto|faturas do mes|faturas do mês)/.test(normalized)) {
    return buildConsultive('list_open_invoices', 'Faturas abertas', date);
  }

  if (/(cartoes|cartões|meus cartoes|meus cartões)/.test(normalized)) {
    return buildConsultive('list_cards', 'Cartões', date);
  }

  if (/(investimentos|caixinhas|patrimonio|patrimônio|saldo guardado)/.test(normalized)) {
    return buildConsultive('list_investments', 'Investimentos', date);
  }

  if (/(metas|objetivos)/.test(normalized)) {
    return buildConsultive('list_goals', 'Metas', date);
  }

  if (/(entradas|receitas|ganhos|recebimentos)/.test(normalized) && /(lista|listar|mostra|mostrar|ver|quais|quanto)/.test(normalized)) {
    return buildConsultive('list_incomes', 'Entradas do mês', date);
  }

  if (/(gastos|despesas|saidas|saídas|compras)/.test(normalized) && /(lista|listar|mostra|mostrar|ver|quais|quanto)/.test(normalized)) {
    return buildConsultive('list_expenses', 'Gastos do mês', date);
  }

  return null;
}

function buildConsultive(intent: TelegramIntent, description: string, date: string): TelegramParsedMessage {
  return {
    intent,
    data: {
      description,
      date,
    },
  };
}

function extractCardInvoiceTarget(text: string) {
  const patterns = [
    /^ver\s+fatura\s+(?:do|da|de)?\s*(.+)$/i,
    /^fatura\s+(?:do|da|de)?\s*(.+)$/i,
    /^(?:quanto|total).*(?:cart[aã]o|fatura)\s+(?:do|da|de)?\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const target = match?.[1] ? normalizeDescription(match[1]) : '';
    if (target && !/^(abertas|em aberto|do mes|do mês)$/i.test(target)) return target;
  }

  return null;
}

function extractInvestmentTarget(text: string) {
  const patterns = [
    /^quanto\s+(?:tenho|guardei|juntei)\s+(?:no|na|em)?\s*(?:investimento|caixinha)\s+(.+)$/i,
    /^(?:ver|mostrar|consulta|consultar)\s+(?:investimento|caixinha)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const target = match?.[1] ? normalizeInvestmentName(match[1]) : '';
    if (target) return target;
  }

  return null;
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

function normalizeInvestmentName(value: string) {
  return sanitizeTelegramText(value)
    .replace(/^(no|na|em|de|do|da)\s+/i, '')
    .replace(/^(investimento|caixinha)\s+/i, '')
    .trim();
}

function normalizeIntentText(value: string) {
  return sanitizeTelegramText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[?!.,;:]/g, '')
    .trim();
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
