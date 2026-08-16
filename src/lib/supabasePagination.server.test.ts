import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createTelegramWebhookRepository } from '../../api/_shared/telegramServer';

type QueryOperation = [name: string, ...arguments_: unknown[]];

function createQueryClient(
  respond: (input: { table: string; operations: QueryOperation[] }) => { data: Record<string, unknown>[] | null; error: unknown },
) {
  const calls: Array<{ table: string; operations: QueryOperation[] }> = [];
  const client = {
    from(table: string) {
      const call = { table, operations: [] as QueryOperation[] };
      calls.push(call);
      const query = new Proxy({}, {
        get(_target, property) {
          if (property === 'then') {
            return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise
              .resolve(respond(call))
              .then(resolve, reject);
          }

          return (...arguments_: unknown[]) => {
            call.operations.push([String(property), ...arguments_]);
            return query;
          };
        },
      });
      return query;
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

function rangeFrom(operations: QueryOperation[]) {
  return operations.find(([name]) => name === 'range')?.[1] as number;
}

describe('Telegram repository pagination', () => {
  it('combines capped transaction pages using the requested user, month, and stable order', async () => {
    const rows: Record<string, unknown>[] = [
      { id: 'tx-3', type: 'gasto', amount: '30', status: 'pendente', notes: null, date: '2026-08-20' },
      { id: 'tx-2', type: 'gasto', amount: '20', status: 'pago', notes: null, date: '2026-08-20' },
      { id: 'tx-1', type: 'entrada', amount: '100', status: 'recebido', notes: null, date: '2026-08-01' },
    ];
    const { client, calls } = createQueryClient(({ operations }) => {
      const from = rangeFrom(operations);
      return { data: rows.slice(from, from + 2), error: null };
    });
    const repo = createTelegramWebhookRepository(client);

    const result = await repo.listMonthTransactions({
      userId: 'user-1',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
    });

    expect(result.map(transaction => transaction.id)).toEqual(['tx-3', 'tx-2', 'tx-1']);
    expect(result.map(transaction => transaction.amount)).toEqual([30, 20, 100]);
    expect(calls.map(call => call.operations.find(([name]) => name === 'range'))).toEqual([
      ['range', 0, 999],
      ['range', 2, 1001],
      ['range', 3, 1002],
    ]);
    for (const call of calls) {
      expect(call.table).toBe('transactions');
      expect(call.operations).toContainEqual(['eq', 'user_id', 'user-1']);
      expect(call.operations).toContainEqual(['gte', 'date', '2026-08-01']);
      expect(call.operations).toContainEqual(['lt', 'date', '2026-09-01']);
      expect(call.operations).toContainEqual(['order', 'date', { ascending: false }]);
      expect(call.operations).toContainEqual(['order', 'id', { ascending: true }]);
    }
  });

  it('propagates a later transaction page error', async () => {
    const error = new Error('second page failed');
    const { client, calls } = createQueryClient(({ operations }) => rangeFrom(operations) === 0
      ? { data: [{ id: 'tx-1' }], error: null }
      : { data: null, error });
    const repo = createTelegramWebhookRepository(client);

    await expect(repo.listMonthTransactions({
      userId: 'user-1',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
    })).rejects.toBe(error);
    expect(calls.map(call => call.operations.find(([name]) => name === 'range'))).toEqual([
      ['range', 0, 999],
      ['range', 1, 1000],
    ]);
  });

  it('maps every persisted Investment field required by Telegram actions', async () => {
    const { client } = createQueryClient(({ operations }) => rangeFrom(operations) === 0
      ? {
          data: [{
            id: 'investment-1',
            user_id: 'user-1',
            name: 'Reserva',
            ticker: null,
            category: 'renda_fixa',
            amount_invested: '1200',
            current_value: '1300',
            return_percentage: '8.33',
            monthly_contribution: '200',
            last_auto_contribution_at: null,
            icon: 'piggy-bank',
            goal_id: 'goal-1',
            suggested_investment_percentage: '15',
            created_at: '2026-08-01T00:00:00Z',
          }],
          error: null,
        }
      : { data: [], error: null });
    const repo = createTelegramWebhookRepository(client);

    await expect(repo.listInvestments('user-1')).resolves.toEqual([expect.objectContaining({
      icon: 'piggy-bank',
      goal_id: 'goal-1',
      suggested_investment_percentage: 15,
    })]);
  });
});
