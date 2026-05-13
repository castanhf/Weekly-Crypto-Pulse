import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Enforces that lib/ files consumed by Node scripts use relative imports
 * instead of the @/ TypeScript path alias.
 *
 * Why: pipeline scripts compile via tsconfig.scripts.json and execute via
 * plain Node. TypeScript emits @/ literally in JS output — Node cannot
 * resolve it. Files in script-consumed directories must use relative imports.
 *
 * Test files (.test.ts) are excluded — Vitest resolves @/ correctly.
 */

const SCRIPT_CONSUMED_DIRS = [
  'lib/reports',
  'lib/email',
  'lib/market-data',
  'lib/markets',
  'lib/news',
  'lib/llm',
  'lib/charts',
  'lib/cache'
] as const;

const ROOT = join(import.meta.dirname, '..');

const collectViolations = (): ReadonlyArray<{ file: string; line: number; text: string }> => {
  const violations: Array<{ file: string; line: number; text: string }> = [];

  for (const dir of SCRIPT_CONSUMED_DIRS) {
    const fullDir = join(ROOT, dir);
    let files: string[];

    try {
      files = readdirSync(fullDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    } catch {
      continue;
    }

    for (const file of files) {
      const content = readFileSync(join(fullDir, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("from '@/")) {
          violations.push({ file: `${dir}/${file}`, line: i + 1, text: lines[i].trim() });
        }
      }
    }
  }

  return violations;
};

describe('import convention', () => {
  it('script-consumed lib/ source files use relative imports, not @/ aliases', () => {
    const violations = collectViolations();

    if (violations.length > 0) {
      const details = violations.map((v) => `  ${v.file}:${v.line}: ${v.text}`).join('\n');

      expect.fail(
        `Found ${violations.length} @/ import(s) in script-consumed lib/ directories.\n` +
          `Convert to relative imports — Node cannot resolve @/ in compiled scripts.\n\n` +
          details
      );
    }

    expect(violations).toHaveLength(0);
  });
});
