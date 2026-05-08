# Categories, Monthly View, and Dashboard Chart Design

## Context

The app already stores financial records in Supabase. Transactions, invoice items, and fixed bills can reference `categories`, but the current seed does not create useful default categories. The dashboard also calculates totals across all records instead of the selected month, while the header still shows a fixed month label.

The category expense pie chart is rendered in a tight area, so the donut, icon, and legend can compete for space.

## Goals

- Make useful categories available automatically.
- Let the user create custom categories from inside the app.
- Improve the dashboard "Gastos por categoria" chart so it is readable and responsive.
- Introduce a central selected month so current and previous months can be viewed without losing historical data.

## Non-Goals

- Full category editing and deletion workflows.
- Authentication or per-user ownership changes beyond the current schema.
- Month-end snapshot tables. Historical month views can be derived from dated records for now.
- Advanced recurrence generation for fixed bills.

## Categories

Categories remain records in the existing `categories` table. The app should guarantee a starter set when categories are missing or when specific defaults are absent.

Default expense categories:

- Estudo
- Transporte
- Lazer
- iFood
- Mercado
- Casa
- Saude
- Assinaturas
- Compras
- Outros

Default income categories:

- Salario
- Freela
- Rendimentos
- Reembolso
- Outros recebimentos

The new transaction modal keeps the category select and adds a small "Nova categoria" action. Creating a category requires:

- name
- type: `entrada`, `gasto`, or `ambos`
- color

After creation, the modal refreshes categories and selects the newly created category when it matches the current transaction type.

Settings should include a simple categories section that lists available categories and allows creating a category. Editing and deleting can be added later.

## Monthly Selection

The selected month should live near the layout/header level so pages can share it. The default is the current month.

The header should show the selected month, for example `Maio 2026`, with previous and next controls. The static `Maio 2026` subtitle should be removed.

Monthly data queries should use the record `date` field:

- start: first day of selected month, inclusive
- end: first day of next month, exclusive

This keeps May records available after June starts. The user can move back to May and see May data because the records remain dated in Supabase.

Initial monthly filtering should apply to:

- Dashboard
- Entradas
- Gastos
- Relatorios
- Faturas / invoice items where the record has a `date`

Fixed bills and goals are not true monthly transactions yet. They can remain visible, while totals that represent actual monthly cash flow should use dated transactions and invoice items.

## Dashboard Category Chart

`CategoryExpenseChart` should be redesigned with stable responsive dimensions:

- a larger donut container
- chart and legend separated so neither covers the other
- top categories sorted by value
- optional `Outros` bucket when there are more categories than the display limit
- empty state when there are no expenses in the selected month
- tooltip formatting in BRL

The chart should work in the existing dashboard grid and on narrow screens.

## Data Flow

1. Layout stores `selectedMonth`.
2. Header updates `selectedMonth`.
3. Pages read selected month through props or context.
4. Hooks receive a month range and query Supabase by `date`.
5. Dashboard derives summary cards, balance evolution, category expenses, and monthly analysis from filtered records.
6. Category creation writes to Supabase, emits the existing financial data changed event, and refreshes category lists.

## Testing

Add tests for pure date and aggregation helpers before implementation:

- build a selected month range from a month key.
- filter/query helpers use inclusive start and exclusive end.
- category expense aggregation groups by category, sorts by value, and creates an `Outros` bucket.
- default category definitions contain the expected expense and income categories.

Run the existing validation scripts before each commit:

- `npm test`
- `npm run build`
- `npm run lint`

