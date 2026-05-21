import { describe, expect, it } from 'vitest';
import {
  buildBalanceCarryoverPayload,
  buildBalanceCarryoverTransactionNote,
  getPreviousMonthRange,
} from './monthlyBalanceCarryover';

describe('monthly balance carryover helpers', () => {
  it('creates a received income payload for a positive previous month balance', () => {
    expect(buildBalanceCarryoverPayload({
      targetMonthKey: '2026-06',
      previousMonthTransactions: [
        { type: 'entrada', amount: 6500, status: 'recebido' },
        { type: 'gasto', amount: 5700, status: 'pago' },
      ],
    })).toEqual({
      type: 'entrada',
      description: 'Sobra do mês Maio',
      amount: 800,
      date: '2026-06-01',
      status: 'recebido',
      payment_method: 'transferencia',
      category_id: null,
      notes: buildBalanceCarryoverTransactionNote('2026-06'),
    });
  });

  it('does not create a payload when the previous month balance is zero or negative', () => {
    expect(buildBalanceCarryoverPayload({
      targetMonthKey: '2026-06',
      previousMonthTransactions: [
        { type: 'entrada', amount: 1000, status: 'recebido' },
        { type: 'gasto', amount: 1000, status: 'pago' },
      ],
    })).toBeNull();

    expect(buildBalanceCarryoverPayload({
      targetMonthKey: '2026-06',
      previousMonthTransactions: [
        { type: 'entrada', amount: 1000, status: 'recebido' },
        { type: 'gasto', amount: 1200, status: 'pago' },
      ],
    })).toBeNull();
  });

  it('ignores pending transactions when calculating the carried balance', () => {
    expect(buildBalanceCarryoverPayload({
      targetMonthKey: '2026-06',
      previousMonthTransactions: [
        { type: 'entrada', amount: 1000, status: 'recebido' },
        { type: 'entrada', amount: 5000, status: 'pendente' },
        { type: 'gasto', amount: 300, status: 'pago' },
        { type: 'gasto', amount: 2000, status: 'pendente' },
      ],
    })?.amount).toBe(700);
  });

  it('resolves the previous month range for January across the year boundary', () => {
    expect(getPreviousMonthRange('2026-01')).toEqual({
      monthKey: '2025-12',
      startDate: '2025-12-01',
      endDate: '2026-01-01',
    });
  });
});
