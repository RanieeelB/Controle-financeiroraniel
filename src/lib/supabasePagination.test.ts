import { describe, expect, it, vi } from 'vitest';
import { collectSupabasePages, SUPABASE_PAGE_SIZE } from './supabasePagination';

describe('Supabase pagination', () => {
  it('keeps reading after capped short pages and advances by the returned length', async () => {
    const rows = ['a', 'b', 'c', 'd', 'e'];
    const fetchPage = vi.fn(async (from: number, to: number) => ({
      data: rows.slice(from, Math.min(from + 2, to + 1)),
      error: null,
    }));

    await expect(collectSupabasePages(fetchPage)).resolves.toEqual(rows);
    expect(fetchPage.mock.calls).toEqual([
      [0, 999],
      [2, 1001],
      [4, 1003],
      [5, 1004],
    ]);
  });

  it('requests the next page after an exact 1000-row boundary and stops on empty', async () => {
    const rows = Array.from({ length: SUPABASE_PAGE_SIZE }, (_, index) => index);
    const fetchPage = vi.fn(async (from: number, to: number) => ({
      data: rows.slice(from, to + 1),
      error: null,
    }));

    const result = await collectSupabasePages(fetchPage);

    expect(result).toEqual(rows);
    expect(fetchPage.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it('propagates the page error without requesting another range', async () => {
    const error = new Error('query failed');
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ data: ['a'], error: null })
      .mockResolvedValueOnce({ data: null, error });

    await expect(collectSupabasePages(fetchPage)).rejects.toBe(error);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
