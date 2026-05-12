import { buildMonthRange } from '../../lib/monthSelection.js';
import { defaultCategories } from '../../lib/defaultCategories.js';
import {
  buildInvestmentDepositTransactionPayload,
  buildLinkedRecordNote,
  buildTransactionPayload,
  getInvestmentTotalsAfterDeposit,
  roundCurrency,
} from '../../lib/financialPayloads.js';
import { calculateSummaryCards } from '../../lib/financialPlanning.js';
import { resolveDynamicFixedBills } from '../../lib/fixedBillPayments.js';
import type { Category, FixedBill, Investment, Transaction } from '../../types/financial.js';
import type { TelegramParsedMessage } from './telegramParser.js';

type TransactionType = Transaction['type'];

interface TelegramCategoryRecord {
  id: string;
  user_id: string | null;
  name: string;
  type: Category['type'];
}

interface TelegramInvoiceItemRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface TelegramTransactionRecord {
  id: string;
  type: Transaction['type'];
  amount: number;
  status: Transaction['status'];
  notes: string | null;
  description?: string;
  date?: string;
  payment_method?: Transaction['payment_method'];
}

export interface TelegramActionsRepository {
  findCategoryByNameOrAliases(input: {
    userId: string;
    type: TransactionType;
    names: string[];
  }): Promise<TelegramCategoryRecord | null>;
  createCategory(input: {
    userId: string;
    name: string;
    type: Category['type'];
    color: string;
    icon: string;
  }): Promise<TelegramCategoryRecord>;
  insertTransaction(input: {
    userId: string;
    type: Transaction['type'];
    description: string;
    amount: number;
    date: string;
    status: Transaction['status'];
    paymentMethod: Transaction['payment_method'];
    categoryId: string | null;
    notes: string | null;
  }): Promise<{ id: string }>;
  listMonthTransactions(input: { userId: string; startDate: string; endDate: string }): Promise<TelegramTransactionRecord[]>;
  listMonthInvoiceItems(input: { userId: string; startDate: string; endDate: string }): Promise<TelegramInvoiceItemRecord[]>;
  listFixedBills(userId: string): Promise<FixedBill[]>;
  listInvestments(userId: string): Promise<Investment[]>;
  insertInvestmentDeposit(input: {
    userId: string;
    investmentId: string;
    amount: number;
    date: string;
    notes: string | null;
  }): Promise<{ id: string | null }>;
  updateInvestmentTotals(input: {
    investmentId: string;
    amountInvested: number;
    currentValue: number;
    returnPercentage: number;
  }): Promise<void>;
}

interface CreateTelegramActionsOptions {
  now?: Date;
  timeZone?: string;
  repo: TelegramActionsRepository;
}

interface CategoryBlueprint {
  label: string;
  aliases: string[];
  icon: string;
  color: string;
  type: Category['type'];
}

const categoryBlueprints: Record<string, CategoryBlueprint> = {
  'Alimentação': {
    label: 'Alimentação',
    aliases: ['Alimentação', 'Alimentacao', 'iFood'],
    icon: 'utensils',
    color: '#ffb4ab',
    type: 'gasto',
  },
  Transporte: {
    label: 'Transporte',
    aliases: ['Transporte'],
    icon: 'bus',
    color: '#ffba79',
    type: 'gasto',
  },
  Mercado: {
    label: 'Mercado',
    aliases: ['Mercado'],
    icon: 'shopping-cart',
    color: '#75ff9e',
    type: 'gasto',
  },
  'Saúde': {
    label: 'Saúde',
    aliases: ['Saúde', 'Saude'],
    icon: 'heart-pulse',
    color: '#ffdad6',
    type: 'gasto',
  },
  Contas: {
    label: 'Contas',
    aliases: ['Contas', 'Casa', 'Assinaturas'],
    icon: 'receipt',
    color: '#bacbb9',
    type: 'gasto',
  },
  Outros: {
    label: 'Outros',
    aliases: ['Outros'],
    icon: 'tag',
    color: '#859585',
    type: 'ambos',
  },
  'Salário': {
    label: 'Salário',
    aliases: ['Salário', 'Salario'],
    icon: 'briefcase',
    color: '#75ff9e',
    type: 'entrada',
  },
  'Outros recebimentos': {
    label: 'Outros recebimentos',
    aliases: ['Outros recebimentos'],
    icon: 'plus-circle',
    color: '#859585',
    type: 'entrada',
  },
};

export function createTelegramActions(options: CreateTelegramActionsOptions) {
  const now = options.now ?? new Date();

  return {
    handleParsedMessageForUser: async (userId: string, parsed: TelegramParsedMessage) => {
      switch (parsed.intent) {
        case 'create_expense':
          return createTransactionMessage(userId, parsed, 'gasto', options);
        case 'create_income':
          return createTransactionMessage(userId, parsed, 'entrada', options);
        case 'get_monthly_summary':
          return createMonthlySummaryMessage(userId, options, now);
        case 'create_investment_deposit':
          return createInvestmentDepositMessage(userId, parsed, options);
        default:
          return getUnknownMessage();
      }
    },
  };
}

async function createInvestmentDepositMessage(
  userId: string,
  parsed: TelegramParsedMessage,
  options: CreateTelegramActionsOptions,
) {
  validateUserId(userId);
  const data = parsed.data;

  validateTransactionInput({
    amount: data.amount,
    description: data.description,
    date: data.date,
    status: data.status,
    type: 'gasto',
  });

  const investments = await options.repo.listInvestments(userId);
  const matched = findMatchingInvestments(investments, data.description);

  if (matched.length === 0) {
    return [
      '🤔 <b>Não encontrei esse investimento com segurança.</b>',
      '',
      'Tente algo como:',
      '• <code>adicione 500 no investimento ferias</code>',
      '• <code>aportar 300 na caixinha 13</code>',
    ].join('\n');
  }

  if (matched.length > 1) {
    return [
      '🤔 <b>Encontrei mais de um investimento parecido.</b>',
      '',
      `Matches: ${matched.map(investment => escapeTelegramHtml(investment.name)).join(', ')}`,
      '',
      'Tente mencionar o nome completo da caixinha.',
    ].join('\n');
  }

  const investment = matched[0];
  const deposit = await options.repo.insertInvestmentDeposit({
    userId,
    investmentId: investment.id,
    amount: data.amount!,
    date: data.date,
    notes: null,
  });

  const updatedTotals = getInvestmentTotalsAfterDeposit({
    amountInvested: investment.amount_invested,
    currentValue: investment.current_value,
    depositAmount: data.amount!,
  });

  await options.repo.updateInvestmentTotals({
    investmentId: investment.id,
    amountInvested: updatedTotals.amount_invested,
    currentValue: updatedTotals.current_value,
    returnPercentage: updatedTotals.return_percentage,
  });

  const transactionPayload = buildInvestmentDepositTransactionPayload({
    investmentName: investment.name,
    amount: data.amount!,
    date: data.date,
    notes: null,
  });

  await options.repo.insertTransaction({
    userId,
    type: transactionPayload.type,
    description: transactionPayload.description,
    amount: transactionPayload.amount,
    date: transactionPayload.date,
    status: transactionPayload.status as Transaction['status'],
    paymentMethod: transactionPayload.payment_method,
    categoryId: transactionPayload.category_id,
    notes: deposit.id
      ? buildLinkedRecordNote('investment_deposit', deposit.id, investment.id)
      : buildLinkedRecordNote('investment_deposit', investment.id),
  });

  return [
    '✅ <b>Aporte registrado</b>',
    '',
    `🏦 <b>Investimento:</b> ${escapeTelegramHtml(investment.name)}`,
    `💰 <b>Valor:</b> ${formatCurrency(data.amount!)}`,
    `📅 <b>Data:</b> ${formatDate(data.date)}`,
  ].join('\n');
}

async function createTransactionMessage(
  userId: string,
  parsed: TelegramParsedMessage,
  type: TransactionType,
  options: CreateTelegramActionsOptions,
) {
  validateUserId(userId);
  const data = parsed.data;

  validateTransactionInput({
    amount: data.amount,
    description: data.description,
    date: data.date,
    status: data.status,
    type,
  });

  const category = await ensureCategoryForUser({
    userId,
    type,
    label: data.category ?? (type === 'entrada' ? 'Outros recebimentos' : 'Outros'),
    repo: options.repo,
  });

  const transactionPayload = buildTransactionPayload({
    type,
    description: data.description,
    amount: data.amount!,
    date: data.date,
    paymentMethod: 'pix',
    categoryId: category.id,
    notes: null,
  });

  await options.repo.insertTransaction({
    userId,
    type: transactionPayload.type,
    description: transactionPayload.description,
    amount: transactionPayload.amount,
    date: transactionPayload.date,
    status: transactionPayload.status as Transaction['status'],
    paymentMethod: transactionPayload.payment_method,
    categoryId: transactionPayload.category_id,
    notes: transactionPayload.notes,
  });

  return type === 'gasto'
    ? [
        '✅ <b>Gasto registrado</b>',
        '',
        `📝 <b>Descrição:</b> ${escapeTelegramHtml(transactionPayload.description)}`,
        `🏷️ <b>Categoria:</b> ${escapeTelegramHtml(category.name)}`,
        `💸 <b>Valor:</b> ${formatCurrency(transactionPayload.amount)}`,
        `📅 <b>Data:</b> ${formatDate(data.date)}`,
      ].join('\n')
    : [
        '✅ <b>Entrada registrada</b>',
        '',
        `📝 <b>Descrição:</b> ${escapeTelegramHtml(transactionPayload.description)}`,
        `🏷️ <b>Categoria:</b> ${escapeTelegramHtml(category.name)}`,
        `💰 <b>Valor:</b> ${formatCurrency(transactionPayload.amount)}`,
        `📅 <b>Data:</b> ${formatDate(data.date)}`,
      ].join('\n');
}

async function createMonthlySummaryMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const monthKey = `${getYear(now, options.timeZone)}-${String(getMonth(now, options.timeZone)).padStart(2, '0')}`;
  const monthRange = buildMonthRange(monthKey);

  const [transactions, invoiceItems, fixedBills] = await Promise.all([
    options.repo.listMonthTransactions({ userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
    options.repo.listMonthInvoiceItems({ userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
    options.repo.listFixedBills(userId),
  ]);

  const normalizedTransactions = transactions.map(transaction => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));

  const mappedBills = resolveDynamicFixedBills({
    bills: fixedBills,
    payments: normalizedTransactions.map(transaction => ({
      id: transaction.id,
      notes: transaction.notes,
      status: transaction.status,
    })),
    monthKey,
    today: now,
  });

  const fixedBillsTotal = mappedBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const unpaidFixedBills = mappedBills
    .filter(bill => bill.dynamicStatus !== 'pago')
    .reduce((sum, bill) => sum + Number(bill.amount), 0);

  const openInvoices = invoiceItems
    .filter(item => {
      const linkedTransaction = normalizedTransactions.find(transaction => transaction.notes === `invoice_item:${item.id}`);
      if (linkedTransaction) {
        return linkedTransaction.status !== 'pago';
      }

      const signature = `${(item.description || '').trim().toLocaleLowerCase('pt-BR')}|${Number(item.amount).toFixed(2)}|${item.date}`;
      const fallbackTransaction = normalizedTransactions.find(transaction => {
        if (transaction.payment_method !== undefined && transaction.payment_method !== 'credito') return false;
        if (!transaction.description || !transaction.date) return false;
        const transactionSignature = `${transaction.description.trim().toLocaleLowerCase('pt-BR')}|${Number(transaction.amount).toFixed(2)}|${transaction.date}`;
        return transactionSignature === signature;
      });

      if (fallbackTransaction) {
        return fallbackTransaction.status !== 'pago';
      }

      return true;
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const summary = calculateSummaryCards({
    transactions: normalizedTransactions,
    savedAmount: 0,
    openInvoices,
    fixedBillsTotal,
    unpaidFixedBills,
  });

  return [
    `📊 <b>Resumo de ${formatMonthYear(monthKey)}</b>`,
    '',
    `💰 <b>Entradas:</b> ${formatCurrency(summary.totalIncome)}`,
    `💸 <b>Gastos:</b> ${formatCurrency(summary.totalExpense)}`,
    `🏠 <b>Contas fixas:</b> ${formatCurrency(summary.fixedBillsTotal)}`,
    `💳 <b>Faturas abertas:</b> ${formatCurrency(summary.openInvoices)}`,
    `🧮 <b>Sobra prevista:</b> ${formatCurrency(summary.projectedBalance)}`,
  ].join('\n');
}

async function ensureCategoryForUser(input: {
  userId: string;
  type: TransactionType;
  label: string;
  repo: TelegramActionsRepository;
}) {
  const blueprint = categoryBlueprints[input.label] ?? getFallbackBlueprint(input.type);
  const existing = await input.repo.findCategoryByNameOrAliases({
    userId: input.userId,
    type: input.type,
    names: blueprint.aliases,
  });

  if (existing) return existing;

  const defaultCategory = defaultCategories.find(category => blueprint.aliases.includes(category.name));

  return input.repo.createCategory({
    userId: input.userId,
    name: blueprint.label,
    type: blueprint.type,
    color: defaultCategory?.color ?? blueprint.color,
    icon: defaultCategory?.icon ?? blueprint.icon,
  });
}

function getFallbackBlueprint(type: TransactionType): CategoryBlueprint {
  return type === 'entrada'
    ? categoryBlueprints['Outros recebimentos']
    : categoryBlueprints.Outros;
}

function validateTransactionInput(input: {
  amount?: number;
  description: string;
  date: string;
  status?: string;
  type: TransactionType;
}) {
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Valor inválido para lançamento do Telegram.');
  }

  if (!input.description.trim()) {
    throw new Error('Descrição obrigatória para lançamento do Telegram.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(`${input.date}T00:00:00Z`))) {
    throw new Error('Data inválida para lançamento do Telegram.');
  }

  const expectedStatus = input.type === 'entrada' ? 'recebido' : 'pago';
  if (input.status !== expectedStatus) {
    throw new Error('Status inválido para lançamento do Telegram.');
  }
}

function validateUserId(userId: string) {
  if (!userId.trim()) {
    throw new Error('Usuário interno inválido para lançamento do Telegram.');
  }
}

function getUnknownMessage() {
  return [
    '🤔 <b>Não consegui entender com segurança.</b>',
    '',
    'Tente enviar assim:',
    '• <code>gastei 25 no almoço</code>',
    '• <code>recebi 6500 salário</code>',
  ].join('\n');
}

function findMatchingInvestments(investments: Investment[], rawName: string) {
  const normalizedQuery = normalizeSearchText(rawName);
  if (!normalizedQuery) return [];

  const exactMatches = investments.filter(investment => normalizeSearchText(investment.name) === normalizedQuery);
  if (exactMatches.length > 0) return exactMatches;

  return investments.filter(investment => normalizeSearchText(investment.name).includes(normalizedQuery));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(roundCurrency(value)).replace(/\u00A0/g, ' ');
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatMonthYear(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${monthName}/${year}`;
}

function getYear(date: Date, timeZone = 'America/Fortaleza') {
  return Number(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
  }).format(date));
}

function getMonth(date: Date, timeZone = 'America/Fortaleza') {
  return Number(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: '2-digit',
  }).format(date));
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
