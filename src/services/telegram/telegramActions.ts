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
import type { Category, CreditCard, FinancialGoal, FixedBill, Investment, Transaction } from '../../types/financial.js';
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
  card_id?: string;
  amount: number;
  description: string;
  date: string;
  credit_card?: Pick<CreditCard, 'id' | 'name' | 'last_digits' | 'brand'>;
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
  category?: { name: string; color?: string };
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
  listCreditCards(userId: string): Promise<CreditCard[]>;
  listFixedBills(userId: string): Promise<FixedBill[]>;
  listInvestments(userId: string): Promise<Investment[]>;
  listFinancialGoals(userId: string): Promise<FinancialGoal[]>;
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
        case 'list_expenses':
          return createTransactionListMessage(userId, options, now, 'gasto');
        case 'list_incomes':
          return createTransactionListMessage(userId, options, now, 'entrada');
        case 'get_expense_distribution':
          return createExpenseDistributionMessage(userId, options, now);
        case 'list_fixed_bills':
          return createFixedBillsMessage(userId, options, now);
        case 'list_open_invoices':
          return createOpenInvoicesMessage(userId, options, now);
        case 'get_card_invoice':
          return createCardInvoiceMessage(userId, parsed.data.description, options, now);
        case 'list_cards':
          return createCardsMessage(userId, options, now);
        case 'list_investments':
          return createInvestmentsMessage(userId, options);
        case 'get_investment_summary':
          return createInvestmentSummaryMessage(userId, parsed.data.description, options);
        case 'list_goals':
          return createGoalsMessage(userId, options);
        case 'get_balance':
          return createBalanceMessage(userId, options, now);
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
  const context = await getMonthlyContext(userId, options, now);
  const summary = calculateMonthlySummary(context);

  return [
    `📊 <b>Resumo de ${formatMonthYear(context.monthKey)}</b>`,
    '',
    `💰 <b>Entradas:</b> ${formatCurrency(summary.totalIncome)}`,
    `💸 <b>Gastos:</b> ${formatCurrency(summary.totalExpense)}`,
    `🏠 <b>Contas fixas:</b> ${formatCurrency(summary.fixedBillsTotal)}`,
    `💳 <b>Faturas abertas:</b> ${formatCurrency(summary.openInvoices)}`,
    `🧮 <b>Sobra prevista:</b> ${formatCurrency(summary.projectedBalance)}`,
  ].join('\n');
}

async function createBalanceMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const context = await getMonthlyContext(userId, options, now);
  const summary = calculateMonthlySummary(context);

  return [
    `🧮 <b>Sobra prevista de ${formatMonthYear(context.monthKey)}</b>`,
    '',
    `💰 Entradas: ${formatCurrency(summary.totalIncome)}`,
    `💸 Gastos: ${formatCurrency(summary.totalExpense)}`,
    `🏠 Fixas em aberto: ${formatCurrency(context.unpaidFixedBills)}`,
    `💳 Faturas abertas: ${formatCurrency(context.openInvoicesTotal)}`,
    '',
    `✅ <b>Sobra prevista:</b> ${formatCurrency(summary.projectedBalance)}`,
  ].join('\n');
}

async function createTransactionListMessage(
  userId: string,
  options: CreateTelegramActionsOptions,
  now: Date,
  type: TransactionType,
) {
  validateUserId(userId);
  const context = await getMonthlyContext(userId, options, now);
  const items = context.transactions
    .filter(transaction => transaction.type === type)
    .sort((left, right) => (right.date ?? '').localeCompare(left.date ?? ''));
  const total = items.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const title = type === 'gasto' ? '💸 <b>Gastos' : '💰 <b>Entradas';

  if (items.length === 0) {
    return [
      `${title} de ${formatMonthYear(context.monthKey)}</b>`,
      '',
      type === 'gasto'
        ? 'Nenhum gasto registrado neste mês ainda.'
        : 'Nenhuma entrada registrada neste mês ainda.',
    ].join('\n');
  }

  return [
    `${title} de ${formatMonthYear(context.monthKey)}</b>`,
    '',
    `<b>Total:</b> ${formatCurrency(total)}`,
    '',
    ...items.slice(0, 10).map(transaction => formatTransactionLine(transaction)),
    items.length > 10 ? `\nMostrei os 10 lançamentos mais recentes de ${items.length}.` : '',
  ].filter(Boolean).join('\n');
}

async function createExpenseDistributionMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const context = await getMonthlyContext(userId, options, now);
  const expenses = context.transactions.filter(transaction => transaction.type === 'gasto');

  if (expenses.length === 0) {
    return [
      `🧭 <b>Distribuição de gastos</b>`,
      '',
      'Ainda não há gastos neste mês para distribuir por categoria.',
    ].join('\n');
  }

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const category = expense.category?.name ?? 'Sem categoria';
    byCategory.set(category, (byCategory.get(category) ?? 0) + Number(expense.amount));
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const lines = [...byCategory.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 8)
    .map(([category, value]) => {
      const ratio = total > 0 ? Math.round((value / total) * 100) : 0;
      return `• ${escapeTelegramHtml(category)}: ${formatCurrency(value)} (${ratio}%)`;
    });

  return [
    '🧭 <b>Distribuição de gastos</b>',
    '',
    `<b>Total analisado:</b> ${formatCurrency(total)}`,
    '',
    ...lines,
  ].join('\n');
}

async function createFixedBillsMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const context = await getMonthlyContext(userId, options, now);

  if (context.fixedBills.length === 0) {
    return [
      '🏠 <b>Contas fixas</b>',
      '',
      'Nenhuma conta fixa cadastrada ainda.',
    ].join('\n');
  }

  return [
    '🏠 <b>Contas fixas</b>',
    '',
    `<b>Total:</b> ${formatCurrency(context.fixedBillsTotal)}`,
    `<b>Em aberto:</b> ${formatCurrency(context.unpaidFixedBills)}`,
    '',
    ...context.fixedBills.map(bill => {
      const status = bill.dynamicStatus === 'pago' ? '✅' : bill.dynamicStatus === 'atrasado' ? '🚨' : '⏳';
      return `• ${status} ${escapeTelegramHtml(bill.description)} · dia ${bill.due_day} · ${formatCurrency(Number(bill.amount))}`;
    }),
  ].join('\n');
}

async function createOpenInvoicesMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const context = await getMonthlyContext(userId, options, now);

  if (context.invoiceItems.length === 0) {
    return [
      `💳 <b>Faturas de ${formatMonthYear(context.monthKey)}</b>`,
      '',
      'Nenhuma fatura encontrada neste mês.',
    ].join('\n');
  }

  const byCard = groupInvoiceItemsByCard(context.invoiceItems, context.transactions);
  const total = context.invoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);
  return [
    `💳 <b>Faturas de ${formatMonthYear(context.monthKey)}</b>`,
    '',
    `<b>Total das faturas:</b> ${formatCurrency(total)}`,
    `<b>Em aberto:</b> ${formatCurrency(context.openInvoicesTotal)}`,
    '',
    ...byCard.map(group => `• ${group.status === 'paid' ? '✅' : '⏳'} ${escapeTelegramHtml(group.name)}: ${formatCurrency(group.total)} (${group.status === 'paid' ? 'Paga' : 'Aberta'} · ${group.count} item${group.count === 1 ? '' : 's'})`),
  ].join('\n');
}

async function createCardsMessage(userId: string, options: CreateTelegramActionsOptions, now: Date) {
  validateUserId(userId);
  const [cards, context] = await Promise.all([
    options.repo.listCreditCards(userId),
    getMonthlyContext(userId, options, now),
  ]);

  if (cards.length === 0) {
    return [
      '💳 <b>Cartões</b>',
      '',
      'Nenhum cartão cadastrado ainda.',
    ].join('\n');
  }

  return [
    '💳 <b>Cartões</b>',
    '',
    ...cards.map(card => {
      const cardItems = context.invoiceItems
        .filter(item => item.card_id === card.id)
      const total = cardItems
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const status = getCardInvoiceStatus(cardItems, context.transactions);
      return `• ${escapeTelegramHtml(card.name)} •••• ${escapeTelegramHtml(card.last_digits)} · limite ${formatCurrency(Number(card.credit_limit))} · fatura ${formatCurrency(total)} · ${status === 'paid' ? 'Paga' : 'Aberta'}`;
    }),
  ].join('\n');
}

async function createCardInvoiceMessage(
  userId: string,
  rawCardName: string,
  options: CreateTelegramActionsOptions,
  now: Date,
) {
  validateUserId(userId);
  const [cards, context] = await Promise.all([
    options.repo.listCreditCards(userId),
    getMonthlyContext(userId, options, now),
  ]);
  const matches = findMatchingCards(cards, rawCardName);

  if (matches.length === 0) {
    return [
      '🤔 <b>Não encontrei esse cartão.</b>',
      '',
      'Tente mencionar o nome do cartão como está cadastrado.',
      cards.length > 0 ? `Cartões: ${cards.map(card => escapeTelegramHtml(card.name)).join(', ')}` : '',
    ].filter(Boolean).join('\n');
  }

  if (matches.length > 1) {
    return [
      '🤔 <b>Encontrei mais de um cartão parecido.</b>',
      '',
      `Cartões: ${matches.map(card => escapeTelegramHtml(card.name)).join(', ')}`,
      'Tente escrever o nome completo.',
    ].join('\n');
  }

  const card = matches[0];
  const items = context.invoiceItems
    .filter(item => item.card_id === card.id)
    .sort((left, right) => right.date.localeCompare(left.date));
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const status = getCardInvoiceStatus(items, context.transactions);

  return [
    `💳 <b>Fatura ${escapeTelegramHtml(card.name)} · ${formatMonthYear(context.monthKey)}</b>`,
    '',
    `<b>Total:</b> ${formatCurrency(total)}`,
    `<b>Status:</b> ${status === 'paid' ? 'Paga' : 'Aberta'}`,
    `<b>Final:</b> •••• ${escapeTelegramHtml(card.last_digits)}`,
    '',
    ...(items.length > 0
      ? items.slice(0, 10).map(item => `• ${formatDate(item.date)} · ${escapeTelegramHtml(item.description)} · ${formatCurrency(Number(item.amount))}`)
      : ['Nenhum item aberto encontrado para este cartão no mês.']),
  ].join('\n');
}

async function createInvestmentsMessage(userId: string, options: CreateTelegramActionsOptions) {
  validateUserId(userId);
  const investments = await options.repo.listInvestments(userId);

  if (investments.length === 0) {
    return [
      '🏦 <b>Investimentos</b>',
      '',
      'Nenhum investimento cadastrado ainda.',
    ].join('\n');
  }

  const totalCurrent = investments.reduce((sum, investment) => sum + Number(investment.current_value), 0);
  const totalInvested = investments.reduce((sum, investment) => sum + Number(investment.amount_invested), 0);

  return [
    '🏦 <b>Investimentos</b>',
    '',
    `<b>Saldo guardado:</b> ${formatCurrency(totalCurrent)}`,
    `<b>Total aportado:</b> ${formatCurrency(totalInvested)}`,
    '',
    ...investments.map(investment => {
      const contribution = Number(investment.monthly_contribution ?? 0);
      return `• ${escapeTelegramHtml(investment.name)} · ${formatCurrency(Number(investment.current_value))}${contribution > 0 ? ` · aporte mensal ${formatCurrency(contribution)}` : ''}`;
    }),
  ].join('\n');
}

async function createInvestmentSummaryMessage(userId: string, rawName: string, options: CreateTelegramActionsOptions) {
  validateUserId(userId);
  const investments = await options.repo.listInvestments(userId);
  const matched = findMatchingInvestments(investments, rawName);

  if (matched.length === 0) {
    return [
      '🤔 <b>Não encontrei essa caixinha com segurança.</b>',
      '',
      'Tente escrever o nome do investimento como ele aparece no app.',
    ].join('\n');
  }

  if (matched.length > 1) {
    return [
      '🤔 <b>Encontrei mais de uma caixinha parecida.</b>',
      '',
      `Matches: ${matched.map(investment => escapeTelegramHtml(investment.name)).join(', ')}`,
    ].join('\n');
  }

  const investment = matched[0];
  return [
    `🏦 <b>${escapeTelegramHtml(investment.name)}</b>`,
    '',
    `Saldo atual: ${formatCurrency(Number(investment.current_value))}`,
    `Aportado: ${formatCurrency(Number(investment.amount_invested))}`,
    `Rentabilidade: ${Number(investment.return_percentage ?? 0).toFixed(2).replace('.', ',')}%`,
    Number(investment.monthly_contribution ?? 0) > 0
      ? `Aporte mensal: ${formatCurrency(Number(investment.monthly_contribution))}`
      : 'Aporte mensal: não configurado',
  ].join('\n');
}

async function createGoalsMessage(userId: string, options: CreateTelegramActionsOptions) {
  validateUserId(userId);
  const goals = await options.repo.listFinancialGoals(userId);

  if (goals.length === 0) {
    return [
      '🎯 <b>Metas financeiras</b>',
      '',
      'Nenhuma meta cadastrada ainda.',
    ].join('\n');
  }

  return [
    '🎯 <b>Metas financeiras</b>',
    '',
    ...goals.map(goal => {
      const target = Number(goal.target_amount);
      const current = Number(goal.current_amount);
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const deadline = goal.deadline ? ` · até ${formatDate(goal.deadline)}` : '';
      return `• ${escapeTelegramHtml(goal.title)} · ${formatCurrency(current)} de ${formatCurrency(target)} · ${progress}%${deadline}`;
    }),
  ].join('\n');
}

type MonthlyContext = Awaited<ReturnType<typeof getMonthlyContext>>;

async function getMonthlyContext(userId: string, options: CreateTelegramActionsOptions, now: Date) {
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
  const openInvoiceItems = getOpenInvoiceItems(invoiceItems, normalizedTransactions);
  const openInvoicesTotal = openInvoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    monthKey,
    transactions: normalizedTransactions,
    invoiceItems,
    fixedBills: mappedBills,
    fixedBillsTotal,
    unpaidFixedBills,
    openInvoiceItems,
    openInvoicesTotal,
  };
}

function calculateMonthlySummary(context: MonthlyContext) {
  return calculateSummaryCards({
    transactions: context.transactions,
    savedAmount: 0,
    openInvoices: context.openInvoicesTotal,
    fixedBillsTotal: context.fixedBillsTotal,
    unpaidFixedBills: context.unpaidFixedBills,
  });
}

function getOpenInvoiceItems(invoiceItems: TelegramInvoiceItemRecord[], transactions: TelegramTransactionRecord[]) {
  return invoiceItems.filter(item => {
    const fallbackTransaction = findInvoiceTransaction(item, transactions);

    if (fallbackTransaction) {
      return fallbackTransaction.status !== 'pago';
    }

    return true;
  });
}

function groupInvoiceItemsByCard(items: TelegramInvoiceItemRecord[], transactions: TelegramTransactionRecord[]) {
  const byCard = new Map<string, {
    name: string;
    total: number;
    count: number;
    items: TelegramInvoiceItemRecord[];
  }>();

  for (const item of items) {
    const cardKey = item.card_id ?? item.credit_card?.id ?? 'unknown';
    const cardName = item.credit_card?.name ?? 'Cartão sem nome';
    const current = byCard.get(cardKey);
    byCard.set(cardKey, {
      name: current?.name ?? cardName,
      total: (current?.total ?? 0) + Number(item.amount),
      count: (current?.count ?? 0) + 1,
      items: [...(current?.items ?? []), item],
    });
  }

  return [...byCard.values()]
    .map(group => ({
      ...group,
      status: getCardInvoiceStatus(group.items, transactions),
    }))
    .sort((left, right) => right.total - left.total);
}

function getCardInvoiceStatus(items: TelegramInvoiceItemRecord[], transactions: TelegramTransactionRecord[]) {
  if (items.length === 0) return 'open' as const;

  const matchedTransactions = items
    .map(item => findInvoiceTransaction(item, transactions))
    .filter((transaction): transaction is TelegramTransactionRecord => Boolean(transaction));

  if (matchedTransactions.length < items.length) return 'open' as const;
  return matchedTransactions.every(transaction => transaction.status === 'pago') ? 'paid' as const : 'open' as const;
}

function findInvoiceTransaction(item: TelegramInvoiceItemRecord, transactions: TelegramTransactionRecord[]) {
  const linkedTransaction = transactions.find(transaction => transaction.notes === `invoice_item:${item.id}`);
  if (linkedTransaction) return linkedTransaction;

  const signature = `${(item.description || '').trim().toLocaleLowerCase('pt-BR')}|${Number(item.amount).toFixed(2)}|${item.date}`;
  return transactions.find(transaction => {
    if (transaction.payment_method !== undefined && transaction.payment_method !== 'credito') return false;
    if (!transaction.description || !transaction.date) return false;
    const transactionSignature = `${transaction.description.trim().toLocaleLowerCase('pt-BR')}|${Number(transaction.amount).toFixed(2)}|${transaction.date}`;
    return transactionSignature === signature;
  });
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
    '• <code>ver fatura nubank</code>',
    '• <code>meus investimentos</code>',
    '• <code>onde estou gastando mais</code>',
  ].join('\n');
}

function formatTransactionLine(transaction: TelegramTransactionRecord) {
  const icon = transaction.type === 'entrada' ? '💰' : '💸';
  const date = transaction.date ? formatDate(transaction.date) : 'sem data';
  const description = escapeTelegramHtml(transaction.description ?? 'Sem descrição');
  const category = transaction.category?.name ? ` · ${escapeTelegramHtml(transaction.category.name)}` : '';
  return `• ${icon} ${date} · ${description}${category} · ${formatCurrency(Number(transaction.amount))}`;
}

function findMatchingInvestments(investments: Investment[], rawName: string) {
  const normalizedQuery = normalizeSearchText(rawName);
  if (!normalizedQuery) return [];

  const exactMatches = investments.filter(investment => normalizeSearchText(investment.name) === normalizedQuery);
  if (exactMatches.length > 0) return exactMatches;

  return investments.filter(investment => normalizeSearchText(investment.name).includes(normalizedQuery));
}

function findMatchingCards(cards: CreditCard[], rawName: string) {
  const normalizedQuery = normalizeSearchText(rawName);
  if (!normalizedQuery) return [];

  const exactMatches = cards.filter(card =>
    normalizeSearchText(card.name) === normalizedQuery
    || normalizeSearchText(card.last_digits) === normalizedQuery
    || normalizeSearchText(card.brand) === normalizedQuery
  );
  if (exactMatches.length > 0) return exactMatches;

  return cards.filter(card =>
    normalizeSearchText(card.name).includes(normalizedQuery)
    || normalizeSearchText(card.last_digits).includes(normalizedQuery)
    || normalizeSearchText(card.brand).includes(normalizedQuery)
  );
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
