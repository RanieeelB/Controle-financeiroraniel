# Invoice Fallback And Fixed Bill Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix invoice payment actions for legacy credit purchases without linked notes and allow fixed bills to be marked back to pending by removing their monthly payment transaction.

**Architecture:** Add a pure invoice matching fallback that first prefers explicit `invoice_item:<id>` links and then matches legacy credit transactions by purchase signature. Extract fixed-bill monthly payment resolution into a reusable helper so the pages and dashboard can toggle paid state by deleting the linked payment transactions for the selected month.

**Tech Stack:** React, TypeScript, Vitest, Supabase

---

## Chunk 1: Legacy Invoice Matching

### Task 1: Cover legacy invoice matching with tests

**Files:**
- Modify: `src/lib/invoicePayments.test.ts`

- [ ] Step 1: Write failing tests for invoice items without `notes` links
- [ ] Step 2: Run `npm test -- src/lib/invoicePayments.test.ts` and confirm the new case fails
- [ ] Step 3: Implement the minimal fallback matching in `src/lib/invoicePayments.ts`
- [ ] Step 4: Re-run `npm test -- src/lib/invoicePayments.test.ts`

## Chunk 2: Fixed Bill Toggle

### Task 2: Resolve paid fixed-bill transactions by month

**Files:**
- Create: `src/lib/fixedBillPayments.ts`
- Create: `src/lib/fixedBillPayments.test.ts`
- Modify: `src/types/financial.ts`
- Modify: `src/hooks/useFixedBills.ts`
- Modify: `src/hooks/useDashboardData.ts`

- [ ] Step 1: Write failing tests for monthly fixed-bill payment resolution
- [ ] Step 2: Run `npm test -- src/lib/fixedBillPayments.test.ts` and confirm the new case fails
- [ ] Step 3: Implement the minimal helper and thread its output into fixed-bill view models
- [ ] Step 4: Re-run `npm test -- src/lib/fixedBillPayments.test.ts`

### Task 3: Toggle fixed-bill monthly payments in the UI

**Files:**
- Modify: `src/lib/financialActions.ts`
- Modify: `src/pages/FixedBills.tsx`
- Modify: `src/components/dashboard/UpcomingBills.tsx`

- [ ] Step 1: Add a remove-payment action for fixed bills
- [ ] Step 2: Toggle the bill action button between pay and reopen/remove
- [ ] Step 3: Run targeted tests, then `npm run lint` and `npm run build`
