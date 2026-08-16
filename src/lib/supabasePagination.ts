export const SUPABASE_PAGE_SIZE = 1000;

export interface SupabasePage<T> {
  data: T[] | null;
  error: unknown;
}

export async function collectSupabasePages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<SupabasePage<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw error;

    const page = data ?? [];
    if (page.length === 0) return rows;

    rows.push(...page);
    from += page.length;
  }
}
