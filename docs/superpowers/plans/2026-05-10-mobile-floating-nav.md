# Mobile Floating Nav Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile hamburger menu with a futuristic floating bottom navigation dock.

**Architecture:** Reuse one shared navigation list from `navigationItems.ts`. Add a focused `MobileFloatingNav.tsx` component for mobile-only bottom navigation and overflow behavior. Keep desktop sidebar logic in `Layout.tsx`, and simplify `DashboardHeader.tsx` by removing the hamburger control.

**Tech Stack:** React 19, React Router `NavLink`, lucide-react icons, Tailwind utility classes, Vitest source assertions.

---

## File Structure

- Create `src/components/layout/navigationItems.ts`: export `navItems` so desktop and mobile navigation share one source.
- Modify `src/components/layout/AppSidebar.tsx`: import shared `navItems`.
- Create `src/components/layout/MobileFloatingNav.tsx`: render mobile dock, overflow sheet, active state, and close behavior.
- Modify `src/components/layout/Layout.tsx`: remove mobile sidebar state/overlay, render desktop sidebar only at `lg`, render `MobileFloatingNav`, and add mobile bottom padding to page content.
- Modify `src/components/layout/DashboardHeader.tsx`: remove hamburger icon import, prop, and button.
- Modify `src/lib/layoutClasses.test.ts`: add failing source assertions before implementation.

## Chunk 1: Mobile Nav Tests

- [ ] **Step 1: Write the failing test**

Add a test in `src/lib/layoutClasses.test.ts` that reads `Layout.tsx`, `DashboardHeader.tsx`, and `MobileFloatingNav.tsx` if present. Assert that the layout contains `MobileFloatingNav`, no longer contains `isMobileMenuOpen`, the header no longer contains `Menu`, and the mobile nav contains `fixed bottom-4`, `backdrop-blur`, `Mais`, and `lg:hidden`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/layoutClasses.test.ts`

Expected: FAIL because `MobileFloatingNav.tsx` does not exist yet and the layout still uses mobile sidebar state.

## Chunk 2: Mobile Nav Component

- [ ] **Step 3: Export shared nav data**

Create `src/components/layout/navigationItems.ts` with the shared route list and lucide icons, then update `AppSidebar.tsx` to import it.

- [ ] **Step 4: Implement `MobileFloatingNav.tsx`**

Create a mobile-only component that:

- imports `navItems`;
- splits primary routes into `/`, `/entradas`, `/gastos`, `/cartoes`;
- renders icon-only dock buttons with accessible labels;
- renders a "Mais" button using a lucide icon;
- opens an overflow panel for the remaining routes;
- closes the panel on backdrop click and location change.

- [ ] **Step 5: Wire layout/header**

In `Layout.tsx`, remove `isMobileMenuOpen`, mobile overlay, and mobile transform sidebar. Render the sidebar as `hidden lg:block` and add `<MobileFloatingNav />` after `<main>`. Add mobile bottom padding to the content wrapper.

In `DashboardHeader.tsx`, remove `Menu`, `onToggleMobileMenu`, and the hamburger button.

- [ ] **Step 6: Run focused test to verify it passes**

Run: `npm test -- src/lib/layoutClasses.test.ts`

Expected: PASS.

## Chunk 3: Validation and Sync

- [ ] **Step 7: Run full validation**

Run:

- `npm test`
- `npm run lint`
- `npm run android:sync`

Expected: all commands exit 0.

- [ ] **Step 8: Browser verification**

Run the app locally, open mobile viewport in the in-app browser, and verify:

- no hamburger button appears;
- the dock floats at the bottom;
- "Mais" opens and closes the overflow routes;
- navigation between dock and overflow routes works;
- page content is not hidden behind the dock.

- [ ] **Step 9: Commit**

Review `git status` and `git diff`, then commit with:

```bash
git add docs/superpowers src
git commit -m "feat: add mobile floating navigation"
```
