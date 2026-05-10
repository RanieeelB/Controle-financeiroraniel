import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Android packaging setup', () => {
  it('configures Capacitor Android around the existing Vite build', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const configPath = join(process.cwd(), 'capacitor.config.ts');

    expect(packageJson.dependencies).toHaveProperty('@capacitor/core');
    expect(packageJson.dependencies).toHaveProperty('@capacitor/android');
    expect(packageJson.devDependencies).toHaveProperty('@capacitor/cli');
    expect(packageJson.scripts).toMatchObject({
      'android:sync': 'npm run build && npx cap sync android',
      'android:apk': 'npm run android:sync && cd android && gradlew.bat assembleDebug',
    });
    expect(existsSync(configPath)).toBe(true);

    const config = readFileSync(configPath, 'utf8');
    expect(config).toContain("appName: 'Saldo Real'");
    expect(config).toContain("appId: 'com.ranieelb.controlefinanceiro'");
    expect(config).toContain("webDir: 'dist'");
  });

  it('documents that Android must be synced after each feature', () => {
    const agents = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf8');

    expect(agents).toContain('Run `npm run android:sync` after each feature that changes the web app');
  });
});
