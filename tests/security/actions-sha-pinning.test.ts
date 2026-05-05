import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
const workflowFiles = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml'));

const SHA_PATTERN = /^[0-9a-f]{40}$/i;

describe('GitHub Actions SHA pinning', () => {
  for (const workflowFile of workflowFiles) {
    it(`all third-party actions in ${workflowFile} are pinned to a full SHA`, () => {
      const content = readFileSync(path.join(workflowsDir, workflowFile), 'utf-8');

      const usesLines = content
        .split('\n')
        .filter((line) => /^\s+uses:\s+/.test(line))
        .map((line) => line.trim());

      for (const line of usesLines) {
        const match = line.match(/^uses:\s+(.+?)(\s+#.*)?$/);
        if (!match) continue;

        const actionRef = match[1].trim();

        // Skip local composite actions — they don't have @ references
        if (actionRef.startsWith('./')) continue;

        const atIndex = actionRef.indexOf('@');
        expect(atIndex).toBeGreaterThan(0);

        const sha = actionRef.slice(atIndex + 1);
        expect(SHA_PATTERN.test(sha), `${actionRef} must be pinned to a 40-char SHA, got: ${sha}`).toBe(true);
      }
    });
  }
});
