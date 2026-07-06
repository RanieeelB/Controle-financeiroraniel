import { describe, expect, it } from 'vitest';
import {
  filterLegacyCarryoverTransactions,
  isLegacyCarryoverTransaction,
} from './legacyCarryover';

describe('legacy carryover helpers', () => {
  it('detects carryover transactions by note prefix', () => {
    expect(isLegacyCarryoverTransaction({ notes: 'carryover:auto:2026-06' })).toBe(true);
    expect(isLegacyCarryoverTransaction({ notes: 'salary:auto:2026-06' })).toBe(false);
    expect(isLegacyCarryoverTransaction({ notes: null })).toBe(false);
  });

  it('filters carryover transactions out of mixed arrays', () => {
    expect(filterLegacyCarryoverTransactions([
      { id: '1', notes: 'carryover:auto:2026-06' },
      { id: '2', notes: 'salary:auto:2026-06' },
      { id: '3', notes: null },
    ])).toEqual([
      { id: '2', notes: 'salary:auto:2026-06' },
      { id: '3', notes: null },
    ]);
  });

  it('treats only the carryover note prefix as legacy carryover', () => {
    expect(isLegacyCarryoverTransaction({ notes: 'carryover:auto:2026-07' })).toBe(true);
    expect(isLegacyCarryoverTransaction({ notes: 'investment_deposit:123' })).toBe(false);
  });
});
