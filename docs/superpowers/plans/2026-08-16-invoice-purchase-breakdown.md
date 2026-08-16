# Invoice Purchase Breakdown Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show cash purchases, installment purchases, and the total invoice for each month, with installment ending forecasts in invoice and projection details.

**Architecture:** A pure invoice-breakdown module normalizes external values, sums currency in cents, and produces discriminated purchase-schedule metadata. `useCreditCards` exposes per-card summaries, while financial projections reuse the same helper and carry typed card metadata to presentation components. Existing invoice persistence and payment/reopen flows remain unchanged.

**Tech Stack:** React 19, TypeScript 6, Vitest, Vite, Supabase JS, Tailwind CSS, Capacitor.

---

Implementation must follow `@test-driven-development`; final claims require `@verification-before-completion`. Execute this plan on `feat/invoice-purchase-breakdown`, created from the completed fixed-bill feature branch so the two concerns remain separately reviewable.

## Chunk 1: Invoice composition domain and invoice screen

### Task 1: Create the pure invoice breakdown module

**Files:**
- Create: `src/lib/invoiceBreakdown.ts`
- Create: `src/lib/invoiceBreakdown.test.ts`

- [ ] **Step 1: Write the complete failing normalization tests**

Cover empty, cash-only, installment-only, mixed, string amounts, zero/negative/non-numeric/infinite amounts, invalid totals, invalid current installment, same-month ending, year rollover, and invalid dates:

```ts
function makeItem(overrides: Record<string, unknown> = {}): InvoiceBreakdownItem {
  return {
    amount: 100, date: '2026-08-01', total_installments: 1, current_installment: 1,
    ...overrides,
  } as InvoiceBreakdownItem;
}

it('keeps total equal to cash plus installments using cents', () => {
  expect(summarizeInvoiceItems([
    { amount: '10.10', date: '2026-08-01', total_installments: 1, current_installment: 1 },
    { amount: '20.20', date: '2026-08-01', total_installments: 10, current_installment: 3 },
  ])).toEqual({ cashPurchases: 10.1, installmentPurchases: 20.2, total: 30.3 });
});

it('predicts an ending month across a year boundary', () => {
  expect(getInvoicePurchaseSchedule({
    amount: 100, date: '2026-08-05', total_installments: 10, current_installment: 3,
  })).toEqual({
    kind: 'installment', currentInstallment: 3, totalInstallments: 10, endingMonthKey: '2027-03',
  });
});

it('keeps an invalid-date installment with unavailable ending', () => {
  expect(getInvoicePurchaseSchedule({
    amount: 100, date: 'bad', total_installments: 3, current_installment: 1,
  })).toEqual({
    kind: 'installment', currentInstallment: 1, totalInstallments: 3, endingMonthKey: null,
  });
});

it.each([
  [undefined, 'cash'], [0, 'cash'], [-2, 'cash'], [2.5, 'cash'], ['3', 'cash'], [3, 'installment'],
])('normalizes total_installments=%s', (total, kind) => {
  expect(getInvoicePurchaseSchedule(makeItem({ total_installments: total }))).toMatchObject({ kind });
});

it.each([
  [undefined, 1], [0, 1], [-1, 1], [2.5, 1], ['3', 1], ['bad', 1], [99, 10], [3, 3],
])('normalizes current_installment=%s', (current, expected) => {
  expect(getInvoicePurchaseSchedule(makeItem({
    total_installments: 10, current_installment: current,
  }))).toMatchObject({ currentInstallment: expected, totalInstallments: 10 });
});

it.each([0, -1, 'bad', Number.NaN, Number.POSITIVE_INFINITY])('ignores invalid amount %s', amount => {
  expect(summarizeInvoiceItems([makeItem({ amount })])).toEqual({
    cashPurchases: 0, installmentPurchases: 0, total: 0,
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/invoiceBreakdown.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement normalization, cent totals, and schedule metadata**

```ts
export interface InvoiceBreakdownItem {
  amount: number | string;
  date: string;
  total_installments: number;
  current_installment: number;
}

export type InvoicePurchaseSchedule =
  | { kind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { kind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null };

function normalizeInstallmentCount(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 1 ? Number(value) : 1;
}

export function getInvoicePurchaseSchedule(item: InvoiceBreakdownItem): InvoicePurchaseSchedule {
  const totalInstallments = normalizeInstallmentCount(item.total_installments);
  if (totalInstallments === 1) {
    return { kind: 'cash', currentInstallment: null, totalInstallments: null, endingMonthKey: null };
  }
  const rawCurrent = item.current_installment;
  const currentInstallment = Number.isInteger(rawCurrent)
    ? Math.min(totalInstallments, Math.max(1, Number(rawCurrent)))
    : 1;
  const monthMatch = /^(\d{4})-(0[1-9]|1[0-2])(?:-|$)/.exec(item.date ?? '');
  const endingMonthKey = monthMatch
    ? moveMonth(`${monthMatch[1]}-${monthMatch[2]}`, totalInstallments - currentInstallment)
    : null;
  return { kind: 'installment', currentInstallment, totalInstallments, endingMonthKey };
}

export function summarizeInvoiceItems(items: InvoiceBreakdownItem[]) {
  let cashCents = 0;
  let installmentCents = 0;
  for (const item of items) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const cents = Math.round(amount * 100);
    if (getInvoicePurchaseSchedule(item).kind === 'installment') installmentCents += cents;
    else cashCents += cents;
  }
  return {
    cashPurchases: cashCents / 100,
    installmentPurchases: installmentCents / 100,
    total: (cashCents + installmentCents) / 100,
  };
}
```

Import `moveMonth` from `monthSelection`. Treat invalid `total_installments`, including numeric strings, as cash exactly as specified; only `amount` accepts numeric strings.

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run: `npm test -- src/lib/invoiceBreakdown.test.ts`

Expected: all invoice-breakdown cases PASS.

- [ ] **Step 5: Commit the pure module**

Run:

```bash
git status --short
git diff --check
git add -N src/lib/invoiceBreakdown.ts src/lib/invoiceBreakdown.test.ts
git diff -- src/lib/invoiceBreakdown.ts src/lib/invoiceBreakdown.test.ts
git add src/lib/invoiceBreakdown.ts src/lib/invoiceBreakdown.test.ts
git commit -m "feat: calculate invoice purchase breakdown"
```

Expected: pure helper commit created.

### Task 2: Expose card summaries from the credit-card hook

**Files:**
- Modify: `src/hooks/useCreditCards.ts`
- Create: `src/lib/creditCardInvoiceSummary.test.ts`
- Create: `src/lib/creditCardInvoiceSummary.ts`

- [ ] **Step 1: Write a failing filter-and-summary test**

```ts
it('summarizes only the requested card', () => {
  expect(getCardInvoiceSummary(items, 'card-a')).toEqual({
    cashPurchases: 100,
    installmentPurchases: 50,
    total: 150,
  });
});
```

Include items from another card to prove filtering.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/creditCardInvoiceSummary.test.ts`

Expected: FAIL because the focused adapter does not exist.

- [ ] **Step 3: Implement the focused adapter and hook method**

```ts
export function getCardInvoiceSummary(items: InvoiceItem[], cardId: string) {
  return summarizeInvoiceItems(items.filter(item => item.card_id === cardId));
}
```

Import it into `useCreditCards` under an alias and expose a stable local function named `getCardInvoiceSummary(cardId)` beside `getCardItems` and `getCardTotal`. Implement `getCardTotal` as `getCardInvoiceSummary(cardId).total` to avoid duplicate monetary rules.

- [ ] **Step 4: Run focused tests and build**

Run: `npm test -- src/lib/creditCardInvoiceSummary.test.ts src/lib/invoiceBreakdown.test.ts && npm run build`

Expected: tests PASS and hook type-checks.

- [ ] **Step 5: Commit hook integration**

Run:

```bash
git status --short
git diff --check
git add -N src/hooks/useCreditCards.ts src/lib/creditCardInvoiceSummary.ts src/lib/creditCardInvoiceSummary.test.ts
git diff -- src/hooks/useCreditCards.ts src/lib/creditCardInvoiceSummary.ts src/lib/creditCardInvoiceSummary.test.ts
git add src/hooks/useCreditCards.ts src/lib/creditCardInvoiceSummary.ts src/lib/creditCardInvoiceSummary.test.ts
git commit -m "feat: expose credit card invoice summaries"
```

Expected: focused hook integration commit created.

### Task 3: Show total, cash, installments, and ending forecasts on Invoices

**Files:**
- Modify if not already present from the prerequisite branch: `package.json`
- Modify if not already present from the prerequisite branch: `package-lock.json`
- Modify: `src/pages/Invoices.tsx`
- Create: `src/pages/Invoices.breakdown.test.tsx`
- Modify: `src/lib/layoutClasses.test.ts`

- [ ] **Step 1: Ensure the rendered-test dependencies are installed**

Run: `npm install --save-dev @testing-library/react jsdom@29.1.1`

Expected: dependencies are already satisfied from the fixed-bill prerequisite branch or are added to `package.json`/`package-lock.json`; command exits 0 on Node 20.20.1.

- [ ] **Step 2: Add failing invoice UI contract checks**

Under jsdom, mock `useOutletContext`, `useCreditCards`, and financial actions, then render `Invoices` with one cash and two installment fixtures (one valid ending and one invalid date). Assert `Total da fatura`, `Compras à vista`, `Compras parceladas`, purchase count, and `Ver fatura` appear. Open the invoice and assert cash rows contain no `Parcela`/ending metadata, installment rows render `Parcela X de Y`, a formatted ending month, and `Término indisponível` for the invalid date. Add two separate action cases: an open invoice whose `Marcar fatura como paga` click calls `payCreditInvoiceTransactions` with the expected payable transaction IDs, and a paid invoice whose `Reabrir fatura` click calls `reopenCreditInvoiceTransactions` with the expected paid transaction IDs; both cases assert `refetch` after success. Keep `layoutClasses.test.ts` only as a responsive integration check.

- [ ] **Step 3: Run the UI test and verify RED**

Run: `npm test -- src/pages/Invoices.breakdown.test.tsx src/lib/layoutClasses.test.ts`

Expected: FAIL because the approved labels and schedule detail are absent.

- [ ] **Step 4: Render the compact approved hierarchy**

Destructure both `getCardItems` and `getCardInvoiceSummary` from the hook. Add `invoiceSummary` to `getCardInvoiceState(cardId)`, obtain per-card `cardItems` only through `getCardItems(cardId)`, and keep `cardTotal` as `invoiceSummary.total` for existing payment logic; the page must perform no per-card filtering or monetary reduction. Preserve the unrelated top-level `invoiceItems.reduce` that groups the global purchase list by date. In each card, render total as the primary value and two secondary rows for cash/installments. In the selected invoice modal, repeat the three values in the header and call `getInvoicePurchaseSchedule(item)` once per row. Render no installment metadata for `cash`; for `installment`, render `Parcela X de Y` and either `Previsão de término: ${formatMonthLabel(endingMonthKey)}` or `Término indisponível`. Continue to render descriptions through JSX interpolation and preserve all payment/reopen handlers.

- [ ] **Step 5: Run invoice UI tests, build, and sync Android**

Run: `npm test -- src/pages/Invoices.breakdown.test.tsx src/lib/layoutClasses.test.ts src/lib/invoiceBreakdown.test.ts && npm run build && npm run android:sync`

Expected: tests PASS, invoice screen compiles, and Capacitor reports a successful Android sync.

- [ ] **Step 6: Commit invoice presentation**

Run:

```bash
git status --short
git diff --check
git add -N package.json package-lock.json src/pages/Invoices.tsx src/pages/Invoices.breakdown.test.tsx src/lib/layoutClasses.test.ts
git diff --check
git diff -- package.json package-lock.json src/pages/Invoices.tsx src/pages/Invoices.breakdown.test.tsx src/lib/layoutClasses.test.ts
git add package.json package-lock.json src/pages/Invoices.tsx src/pages/Invoices.breakdown.test.tsx src/lib/layoutClasses.test.ts
git commit -m "feat: show invoice purchase composition"
```

Expected: invoice-screen commit created with payment actions intact.

## Chunk 2: Projection composition and final verification

### Task 4: Carry discriminated card metadata through projections

**Files:**
- Modify: `src/lib/financialProjections.ts`
- Modify: `src/lib/financialProjections.test.ts`

- [ ] **Step 1: Add failing projection breakdown tests**

```ts
it('separates cash and installment cards without changing projection total', () => {
  const [projection] = buildFinancialProjections(makeInput({
    futureInvoiceItems: [
      { description: 'Cash', amount: '100', date: '2026-09-01', total_installments: 1, current_installment: 1 },
      { description: 'Installment', amount: '50', date: '2026-09-01', total_installments: 10, current_installment: 3 },
    ],
  }));

  expect(projection.breakdown).toMatchObject({
    creditCards: 150,
    cashPurchases: 100,
    installmentPurchases: 50,
  });
  expect(projection.total).toBe(
    projection.breakdown.fixedBills + projection.breakdown.creditCards + projection.breakdown.investments,
  );
  expect(projection.details.find(detail => detail.description === 'Installment')).toMatchObject({
    type: 'card', purchaseKind: 'installment', currentInstallment: 3,
    totalInstallments: 10, endingMonthKey: '2027-04',
  });
  expect(projection.breakdown).not.toHaveProperty('futureInstallmentBalance');
});

it('preserves fixed bills, investments, salary entries, and leftover', () => {
  const [projection] = buildFinancialProjections(makeInput({
    fixedBills: [{ description: 'Rent', amount: 700 }],
    investments: [{ name: 'Reserve', monthly_contribution: 200 }],
    salaryAmount: 5000,
    salaryEntries: [{ monthKey: '2026-09', amount: 4500 }],
    futureInvoiceItems: [
      { description: 'Cash', amount: 100, date: '2026-09-01', total_installments: 1, current_installment: 1 },
    ],
  }));
  expect(projection.breakdown).toEqual({
    fixedBills: 700, creditCards: 100, cashPurchases: 100,
    installmentPurchases: 0, investments: 200,
  });
  expect(projection).toMatchObject({ total: 1000, salary: 4500, projectedLeftover: 3500 });
});
```

Define `makeInput(overrides)` as a complete `BuildFinancialProjectionsInput` with `baseMonthKey: '2026-08'`, empty fixed/investment/invoice arrays, `salaryAmount: 0`, then spread overrides. Also assert cash metadata contains null installment fields, invalid amounts never introduce `NaN`, and fixed/investment details have no card fields.

- [ ] **Step 2: Run projection tests and verify RED**

Run: `npm test -- src/lib/financialProjections.test.ts`

Expected: FAIL because projection breakdown and card metadata are not separated.

- [ ] **Step 3: Implement typed projection details using the shared helper**

Define:

```ts
type NonCardProjectionDetail = {
  description: string;
  amount: number;
  type: 'fixed' | 'investment';
};

type CardProjectionDetail = {
  description: string;
  amount: number;
  type: 'card';
} & (
  | { purchaseKind: 'cash'; currentInstallment: null; totalInstallments: null; endingMonthKey: null }
  | { purchaseKind: 'installment'; currentInstallment: number; totalInstallments: number; endingMonthKey: string | null }
);
```

Set `MonthProjection.details` to `(NonCardProjectionDetail | CardProjectionDetail)[]`, extend `breakdown` with `cashPurchases` and `installmentPurchases`, select only valid current-month card items, call `summarizeInvoiceItems(monthItems)`, and use `getInvoicePurchaseSchedule(item)` for each valid detail. Set `creditCards` to `summary.total`; do not add any future installment balance field.

- [ ] **Step 4: Run projection and helper tests**

Run: `npm test -- src/lib/financialProjections.test.ts src/lib/invoiceBreakdown.test.ts`

Expected: all projection and helper tests PASS.

- [ ] **Step 5: Commit the projection domain changes**

Run:

```bash
git status --short
git diff --check
git diff -- src/lib/financialProjections.ts src/lib/financialProjections.test.ts
git add src/lib/financialProjections.ts src/lib/financialProjections.test.ts
git commit -m "feat: add invoice composition to projections"
```

Expected: projection-domain commit created.

### Task 5: Show cash/installments and ending forecasts in projection UI

**Files:**
- Modify: `src/components/dashboard/ProjectionsSection.tsx`
- Create: `src/components/dashboard/ProjectionsSection.test.tsx`
- Create: `src/components/finance/ModalShell.tsx`
- Create: `src/components/finance/ProjectionDetailsModal.tsx`
- Create: `src/components/finance/ProjectionDetailsModal.test.tsx`
- Modify: `src/components/finance/FinanceModals.tsx`
- Modify: `src/lib/layoutClasses.test.ts`

- [ ] **Step 1: Add failing projection UI contract checks**

Under jsdom, render `ProjectionsSection` with its data hook mocked to return one projection and assert the card shows unchanged overall total plus `Cartão`, `À vista`, and `Parcelado`; click details and assert the modal opens. Render `ProjectionDetailsModal` directly with cash, valid-installment, invalid-ending, fixed, and investment details. Assert header card total/cash/installment values; cash label has no parcel/ending text; installment has `Parcela X de Y` and formatted forecast; null ending renders `Término indisponível`; fixed/investment rows retain their labels and have no card-only fields. Keep a source integration assertion requiring `FinanceModals.tsx` to re-export the focused modal rather than retain the large inline implementation.

- [ ] **Step 2: Run the UI contract test and verify RED**

Run: `npm test -- src/components/dashboard/ProjectionsSection.test.tsx src/components/finance/ProjectionDetailsModal.test.tsx src/lib/layoutClasses.test.ts`

Expected: FAIL because projection composition and focused modal do not exist.

- [ ] **Step 3: Render breakdowns without duplicating domain rules**

Extract the existing `ModalShellProps` and `ModalShell` implementation unchanged into `ModalShell.tsx`, export it, and import it into both `FinanceModals.tsx` and the new modal. This avoids a circular import when `FinanceModals.tsx` re-exports `ProjectionDetailsModal`. Keep `labelClass` private to the existing file because the projection modal has no form labels; define its local numeric formatter as `value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })`. In `ProjectionsSection`, keep `Cartão` as the main card total and add small `À vista` and `Parcelado` rows from `proj.breakdown`. Move `ProjectionDetailsModal` into its focused file and re-export it from `FinanceModals.tsx` for compatibility. In the modal header, render total/cash/installment card values. Narrow details first with `detail.type === 'card'`; render `À vista` for cash and `Parcela X de Y` plus the formatted ending month or `Término indisponível` for installment. Fixed and investment detail rendering remains unchanged.

- [ ] **Step 4: Run UI contracts and build**

Run: `npm test -- src/components/dashboard/ProjectionsSection.test.tsx src/components/finance/ProjectionDetailsModal.test.tsx src/lib/layoutClasses.test.ts src/lib/financialProjections.test.ts && npm run build && npm run android:sync`

Expected: tests PASS, TypeScript verifies discriminated narrowing, and Capacitor reports a successful Android sync.

- [ ] **Step 5: Commit projection presentation**

Run:

```bash
git status --short
git diff --check
git add -N src/components/dashboard/ProjectionsSection.tsx src/components/dashboard/ProjectionsSection.test.tsx src/components/finance/ModalShell.tsx src/components/finance/ProjectionDetailsModal.tsx src/components/finance/ProjectionDetailsModal.test.tsx src/components/finance/FinanceModals.tsx src/lib/layoutClasses.test.ts
git diff -- src/components/dashboard/ProjectionsSection.tsx src/components/dashboard/ProjectionsSection.test.tsx src/components/finance/ModalShell.tsx src/components/finance/ProjectionDetailsModal.tsx src/components/finance/ProjectionDetailsModal.test.tsx src/components/finance/FinanceModals.tsx src/lib/layoutClasses.test.ts
git add src/components/dashboard/ProjectionsSection.tsx src/components/dashboard/ProjectionsSection.test.tsx src/components/finance/ModalShell.tsx src/components/finance/ProjectionDetailsModal.tsx src/components/finance/ProjectionDetailsModal.test.tsx src/components/finance/FinanceModals.tsx src/lib/layoutClasses.test.ts
git commit -m "feat: show invoice composition in projections"
```

Expected: projection UI commit created.

### Task 6: Verify invoice breakdown and synchronize Android

**Files:**
- Modify only if verification exposes a scoped defect.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint && npm run build`

Expected: both commands exit 0 with no lint errors.

- [ ] **Step 3: Synchronize the Android project**

Run: `npm run android:sync`

Expected: web build succeeds and Capacitor reports a successful Android sync.

- [ ] **Step 4: Review final diff and history**

Run:

```bash
git status --short --branch
git diff --check
git log --oneline --decorate -8
```

Expected: clean source tree and focused commits. If Android sync changes tracked files, run `git status --short`, `git diff --check`, and `git diff -- android`; stage only reviewed Android files with `git add android`, inspect `git diff --cached -- android`, commit with `git commit -m "chore: sync android invoice breakdown"`, and confirm `git status --short` is empty.

- [ ] **Step 5: Perform browser acceptance checks**

Run `npm run dev -- --host 127.0.0.1`, open the printed `http://127.0.0.1:<port>/faturas`, and sign in. Test-data prerequisite: use an existing card (or create one), add one R$ 100 à-vista purchase in the selected month and one R$ 50-per-month 3× purchase beginning in that month. Verify at 1440×900 and 390×844: the card total is R$ 150, cash is R$ 100, installment is R$ 50, and purchase count is 2; the invoice modal repeats those totals, cash has no ending forecast, and the installment shows `Parcela 1 de 3` with an ending month two months ahead; the existing mark-paid/reopen action still changes state. Open `/`, verify the future projection carrying later generated installments shows matching card/cash/installment values and no aggregate future balance. The invalid-date `Término indisponível` fallback is verified by the automated component test because the normal purchase form does not permit an invalid date. Stop the development server with `Ctrl+C` after the checks.
