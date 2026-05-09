# Invoice Batch Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standard monthly due day to credit cards and let users stage multiple invoice purchases in one modal before saving the whole invoice.

**Architecture:** Keep `due_day` persisted on `credit_cards`, expose it through the existing card modal and card views, and implement invoice batch entry as UI state inside the invoice modal. Persist the batch through a new action that orchestrates repeated calls to the existing single-purchase creation flow so installment behavior stays unchanged.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase

---

## File Map

- Modify: `src/lib/financialPayloads.ts`
- Modify: `src/lib/financialPayloads.test.ts`
- Modify: `src/lib/financialActions.ts`
- Modify: `src/components/finance/FinanceModals.tsx`
- Modify: `src/pages/Cards.tsx`
- Modify: `src/pages/Invoices.tsx`

## Chunk 1: Payloads and Persistence

### Task 1: Add failing tests for card due day payload support

**Files:**
- Modify: `src/lib/financialPayloads.test.ts`
- Modify: `src/lib/financialPayloads.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('maps the due day into the credit card payload', () => {
  expect(buildCreditCardPayload({
    bank: 'Nubank',
    brand: 'Mastercard',
    lastDigits: '1234',
    dueDay: 25,
  })).toMatchObject({
    due_day: 25,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: FAIL because `dueDay` is not yet accepted or `due_day` remains the old default.

- [ ] **Step 3: Write minimal implementation**

Update `CreditCardPayloadInput` and `buildCreditCardPayload` to accept `dueDay` and clamp it into the valid `1..31` range.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS for the new due day assertion and existing payload tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/financialPayloads.ts src/lib/financialPayloads.test.ts
git commit -m "types: support card due day payload"
```

### Task 2: Add failing tests for batch purchase persistence helper

**Files:**
- Modify: `src/lib/financialPayloads.test.ts`
- Modify: `src/lib/financialActions.ts`

- [ ] **Step 1: Write the failing test**

Add a focused unit test around a small exported helper that validates a batch item shape or total, for example:

```ts
it('prepares batch invoice items without losing installment fields', () => {
  const items = normalizeInvoicePurchaseBatch([
    {
      description: 'Mercado',
      amount: 250,
      date: '2026-05-09',
      categoryId: 'cat-1',
      totalInstallments: 3,
      currentInstallment: 2,
    },
  ]);

  expect(items).toEqual([
    expect.objectContaining({
      description: 'Mercado',
      amount: 250,
      totalInstallments: 3,
      currentInstallment: 2,
    }),
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: FAIL because the batch helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create a small reusable helper in `src/lib/financialActions.ts` or `src/lib/financialPayloads.ts` that normalizes a batch array, then implement `createCreditPurchasesBatch` on top of the existing `createCreditPurchase`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS with the new batch helper covered.

- [ ] **Step 5: Commit**

```bash
git add src/lib/financialActions.ts src/lib/financialPayloads.test.ts
git commit -m "feat: add credit invoice batch persistence"
```

## Chunk 2: User Interface

### Task 3: Add due day editing to the card modal

**Files:**
- Modify: `src/components/finance/FinanceModals.tsx`

- [ ] **Step 1: Write the failing test**

If extracting a pure validator/helper is practical, add a minimal unit test first. If not, use the existing payload test coverage as the red step and proceed to the modal wiring.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: Existing payload test covers missing modal input indirectly until UI is wired.

- [ ] **Step 3: Write minimal implementation**

Add a numeric `Dia do vencimento` field to `CreditCardModal`, initialize it from `card?.due_day ?? 10`, validate `1..31`, and pass it into `createCreditCard` / `updateCreditCard`.

- [ ] **Step 4: Run targeted verification**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/finance/FinanceModals.tsx
git commit -m "feat: add due day field to credit card modal"
```

### Task 4: Convert invoice purchase modal into batch-entry flow

**Files:**
- Modify: `src/components/finance/FinanceModals.tsx`
- Modify: `src/lib/financialActions.ts`

- [ ] **Step 1: Write the failing test**

If a pure helper is extracted for subtotal or item reset, add a test first. Otherwise, use the earlier batch helper test as the red coverage and then wire the UI around it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: FAIL until the helper or behavior is implemented.

- [ ] **Step 3: Write minimal implementation**

Refactor `InvoicePurchaseModal` to:

- keep the selected card stable
- add items to a temporary batch list
- show a batch summary list with remove buttons
- keep the modal open while adding items
- persist the whole batch only when `Salvar fatura` is clicked

- [ ] **Step 4: Run targeted verification**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/finance/FinanceModals.tsx src/lib/financialActions.ts
git commit -m "feat: add invoice batch entry modal"
```

### Task 5: Surface due day on cards and invoices pages

**Files:**
- Modify: `src/pages/Cards.tsx`
- Modify: `src/pages/Invoices.tsx`

- [ ] **Step 1: Write the failing test**

No existing page-level test harness is present, so use the prior red-green helper coverage and perform careful manual verification after implementation.

- [ ] **Step 2: Run baseline verification**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS before touching the pages.

- [ ] **Step 3: Write minimal implementation**

Render `Vence todo dia X` in both pages using `card.due_day`.

- [ ] **Step 4: Run targeted verification**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Cards.tsx src/pages/Invoices.tsx
git commit -m "feat: show card due day in invoice views"
```

## Chunk 3: Full Verification

### Task 6: Run full project verification

**Files:**
- Modify: `src/components/finance/FinanceModals.tsx`
- Modify: `src/lib/financialActions.ts`
- Modify: `src/lib/financialPayloads.ts`
- Modify: `src/lib/financialPayloads.test.ts`
- Modify: `src/pages/Cards.tsx`
- Modify: `src/pages/Invoices.tsx`

- [ ] **Step 1: Run the focused tests**

Run: `npm test -- src/lib/financialPayloads.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS with zero failing tests.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS with zero lint errors.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS and produce the Vite build successfully.

- [ ] **Step 5: Review git state before any final wrap-up**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the intended files changed.
