# Categories Monthly Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add default/custom categories, fix the dashboard category pie chart, and make financial pages filter by selected month.

**Architecture:** Add pure helpers for monthly ranges, default category definitions, and category expense aggregation, then wire those helpers into existing Supabase hooks and layout state. Keep data in the current Supabase schema and derive historical months from each record's `date` field instead of creating snapshot tables.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase JS, Recharts, Tailwind CSS v4, lucide-react.

---

## File Structure

- Create `src/lib/monthSelection.ts`: selected month key/range helpers and display labels.
- Create `src/lib/monthSelection.test.ts`: TDD coverage for month key and inclusive/exclusive ranges.
- Create `src/lib/defaultCategories.ts`: default category records and helper definitions.
- Create `src/lib/defaultCategories.test.ts`: coverage for expected category names and types.
- Create `src/lib/categoryExpense.ts`: pure category aggregation for the dashboard chart.
- Create `src/lib/categoryExpense.test.ts`: coverage for grouping, sorting, and `Outros`.
- Modify `src/lib/financialActions.ts`: add `createCategory` and `ensureDefaultCategories`.
- Modify `src/hooks/useCategories.ts`: ensure defaults and expose category creation refresh behavior.
- Modify `src/hooks/useDashboardData.ts`: accept a month range and use category aggregation helper.
- Modify `src/hooks/useTransactions.ts`: accept a month range and query by `date`.
- Modify `src/hooks/useCreditCards.ts`: accept a month range for invoice items.
- Modify `src/pages/Dashboard.tsx`: read selected month from layout context.
- Modify `src/pages/Incomes.tsx`: filter by selected month.
- Modify `src/pages/Expenses.tsx`: filter by selected month.
- Modify `src/pages/Reports.tsx`: filter transactions and invoice items by selected month.
- Modify `src/pages/Cards.tsx` and/or `src/pages/Invoices.tsx`: pass selected month to card/invoice data where applicable.
- Modify `src/components/layout/Layout.tsx`: store selected month and provide context.
- Modify `src/components/layout/DashboardHeader.tsx`: add previous/next month controls and dynamic label.
- Modify `src/components/dashboard/NewTransactionModal.tsx`: add quick category creation.
- Modify `src/components/dashboard/CategoryExpenseChart.tsx`: improve layout and empty state.
- Modify `src/pages/Settings.tsx`: add simple categories section with list/create.
- Optionally modify `supabase/seed.sql`: document default categories for manual database seeding.

## Chunk 1: Month State and Query Range

### Task 1: Add Month Selection Helpers

**Files:**
- Create: `src/lib/monthSelection.ts`
- Test: `src/lib/monthSelection.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm test -- src/lib/monthSelection.test.ts`

Expected: FAIL because `src/lib/monthSelection.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal helper module**

Implement:

```ts
export interface MonthRange {
  monthKey: string;
  startDate: string;
  endDate: string;
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildMonthRange(monthKey: string): MonthRange {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    monthKey,
    startDate: toDateKey(start),
    endDate: toDateKey(end),
  };
}

export function moveMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month - 1 + offset, 1);
  return getCurrentMonthKey(next);
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run the tests to verify GREEN**

Run: `npm test -- src/lib/monthSelection.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git status --short
git diff
git add src/lib/monthSelection.ts src/lib/monthSelection.test.ts
git commit -m "feat: add month selection helpers"
```

### Task 2: Add Selected Month State to Layout

**Files:**
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/components/layout/DashboardHeader.tsx`

- [ ] **Step 1: Write a failing test if a UI test harness exists**

This repo does not currently have React Testing Library configured. Do not add a new UI testing stack only for this task. Cover behavior through pure helper tests from Task 1 and verify manually after implementation.

- [ ] **Step 2: Implement layout state and header controls**

In `Layout.tsx`:

- import `buildMonthRange`, `formatMonthLabel`, `getCurrentMonthKey`, and `moveMonth`.
- create `selectedMonthKey` state initialized with `getCurrentMonthKey()`.
- compute `selectedMonthRange`.
- pass `monthLabel`, `onPreviousMonth`, and `onNextMonth` to `DashboardHeader`.
- provide `selectedMonthRange` to routed pages through `Outlet context`.

In `DashboardHeader.tsx`:

- replace the static month subtitle with the supplied month label.
- wire the calendar button area into previous/next month icon buttons and the label.
- keep `Novo lançamento` behavior unchanged.

- [ ] **Step 3: Build-check**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git status --short
git diff
git add src/components/layout/Layout.tsx src/components/layout/DashboardHeader.tsx
git commit -m "feat: add monthly navigation header"
```

## Chunk 2: Categories

### Task 3: Add Default Category Definitions

**Files:**
- Create: `src/lib/defaultCategories.ts`
- Test: `src/lib/defaultCategories.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { defaultCategories } from './defaultCategories';

describe('defaultCategories', () => {
  it('includes the requested expense categories', () => {
    const names = defaultCategories.filter(category => category.type !== 'entrada').map(category => category.name);

    expect(names).toEqual(expect.arrayContaining(['Estudo', 'Transporte', 'Lazer', 'iFood']));
  });

  it('includes useful income categories', () => {
    const names = defaultCategories.filter(category => category.type !== 'gasto').map(category => category.name);

    expect(names).toEqual(expect.arrayContaining(['Salario', 'Freela', 'Rendimentos']));
  });

  it('uses valid category types and colors', () => {
    expect(defaultCategories.every(category => ['entrada', 'gasto', 'ambos'].includes(category.type))).toBe(true);
    expect(defaultCategories.every(category => /^#[0-9a-f]{6}$/i.test(category.color))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm test -- src/lib/defaultCategories.test.ts`

Expected: FAIL because the module does not exist yet.

- [ ] **Step 3: Implement default definitions**

Use ASCII names where the codebase currently favors ASCII in source files:

```ts
export interface DefaultCategoryDefinition {
  name: string;
  icon: string;
  type: 'entrada' | 'gasto' | 'ambos';
  color: string;
}

export const defaultCategories: DefaultCategoryDefinition[] = [
  { name: 'Estudo', icon: 'book-open', type: 'gasto', color: '#7bd0ff' },
  { name: 'Transporte', icon: 'bus', type: 'gasto', color: '#ffba79' },
  { name: 'Lazer', icon: 'gamepad-2', type: 'gasto', color: '#fdb878' },
  { name: 'iFood', icon: 'utensils', type: 'gasto', color: '#ffb4ab' },
  { name: 'Mercado', icon: 'shopping-cart', type: 'gasto', color: '#75ff9e' },
  { name: 'Casa', icon: 'home', type: 'gasto', color: '#bacbb9' },
  { name: 'Saude', icon: 'heart-pulse', type: 'gasto', color: '#ffdad6' },
  { name: 'Assinaturas', icon: 'repeat', type: 'gasto', color: '#c4e7ff' },
  { name: 'Compras', icon: 'shopping-bag', type: 'gasto', color: '#ffdcbf' },
  { name: 'Outros', icon: 'tag', type: 'ambos', color: '#859585' },
  { name: 'Salario', icon: 'briefcase', type: 'entrada', color: '#75ff9e' },
  { name: 'Freela', icon: 'laptop', type: 'entrada', color: '#7bd0ff' },
  { name: 'Rendimentos', icon: 'trending-up', type: 'entrada', color: '#00e676' },
  { name: 'Reembolso', icon: 'receipt', type: 'entrada', color: '#ffba79' },
  { name: 'Outros recebimentos', icon: 'plus-circle', type: 'entrada', color: '#859585' },
];
```

- [ ] **Step 4: Run the tests to verify GREEN**

Run: `npm test -- src/lib/defaultCategories.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git status --short
git diff
git add src/lib/defaultCategories.ts src/lib/defaultCategories.test.ts
git commit -m "feat: add default financial categories"
```

### Task 4: Add Category Creation and Bootstrap Actions

**Files:**
- Modify: `src/lib/financialActions.ts`
- Modify: `src/hooks/useCategories.ts`

- [ ] **Step 1: Write a failing unit test for payload normalization if helper extraction is needed**

If `createCategory` uses inline Supabase calls only, skip adding brittle tests around Supabase mocking. Keep coverage on `defaultCategories` and verify through the app.

- [ ] **Step 2: Implement `createCategory`**

Add to `financialActions.ts`:

```ts
export interface CreateCategoryInput {
  name: string;
  type: Category['type'];
  color: string;
  icon?: string;
}

export async function createCategory(input: CreateCategoryInput) {
  const payload = {
    name: input.name.trim(),
    type: input.type,
    color: input.color,
    icon: input.icon?.trim() || 'tag',
  };

  if (!payload.name) throw new Error('Informe o nome da categoria.');

  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  emitFinancialDataChanged();
  return data as Category;
}
```

- [ ] **Step 3: Implement `ensureDefaultCategories`**

Add a function that:

- selects existing `name,type` from `categories`;
- compares against `defaultCategories`;
- inserts missing defaults;
- does not duplicate categories already present;
- emits `financialDataChanged` only after inserting missing rows.

- [ ] **Step 4: Wire bootstrap into `useCategories`**

In `useCategories.ts`, before fetching categories:

- call `ensureDefaultCategories()` once per app session or once inside `fetchCategories`;
- avoid an infinite loop by not relying only on emitted events for the initial refresh.

- [ ] **Step 5: Run validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git status --short
git diff
git add src/lib/financialActions.ts src/hooks/useCategories.ts
git commit -m "feat: bootstrap and create categories"
```

### Task 5: Add Category Creation UI

**Files:**
- Modify: `src/components/dashboard/NewTransactionModal.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Add modal state and small form in New Transaction**

In `NewTransactionModal.tsx`:

- import `Plus` from `lucide-react`.
- import `createCategory`.
- add state for inline category form visibility, name, type, color, and saving/error.
- show a `Nova categoria` button near the category label.
- on submit, call `createCategory`, refresh `useCategories`, and set `categoryId` to the new category id.

- [ ] **Step 2: Add categories section to Settings**

In `Settings.tsx`:

- replace the placeholder-only view with a page section for categories.
- call `useCategories()` with no type to list all categories.
- add a compact create form with name, type, and color.
- call `createCategory`, then `refetch`.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`

Manual checks:

- open the app;
- open "Novo lançamento";
- confirm default categories appear;
- create a category;
- confirm the category appears in the select;
- open Configurações;
- confirm categories are listed.

- [ ] **Step 4: Run validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git status --short
git diff
git add src/components/dashboard/NewTransactionModal.tsx src/pages/Settings.tsx
git commit -m "feat: add category creation UI"
```

## Chunk 3: Monthly Filtering

### Task 6: Filter Dashboard and Transaction Hooks by Month

**Files:**
- Modify: `src/hooks/useDashboardData.ts`
- Modify: `src/hooks/useTransactions.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Incomes.tsx`
- Modify: `src/pages/Expenses.tsx`

- [ ] **Step 1: Write failing helper tests where possible**

Month range behavior is already covered in Task 1. Do not mock Supabase for hook query chains unless the project already has that pattern.

- [ ] **Step 2: Update hook signatures**

Update:

```ts
export function useDashboardData(monthRange: MonthRange)
export function useTransactions(type?: 'entrada' | 'gasto', monthRange?: MonthRange)
```

Add Supabase filters:

```ts
.gte('date', monthRange.startDate)
.lt('date', monthRange.endDate)
```

Ensure callback dependencies include `monthRange.startDate` and `monthRange.endDate`, not the whole object if it changes each render.

- [ ] **Step 3: Read selected month from Outlet context in pages**

In dashboard, incomes, and expenses pages:

- import `useOutletContext`.
- define a small context type with `selectedMonthRange`.
- pass the range to each hook.

- [ ] **Step 4: Run validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git status --short
git diff
git add src/hooks/useDashboardData.ts src/hooks/useTransactions.ts src/pages/Dashboard.tsx src/pages/Incomes.tsx src/pages/Expenses.tsx
git commit -m "feat: filter dashboard transactions by month"
```

### Task 7: Filter Reports and Invoices by Month

**Files:**
- Modify: `src/hooks/useCreditCards.ts`
- Modify: `src/pages/Reports.tsx`
- Modify: `src/pages/Cards.tsx`
- Modify: `src/pages/Invoices.tsx`

- [ ] **Step 1: Update `useCreditCards` signature**

Add optional `monthRange?: MonthRange`.

Filter `invoice_items` by `date` when `monthRange` is supplied:

```ts
if (monthRange) {
  itemsQuery = itemsQuery
    .gte('date', monthRange.startDate)
    .lt('date', monthRange.endDate);
}
```

Cards should still load all card definitions.

- [ ] **Step 2: Wire pages to selected month**

Use Outlet context in `Reports.tsx`, `Cards.tsx`, and `Invoices.tsx`.

Pass the range to:

- `useTransactions(undefined, selectedMonthRange)` in Reports.
- `useCreditCards(selectedMonthRange)` in Reports, Cards, and Invoices.

- [ ] **Step 3: Run validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git status --short
git diff
git add src/hooks/useCreditCards.ts src/pages/Reports.tsx src/pages/Cards.tsx src/pages/Invoices.tsx
git commit -m "feat: filter card reports by month"
```

## Chunk 4: Category Expense Chart

### Task 8: Add Category Expense Aggregation Helper

**Files:**
- Create: `src/lib/categoryExpense.ts`
- Test: `src/lib/categoryExpense.test.ts`
- Modify: `src/hooks/useDashboardData.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildCategoryExpenseData } from './categoryExpense';
import type { Transaction } from '../types/financial';

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
      { ...base, id: '1', amount: 20, category: { id: 'a', user_id: null, name: 'Lazer', icon: 'tag', type: 'gasto', color: '#ffba79', created_at: '' } },
      { ...base, id: '2', amount: 50, category: { id: 'b', user_id: null, name: 'Mercado', icon: 'tag', type: 'gasto', color: '#75ff9e', created_at: '' } },
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
        category: { id: String(index), user_id: null, name: `Cat ${index}`, icon: 'tag', type: 'gasto', color: '#75ff9e', created_at: '' },
      })),
      5,
    );

    expect(result).toHaveLength(5);
    expect(result.at(-1)?.name).toBe('Outros');
  });
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `npm test -- src/lib/categoryExpense.test.ts`

Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Implement the helper**

Move existing category aggregation out of `useDashboardData.ts` into `categoryExpense.ts`, with a `limit = 5` parameter and `Outros` bucket.

- [ ] **Step 4: Wire dashboard data hook**

Replace local `buildCategoryExpense` in `useDashboardData.ts` with `buildCategoryExpenseData`.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/lib/categoryExpense.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git status --short
git diff
git add src/lib/categoryExpense.ts src/lib/categoryExpense.test.ts src/hooks/useDashboardData.ts
git commit -m "feat: aggregate category expenses"
```

### Task 9: Redesign Category Expense Chart

**Files:**
- Modify: `src/components/dashboard/CategoryExpenseChart.tsx`

- [ ] **Step 1: Implement responsive layout**

Update `CategoryExpenseChart` to:

- use `min-h-[320px]`;
- render an empty state when `data.length === 0`;
- use a larger stable chart area, for example `h-[190px] w-full`;
- use `innerRadius` around `54` and `outerRadius` around `82`;
- move legend into a separate `ul` below the chart with wrapping and values;
- keep tooltip formatting in BRL.

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`

Open the app and check:

- dashboard chart no longer covers legend or center icon;
- empty month state is readable;
- mobile/narrow viewport does not overlap.

- [ ] **Step 3: Run validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git status --short
git diff
git add src/components/dashboard/CategoryExpenseChart.tsx
git commit -m "fix: improve category expense chart layout"
```

## Chunk 5: Final Verification

### Task 10: Full App Verification

**Files:**
- No planned file edits unless verification finds issues.

- [ ] **Step 1: Run full validation**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all pass. Build may warn about chunk size; this is acceptable if it matches the existing Vite warning.

- [ ] **Step 2: Manual acceptance checks**

Run: `npm run dev`

Check:

- default categories appear without manual database seed;
- creating a category from the transaction modal works;
- creating a category from Configurações works;
- Dashboard, Entradas, Gastos, Relatórios, Cartões, and Faturas update when changing month;
- May data remains visible when selecting May after changing to June;
- the category chart is readable and not covered.

- [ ] **Step 3: Final status review**

Run:

```bash
git status --short --branch
git log --oneline -8
```

Expected: clean worktree after final commit, with small conventional commits.

