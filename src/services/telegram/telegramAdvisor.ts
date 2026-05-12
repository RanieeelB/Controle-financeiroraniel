import { GoogleGenAI } from '@google/genai';
import { buildMonthRange } from '../../lib/monthSelection.js';
import { calculateSummaryCards } from '../../lib/financialPlanning.js';
import { resolveDynamicFixedBills } from '../../lib/fixedBillPayments.js';
import type {
  FinancialGoal,
  FixedBill,
  Investment,
  SalarySetting,
  Transaction,
} from '../../types/financial.js';

interface AdvisorTransactionRecord extends Pick<Transaction, 'id' | 'type' | 'amount' | 'status' | 'notes'> {
  description?: string;
  date?: string;
  payment_method?: Transaction['payment_method'];
}

interface AdvisorInvoiceItemRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface AdvisorConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TelegramAdvisorRepository {
  listMonthTransactions(input: { userId: string; startDate: string; endDate: string }): Promise<AdvisorTransactionRecord[]>;
  listMonthInvoiceItems(input: { userId: string; startDate: string; endDate: string }): Promise<AdvisorInvoiceItemRecord[]>;
  listFixedBills(userId: string): Promise<FixedBill[]>;
  listInvestments(userId: string): Promise<Investment[]>;
  listFinancialGoals(userId: string): Promise<FinancialGoal[]>;
  getSalarySettings(userId: string): Promise<Pick<SalarySetting, 'amount' | 'day_of_month'> | null>;
  listRecentConversationMessages(input: { userId: string; telegramChatId: string; limit: number }): Promise<AdvisorConversationMessage[]>;
  saveConversationMessage(input: {
    userId: string;
    telegramChatId: string;
    telegramUserId: string;
    role: 'user' | 'assistant';
    content: string;
  }): Promise<void>;
}

interface GenerateContentClient {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config?: {
        temperature?: number;
      };
    }): Promise<{ text?: string | (() => string) }>;
  };
}

interface CreateTelegramAdvisorOptions {
  apiKey: string;
  model?: string;
  repo: TelegramAdvisorRepository;
  client?: GenerateContentClient;
  now?: Date;
  timeZone?: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const HISTORY_LIMIT = 12;

export function createTelegramAdvisor(options: CreateTelegramAdvisorOptions) {
  const client = options.client ?? new GoogleGenAI({ apiKey: options.apiKey });
  const model = options.model?.trim() || DEFAULT_MODEL;

  return {
    reply: async (input: {
      userId: string;
      telegramChatId: string;
      telegramUserId: string;
      message: string;
    }) => {
      const now = options.now ?? new Date();
      const monthKey = `${getYear(now, options.timeZone)}-${String(getMonth(now, options.timeZone)).padStart(2, '0')}`;
      const monthRange = buildMonthRange(monthKey);

      try {
        const [transactions, invoiceItems, fixedBills, investments, goals, salarySetting, history] = await Promise.all([
          options.repo.listMonthTransactions({ userId: input.userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
          options.repo.listMonthInvoiceItems({ userId: input.userId, startDate: monthRange.startDate, endDate: monthRange.endDate }),
          options.repo.listFixedBills(input.userId),
          options.repo.listInvestments(input.userId),
          options.repo.listFinancialGoals(input.userId),
          options.repo.getSalarySettings(input.userId),
          options.repo.listRecentConversationMessages({ userId: input.userId, telegramChatId: input.telegramChatId, limit: HISTORY_LIMIT }),
        ]);

        const prompt = buildAdvisorPrompt({
          userMessage: input.message,
          history,
          monthKey,
          now,
          salarySetting,
          transactions,
          invoiceItems,
          fixedBills,
          investments,
          goals,
        });

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.5,
          },
        });

        const text = normalizeResponseText(response);
        const safeText = text || getFallbackAdviceMessage();

        await options.repo.saveConversationMessage({
          userId: input.userId,
          telegramChatId: input.telegramChatId,
          telegramUserId: input.telegramUserId,
          role: 'user',
          content: input.message,
        });

        await options.repo.saveConversationMessage({
          userId: input.userId,
          telegramChatId: input.telegramChatId,
          telegramUserId: input.telegramUserId,
          role: 'assistant',
          content: safeText,
        });

        return safeText;
      } catch {
        return getFallbackAdviceMessage();
      }
    },
  };
}

function buildAdvisorPrompt(input: {
  userMessage: string;
  history: AdvisorConversationMessage[];
  monthKey: string;
  now: Date;
  salarySetting: Pick<SalarySetting, 'amount' | 'day_of_month'> | null;
  transactions: AdvisorTransactionRecord[];
  invoiceItems: AdvisorInvoiceItemRecord[];
  fixedBills: FixedBill[];
  investments: Investment[];
  goals: FinancialGoal[];
}) {
  const normalizedTransactions = input.transactions.map(transaction => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));

  const mappedBills = resolveDynamicFixedBills({
    bills: input.fixedBills,
    payments: normalizedTransactions.map(transaction => ({
      id: transaction.id,
      notes: transaction.notes,
      status: transaction.status,
    })),
    monthKey: input.monthKey,
    today: input.now,
  });

  const fixedBillsTotal = mappedBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const unpaidFixedBills = mappedBills
    .filter(bill => bill.dynamicStatus !== 'pago')
    .reduce((sum, bill) => sum + Number(bill.amount), 0);
  const openInvoices = input.invoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const savedAmount = input.goals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
  const summary = calculateSummaryCards({
    transactions: normalizedTransactions,
    savedAmount,
    openInvoices,
    fixedBillsTotal,
    unpaidFixedBills,
  });

  const topExpenses = aggregateTopExpenses(normalizedTransactions);
  const investmentCurrentValue = input.investments.reduce((sum, investment) => sum + Number(investment.current_value), 0);
  const investmentMonthlyContribution = input.investments.reduce((sum, investment) => sum + Number(investment.monthly_contribution ?? 0), 0);
  const goalSummary = input.goals.map(goal =>
    `- ${goal.title}: guardado ${formatCurrency(Number(goal.current_amount))} de ${formatCurrency(Number(goal.target_amount))}`,
  ).join('\n') || '- Nenhuma meta cadastrada';
  const investmentSummary = input.investments.map(investment =>
    `- ${investment.name}: atual ${formatCurrency(Number(investment.current_value))}, aporte mensal ${formatCurrency(Number(investment.monthly_contribution ?? 0))}`,
  ).join('\n') || '- Nenhum investimento cadastrado';
  const fixedBillSummary = mappedBills.map(bill =>
    `- ${bill.description}: ${formatCurrency(Number(bill.amount))} (${bill.dynamicStatus})`,
  ).join('\n') || '- Nenhuma conta fixa cadastrada';
  const historyBlock = input.history.map(message => `${message.role === 'user' ? 'Usuario' : 'Consultor'}: ${message.content}`).join('\n') || 'Sem historico anterior.';

  return [
    'Você é um consultor financeiro pessoal conversacional dentro do Telegram.',
    'Fale apenas sobre finanças pessoais, orçamento, cartão, contas fixas, investimentos, metas e planejamento.',
    'Se o usuário sair do tema, redirecione com gentileza para finanças.',
    'Use tom humano, direto, prestativo e objetivo. Não invente dados ausentes.',
    'Nunca diga que é um modelo treinado; aja como um consultor com acesso ao contexto financeiro do usuário.',
    '',
    `Mes de referencia: ${input.monthKey}`,
    `Salario configurado: ${input.salarySetting ? `${formatCurrency(Number(input.salarySetting.amount))} no dia ${input.salarySetting.day_of_month}` : 'nao configurado'}`,
    `Resumo atual: entradas ${formatCurrency(summary.totalIncome)}, gastos ${formatCurrency(summary.totalExpense)}, contas fixas ${formatCurrency(summary.fixedBillsTotal)}, faturas em aberto ${formatCurrency(summary.openInvoices)}, sobra prevista ${formatCurrency(summary.projectedBalance)}`,
    `Investimentos: total atual ${formatCurrency(investmentCurrentValue)}, aportes mensais ${formatCurrency(investmentMonthlyContribution)}`,
    '',
    'Top gastos do mes:',
    topExpenses,
    '',
    'Contas fixas:',
    fixedBillSummary,
    '',
    'Investimentos:',
    investmentSummary,
    '',
    'Metas financeiras:',
    goalSummary,
    '',
    'Historico recente da conversa:',
    historyBlock,
    '',
    `Mensagem atual do usuario: ${input.userMessage}`,
    '',
    'Responda em portugues do Brasil, em texto puro adequado para Telegram, com orientacoes praticas e personalizadas.',
  ].join('\n');
}

function aggregateTopExpenses(transactions: AdvisorTransactionRecord[]) {
  const grouped = new Map<string, number>();
  transactions
    .filter(transaction => transaction.type === 'gasto')
    .forEach(transaction => {
      const key = transaction.description ?? 'Sem descricao';
      grouped.set(key, (grouped.get(key) ?? 0) + Number(transaction.amount));
    });

  const lines = [...grouped.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([description, amount]) => `- ${description}: ${formatCurrency(amount)}`);

  return lines.join('\n') || '- Nenhum gasto no periodo';
}

function normalizeResponseText(response: { text?: string | (() => string) }) {
  const rawText = typeof response.text === 'function' ? response.text() : response.text ?? '';
  return rawText.trim();
}

function getFallbackAdviceMessage() {
  return 'Estou como seu consultor financeiro agora, mas nao consegui montar uma resposta confiavel neste momento. Tente perguntar de novo sobre gastos, cartao, contas fixas, investimentos ou metas.';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\u00A0/g, ' ');
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
