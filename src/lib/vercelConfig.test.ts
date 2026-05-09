import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('vercel SPA routing config', () => {
  it('defines a rewrite so direct React Router URLs resolve to the app shell', () => {
    const configPath = join(process.cwd(), 'vercel.json');

    expect(existsSync(configPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      rewrites?: Array<{ source?: string; destination?: string }>;
    };

    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/(.*)',
          destination: '/',
        }),
      ]),
    );
  });
});
