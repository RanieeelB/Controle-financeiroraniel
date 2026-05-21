# Monthly Balance Carryover Design

## Goal

Automatically carry a positive balance left at the end of the previous month into the new month as a visible income transaction.

## User Rules

- If the previous month closes with a positive available balance, the next month receives an automatic income on day 1.
- The income description is `Sobra do mês <Nome do mês anterior>`.
- The transaction is visible in the income list and participates in dashboard totals, reports, and charts.
- Negative or zero balances do not create any automatic transaction.
- The app must not create duplicates when opened multiple times.

## Balance Rule

The carried amount is calculated from the previous month transactions:

- received income increases the balance;
- paid expenses decrease the balance;
- pending income and pending expenses are ignored.

This matches the app's current "Saldo atual" behavior and avoids carrying money that has not actually arrived or expenses that have not actually left the account.

## Data Shape

The automatic transaction uses the existing `transactions` table:

- `type`: `entrada`
- `description`: `Sobra do mês <previous month label>`
- `amount`: positive carried amount
- `date`: first day of the target month
- `status`: `recebido`
- `payment_method`: `transferencia`
- `category_id`: `null`
- `notes`: `carryover:auto:<target-month-key>`

The `notes` value is the idempotency key. If a transaction with the same note already exists for the user, no new transaction is created.

## Trigger

The layout runs an automatic carryover hook for the currently selected month, but creation is limited to the real current month. This prevents accidentally creating carryovers for future months while browsing the month selector.

## Testing

Add pure helper tests for:

- creating the expected payload for June from a positive May balance;
- returning no payload for zero or negative previous-month balance;
- ignoring pending records in the carried amount.

Add action-level tests only if the current Supabase action test pattern supports it cleanly; otherwise keep the database orchestration minimal and covered by the pure helper behavior.
