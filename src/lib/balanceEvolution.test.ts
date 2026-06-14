import { describe, expect, it } from 'vitest';
import { buildBalanceEvolution } from './balanceEvolution';

describe('buildBalanceEvolution', () => {
  it('does not include future transactions in the running balance', () => {
    expect(buildBalanceEvolution([
      { type: 'entrada', amount: 6500, date: '2026-05-01', status: 'recebido' },
      { type: 'gasto', amount: 3000, date: '2026-05-03', status: 'pago' },
    ], new Date('2026-05-01T12:00:00'))).toEqual([
      { label: '01', balance: 6500 },
    ]);
  });

  it('only includes received income and paid expenses', () => {
    expect(buildBalanceEvolution([
      { type: 'entrada', amount: 1000, date: '2026-05-01', status: 'recebido' },
      { type: 'entrada', amount: 500, date: '2026-05-02', status: 'pendente' },
      { type: 'gasto', amount: 300, date: '2026-05-03', status: 'pago' },
      { type: 'gasto', amount: 200, date: '2026-05-04', status: 'pendente' },
    ], new Date('2026-05-10'))).toEqual([
      { label: '01', balance: 1000 },
      { label: '03', balance: 700 },
    ]);
  });
});
