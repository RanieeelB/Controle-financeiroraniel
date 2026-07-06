# Remove Monthly Balance Carryover Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop creating `Sobra do mês anterior` transactions and exclude legacy carryover rows from all UI and financial calculations without deleting database records.

**Architecture:** Add a small shared helper that identifies and filters legacy carryover transactions by `notes`, then apply that helper in the central transaction-loading hooks so downstream dashboards, totals, and lists inherit a clean dataset. Remove the layout-triggered carryover automation and delete the now-dead carryover-specific files and action paths.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase, Capacitor Android

---

## Chunk 1: Legacy carryover filtering helper

### Task 1: Add detection and filtering helpers with TDD

**Files:**
- Create: `src/lib/legacyCarryover.ts`
- Create: `src/lib/legacyCarryover.test.ts`
- Delete: `src/lib/monthlyBalanceCarryover.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/legacyCarryover.test.ts`
Expected: FAIL because `./legacyCarryover` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
const LEGACY_CARRYOVER_PREFIX = 'carryover:auto:';

export function isLegacyCarryoverTransaction(transaction: { notes?: string | null }) {
  return transaction.notes?.startsWith(LEGACY_CARRYOVER_PREFIX) === true;
}

export function filterLegacyCarryoverTransactions<T extends { notes?: string | null }>(transactions: T[]) {
  return transactions.filter(transaction => !isLegacyCarryoverTransaction(transaction));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/legacyCarryover.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/legacyCarryover.ts src/lib/legacyCarryover.test.ts src/lib/monthlyBalanceCarryover.test.ts
git status --short
git diff --cached
git commit -m "refactor: add legacy carryover filter helpers"
```

## Chunk 2: Read-path filtering

### Task 2: Filter carryover rows in transaction hooks with regression tests

**Files:**
- Modify: `src/hooks/useTransactions.ts`
- Modify: `src/hooks/useDashboardData.ts`
- Modify: `src/lib/financialPlanning.test.ts`
- Modify: `src/lib/balanceEvolution.test.ts`
- Use: `src/lib/legacyCarryover.ts`

- [ ] **Step 1: Write the failing tests**

Add a regression case to `src/lib/financialPlanning.test.ts`:

```ts
it('ignores legacy carryover entries before building dashboard summary inputs', () => {
  const visibleTransactions = filterLegacyCarryoverTransactions([
    { type: 'entrada', amount: 800, status: 'recebido', notes: 'carryover:auto:2026-06' },
    { type: 'entrada', amount: 5000, status: 'recebido', notes: 'salary:auto:2026-06' },
    { type: 'gasto', amount: 1200, status: 'pago', notes: null },
  ]);

  expect(calculateSummaryCards({
    transactions: visibleTransactions,
    savedAmount: 0,
    openInvoices: 0,
    fixedBillsTotal: 0,
    unpaidFixedBills: 0,
  }).currentBalance).toBe(3800);
});
```

Add a regression case to `src/lib/balanceEvolution.test.ts`:

```ts
it('does not include filtered legacy carryover entries in the running balance', () => {
  expect(buildBalanceEvolution(filterLegacyCarryoverTransactions([
    { type: 'entrada', amount: 500, date: '2026-05-01', status: 'recebido', notes: 'carryover:auto:2026-05' },
    { type: 'entrada', amount: 1000, date: '2026-05-02', status: 'recebido', notes: null },
    { type: 'gasto', amount: 300, date: '2026-05-03', status: 'pago', notes: null },
  ]), new Date('2026-05-10'))).toEqual([
    { label: '02', balance: 1000 },
    { label: '03', balance: 700 },
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/financialPlanning.test.ts src/lib/balanceEvolution.test.ts`
Expected: FAIL until the new helper import and filtering path are wired correctly.

- [ ] **Step 3: Write minimal implementation**

Apply `filterLegacyCarryoverTransactions(...)`:

- immediately after transaction mapping in `src/hooks/useTransactions.ts`;
- immediately after transaction mapping in `src/hooks/useDashboardData.ts`;
- before dashboard totals and derived datasets are computed.

Keep the filter centralized so screens using these hooks inherit the same behavior automatically.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/legacyCarryover.test.ts src/lib/financialPlanning.test.ts src/lib/balanceEvolution.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTransactions.ts src/hooks/useDashboardData.ts src/lib/financialPlanning.test.ts src/lib/balanceEvolution.test.ts src/lib/legacyCarryover.ts src/lib/legacyCarryover.test.ts
git status --short
git diff --cached
git commit -m "refactor: hide legacy carryover from financial views"
```

## Chunk 3: Remove automatic creation and dead code

### Task 3: Remove the carryover automation entry points

**Files:**
- Modify: `src/components/layout/Layout.tsx`
- Modify: `src/lib/financialActions.ts`
- Delete: `src/hooks/useAutoBalanceCarryover.ts`
- Delete: `src/lib/monthlyBalanceCarryover.ts`

- [ ] **Step 1: Write the failing test**

Extend `src/lib/legacyCarryover.test.ts` with a guard that locks the detection contract and proves we do not need carryover creation helpers anymore:

```ts
it('treats only the carryover note prefix as legacy carryover', () => {
  expect(isLegacyCarryoverTransaction({ notes: 'carryover:auto:2026-07' })).toBe(true);
  expect(isLegacyCarryoverTransaction({ notes: 'investment_deposit:123' })).toBe(false);
});
```

This test should already be close to green, but write it first before deleting the old files so the replacement contract is explicit.

- [ ] **Step 2: Run test to verify current safety net**

Run: `npm test -- src/lib/legacyCarryover.test.ts`
Expected: PASS, confirming the replacement contract exists before deleting the old automation code.

- [ ] **Step 3: Write minimal implementation**

- Remove `useAutoBalanceCarryover` import/call from `src/components/layout/Layout.tsx`.
- Remove `ensureMonthlyBalanceCarryoverTransaction` and the carryover-specific imports from `src/lib/financialActions.ts`.
- Delete `src/hooks/useAutoBalanceCarryover.ts`.
- Delete `src/lib/monthlyBalanceCarryover.ts`.

- [ ] **Step 4: Run focused verification**

Run: `npm test -- src/lib/legacyCarryover.test.ts src/lib/financialPlanning.test.ts src/lib/balanceEvolution.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Layout.tsx src/lib/financialActions.ts src/lib/legacyCarryover.test.ts
git add -u src/hooks/useAutoBalanceCarryover.ts src/lib/monthlyBalanceCarryover.ts src/lib/monthlyBalanceCarryover.test.ts
git status --short
git diff --cached
git commit -m "refactor: remove monthly balance carryover automation"
```

## Chunk 4: Full verification and Android sync

### Task 4: Run full project checks for the feature branch state

**Files:**
- Modify: none expected

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- src/lib/legacyCarryover.test.ts src/lib/financialPlanning.test.ts src/lib/balanceEvolution.test.ts`
Expected: PASS.

- [ ] **Step 2: Run broader validation**

Run: `npm run test`
Expected: PASS, or document any unrelated pre-existing failure with exact file names.

Run: `npm run lint`
Expected: PASS, or document any unrelated pre-existing failure with exact file names.

- [ ] **Step 3: Sync Android project**

Run: `npm run android:sync`
Expected: Android project updates successfully.

If the script does not exist, document that `package.json` has no `android:sync` script and do not invent a replacement in the same commit.

- [ ] **Step 4: Review final diff**

```bash
git status --short
git diff --stat
git diff
```

Expected: only carryover-removal code and tests are present, plus any generated Android sync changes that are intended to be committed.

- [ ] **Step 5: Final commit**

```bash
git add .
git status --short
git diff --cached
git commit -m "refactor: remove monthly balance carryover"
```
