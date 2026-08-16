import type { CategoryExpenseData, Transaction } from '../types/financial';

const fallbackExpenseColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#859585', '#ffb4ab'];
const otherColor = '#859585';

export function buildCategoryExpenseData(transactions: Transaction[], limit = 5): CategoryExpenseData[] {
  const byCategory = new Map<string, { value: number; color: string }>();

  transactions
    .filter(transaction => transaction.type === 'gasto')
    .forEach(transaction => {
      const name = transaction.category?.name ?? 'Sem categoria';
      const color = transaction.category?.color ?? fallbackExpenseColors[byCategory.size % fallbackExpenseColors.length];
      const current = byCategory.get(name);
      byCategory.set(name, {
        value: (current?.value ?? 0) + transaction.amount,
        color: current?.color ?? color,
      });
    });

  const sorted = [...byCategory.entries()]
    .sort(([, left], [, right]) => right.value - left.value)
    .map(([name, data]) => ({ name, value: data.value, color: data.color }));

  if (sorted.length <= limit) return sorted;

  const visibleCount = Math.max(1, limit - 1);
  const visible = sorted.slice(0, visibleCount);
  const otherValue = sorted
    .slice(visibleCount)
    .reduce((sum, item) => sum + item.value, 0);

  return [
    ...visible,
    {
      name: 'Outros',
      value: otherValue,
      color: otherColor,
    },
  ];
}
