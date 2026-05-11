import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createTelegramLinkService, type TelegramConnectionRecord } from '../../src/services/telegram/telegramLinkService';
import type { FixedBill, Transaction } from '../../src/types/financial';

export function getServerEnv() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Configuração do servidor incompleta para Supabase.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

export function getTelegramWebhookEnv() {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } = getServerEnv();
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
  const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? '';

  if (!telegramBotToken || !telegramWebhookSecret) {
    throw new Error('Configuração do servidor incompleta para o webhook do Telegram.');
  }

  return {
    telegramBotToken,
    telegramWebhookSecret,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

export function createSupabaseAdminClient() {
  const env = getServerEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAnonServerClient() {
  const env = getServerEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireAuthenticatedUser(accessToken: string) {
  const supabase = createSupabaseAnonServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error('Sessão inválida para gerar token do Telegram.');
  }

  return data.user;
}

export function getBearerToken(headers: Record<string, string | string[] | undefined>) {
  const direct = headers.authorization;
  const value = typeof direct === 'string' ? direct : Array.isArray(direct) ? direct[0] : undefined;

  if (!value?.startsWith('Bearer ')) return null;
  return value.slice('Bearer '.length).trim() || null;
}

export function createTelegramLinkRepository(supabase: SupabaseClient) {
  return {
    async getConnectionByUserId(userId: string): Promise<TelegramConnectionRecord | null> {
      const { data, error } = await supabase
        .from('telegram_connections')
        .select('id, user_id, link_token_hash, token_generated_at, telegram_user_id, telegram_chat_id, linked_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    async saveGeneratedToken(input: { userId: string; tokenHash: string; generatedAt: string; }) {
      const { data, error } = await supabase
        .from('telegram_connections')
        .upsert({
          user_id: input.userId,
          link_token_hash: input.tokenHash,
          token_generated_at: input.generatedAt,
          updated_at: input.generatedAt,
        }, { onConflict: 'user_id' })
        .select('id, user_id, link_token_hash, token_generated_at, telegram_user_id, telegram_chat_id, linked_at')
        .single();

      if (error) throw error;
      return data;
    },
    async getConnectionByTelegramUserId(telegramUserId: string) {
      const { data, error } = await supabase
        .from('telegram_connections')
        .select('id, user_id, telegram_user_id')
        .eq('telegram_user_id', telegramUserId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    async getConnectionByTokenHash(tokenHash: string): Promise<TelegramConnectionRecord | null> {
      const { data, error } = await supabase
        .from('telegram_connections')
        .select('id, user_id, link_token_hash, token_generated_at, telegram_user_id, telegram_chat_id, linked_at')
        .eq('link_token_hash', tokenHash)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    async consumeTokenLink(input: { connectionId: string; telegramUserId: string; telegramChatId: string; linkedAt: string; }) {
      const { error } = await supabase
        .from('telegram_connections')
        .update({
          telegram_user_id: input.telegramUserId,
          telegram_chat_id: input.telegramChatId,
          linked_at: input.linkedAt,
          link_token_hash: null,
          updated_at: input.linkedAt,
        })
        .eq('id', input.connectionId);

      if (error) throw error;
    },
  };
}

export function createTelegramWebhookRepository(supabase: SupabaseClient) {
  const linkRepo = createTelegramLinkRepository(supabase);

  return {
    ...linkRepo,
    async getLinkedConnectionByTelegramUserId(telegramUserId: string) {
      const { data, error } = await supabase
        .from('telegram_connections')
        .select('id, user_id, telegram_user_id, telegram_chat_id, linked_at')
        .eq('telegram_user_id', telegramUserId)
        .not('linked_at', 'is', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    async findCategoryByNameOrAliases(input: {
      userId: string;
      type: Transaction['type'];
      names: string[];
    }) {
      const { data, error } = await supabase
        .from('categories')
        .select('id, user_id, name, type')
        .eq('user_id', input.userId)
        .in('name', input.names)
        .in('type', [input.type, 'ambos'])
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    async createCategory(input: {
      userId: string;
      name: string;
      type: 'entrada' | 'gasto' | 'ambos';
      color: string;
      icon: string;
    }) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: input.userId,
          name: input.name,
          type: input.type,
          color: input.color,
          icon: input.icon,
        })
        .select('id, user_id, name, type')
        .single();

      if (error) throw error;
      return data;
    },
    async insertTransaction(input: {
      userId: string;
      type: Transaction['type'];
      description: string;
      amount: number;
      date: string;
      status: Transaction['status'];
      paymentMethod: Transaction['payment_method'];
      categoryId: string | null;
      notes: string | null;
    }) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: input.userId,
          type: input.type,
          description: input.description,
          amount: input.amount,
          date: input.date,
          status: input.status,
          payment_method: input.paymentMethod,
          category_id: input.categoryId,
          notes: input.notes,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    async listMonthTransactions(input: { userId: string; startDate: string; endDate: string }) {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, status, notes, description, date, payment_method')
        .eq('user_id', input.userId)
        .gte('date', input.startDate)
        .lt('date', input.endDate);

      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(transaction => ({
        id: String(transaction.id),
        type: transaction.type as Transaction['type'],
        amount: Number(transaction.amount),
        status: transaction.status as Transaction['status'],
        notes: typeof transaction.notes === 'string' ? transaction.notes : null,
        description: typeof transaction.description === 'string' ? transaction.description : undefined,
        date: typeof transaction.date === 'string' ? transaction.date : undefined,
        payment_method: transaction.payment_method as Transaction['payment_method'] | undefined,
      }));
    },
    async listMonthInvoiceItems(input: { userId: string; startDate: string; endDate: string }) {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, amount, description, date')
        .eq('user_id', input.userId)
        .gte('date', input.startDate)
        .lt('date', input.endDate);

      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(item => ({
        id: String(item.id),
        amount: Number(item.amount),
        description: String(item.description ?? ''),
        date: String(item.date ?? ''),
      }));
    },
    async listFixedBills(userId: string) {
      const { data, error } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_day', { ascending: true });

      if (error) throw error;
      return ((data ?? []) as Array<Record<string, unknown>>).map(bill => ({
        id: String(bill.id),
        user_id: typeof bill.user_id === 'string' ? bill.user_id : null,
        description: String(bill.description ?? ''),
        category_id: typeof bill.category_id === 'string' ? bill.category_id : null,
        amount: Number(bill.amount),
        due_day: Number(bill.due_day),
        status: bill.status as FixedBill['status'],
        icon: String(bill.icon ?? 'receipt'),
        created_at: String(bill.created_at ?? ''),
      }));
    },
  };
}

export function createTelegramLinkTokenService() {
  const supabase = createSupabaseAdminClient();
  const repo = createTelegramLinkRepository(supabase);
  return createTelegramLinkService({ repo });
}

export async function resolveSessionUserFromHeaders(headers: Record<string, string | string[] | undefined>) {
  const accessToken = getBearerToken(headers);
  if (!accessToken) {
    throw new Error('Usuário não autenticado para gerar token do Telegram.');
  }

  return requireAuthenticatedUser(accessToken);
}

export type AuthenticatedUser = User;
