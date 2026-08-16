// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransactions } from './useTransactions';

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }));

type QueryOperation = [name: string, ...arguments_: unknown[]];

describe('useTransactions pagination', () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it('combines short pages and rebuilds the filtered stable query for every range', async () => {
    const rows = [
      { id: 'tx-3', type: 'gasto', amount: '30', status: 'pendente', notes: null, date: '2026-08-20' },
      { id: 'tx-2', type: 'gasto', amount: '20', status: 'pago', notes: null, date: '2026-08-20' },
      { id: 'tx-1', type: 'gasto', amount: '10', status: 'pago', notes: null, date: '2026-08-01' },
    ];
    const calls: QueryOperation[][] = [];
    supabaseMock.from.mockImplementation(() => {
      const operations: QueryOperation[] = [];
      calls.push(operations);
      const query = new Proxy({}, {
        get(_target, property) {
          if (property === 'then') {
            return (resolve: (value: unknown) => unknown) => {
              const from = operations.find(([name]) => name === 'range')?.[1] as number;
              return Promise.resolve({ data: rows.slice(from, from + 2), error: null }).then(resolve);
            };
          }
          return (...arguments_: unknown[]) => {
            operations.push([String(property), ...arguments_]);
            return query;
          };
        },
      });
      return query;
    });

    const { result } = renderHook(() => useTransactions('gasto', {
      monthKey: '2026-08',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.transactions.map(transaction => transaction.id)).toEqual(['tx-3', 'tx-2', 'tx-1']);
    expect(result.current.totals).toMatchObject({ total: 60, count: 3 });
    expect(calls.map(operations => operations.find(([name]) => name === 'range'))).toEqual([
      ['range', 0, 999],
      ['range', 2, 1001],
      ['range', 3, 1002],
    ]);
    for (const operations of calls) {
      expect(operations).toContainEqual(['eq', 'type', 'gasto']);
      expect(operations).toContainEqual(['gte', 'date', '2026-08-01']);
      expect(operations).toContainEqual(['lt', 'date', '2026-09-01']);
      expect(operations).toContainEqual(['order', 'date', { ascending: false }]);
      expect(operations).toContainEqual(['order', 'id', { ascending: true }]);
    }
  });
});
