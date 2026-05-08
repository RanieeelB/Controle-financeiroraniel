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
});
