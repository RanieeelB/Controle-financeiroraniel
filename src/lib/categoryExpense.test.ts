import { describe, expect, it } from 'vitest';
import { buildCategoryExpenseData } from './categoryExpense';
import type { Category, Transaction } from '../types/financial';

const baseCategory = {
  user_id: null,
  icon: 'tag',
  type: 'gasto',
  created_at: '',
} satisfies Pick<Category, 'user_id' | 'icon' | 'type' | 'created_at'>;

const base = {
  id: 'tx',
  user_id: null,
  category_id: null,
  type: 'gasto',
  description: 'x',
  amount: 0,
  date: '2026-05-08',
  status: 'pago',
  payment_method: 'pix',
  notes: null,
  created_at: '2026-05-08',
} satisfies Transaction;

describe('buildCategoryExpenseData', () => {
  it('groups expenses by category and sorts by amount', () => {
    const result = buildCategoryExpenseData([
      {
        ...base,
        id: '1',
        amount: 20,
        category: { ...baseCategory, id: 'a', name: 'Lazer', color: '#ffba79' },
      },
      {
        ...base,
        id: '2',
        amount: 50,
        category: { ...baseCategory, id: 'b', name: 'Mercado', color: '#75ff9e' },
      },
      { ...base, id: '3', amount: 10, type: 'entrada' },
    ]);

    expect(result.map(item => item.name)).toEqual(['Mercado', 'Lazer']);
  });

  it('groups smaller categories into Outros when above the limit', () => {
    const result = buildCategoryExpenseData(
      Array.from({ length: 6 }, (_, index) => ({
        ...base,
        id: String(index),
        amount: 100 - index,
        category: {
          ...baseCategory,
          id: String(index),
          name: `Cat ${index}`,
          color: '#75ff9e',
        },
      })),
      5,
    );

    expect(result).toHaveLength(5);
    expect(result.at(-1)?.name).toBe('Outros');
    expect(result.at(-1)?.value).toBe(191);
  });
});
