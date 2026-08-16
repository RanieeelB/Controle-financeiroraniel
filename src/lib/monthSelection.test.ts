import { describe, expect, it } from 'vitest';
import {
  buildMonthRange,
  formatMonthLabel,
  getCurrentMonthKey,
  moveMonth,
  resolveMonthRange,
  toLocalDateKey,
  type MonthRange,
} from './monthSelection';

describe('local date selection', () => {
  it.each([
    [new Date(2026, 7, 31, 23, 59, 59), '2026-08-31', '2026-08'],
    [new Date(2026, 8, 1, 0, 0, 1), '2026-09-01', '2026-09'],
    [new Date(2027, 0, 1, 0, 0, 1), '2027-01-01', '2027-01'],
  ])('keeps the local date and month coherent for %s', (date, dateKey, monthKey) => {
    expect(toLocalDateKey(date)).toBe(dateKey);
    expect(getCurrentMonthKey(date)).toBe(monthKey);
  });
});

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

describe('monthSelection', () => {
  it('builds an inclusive start and exclusive end range', () => {
    expect(buildMonthRange('2026-05')).toEqual({
      monthKey: '2026-05',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
    });
  });

  it('moves between months across year boundaries', () => {
    expect(moveMonth('2026-01', -1)).toBe('2025-12');
    expect(moveMonth('2026-12', 1)).toBe('2027-01');
  });

  it('formats the selected month in Brazilian Portuguese', () => {
    expect(formatMonthLabel('2026-05')).toBe('Maio de 2026');
  });
  it('builds the current month key from a date', () => {
    expect(getCurrentMonthKey(new Date('2026-05-08T12:00:00'))).toBe('2026-05');
  });
});
