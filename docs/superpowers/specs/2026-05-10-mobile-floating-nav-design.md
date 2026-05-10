# Mobile Floating Nav Design

## Goal

Replace the mobile hamburger navigation with a futuristic floating bottom dock while keeping the desktop sidebar unchanged.

## Approved Direction

Use option A from the visual companion: a compact bottom dock with primary shortcuts and a "Mais" control for secondary tabs. The dock should feel glassy and futuristic, using the existing dark surface, green primary accent, blur, and soft glow already present in the app.

## Behavior

- On mobile and tablet widths below `lg`, hide the hamburger sidebar entry point.
- Show a fixed bottom navigation dock with icon buttons for high-frequency routes.
- Put less frequent routes in an expandable bottom sheet opened by "Mais".
- Highlight the active route in the dock. If the active route is inside the overflow menu, highlight "Mais".
- Close the overflow sheet after route changes or when the user taps the backdrop.
- Keep desktop behavior unchanged: the full sidebar remains sticky and visible at `lg` and above.
- Add bottom padding to the main content on mobile so the dock does not cover page actions.

## Navigation Split

Primary dock routes:

- Dashboard
- Entradas
- Gastos
- Cartoes

Overflow routes:

- Faturas
- Contas Fixas
- Investimentos
- Metas
- Relatorios
- Configuracoes

## Testing

Extend the existing `src/lib/layoutClasses.test.ts` file with source-level assertions that verify:

- The layout renders the mobile floating navigation.
- The mobile sidebar overlay state and hamburger toggle are no longer used.
- The mobile nav has bottom fixed chrome, blur/glow styling, primary route links, and a "Mais" overflow control.
- The desktop sidebar remains `lg` scoped.
