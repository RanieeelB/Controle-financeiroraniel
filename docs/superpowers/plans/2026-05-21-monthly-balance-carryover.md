# Monthly Balance Carryover Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically create a visible income transaction on day 1 with the positive balance left from the previous month.

**Architecture:** Add pure carryover helpers in `src/lib/monthlyBalanceCarryover.ts`, wire an idempotent Supabase action in `src/lib/financialActions.ts`, and run it from a small hook in `src/hooks/useAutoBalanceCarryover.ts`. The UI does not need new controls because the transaction appears in existing income/dashboard views.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase JS, existing transaction table.

---

## File Structure

- Create `src/lib/monthlyBalanceCarryover.ts`: date/month helpers, balance calculation, note, and transaction payload.
- Create `src/lib/monthlyBalanceCarryover.test.ts`: TDD coverage for positive, zero/negative, and pending-ignored behavior.
- Modify `src/lib/financialActions.ts`: add `ensureMonthlyBalanceCarryoverTransaction`.
- Create `src/hooks/useAutoBalanceCarryover.ts`: call the action from React.
- Modify `src/components/layout/Layout.tsx`: run the hook beside salary/investment automations.

## Chunk 1: Pure Carryover Helpers

### Task 1: Helper Behavior

**Files:**
- Create: `src/lib/monthlyBalanceCarryover.test.ts`
- Create: `src/lib/monthlyBalanceCarryover.ts`

- [ ] **Step 1: Write failing tests**
  - Test positive May balance creates June 1 income named `Sobra do mês Maio`.
  - Test zero/negative previous balance returns `null`.
  - Test pending transactions are ignored.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npm test -- src/lib/monthlyBalanceCarryover.test.ts`
  - Expected: fail because module/helper does not exist.

- [ ] **Step 3: Implement minimal helper**
  - Export note builder, previous-month range resolver, balance calculator, and payload builder.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npm test -- src/lib/monthlyBalanceCarryover.test.ts`
  - Expected: pass.

## Chunk 2: Supabase Action and Hook

### Task 2: Automatic Creation

**Files:**
- Modify: `src/lib/financialActions.ts`
- Create: `src/hooks/useAutoBalanceCarryover.ts`
- Modify: `src/components/layout/Layout.tsx`

- [ ] **Step 1: Wire idempotent action**
  - Check current user.
  - Skip if selected month is not the real current month.
  - Skip if `carryover:auto:<monthKey>` already exists.
  - Fetch previous-month transactions.
  - Insert payload only when helper returns a positive carryover.

- [ ] **Step 2: Add hook**
  - Call the action in an effect and log failures like `useAutoSalary`.

- [ ] **Step 3: Run validations**
  - Run: `npm test`
  - Run: `npm run lint`
  - Run: `npm run android:sync`

- [ ] **Step 4: Commit**
  - Commit: `feat: add monthly balance carryover`
