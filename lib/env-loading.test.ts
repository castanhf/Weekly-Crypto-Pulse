import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from 'vitest';

const ENTRY_POINTS_REQUIRING_DOTENV = [
  'scripts/run-daily-pipeline.ts',
  'scripts/run-sunday-digest-pipeline.ts',
  'scripts/generate-local-report.ts',
  'scripts/generate-report-input.ts',
  'scripts/generate-daily-input.ts',
  'scripts/generate-daily-report.ts',
  'scripts/review-daily-report.ts',
  'scripts/smoke-beehiiv.ts',
] as const;

test('entry-point scripts import and call dotenv', () => {
  for (const entry of ENTRY_POINTS_REQUIRING_DOTENV) {
    const fullPath = join(process.cwd(), entry);
    if (!existsSync(fullPath)) {
      throw new Error(`Expected entry-point script not found: ${entry}`);
    }

    const content = readFileSync(fullPath, 'utf-8');
    expect(content, `${entry} must import dotenv`).toMatch(/import dotenv from ['"]dotenv['"]/);
    expect(content, `${entry} must call dotenv.config`).toMatch(/dotenv\.config\(/);
  }
});

test('npm scripts do not use --env-file flag', () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as {
    scripts?: Record<string, unknown>;
  };
  const scripts = packageJson.scripts ?? {};

  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== 'string') continue;
    expect(command, `Script "${name}" must not use --env-file flag`).not.toMatch(/--env-file/);
  }
});
