import { describe, expect, it } from 'vitest';
import { buildBalanceEvolution } from './balanceEvolution';

describe('buildBalanceEvolution', () => {
  it('does not include future transactions in the running balance', () => {
    expect(buildBalanceEvolution([
      { type: 'entrada', amount: 6500, date: '2026-05-01' },
      { type: 'gasto', amount: 3000, date: '2026-05-03' },
    ], new Date('2026-05-01T12:00:00'))).toEqual([
      { label: '01', balance: 6500 },
    ]);
  });
});
