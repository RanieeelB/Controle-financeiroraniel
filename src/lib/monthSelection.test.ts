import { describe, expect, it } from 'vitest';
import { resolveMonthRange, type MonthRange } from './monthSelection';

describe('resolveMonthRange', () => {
  it('uses the current local month when no range is supplied', () => {
    expect(resolveMonthRange(undefined, new Date(2026, 0, 15, 12))).toEqual({
      monthKey: '2026-01',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    });
  });

  it('preserves an explicitly supplied month range', () => {
    const selectedRange: MonthRange = {
      monthKey: '2025-12',
      startDate: '2025-12-01',
      endDate: '2026-01-01',
    };

    expect(resolveMonthRange(selectedRange, new Date(2026, 0, 15, 12))).toBe(selectedRange);
  });
});
