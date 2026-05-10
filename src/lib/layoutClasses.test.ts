import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filesWithResponsiveMaxWidths = [
  'src/components/dashboard/NewTransactionModal.tsx',
  'src/components/finance/FinanceModals.tsx',
  'src/pages/Cards.tsx',
  'src/pages/Goals.tsx',
  'src/pages/Investments.tsx',
  'src/pages/Reports.tsx',
  'src/pages/Settings.tsx',
];

describe('layout width classes', () => {
  it('does not use named max-width utilities that collide with custom spacing tokens', () => {
    const offenders = filesWithResponsiveMaxWidths.flatMap(file => {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      return [...contents.matchAll(/\bmax-w-(?:md|xl|2xl)\b/g)].map(match => `${file}:${match[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  it('keeps the application shell responsive below tablet widths', () => {
    const layout = readFileSync(join(process.cwd(), 'src/components/layout/Layout.tsx'), 'utf8');
    const sidebar = readFileSync(join(process.cwd(), 'src/components/layout/AppSidebar.tsx'), 'utf8');
    const header = readFileSync(join(process.cwd(), 'src/components/layout/DashboardHeader.tsx'), 'utf8');

    expect(layout).toContain('px-4');
    expect(layout).toContain('sm:px-6');
    expect(layout).toContain('lg:px-xl');
    expect(sidebar).toContain('h-[100dvh]');
    expect(header).toContain('min-w-0');
    expect(header).toContain('w-full sm:w-auto');
  });

  it('keeps dialogs inside the mobile viewport with internal scrolling', () => {
    const modalFiles = [
      'src/components/dashboard/NewTransactionModal.tsx',
      'src/components/dashboard/PjTaxesModal.tsx',
      'src/components/finance/FinanceModals.tsx',
    ];

    for (const file of modalFiles) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).toContain('max-h-[90dvh]');
      expect(contents, file).toContain('overflow-y-auto');
    }
  });

  it('sets minimum table widths only inside horizontal scroll regions', () => {
    const tableFiles = [
      'src/pages/Incomes.tsx',
      'src/pages/Expenses.tsx',
      'src/pages/FixedBills.tsx',
      'src/pages/Reports.tsx',
      'src/components/dashboard/UpcomingBills.tsx',
    ];

    for (const file of tableFiles) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).toContain('overflow-x-auto');
      expect(contents, file).toMatch(/<table className="[^"]*min-w-\[/);
    }
  });

  it('scales oversized financial typography on mobile cards', () => {
    const files = [
      'src/components/dashboard/SummaryCardsGrid.tsx',
      'src/pages/Incomes.tsx',
      'src/pages/Expenses.tsx',
      'src/pages/Goals.tsx',
    ];

    for (const file of files) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).not.toMatch(/(?:^|\s)text-\[48px\]/);
    }
  });

  it('allows compact dashboard list content to shrink instead of overflowing', () => {
    const files = [
      'src/components/dashboard/CreditCardInvoices.tsx',
      'src/components/dashboard/FinancialGoalCard.tsx',
      'src/pages/Cards.tsx',
      'src/pages/Invoices.tsx',
      'src/pages/Investments.tsx',
      'src/pages/Reports.tsx',
    ];

    for (const file of files) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).toContain('min-w-0');
    }
  });

  it('uses mobile-first dashboard surfaces instead of forcing desktop tables first', () => {
    const dashboard = readFileSync(join(process.cwd(), 'src/pages/Dashboard.tsx'), 'utf8');
    const summaryCards = readFileSync(join(process.cwd(), 'src/components/dashboard/SummaryCardsGrid.tsx'), 'utf8');
    const upcomingBills = readFileSync(join(process.cwd(), 'src/components/dashboard/UpcomingBills.tsx'), 'utf8');

    expect(dashboard).toContain('gap-lg lg:gap-xl');
    expect(summaryCards).toContain('sm:grid-cols-2');
    expect(summaryCards).toContain('lg:col-span-1');
    expect(upcomingBills).toContain('md:hidden');
    expect(upcomingBills).toContain('hidden md:block');
  });

  it('uses mobile card lists for data-heavy pages before switching to tables', () => {
    const files = [
      'src/pages/Incomes.tsx',
      'src/pages/Expenses.tsx',
      'src/pages/FixedBills.tsx',
      'src/pages/Reports.tsx',
    ];

    for (const file of files) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).toContain('md:hidden');
      expect(contents, file).toContain('hidden md:block');
    }
  });

  it('keeps primary actions reachable as full-width mobile buttons on feature pages', () => {
    const files = [
      'src/pages/Cards.tsx',
      'src/pages/Invoices.tsx',
      'src/pages/Investments.tsx',
      'src/pages/Goals.tsx',
      'src/pages/FixedBills.tsx',
    ];

    for (const file of files) {
      const contents = readFileSync(join(process.cwd(), file), 'utf8');
      expect(contents, file).toContain('min-h-11');
      expect(contents, file).toContain('w-full');
    }
  });
});
