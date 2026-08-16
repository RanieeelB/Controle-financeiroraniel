import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(file: string) {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

function methodSource(contents: string, method: string, nextMethod: string) {
  return contents.slice(contents.indexOf(`async ${method}`), contents.indexOf(`async ${nextMethod}`));
}

describe('financial Supabase pagination wiring', () => {
  it('paginates fixed bills and their selected-month payments with stable ordering', () => {
    const contents = source('src/hooks/useFixedBills.ts');

    expect(contents.match(/collectSupabasePages</g)).toHaveLength(2);
    expect(contents.match(/\.range\(from, to\)/g)).toHaveLength(2);
    expect(contents).toMatch(/order\('due_day',[\s\S]*order\('id'/);
    expect(contents).toMatch(/from\('transactions'\)[\s\S]*order\('id'/);
  });

  it('paginates every dashboard list used for financial totals with unique ordering', () => {
    const contents = source('src/hooks/useDashboardData.ts');

    for (const table of ['transactions', 'fixed_bills', 'credit_cards', 'invoice_items', 'financial_goals']) {
      const tableStart = contents.indexOf(`from('${table}')`);
      expect(tableStart, table).toBeGreaterThan(-1);
      const queryTail = contents.slice(tableStart, tableStart + 700);
      expect(queryTail, table).toContain("order('id'");
      expect(queryTail, table).toContain('.range(from, to)');
    }
    expect(contents.match(/collectSupabasePages</g)).toHaveLength(5);
  });

  it('paginates filtered transactions and coordinates keyed refreshes', () => {
    const contents = source('src/hooks/useTransactions.ts');

    expect(contents).toContain('collectSupabasePages');
    expect(contents).toContain('.range(from, to)');
    expect(contents).toMatch(/order\('date', \{ ascending: false \}\)[\s\S]*order\('id', \{ ascending: true \}\)/);
    expect(contents).toContain('createFinancialRefreshCoordinator');
    expect(contents).toContain('getFinancialDataVersion');
    expect(contents).toContain('refreshCoordinator.isCurrentKey(queryKey)');
  });

  it('paginates every Telegram financial repository list method', () => {
    const contents = source('api/_shared/telegramServer.ts');
    const methods = [
      ['listMonthTransactions', 'listMonthInvoiceItems'],
      ['listMonthInvoiceItems', 'listCreditCards'],
      ['listCreditCards', 'listFixedBills'],
      ['listFixedBills', 'listInvestments'],
      ['listInvestments', 'insertInvestmentDeposit'],
      ['listFinancialGoals', 'getSalarySettings'],
    ] as const;

    for (const [method, nextMethod] of methods) {
      const methodContents = methodSource(contents, method, nextMethod);
      expect(methodContents, method).toContain('collectSupabasePages');
      expect(methodContents, method).toContain('.range(from, to)');
      expect(methodContents, method).toContain("order('id'");
    }
  });
});
