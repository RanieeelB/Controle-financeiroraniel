import { describe, expect, it } from 'vitest';
import { buildMonthRange, formatMonthLabel, getCurrentMonthKey, moveMonth } from './monthSelection';

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
    expect(formatMonthLabel('2026-05')).toBe('Maio 2026');
  });

  it('builds the current month key from a date', () => {
    expect(getCurrentMonthKey(new Date('2026-05-08T12:00:00'))).toBe('2026-05');
  });
});
