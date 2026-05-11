import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('telegram settings source', () => {
  it('renders a telegram settings section with one-time token generation states', () => {
    const settings = readFileSync(join(process.cwd(), 'src/pages/Settings.tsx'), 'utf8');

    expect(settings).toContain('Telegram');
    expect(settings).toContain('Gerar token de acesso');
    expect(settings).toContain('Token gerado aguardando vinculação');
    expect(settings).toContain('Telegram conectado');
    expect(settings).toContain('Esse token aparece apenas uma vez');
  });
});
