# Fixed Bill Partial Payments Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow one or more current-month partial payments against a fixed bill, enforce the fresh remaining balance, and show each payment distinctly in the expense history.

**Architecture:** Keep `transactions` as the payment ledger and derive each bill's paid amount, remaining amount, progress, and status with pure cent-based functions. A guarded action re-reads the persisted bill and its current-month paid transactions before inserting, while a focused modal is shared by the fixed-bills page and dashboard. Expense-history presentation is derived by a pure helper so legacy full payments remain distinguishable.

**Tech Stack:** React 19, TypeScript 6, Vitest, Vite, Supabase JS, Tailwind CSS, Capacitor.

---

Implementation must follow `@test-driven-development`; final claims require `@verification-before-completion`.

## Chunk 1: Fixed-bill partial payment domain and persistence

### Task 1: Derive partial-payment balances and status

**Files:**
- Modify: `src/types/financial.ts`
- Modify: `src/lib/fixedBillPayments.ts`
- Modify: `src/lib/fixedBillPayments.test.ts`
- Modify: `src/services/telegram/telegramActions.ts`
- Modify: `src/services/telegram/telegramAutomations.ts`
- Modify: `src/services/telegram/telegramActions.test.ts`
- Modify: `src/services/telegram/telegramAutomations.test.ts`

- [ ] **Step 1: Extend the failing domain tests**

Add fixtures whose payment records include `type`, `amount`, `status`, and `notes`, then cover partial, multiple, exact, malformed, wrong-type, pending, legacy-overpayment, overdue, and deletion/recalculation cases. Add validation assertions for invalid and excessive amounts:

```ts
it('sums eligible partial payments and preserves the bill total', () => {
  const [bill] = resolveDynamicFixedBills({
    bills: [makeBill({ amount: 700 })],
    payments: [
      makePayment({ id: 'p1', amount: 350 }),
      makePayment({ id: 'p2', amount: 100 }),
      makePayment({ id: 'ignored', amount: 999, status: 'pendente' }),
    ],
    monthKey: '2026-08',
    today: new Date(2026, 7, 5),
  });

  expect(bill).toMatchObject({
    paidAmount: 450,
    remainingAmount: 250,
    paymentProgress: 64.29,
    dynamicStatus: 'pendente',
    paymentTransactionIds: ['p1', 'p2'],
  });
expect(bill.paidAmount + bill.remainingAmount).toBe(bill.amount);
});

it.each([
  ['empty link', makePayment({ notes: 'fixed_bill:' })],
  ['extra segment', makePayment({ notes: 'fixed_bill:bill-1:extra' })],
  ['other bill', makePayment({ notes: 'fixed_bill:bill-2' })],
  ['income', makePayment({ type: 'entrada' })],
  ['pending', makePayment({ status: 'pendente' })],
  ['zero', makePayment({ amount: 0 })],
  ['negative', makePayment({ amount: -10 })],
  ['not finite', makePayment({ amount: Number.NaN })],
  ['numeric string', makePayment({ amount: '350' as unknown as number })],
  ['missing amount', makePayment({ amount: undefined as unknown as number })],
])('ignores an ineligible payment: %s', (_label, payment) => {
  const [bill] = resolveDynamicFixedBills({
    bills: [makeBill({ id: 'bill-1', amount: 700 })], payments: [payment],
    monthKey: '2026-08', today: new Date(2026, 7, 5),
  });
  expect(bill).toMatchObject({ paidAmount: 0, remainingAmount: 700, paymentTransactionIds: [] });
});

it.each([
  [[makePayment({ id: 'p1', amount: 700 })], 700, 0, 'pago'],
  [[makePayment({ id: 'p1', amount: 500 }), makePayment({ id: 'p2', amount: 300 })], 700, 0, 'pago'],
  [[makePayment({ id: 'p1', amount: 300 })], 300, 400, 'pendente'],
  [[], 0, 700, 'pendente'],
])('derives eligible balance and status', (payments, paid, remaining, status) => {
  const [bill] = resolveDynamicFixedBills({
    bills: [makeBill({ amount: 700 })], payments,
    monthKey: '2026-08', today: new Date(2026, 7, 5),
  });
  expect(bill).toMatchObject({ paidAmount: paid, remainingAmount: remaining, dynamicStatus: status });
  expect(bill.paidAmount + bill.remainingAmount).toBe(700);
});

it('recalculates after an individual payment disappears and keeps a partial bill overdue', () => {
  const [bill] = resolveDynamicFixedBills({
    bills: [makeBill({ amount: 700, due_day: 10 })],
    payments: [makePayment({ id: 'remaining-payment', amount: 350 })],
    monthKey: '2026-08', today: new Date(2026, 7, 15),
  });
  expect(bill).toMatchObject({ paidAmount: 350, remainingAmount: 350, dynamicStatus: 'atrasado', daysOverdue: 5 });
});

it('rejects a payment above the remaining amount', () => {
  expect(validateFixedBillPayment({
    billAmount: 450,
    paidAmount: 0,
    paymentAmount: 451,
  })).toEqual({ ok: false, code: 'exceeds_remaining', remainingAmount: 450 });
});

it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid amount %s', paymentAmount => {
  expect(validateFixedBillPayment({ billAmount: 450, paidAmount: 0, paymentAmount }))
    .toMatchObject({ ok: false, code: 'invalid_amount', remainingAmount: 450 });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/fixedBillPayments.test.ts`

Expected: FAIL because payment records do not accept amount/type and the new balance fields and validator do not exist.

- [ ] **Step 3: Extend the dynamic type and implement cent-based derivation**

Add to `DynamicFixedBill`:

```ts
paidAmount: number;
remainingAmount: number;
paymentProgress: number;
paymentTransactionIds: string[];
```

In `fixedBillPayments.ts`, export a strict note parser and validator, and resolve balances with cents:

```ts
export type FixedBillPaymentRecord = Pick<
  Transaction,
  'id' | 'type' | 'status' | 'amount' | 'notes'
>;

const toCents = (value: number) => Math.round(Number(value) * 100);
const fromCents = (value: number) => value / 100;

export function getFixedBillIdFromNote(note?: string | null) {
  const match = /^fixed_bill:([^:]+)$/.exec(note ?? '');
  return match?.[1] ?? null;
}

export function sumEligibleFixedBillPayments(input: {
  billId: string;
  payments: FixedBillPaymentRecord[];
  maximumAmount: number;
}) {
  const maximumCents = Math.max(0, toCents(input.maximumAmount));
  const paidCents = getEligibleFixedBillPayments(input.billId, input.payments)
    .reduce((sum, payment) => sum + toCents(payment.amount), 0);
  return fromCents(Math.min(maximumCents, paidCents));
}

function getEligibleFixedBillPayments(billId: string, payments: FixedBillPaymentRecord[]) {
  return payments.filter(payment =>
    getFixedBillIdFromNote(payment.notes) === billId
    && payment.type === 'gasto'
    && payment.status === 'pago'
    && typeof payment.amount === 'number'
    && Number.isFinite(payment.amount)
    && payment.amount > 0,
  );
}

export function resolveDynamicFixedBills(input: {
  bills: FixedBill[];
  payments: FixedBillPaymentRecord[];
  monthKey: string;
  today?: Date;
}): DynamicFixedBill[] {
  const { bills, payments, monthKey, today = new Date() } = input;
  const currentMonthKey = getCurrentMonthKey(today);
  const isPastMonth = monthKey < currentMonthKey;

  return bills.map(bill => {
    const billCents = Math.max(0, toCents(Number(bill.amount)));
    const eligiblePayments = getEligibleFixedBillPayments(bill.id, payments);
    const rawPaidCents = eligiblePayments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
    const paidCents = Math.min(billCents, rawPaidCents);
    const remainingCents = Math.max(0, billCents - paidCents);
    const isOverdue = remainingCents > 0 && (
      isPastMonth || (monthKey === currentMonthKey && today.getDate() > bill.due_day)
    );

    return {
      ...bill,
      amount: fromCents(billCents),
      paidAmount: fromCents(paidCents),
      remainingAmount: fromCents(remainingCents),
      paymentProgress: billCents > 0 ? Math.round((paidCents / billCents) * 10_000) / 100 : 100,
      paymentTransactionIds: eligiblePayments.map(payment => payment.id),
      dynamicStatus: remainingCents === 0 ? 'pago' : isOverdue ? 'atrasado' : 'pendente',
      daysOverdue: isOverdue && monthKey === currentMonthKey ? today.getDate() - bill.due_day : 0,
    };
  });
}

export function validateFixedBillPayment(input: {
  billAmount: number;
  paidAmount: number;
  paymentAmount: number;
}) {
  const billCents = toCents(input.billAmount);
  const paidCents = Math.min(Math.max(0, toCents(input.paidAmount)), billCents);
  const paymentCents = toCents(input.paymentAmount);
  const remainingCents = Math.max(0, billCents - paidCents);

  if (!Number.isFinite(input.paymentAmount) || paymentCents <= 0) {
    return { ok: false as const, code: 'invalid_amount' as const, remainingAmount: fromCents(remainingCents) };
  }
  if (paymentCents > remainingCents) {
    return { ok: false as const, code: 'exceeds_remaining' as const, remainingAmount: fromCents(remainingCents) };
  }
  return {
    ok: true as const,
    amount: fromCents(paymentCents),
    remainingAfterPayment: fromCents(remainingCents - paymentCents),
  };
}
```

Use `getEligibleFixedBillPayments` inside `sumEligibleFixedBillPayments` so the predicate has one source of truth. The resolver implementation above preserves past-month/current-day overdue rules and only exposes eligible IDs.

- [ ] **Step 4: Run the focused domain tests and verify GREEN**

Run: `npm test -- src/lib/fixedBillPayments.test.ts`

Expected: all fixed-bill payment tests PASS.

- [ ] **Step 5: Add failing Telegram partial-balance assertions**

In `telegramActions.test.ts`, add a R$ 700 fixed-bill fixture and a current-month paid transaction `{ id: 'payment-1', type: 'gasto', status: 'pago', amount: 350, notes: 'fixed_bill:bill-1' }`; assert the fixed-bills response contains `Em aberto: R$ 350,00` and not `Em aberto: R$ 700,00`. In `telegramAutomations.test.ts`, use income R$ 6.500, ordinary expense R$ 200, pending invoice transaction R$ 300, the same R$ 350 partial payment, and the R$ 700 bill; run the 18h automation and assert the message contains `Sobra projetada do mês: R$ 5.300,00`. The calculation is `6500 - ((200 + 300 + 350) + 350 remaining) = 5300`; the morning reminder continues to show the original bill value.

- [ ] **Step 6: Run Telegram tests and verify RED**

Run: `npm test -- src/services/telegram/telegramActions.test.ts src/services/telegram/telegramAutomations.test.ts`

Expected: FAIL because the consumers omit payment type/amount and still sum full unpaid bill amounts.

- [ ] **Step 7: Update both Telegram consumers**

In both files, map each normalized transaction with `id`, `notes`, `status`, `type`, and `amount`; then calculate open fixed bills with:

```ts
const unpaidFixedBills = mappedBills.reduce((sum, bill) => sum + bill.remainingAmount, 0);
```

- [ ] **Step 8: Run Telegram tests and verify GREEN**

Run: `npm test -- src/services/telegram/telegramActions.test.ts src/services/telegram/telegramAutomations.test.ts`

Expected: both service suites PASS with R$ 350 remaining.

- [ ] **Step 9: Commit the domain model**

Run:

```bash
git status --short
git diff --check
git add -N src/types/financial.ts src/lib/fixedBillPayments.ts src/lib/fixedBillPayments.test.ts src/services/telegram/telegramActions.ts src/services/telegram/telegramAutomations.ts src/services/telegram/telegramActions.test.ts src/services/telegram/telegramAutomations.test.ts
git diff -- src/types/financial.ts src/lib/fixedBillPayments.ts src/lib/fixedBillPayments.test.ts src/services/telegram/telegramActions.ts src/services/telegram/telegramAutomations.ts src/services/telegram/telegramActions.test.ts src/services/telegram/telegramAutomations.test.ts
git add src/types/financial.ts src/lib/fixedBillPayments.ts src/lib/fixedBillPayments.test.ts src/services/telegram/telegramActions.ts src/services/telegram/telegramAutomations.ts src/services/telegram/telegramActions.test.ts src/services/telegram/telegramAutomations.test.ts
git commit -m "feat: calculate partial fixed bill payments"
```

Expected: one focused Conventional Commit with no unrelated files.

### Task 2: Calculate hook totals from paid and remaining amounts

**Files:**
- Modify: `src/lib/fixedBillPayments.ts`
- Modify: `src/lib/fixedBillPayments.test.ts`
- Create: `src/lib/dashboardFixedBillSummary.ts`
- Create: `src/lib/dashboardFixedBillSummary.test.ts`
- Modify: `src/hooks/useFixedBills.ts`
- Modify: `src/hooks/useDashboardData.ts`
- Modify: `src/lib/financialPlanning.test.ts`

- [ ] **Step 1: Add a failing totals test**

```ts
it('totals original, paid, remaining, and fully paid bills independently', () => {
expect(summarizeFixedBills([
    makeDynamicBill({ amount: 700, paidAmount: 350, remainingAmount: 350, dynamicStatus: 'pendente' }),
    makeDynamicBill({ amount: 200, paidAmount: 200, remainingAmount: 0, dynamicStatus: 'pago' }),
  ])).toEqual({ total: 900, paid: 550, paidCount: 1, pending: 350, count: 2 });
});

it('derives the dashboard pending commitment from remaining amounts', () => {
  expect(buildDashboardFixedBillSummary([
    makeDynamicBill({ amount: 700, paidAmount: 350, remainingAmount: 350, dynamicStatus: 'pendente' }),
  ])).toEqual({ fixedBillsTotal: 700, unpaidFixedBills: 350 });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/fixedBillPayments.test.ts src/lib/dashboardFixedBillSummary.test.ts`

Expected: FAIL because `summarizeFixedBills` and `buildDashboardFixedBillSummary` are not exported.

- [ ] **Step 3: Implement the pure totals helper and consume it in the hook**

```ts
export function summarizeFixedBills(bills: DynamicFixedBill[]) {
  return {
    total: fromCents(bills.reduce((sum, bill) => sum + toCents(bill.amount), 0)),
    paid: fromCents(bills.reduce((sum, bill) => sum + toCents(bill.paidAmount), 0)),
    paidCount: bills.filter(bill => bill.remainingAmount === 0).length,
    pending: fromCents(bills.reduce((sum, bill) => sum + toCents(bill.remainingAmount), 0)),
    count: bills.length,
  };
}
```

Update the transaction select in `useFixedBills` to `id, notes, status, type, amount`, type the results as `FixedBillPaymentRecord[]`, and replace the inline totals with `summarizeFixedBills(bills)`.

Implement `dashboardFixedBillSummary.ts` as a named adapter around the tested domain helper:

```ts
export function buildDashboardFixedBillSummary(bills: DynamicFixedBill[]) {
  const totals = summarizeFixedBills(bills);
  return { fixedBillsTotal: totals.total, unpaidFixedBills: totals.pending };
}
```

In `useDashboardData`, call this adapter and pass its two fields to `calculateSummaryCards`, so a partial payment reduces the projected commitment instead of counting the entire bill again. Add this downstream regression assertion to `financialPlanning.test.ts`:

```ts
expect(calculateSummaryCards({
  transactions: [{ type: 'gasto', amount: 350, status: 'pago', notes: 'fixed_bill:bill-1' }],
  fixedBillsTotal: 700,
  unpaidFixedBills: 350,
  openInvoices: 0,
  savedAmount: 0,
}).projectedBalance).toBe(-700);
```

- [ ] **Step 4: Run domain tests and TypeScript build**

Run: `npm test -- src/lib/fixedBillPayments.test.ts src/lib/dashboardFixedBillSummary.test.ts src/lib/financialPlanning.test.ts && npm run build`

Expected: tests PASS and build exits 0.

- [ ] **Step 5: Commit hook integration**

Run:

```bash
git status --short
git diff --check
git add -N src/lib/dashboardFixedBillSummary.ts src/lib/dashboardFixedBillSummary.test.ts
git diff -- src/lib/fixedBillPayments.ts src/lib/fixedBillPayments.test.ts src/lib/dashboardFixedBillSummary.ts src/lib/dashboardFixedBillSummary.test.ts src/hooks/useFixedBills.ts src/hooks/useDashboardData.ts src/lib/financialPlanning.test.ts
git add src/lib/fixedBillPayments.ts src/lib/fixedBillPayments.test.ts src/lib/dashboardFixedBillSummary.ts src/lib/dashboardFixedBillSummary.test.ts src/hooks/useFixedBills.ts src/hooks/useDashboardData.ts src/lib/financialPlanning.test.ts
git commit -m "feat: expose fixed bill payment totals"
```

Expected: focused commit created.

### Task 3: Add the guarded current-month persistence action

**Files:**
- Modify: `src/lib/monthSelection.ts`
- Modify: `src/lib/monthSelection.test.ts`
- Modify: `src/lib/financialActions.ts`
- Create: `src/lib/financialActions.fixedBillPayments.test.ts`

- [ ] **Step 1: Add failing local-date and action tests**

Add exact local-clock cases:

```ts
it.each([
  [new Date(2026, 7, 31, 23, 59, 59), '2026-08-31', '2026-08'],
  [new Date(2026, 8, 1, 0, 0, 1), '2026-09-01', '2026-09'],
  [new Date(2027, 0, 1, 0, 0, 1), '2027-01-01', '2027-01'],
])('keeps local date and month coherent at %s', (now, dateKey, monthKey) => {
  expect(toLocalDateKey(now)).toBe(dateKey);
  expect(getCurrentMonthKey(now)).toBe(monthKey);
});
```

Mock only the Supabase boundary and financial event. Use this hoisted state and operation-specific chain so `.select()` and `.insert()` on `transactions` cannot consume the wrong result:

```ts
const mockState = vi.hoisted(() => ({
  billResult: { data: { id: 'bill-1', description: 'Persisted name', amount: 700, category_id: 'cat-1' } as {
    id: string; description: string; amount: number; category_id: string | null;
  } | null, error: null as { code?: string; message?: string } | null },
  paymentsResult: { data: [] as Array<{ id: string; notes: string | null; status: string; type: string; amount: number }>, error: null as Error | null },
  insertResult: { error: null as Error | null },
  insert: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-1' } } } })) },
    from: vi.fn((table: string) => {
      if (table === 'fixed_bills') {
        const chain: Record<string, ReturnType<typeof vi.fn>> = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn(() => chain);
        chain.single = vi.fn(async () => mockState.billResult);
        return chain;
      }
      if (table === 'transactions') {
        const selectChain: Record<string, ReturnType<typeof vi.fn>> = {};
        selectChain.eq = vi.fn(() => selectChain);
        selectChain.gte = vi.fn(() => selectChain);
        selectChain.lt = vi.fn(async () => mockState.paymentsResult);
        mockState.insert.mockImplementation(async () => mockState.insertResult);
        return { select: vi.fn(() => selectChain), insert: mockState.insert };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  },
}));

vi.mock('./financialEvents', () => ({ emitFinancialDataChanged: mockState.emit }));
```

Reset the result objects and spies in `beforeEach`, use `vi.useFakeTimers()` and `vi.setSystemTime(new Date(2026, 7, 5, 23, 59))`, then cover:

```ts
await expect(createFixedBillPayment({
  billId: 'bill-1', amount: 451, selectedMonthKey: '2026-08',
})).resolves.toEqual({
  status: 'rejected', code: 'exceeds_remaining', remainingAmount: 450,
});
expect(mockState.insert).not.toHaveBeenCalled();
```

Using the `mockState` fixture above, add table tests for `{ selectedMonthKey: '2026-07' } -> invalid_month` with no table calls and amounts `0`, `-1`, `NaN`, `Infinity` -> `invalid_amount`; add separate tests assigning `{ data: null, error: { code: 'PGRST116' } }` for `bill_not_found`, a non-PGRST116 bill error -> rejection, payment read error -> rejection, and insert error -> rejection. In the success test, seed persisted `{ id: 'bill-1', description: 'Persisted name', amount: 700, category_id: 'cat-1' }` plus a paid R$ 350 row, submit R$ 350, and assert the inserted payload contains session user, local date, `gasto`, `pago`, `pix`, `Abatimento: Persisted name`, amount 350, category `cat-1`, exact note, and a single emitted event. In the stale test, seed the same paid row, submit R$ 351, assert `exceeds_remaining` with 350 and `expect(mockState.insert).not.toHaveBeenCalled()`. Do not place screen-supplied bill fields in the action input.

- [ ] **Step 2: Run action tests and verify RED**

Run: `npm test -- src/lib/monthSelection.test.ts src/lib/financialActions.fixedBillPayments.test.ts`

Expected: FAIL because `toLocalDateKey` and `createFixedBillPayment` do not exist.

- [ ] **Step 3: Export the local date helper and implement the action**

Export from `monthSelection.ts`:

```ts
export function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

Implement the public action with this contract:

```ts
export type CreateFixedBillPaymentResult =
  | { status: 'created' }
  | {
      status: 'rejected';
      code: 'invalid_month' | 'invalid_amount' | 'exceeds_remaining' | 'bill_not_found';
      remainingAmount?: number;
    };

export async function createFixedBillPayment(input: {
  billId: string;
  amount: number;
  selectedMonthKey: string;
}): Promise<CreateFixedBillPaymentResult> {
  const now = new Date();
  if (input.selectedMonthKey !== getCurrentMonthKey(now)) {
    return { status: 'rejected', code: 'invalid_month' };
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { status: 'rejected', code: 'invalid_amount' };
  }

  const userId = await getUserId();
  const { data: bill, error: billError } = await supabase
    .from('fixed_bills')
    .select('id, description, amount, category_id')
    .eq('id', input.billId)
    .single();

  if (billError && billError.code !== 'PGRST116') throw billError;
  if (!bill) return { status: 'rejected', code: 'bill_not_found' };

  const range = buildMonthRange(getCurrentMonthKey(now));
  const { data: rows, error: paymentError } = await supabase
    .from('transactions')
    .select('id, notes, status, type, amount')
    .eq('notes', `fixed_bill:${bill.id}`)
    .gte('date', range.startDate)
    .lt('date', range.endDate);
  if (paymentError) throw paymentError;

  const freshPaidAmount = sumEligibleFixedBillPayments({
    billId: bill.id,
    payments: (rows ?? []) as FixedBillPaymentRecord[],
    maximumAmount: Number(bill.amount),
  });
  const validation = validateFixedBillPayment({
    billAmount: Number(bill.amount),
    paidAmount: freshPaidAmount,
    paymentAmount: input.amount,
  });
  if (!validation.ok) {
    return {
      status: 'rejected',
      code: validation.code,
      remainingAmount: validation.remainingAmount,
    };
  }

  const payload = buildTransactionPayload({
    type: 'gasto',
    description: `Abatimento: ${bill.description}`,
    amount: validation.amount,
    date: toLocalDateKey(now),
    paymentMethod: 'pix',
    categoryId: bill.category_id,
  });
  const { error } = await supabase.from('transactions').insert({
    ...payload, user_id: userId, notes: `fixed_bill:${bill.id}`,
  });
  if (error) throw error;
  emitFinancialDataChanged();
  return { status: 'created' };
}
```

Add `sumEligibleFixedBillPayments` to `fixedBillPayments.ts` with the minimal `{ billId, payments, maximumAmount }` contract and reuse it from `resolveDynamicFixedBills`; this avoids casting the four-field persisted row to a full bill. Keep `removeFixedBillPayments` for compatibility, but remove consumer use in Task 5. Do not accept a bill object or clock from callers. Replace the existing private month `toDateKey` with the exported `toLocalDateKey` and use it inside `buildMonthRange`, avoiding duplicate helpers.

- [ ] **Step 4: Run the action tests and verify GREEN**

Run: `npm test -- src/lib/monthSelection.test.ts src/lib/financialActions.fixedBillPayments.test.ts`

Expected: all local-date and action cases PASS.

- [ ] **Step 5: Commit guarded persistence**

Run:

```bash
git status --short
git diff --check
git diff -- src/lib/monthSelection.ts src/lib/monthSelection.test.ts src/lib/financialActions.ts src/lib/financialActions.fixedBillPayments.test.ts
git add src/lib/monthSelection.ts src/lib/monthSelection.test.ts src/lib/financialActions.ts src/lib/financialActions.fixedBillPayments.test.ts
git commit -m "feat: add guarded fixed bill payments"
```

Expected: persistence commit created without UI changes.

## Chunk 2: Fixed-bill payment interface and history

### Task 4: Build a focused payment modal with recoverable states

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/finance/FixedBillPaymentModal.tsx`
- Create: `src/components/finance/fixedBillPaymentForm.ts`
- Create: `src/components/finance/fixedBillPaymentForm.test.ts`
- Create: `src/components/finance/FixedBillPaymentModal.test.tsx`

- [ ] **Step 1: Install the focused DOM test dependencies**

Run: `npm install --save-dev @testing-library/react jsdom@29.1.1`

Expected: `package.json` and `package-lock.json` add only the React testing library and jsdom test dependencies; the command exits 0.

- [ ] **Step 2: Write failing form-state tests**

Keep async result handling pure so it is testable without a DOM dependency:

```ts
const initialState: FixedBillPaymentFormState = {
  value: '451', remainingAmount: 450, error: null,
};

it('keeps input and updates the fresh balance after a stale-balance rejection', () => {
  expect(reduceFixedBillPaymentResult(
    { value: '451', remainingAmount: 450, error: null },
    { status: 'rejected', code: 'exceeds_remaining', remainingAmount: 300 },
  )).toEqual({
    close: false,
    state: { value: '451', remainingAmount: 300, error: 'O valor excede o saldo restante de R$ 300,00.' },
  });
});

it('closes only after a created result', () => {
  expect(reduceFixedBillPaymentResult(initialState, { status: 'created' }).close).toBe(true);
});
```

Define `parsePaymentValue(value: string)` as `Number(value.replace(',', '.'))`, returning `NaN` for blank values. Define `formatPaymentCurrency(value)` as `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value).replace(/\u00a0/g, ' ')`, normalizing the locale non-breaking separator to the ordinary spaces used by the UI contract. Define `validatePaymentField(value, remainingAmount)` to return exactly `Informe um valor maior que zero.` for blank/zero/negative/non-finite input and `O valor excede o saldo restante de R$ 450,00.` when above the remaining balance. Define reducer messages exactly: `Selecione o mês atual para adicionar um abatimento.`, `Informe um valor válido.`, `A conta fixa não foi encontrada.`, and the fresh remaining-balance message shown above. Test comma parsing and the normalized `R$ 450,00` output through exported `formatPaymentCurrency`.

- [ ] **Step 3: Run the form tests and verify RED**

Run: `npm test -- src/components/finance/fixedBillPaymentForm.test.ts`

Expected: FAIL because the form state module does not exist.

- [ ] **Step 4: Implement the pure form state**

```ts
export interface FixedBillPaymentFormState {
  value: string;
  remainingAmount: number;
  error: string | null;
}

export function parsePaymentValue(value: string) {
  return value.trim() === '' ? Number.NaN : Number(value.replace(',', '.'));
}

export function validatePaymentField(value: string, remainingAmount: number) {
  const amount = parsePaymentValue(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Informe um valor maior que zero.';
  if (Math.round(amount * 100) > Math.round(remainingAmount * 100)) {
    return `O valor excede o saldo restante de ${formatPaymentCurrency(remainingAmount)}.`;
  }
  return null;
}
```

Implement the result reducer with the exact messages from Step 2 and a `{ close, state }` return. `created` is the only result with `close: true`.

- [ ] **Step 5: Run the pure form tests and verify GREEN**

Run: `npm test -- src/components/finance/fixedBillPaymentForm.test.ts`

Expected: all parsing, validation, formatting, and result-state cases PASS.

- [ ] **Step 6: Write failing rendered modal recovery tests**

At the top of `FixedBillPaymentModal.test.tsx`, use `// @vitest-environment jsdom`. Mock `createFixedBillPayment`, render with a R$ 700 bill/R$ 450 remaining, type `451`, and submit. Cover these exact flows with `render`, `fireEvent`, `screen`, and `waitFor`:

```ts
mockCreate.mockResolvedValueOnce({ status: 'rejected', code: 'exceeds_remaining', remainingAmount: 300 });
const onRefresh = vi.fn().mockRejectedValue(new Error('refresh failed'));
render(<FixedBillPaymentModal bill={bill} selectedMonthKey="2026-08" onClose={onClose} onRefresh={onRefresh} />);
fireEvent.change(screen.getByLabelText('Valor do abatimento'), { target: { value: '451' } });
fireEvent.click(screen.getByRole('button', { name: 'Salvar abatimento' }));
await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
expect((screen.getByLabelText('Valor do abatimento') as HTMLInputElement).value).toBe('451');
expect(screen.getByText(/R\$ 300,00/)).toBeTruthy();
expect(onClose).not.toHaveBeenCalled();
```

Add a persistence rejection test (`mockCreate.mockRejectedValueOnce`) asserting the input and modal remain; a success test returning `created` with a rejecting refresh asserting `onClose` once, action once, refresh once, and no second insertion after flushing promises; and a double-click/in-flight test using a deferred promise asserting the action is called once and submit is disabled.

- [ ] **Step 7: Run the modal test and verify RED**

Run: `npm test -- src/components/finance/FixedBillPaymentModal.test.tsx`

Expected: FAIL because the modal does not exist.

- [ ] **Step 8: Implement the rendered modal behavior**

`fixedBillPaymentForm.ts` exports `validatePaymentField` and `reduceFixedBillPaymentResult`. The modal receives:

```ts
interface FixedBillPaymentModalProps {
  bill: DynamicFixedBill;
  selectedMonthKey: string;
  onClose: () => void;
  onRefresh: () => Promise<unknown> | unknown;
}
```

The modal must render only `Valor do abatimento`, show original/paid/remaining amounts, keep the input empty initially, and use `createFixedBillPayment({ billId, amount, selectedMonthKey })`. While saving, disable close/submit duplicates. For `exceeds_remaining`, preserve the typed value, replace the displayed remaining balance with the returned fresh balance, show the specific inline error, and call `void Promise.resolve(onRefresh()).catch(error => console.error('Error refreshing fixed bills:', error))`. For persistence exceptions, keep the modal open and typed value intact with `Não foi possível salvar o abatimento. Tente novamente.`. On `created`, call `onClose()` exactly once and use the same catch-logged background refresh so a refresh failure cannot repeat the insert or reopen the modal.

- [ ] **Step 9: Run form and modal tests, build, and sync Android**

Run: `npm test -- src/components/finance/fixedBillPaymentForm.test.ts src/components/finance/FixedBillPaymentModal.test.tsx && npm run build && npm run android:sync`

Expected: tests PASS, modal compiles, and Capacitor completes Android sync.

- [ ] **Step 10: Commit the focused modal**

Run:

```bash
git status --short
git diff --check
git add -N package.json package-lock.json src/components/finance/FixedBillPaymentModal.tsx src/components/finance/fixedBillPaymentForm.ts src/components/finance/fixedBillPaymentForm.test.ts src/components/finance/FixedBillPaymentModal.test.tsx
git diff -- package.json package-lock.json src/components/finance/FixedBillPaymentModal.tsx src/components/finance/fixedBillPaymentForm.ts src/components/finance/fixedBillPaymentForm.test.ts src/components/finance/FixedBillPaymentModal.test.tsx
git add package.json package-lock.json src/components/finance/FixedBillPaymentModal.tsx src/components/finance/fixedBillPaymentForm.ts src/components/finance/fixedBillPaymentForm.test.ts src/components/finance/FixedBillPaymentModal.test.tsx
git commit -m "feat: add fixed bill payment modal"
```

Expected: modal commit created.

### Task 5: Wire compact progress UI into fixed bills and dashboard

**Files:**
- Create: `src/components/finance/FixedBillPaymentProgress.tsx`
- Create: `src/components/finance/FixedBillPaymentProgress.test.tsx`
- Modify: `src/pages/FixedBills.tsx`
- Modify: `src/components/dashboard/UpcomingBills.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/hooks/useDashboardData.ts`
- Modify: `src/lib/layoutClasses.test.ts`

- [ ] **Step 1: Add failing rendered progress tests**

Use jsdom and render `FixedBillPaymentProgress` with a R$ 700 bill paid R$ 350. Assert the progress element has `aria-valuemin="0"`, `aria-valuemax="700"`, `aria-valuenow="350"`, and rendered `Pago R$ 350,00` / `Falta R$ 350,00`. Render again with remaining zero and assert `Pago` is present and `Adicionar abatimento` is absent. Render a current-month partial bill with `canAddPayment` and assert clicking `Adicionar abatimento` calls `onAddPayment` once. Render with `canAddPayment={false}` and assert no button.

- [ ] **Step 2: Run the progress test and verify RED**

Run: `npm test -- src/components/finance/FixedBillPaymentProgress.test.tsx`

Expected: FAIL because the shared progress component does not exist.

- [ ] **Step 3: Implement the shared compact progress component**

Give the component `{ bill, canAddPayment, onAddPayment, compact? }`. Render the original amount as the primary number, a determinate progress bar sized from `paymentProgress`, accessible min/max/current values based on money, the two approved secondary labels, and the current-month action only when allowed. Use it unchanged in mobile and desktop containers rather than duplicating the calculation.

- [ ] **Step 4: Run rendered progress tests and verify GREEN**

Run: `npm test -- src/components/finance/FixedBillPaymentProgress.test.tsx`

Expected: all progress and action-gating tests PASS.

- [ ] **Step 5: Add failing integration contract checks**

Extend the current source-based integration test to assert the shared component owns `Pago`, `Falta`, progress semantics (`role="progressbar"` with `aria-valuenow`), and `Adicionar abatimento`; both consumers import `FixedBillPaymentProgress` and `FixedBillPaymentModal`; neither imports/calls `payFixedBill` or `removeFixedBillPayments`; and `Dashboard` passes selected month plus refresh. Rendered behavior remains covered by the shared progress and modal tests.

- [ ] **Step 6: Run UI contract tests and verify RED**

Run: `npm test -- src/lib/layoutClasses.test.ts`

Expected: FAIL because the compact partial-payment UI is not wired.

- [ ] **Step 7: Replace pay/reopen controls with the shared progress and modal**

In both consumers:

- keep one `selectedPaymentBill: DynamicFixedBill | null` state;
- compute `canAddPayment = selectedMonthKey === getCurrentMonthKey() && bill.remainingAmount > 0`;
- render original amount as primary, a determinate progress bar, and secondary `Pago R$ ...` / `Falta R$ ...` values;
- show `Adicionar abatimento` only for eligible current-month bills;
- show the paid state without a reopen action when `remainingAmount === 0`;
- pass the selected bill, selected month, close callback, and existing `refetch` to `FixedBillPaymentModal`.

Return `refetch: fetchData` from `useDashboardData`. In `Dashboard`, destructure it and pass `<UpcomingBills data={fixedBills} selectedMonthKey={selectedMonthRange.monthKey} onRefresh={refetch} />`. Extend `UpcomingBillsProps` with those exact properties; do not create a second data fetch.

- [ ] **Step 8: Run rendered/integration tests, build, and sync Android**

Run: `npm test -- src/components/finance/FixedBillPaymentProgress.test.tsx src/lib/layoutClasses.test.ts && npm run build && npm run android:sync`

Expected: tests PASS and both responsive layouts compile.

- [ ] **Step 9: Commit fixed-bill UI integration**

Run:

```bash
git status --short
git diff --check
git add -N src/components/finance/FixedBillPaymentProgress.tsx src/components/finance/FixedBillPaymentProgress.test.tsx src/pages/FixedBills.tsx src/components/dashboard/UpcomingBills.tsx src/pages/Dashboard.tsx src/hooks/useDashboardData.ts src/lib/layoutClasses.test.ts
git diff -- src/components/finance/FixedBillPaymentProgress.tsx src/components/finance/FixedBillPaymentProgress.test.tsx src/pages/FixedBills.tsx src/components/dashboard/UpcomingBills.tsx src/pages/Dashboard.tsx src/hooks/useDashboardData.ts src/lib/layoutClasses.test.ts
git add src/components/finance/FixedBillPaymentProgress.tsx src/components/finance/FixedBillPaymentProgress.test.tsx src/pages/FixedBills.tsx src/components/dashboard/UpcomingBills.tsx src/pages/Dashboard.tsx src/hooks/useDashboardData.ts src/lib/layoutClasses.test.ts
git commit -m "feat: show fixed bill payment progress"
```

Expected: UI integration commit created.

### Task 6: Distinguish fixed-bill payments in expense history

**Files:**
- Create: `src/lib/fixedBillPaymentPresentation.ts`
- Create: `src/lib/fixedBillPaymentPresentation.test.ts`
- Create: `src/pages/Expenses.fixedBillPayments.test.tsx`
- Modify: `src/pages/Expenses.tsx`
- Modify: `src/components/finance/RecordActionsMenu.tsx`
- Create: `src/components/finance/RecordActionsMenu.test.tsx`
- Modify: `src/lib/layoutClasses.test.ts`

- [ ] **Step 1: Write failing presentation tests**

```ts
expect(getFixedBillPaymentPresentation(makeTransaction({
  notes: 'fixed_bill:bill-1', description: 'Abatimento: Vale casa',
}))).toEqual({ kind: 'partial', badge: 'Pagamento parcial', context: 'Vinculado à conta fixa' });

expect(getFixedBillPaymentPresentation(makeTransaction({
  notes: 'fixed_bill:bill-1', description: 'Pagamento: Vale casa',
}))).toEqual({ kind: 'legacy', badge: 'Conta fixa', context: 'Vinculado à conta fixa' });

expect(getFixedBillPaymentPresentation(makeTransaction({ notes: null }))).toBeNull();

expect(getFixedBillPaymentPresentation(makeTransaction({ notes: 'fixed_bill:' }))).toBeNull();
expect(getFixedBillPaymentPresentation(makeTransaction({ notes: 'fixed_bill:bill-1:extra' }))).toBeNull();
```

Add `RecordActionsMenu.test.tsx` under jsdom: render without `onPrimaryAction`, open the menu, assert `Excluir` is present and `Editar` absent; render with the callback and assert `Editar` is present. Add `Expenses.fixedBillPayments.test.tsx` with mocked `useOutletContext`, `useTransactions`, and financial actions. Return one `Abatimento:` row and one legacy `Pagamento:` row, render `Expenses`, and assert both mobile and desktop paths contain their correct badges/context/green stripe marker; open each linked action menu and assert the status/edit primary action is absent while delete remains. The fixture's delete action must call `deleteFinancialTransaction` only for the clicked transaction ID and then `refetch`.

- [ ] **Step 2: Run presentation and layout tests and verify RED**

Run: `npm test -- src/lib/fixedBillPaymentPresentation.test.ts src/components/finance/RecordActionsMenu.test.tsx src/pages/Expenses.fixedBillPayments.test.tsx src/lib/layoutClasses.test.ts`

Expected: FAIL because presentation helper and special rendering do not exist.

- [ ] **Step 3: Implement the pure classification and special expense rendering**

Classify only exact `fixed_bill:<non-empty-id>` notes. Return `partial` only when description starts with `Abatimento:`; otherwise return `legacy`. In `Expenses`, use the helper in both responsive paths to add `border-l-4 border-l-primary`, `Landmark`, the correct badge, and `Vinculado à conta fixa`. Keep the existing delete path so deletion removes one selected transaction and the existing financial event recalculates the bill. Modify `RecordActionsMenu` so its primary button is rendered only when `onPrimaryAction` is provided. For linked fixed-bill transactions, pass no primary action and set `deleteLabel="Excluir abatimento"`; normal expenses retain the existing status action and delete behavior.

- [ ] **Step 4: Run focused tests and build**

Run: `npm test -- src/lib/fixedBillPaymentPresentation.test.ts src/components/finance/RecordActionsMenu.test.tsx src/pages/Expenses.fixedBillPayments.test.tsx src/lib/layoutClasses.test.ts && npm run build && npm run android:sync`

Expected: tests PASS and expense history compiles.

- [ ] **Step 5: Commit expense-history treatment**

Run:

```bash
git status --short
git diff --check
git add -N src/lib/fixedBillPaymentPresentation.ts src/lib/fixedBillPaymentPresentation.test.ts src/pages/Expenses.fixedBillPayments.test.tsx src/pages/Expenses.tsx src/components/finance/RecordActionsMenu.tsx src/components/finance/RecordActionsMenu.test.tsx src/lib/layoutClasses.test.ts
git diff -- src/lib/fixedBillPaymentPresentation.ts src/lib/fixedBillPaymentPresentation.test.ts src/pages/Expenses.fixedBillPayments.test.tsx src/pages/Expenses.tsx src/components/finance/RecordActionsMenu.tsx src/components/finance/RecordActionsMenu.test.tsx src/lib/layoutClasses.test.ts
git add src/lib/fixedBillPaymentPresentation.ts src/lib/fixedBillPaymentPresentation.test.ts src/pages/Expenses.fixedBillPayments.test.tsx src/pages/Expenses.tsx src/components/finance/RecordActionsMenu.tsx src/components/finance/RecordActionsMenu.test.tsx src/lib/layoutClasses.test.ts
git commit -m "feat: distinguish fixed bill payments in expenses"
```

Expected: history commit created.

### Task 7: Verify the fixed-bill feature and synchronize Android

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

- [ ] **Step 4: Review the final diff and repository state**

Run:

```bash
git status --short --branch
git diff --check
git log --oneline --decorate -8
```

Expected: no uncommitted source changes, no whitespace errors, and only focused feature commits after the design commit. If Android sync changes tracked Android files, review them and commit with `chore: sync android fixed bill payments` after re-running the same status/diff checks.

- [ ] **Step 5: Perform manual browser acceptance checks**

Run `npm run dev -- --host 127.0.0.1`, open the printed `http://127.0.0.1:<port>/`, and verify at desktop 1440×900 and mobile 390×844: R$ 350 against R$ 700 leaves R$ 350; R$ 351 is rejected after that; a second R$ 350 closes the bill; previous/future months do not offer payment; deleting one partial payment in Expenses recalculates the remaining amount; new `Abatimento:` entries show green stripe/landmark/`Pagamento parcial`, legacy `Pagamento:` entries show `Conta fixa`, both show linked context and delete-only actions; fixed-bill cards show the compact approved hierarchy.
