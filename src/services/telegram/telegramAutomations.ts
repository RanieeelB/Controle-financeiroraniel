import { buildMonthRange } from '../../lib/monthSelection.js';
import { buildTransactionPayload, roundCurrency } from '../../lib/financialPayloads.js';
import { calculateSummaryCards } from '../../lib/financialPlanning.js';
import { resolveDynamicFixedBills } from '../../lib/fixedBillPayments.js';
import type { CreditCard, FixedBill, Transaction } from '../../types/financial.js';
import type { TelegramParseMode, TelegramReplyMarkup } from './telegramService.js';

type TransactionType = Transaction['type'];

interface TelegramAutomationConnection {
  user_id: string;
  telegram_chat_id: string | null;
}

interface TelegramAutomationInvoiceItem {
  id: string;
  card_id?: string;
  amount: number;
  description: string;
  date: string;
  credit_card?: Pick<CreditCard, 'id' | 'name' | 'last_digits' | 'brand'>;
}

interface TelegramAutomationTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: Transaction['status'];
  notes: string | null;
  description?: string;
  date?: string;
  payment_method?: Transaction['payment_method'];
  category?: { name: string; color?: string };
}

export interface TelegramAutomationRepository {
  listLinkedConnections(): Promise<TelegramAutomationConnection[]>;
  hasDelivery(input: { userId: string; automationKey: string }): Promise<boolean>;
  saveDelivery(input: { userId: string; automationKey: string; deliveredAt: string }): Promise<void>;
  listMonthTransactions(input: { userId: string; startDate: string; endDate: string }): Promise<TelegramAutomationTransaction[]>;
  listMonthInvoiceItems(input: { userId: string; startDate: string; endDate: string }): Promise<TelegramAutomationInvoiceItem[]>;
  listCreditCards(userId: string): Promise<CreditCard[]>;
  listFixedBills(userId: string): Promise<FixedBill[]>;
  updateTransactionsStatus(transactionIds: string[], status: Transaction['status']): Promise<void>;
  insertFixedBillPayment(input: {
    userId: string;
    billId: string;
    monthKey: string;
    description: string;
    amount: number;
    categoryId: string | null;
    date: string;
  }): Promise<{ id: string | null }>;
}

interface CreateTelegramAutomationRunnerOptions {
  now?: Date;
  timeZone?: string;
  repo: TelegramAutomationRepository;
  sendMessage(input: {
    chatId: number;
    text: string;
    replyMarkup?: TelegramReplyMarkup;
    parseMode?: TelegramParseMode;
  }): Promise<void>;
}

interface AutomationMessage {
  key: string;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}

type MonthlyContext = Awaited<ReturnType<typeof getMonthlyContext>>;

const DEFAULT_TIME_ZONE = 'America/Fortaleza';
const MORNING_HOUR = 8;
const EVENING_HOUR = 18;

export function createTelegramAutomationRunner(options: CreateTelegramAutomationRunnerOptions) {
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;

  return {
    runDueAutomations: async () => {
      const now = options.now ?? new Date();
      const local = getLocalDateParts(now, timeZone);
      const connections = await options.repo.listLinkedConnections();
      let sent = 0;
      let skipped = 0;

      for (const connection of connections) {
        if (!connection.telegram_chat_id) {
          skipped += 1;
          continue;
        }

        const context = await getMonthlyContext(connection.user_id, options.repo, now, timeZone);
        const messages = buildDueMessages(context, local, now, timeZone);

        for (const message of messages) {
          const alreadySent = await options.repo.hasDelivery({
            userId: connection.user_id,
            automationKey: message.key,
          });
          if (alreadySent) {
            skipped += 1;
            continue;
          }

          await options.sendMessage({
            chatId: Number(connection.telegram_chat_id),
            text: message.text,
            replyMarkup: message.replyMarkup,
            parseMode: 'HTML',
          });
          await options.repo.saveDelivery({
            userId: connection.user_id,
            automationKey: message.key,
            deliveredAt: now.toISOString(),
          });
          sent += 1;
        }
      }

      return { sent, skipped };
    },
    handleAutomationCallback: async (userId: string, callbackData: string) => {
      return handleAutomationCallback(userId, callbackData, options.repo, options.now ?? new Date(), timeZone);
    },
  };
}

function buildDueMessages(
  context: MonthlyContext,
  local: LocalDateParts,
  now: Date,
  timeZone: string,
) {
  const messages: AutomationMessage[] = [];
  const todayKey = local.dateKey;

  if (local.hour === MORNING_HOUR) {
    const morning = buildDueReminderMessage(context, todayKey, {
      keyPrefix: 'morning-agenda',
      title: '🌅 <b>Agenda da manhã</b>',
    });
    if (morning) messages.push(morning);
  }

  if (local.hour === EVENING_HOUR) {
    const eveningReminders = buildDueReminderMessage(context, todayKey, {
      keyPrefix: 'evening-due-reminders',
      title: '🗓️ <b>Vencimentos próximos</b>',
    });
    if (eveningReminders) messages.push(eveningReminders);

    const daily = buildDailySummaryMessage(context, todayKey, now, timeZone);
    if (daily) messages.push(daily);

    const lowBalance = buildLowBalanceMessage(context, todayKey);
    if (lowBalance) messages.push(lowBalance);

    if (local.weekday === 7) {
      const weekly = buildWeeklyClosingMessage(context, todayKey);
      if (weekly) messages.push(weekly);
    }
  }

  return messages;
}

function buildDueReminderMessage(
  context: MonthlyContext,
  todayKey: string,
  input: { keyPrefix: string; title: string },
): AutomationMessage | null {
  const items = getCriticalCommitments(context, todayKey, 3, true);
  if (items.length === 0) return null;

  const keyboardRows = items
    .filter(item => item.callbackData)
    .slice(0, 6)
    .map(item => [{ text: `Marcar ${item.shortLabel} como pago`, callback_data: item.callbackData! }]);

  return {
    key: `${input.keyPrefix}:${todayKey}`,
    text: [
      input.title,
      '',
      'Compromissos próximos ou em atraso:',
      '',
      ...items.map(item => `• ${item.line}`),
    ].join('\n'),
    replyMarkup: keyboardRows.length > 0 ? { inline_keyboard: keyboardRows } : undefined,
  };
}

function buildDailySummaryMessage(
  context: MonthlyContext,
  todayKey: string,
  now: Date,
  timeZone: string,
): AutomationMessage | null {
  const todayTransactions = context.transactions.filter(transaction => transaction.date === todayKey);
  if (todayTransactions.length === 0) return null;

  const summary = calculateMonthlySummary(context);
  const todayIncome = sumTransactions(todayTransactions, 'entrada');
  const todayExpense = sumTransactions(todayTransactions, 'gasto');
  const nextCommitment = getCriticalCommitments(context, todayKey, 7, true)[0];

  return {
    key: `daily-summary:${todayKey}`,
    text: [
      `🕕 <b>Resumo das 18h</b> · ${formatDateTime(now, timeZone)}`,
      '',
      `💰 Entradas de hoje: ${formatCurrency(todayIncome)}`,
      `💸 Gastos de hoje: ${formatCurrency(todayExpense)}`,
      `🧮 <b>Saldo disponível hoje:</b> ${formatCurrency(summary.currentBalance)}`,
      `📈 Sobra projetada do mês: ${formatCurrency(summary.projectedBalance)}`,
      nextCommitment ? `⏭️ Próximo compromisso: ${nextCommitment.plainLine}` : '⏭️ Nenhum compromisso crítico nos próximos dias.',
    ].join('\n'),
  };
}

function buildLowBalanceMessage(context: MonthlyContext, todayKey: string): AutomationMessage | null {
  const summary = calculateMonthlySummary(context);
  const shouldAlert = summary.currentBalance < 100 || summary.projectedBalance < 0;
  if (!shouldAlert) return null;

  return {
    key: `low-balance:${todayKey}`,
    text: [
      '⚠️ <b>Alerta de saldo</b>',
      '',
      `Saldo disponível hoje: ${formatCurrency(summary.currentBalance)}`,
      `Sobra projetada do mês: ${formatCurrency(summary.projectedBalance)}`,
      '',
      summary.projectedBalance < 0
        ? 'A projeção ficou negativa considerando faturas e contas em aberto.'
        : 'O saldo disponível está abaixo do limite de atenção.',
    ].join('\n'),
  };
}

function buildWeeklyClosingMessage(context: MonthlyContext, todayKey: string): AutomationMessage | null {
  const weekStart = addDays(todayKey, -6);
  const weekTransactions = context.transactions.filter(transaction =>
    Boolean(transaction.date && transaction.date >= weekStart && transaction.date <= todayKey)
  );
  const weekIncome = sumTransactions(weekTransactions, 'entrada');
  const weekExpense = sumTransactions(weekTransactions, 'gasto');
  const topCategory = getTopExpenseCategory(weekTransactions);
  const critical = getCriticalCommitments(context, todayKey, 7, false);

  if (weekTransactions.length === 0 && critical.length === 0) return null;

  return {
    key: `weekly-closing:${todayKey}`,
    text: [
      '📆 <b>Fechamento semanal</b>',
      '',
      `💰 Entrou na semana: ${formatCurrency(weekIncome)}`,
      `💸 Saiu na semana: ${formatCurrency(weekExpense)}`,
      `🏷️ Maior categoria: ${topCategory ? `${escapeTelegramHtml(topCategory.name)} (${formatCurrency(topCategory.total)})` : 'sem gastos categorizados'}`,
      '',
      critical.length > 0
        ? 'Contas críticas da próxima semana:'
        : 'Sem contas críticas para a próxima semana.',
      ...critical.slice(0, 6).map(item => `• ${item.line}`),
    ].join('\n'),
  };
}

async function handleAutomationCallback(
  userId: string,
  callbackData: string,
  repo: TelegramAutomationRepository,
  now: Date,
  timeZone: string,
) {
  const [, action, recordId, monthKey] = callbackData.split(':');
  if (!callbackData.startsWith('auto:') || !recordId || !/^\d{4}-\d{2}$/.test(monthKey ?? '')) {
    return null;
  }

  const [year, month] = monthKey.split('-').map(Number);
  const context = await getMonthlyContextForMonth(userId, repo, monthKey, now);
  const todayKey = getLocalDateParts(now, timeZone).dateKey;

  if (action === 'payinv') {
    const cardItems = context.invoiceItems.filter(item => item.card_id === recordId);
    const payableTransactionIds = cardItems
      .map(item => findInvoiceTransaction(item, context.transactions))
      .filter((transaction): transaction is TelegramAutomationTransaction => Boolean(transaction))
      .filter(transaction => transaction.status === 'pendente')
      .map(transaction => transaction.id);

    if (payableTransactionIds.length === 0) {
      return { text: 'ℹ️ <b>Essa fatura já estava quitada ou sem lançamentos pendentes.</b>' };
    }

    await repo.updateTransactionsStatus(payableTransactionIds, 'pago');
    return { text: `✅ <b>Fatura marcada como paga</b>\n\nAtualizei ${payableTransactionIds.length} lançamento${payableTransactionIds.length === 1 ? '' : 's'} de ${formatMonthYear(year, month)}.` };
  }

  if (action === 'payfix') {
    const bill = context.fixedBills.find(item => item.id === recordId);
    if (!bill) return { text: '⚠️ <b>Não encontrei essa conta fixa.</b>' };
    if (bill.dynamicStatus === 'pago') return { text: 'ℹ️ <b>Essa conta fixa já estava marcada como paga.</b>' };

    await repo.insertFixedBillPayment({
      userId,
      billId: bill.id,
      monthKey,
      description: bill.description,
      amount: Number(bill.amount),
      categoryId: bill.category_id,
      date: todayKey,
    });
    return { text: `✅ <b>Conta fixa marcada como paga</b>\n\n${escapeTelegramHtml(bill.description)} · ${formatCurrency(Number(bill.amount))}` };
  }

  return null;
}

async function getMonthlyContext(
  userId: string,
  repo: TelegramAutomationRepository,
  now: Date,
  timeZone: string,
) {
  const local = getLocalDateParts(now, timeZone);
  return getMonthlyContextForMonth(userId, repo, `${local.year}-${String(local.month).padStart(2, '0')}`, now);
}

async function getMonthlyContextForMonth(
  userId: string,
  repo: TelegramAutomationRepository,
  monthKey: string,
  now: Date,
) {
  const monthRange = buildMonthRange(monthKey);
  const [transactions, invoiceItems, fixedBills, cards] = await Promise.all([
    repo.listMonthTransactions({ userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
    repo.listMonthInvoiceItems({ userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
    repo.listFixedBills(userId),
    repo.listCreditCards(userId),
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
  const openInvoiceItems = invoiceItems.filter(item => {
    const transaction = findInvoiceTransaction(item, normalizedTransactions);
    return !transaction || transaction.status !== 'pago';
  });
  const fixedBillsTotal = mappedBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const unpaidFixedBills = mappedBills
    .filter(bill => bill.dynamicStatus !== 'pago')
    .reduce((sum, bill) => sum + Number(bill.amount), 0);
  const openInvoicesTotal = openInvoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    monthKey,
    transactions: normalizedTransactions,
    invoiceItems,
    openInvoiceItems,
    fixedBills: mappedBills,
    creditCards: cards,
    fixedBillsTotal,
    unpaidFixedBills,
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

function getCriticalCommitments(context: MonthlyContext, todayKey: string, daysAhead: number, includeOverdue: boolean) {
  const commitments: Array<{
    date: string;
    line: string;
    plainLine: string;
    shortLabel: string;
    callbackData?: string;
  }> = [];

  for (const bill of context.fixedBills) {
    if (bill.dynamicStatus === 'pago') continue;
    const dueDate = resolveMonthDate(context.monthKey, Number(bill.due_day));
    const daysUntil = diffDays(todayKey, dueDate);
    if ((!includeOverdue && daysUntil < 0) || daysUntil > daysAhead) continue;

    const status = daysUntil < 0 ? `${Math.abs(daysUntil)} dia${Math.abs(daysUntil) === 1 ? '' : 's'} em atraso` : daysUntil === 0 ? 'vence hoje' : `vence em ${daysUntil} dia${daysUntil === 1 ? '' : 's'}`;
    commitments.push({
      date: dueDate,
      line: `🏠 ${escapeTelegramHtml(bill.description)} · ${formatCurrency(Number(bill.amount))} · ${status}`,
      plainLine: `${bill.description} · ${formatCurrency(Number(bill.amount))} · ${status}`,
      shortLabel: bill.description,
      callbackData: `auto:payfix:${bill.id}:${context.monthKey}`,
    });
  }

  const invoiceGroups = groupOpenInvoicesByCard(context);
  for (const invoice of invoiceGroups) {
    const dueDate = resolveMonthDate(context.monthKey, invoice.dueDay);
    const daysUntil = diffDays(todayKey, dueDate);
    if ((!includeOverdue && daysUntil < 0) || daysUntil > daysAhead) continue;

    const status = daysUntil < 0 ? `${Math.abs(daysUntil)} dia${Math.abs(daysUntil) === 1 ? '' : 's'} em atraso` : daysUntil === 0 ? 'vence hoje' : `vence em ${daysUntil} dia${daysUntil === 1 ? '' : 's'}`;
    commitments.push({
      date: dueDate,
      line: `💳 Fatura ${escapeTelegramHtml(invoice.name)} · ${formatCurrency(invoice.total)} · ${status}`,
      plainLine: `Fatura ${invoice.name} · ${formatCurrency(invoice.total)} · ${status}`,
      shortLabel: `fatura ${invoice.name}`,
      callbackData: `auto:payinv:${invoice.cardId}:${context.monthKey}`,
    });
  }

  return commitments.sort((left, right) => left.date.localeCompare(right.date));
}

function groupOpenInvoicesByCard(context: MonthlyContext) {
  const byCard = new Map<string, { cardId: string; name: string; dueDay: number; total: number }>();
  const cardsById = new Map(context.creditCards.map(card => [card.id, card]));

  for (const item of context.openInvoiceItems) {
    const cardId = item.card_id ?? item.credit_card?.id;
    if (!cardId) continue;
    const card = cardsById.get(cardId);
    const current = byCard.get(cardId);
    byCard.set(cardId, {
      cardId,
      name: current?.name ?? card?.name ?? item.credit_card?.name ?? 'Cartão',
      dueDay: current?.dueDay ?? Number(card?.due_day ?? 10),
      total: roundCurrency((current?.total ?? 0) + Number(item.amount)),
    });
  }

  return [...byCard.values()];
}

function findInvoiceTransaction(item: TelegramAutomationInvoiceItem, transactions: TelegramAutomationTransaction[]) {
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

function sumTransactions(transactions: TelegramAutomationTransaction[], type: TransactionType) {
  return roundCurrency(transactions
    .filter(transaction => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0));
}

function getTopExpenseCategory(transactions: TelegramAutomationTransaction[]) {
  const byCategory = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'gasto') continue;
    const category = transaction.category?.name ?? 'Sem categoria';
    byCategory.set(category, (byCategory.get(category) ?? 0) + Number(transaction.amount));
  }

  const [name, total] = [...byCategory.entries()].sort(([, left], [, right]) => right - left)[0] ?? [];
  return name ? { name, total: roundCurrency(total) } : null;
}

function resolveMonthDate(monthKey: string, day: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function diffDays(fromDate: string, toDate: string) {
  const [fromYear, fromMonth, fromDay] = fromDate.split('-').map(Number);
  const [toYear, toMonth, toDay] = toDate.split('-').map(Number);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((to - from) / 86_400_000);
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  dateKey: string;
}

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));

  return {
    year,
    month,
    day,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: weekdayMap[get('weekday')] ?? 0,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(roundCurrency(value)).replace(/\u00A0/g, ' ');
}

function formatDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '');
}

function formatMonthYear(year: number, month: number) {
  const monthName = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return `${monthName}/${year}`;
}

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildFixedBillPaymentPayload(input: {
  description: string;
  amount: number;
  categoryId: string | null;
  date: string;
  billId: string;
}) {
  const transactionPayload = buildTransactionPayload({
    type: 'gasto',
    description: `Pagamento: ${input.description}`,
    amount: input.amount,
    date: input.date,
    paymentMethod: 'pix',
    categoryId: input.categoryId,
    notes: `fixed_bill:${input.billId}`,
  });

  return {
    ...transactionPayload,
    notes: `fixed_bill:${input.billId}`,
  };
}
