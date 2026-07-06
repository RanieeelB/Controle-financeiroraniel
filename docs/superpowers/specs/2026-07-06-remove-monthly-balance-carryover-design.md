# Remove Monthly Balance Carryover Design

## Goal

Remove the `Sobra do mês anterior` feature from the product without deleting historical database records.

## User Rules

- The app must stop creating new automatic carryover transactions.
- Existing carryover transactions must remain stored in the database.
- Existing carryover transactions must not appear in transaction lists, dashboard cards, charts, reports, or any other visible financial UI.
- Existing carryover transactions must not participate in totals, balances, projections, summaries, or any other financial calculation shown to the user.
- Non-carryover transactions must keep their current behavior.

## Carryover Detection Rule

Legacy carryover transactions are identified by `notes` values matching:

- `carryover:auto:<target-month-key>`

This existing note pattern becomes the single source of truth for excluding historical carryover records from the product experience.

## Architecture

The removal should happen in two layers:

1. **Creation removal**
   - Remove the layout-level hook that triggers automatic carryover creation.
   - Remove the action/helper code that exists only to support this automation.

2. **Read-path filtering**
   - Introduce a small shared helper that detects legacy carryover transactions.
   - Introduce a shared filter helper that removes those transactions from arrays before UI and calculation code consumes them.
   - Apply the filter in the central transaction-loading hooks so downstream consumers inherit the cleaned dataset by default.

This keeps the change focused, avoids destructive data migration, and reduces the chance of forgetting one isolated screen.

## Components And Data Flow

### Transaction Loading

`src/hooks/useTransactions.ts` should filter carryover records immediately after mapping Supabase rows into app transactions.

This covers:

- income list views;
- expense list views;
- totals returned by the hook;
- category summaries derived from the hook result.

### Dashboard Loading

`src/hooks/useDashboardData.ts` should apply the same shared filter before computing:

- summary cards;
- balance evolution;
- category expense charts;
- monthly analysis;
- fixed-bill resolution that depends on the transaction list.

### Layout Automation

`src/components/layout/Layout.tsx` should stop invoking the carryover automation hook.

If no other code path uses the feature, the dedicated hook and carryover-specific helper/action code should be removed to avoid dead behavior and future accidental reuse.

## Error Handling

- No database migration is required for this removal.
- Historical carryover rows remain untouched, so rollback risk is low.
- If any old record has malformed `notes`, it is treated as a normal transaction unless it matches the carryover pattern exactly.
- Filtering must be pure and silent; it should not surface warnings to the user.

## Testing

Add or update tests to cover:

- detection of legacy carryover transactions from the `notes` pattern;
- filtering carryover transactions out of mixed transaction arrays;
- preserving non-carryover transactions unchanged;
- excluding carryover transactions from dashboard-facing calculations by validating the filtered dataset path;
- removal of the old carryover-specific helper tests that no longer represent supported behavior.

## Out Of Scope

- Deleting historical carryover rows from Supabase.
- Rewriting old carryover notes into another format.
- Adding a user-facing toggle to reveal hidden legacy carryover entries.
