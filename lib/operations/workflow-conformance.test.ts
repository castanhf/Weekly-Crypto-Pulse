// @vitest-environment node
/**
 * Guards against workflow commit steps adding gitignored paths.
 *
 * v2.1.3: introduced with hardcoded forbidden list — missed data/pro-packs.
 * v2.1.4: replaced with dynamic .gitignore check so any new gitignored path
 *         under data/ is caught automatically without updating this file.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

const PIPELINE_WORKFLOWS = [
  '.github/workflows/daily-pipeline.yml',
  '.github/workflows/weekly-report-automation.yml'
] as const;

function extractGitignoredDataPaths(): string[] {
  const gitignore = readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
  return gitignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/^\//, '').replace(/\/$/, ''))
    .filter((line) => line.startsWith('data/'));
}

function extractGitAddPathsFromWorkflow(workflowPath: string): string[] {
  const content = readFileSync(path.join(ROOT, workflowPath), 'utf-8');
  const paths: string[] = [];
  const gitAddPattern = /git\s+add\s+([^\n&|;]+)/g;
  let match: RegExpExecArray | null;
  while ((match = gitAddPattern.exec(content)) !== null) {
    const args = match[1].trim().split(/\s+/);
    paths.push(...args);
  }
  return paths;
}

describe('GitHub Actions workflow conformance', () => {
  const gitignoredPaths = extractGitignoredDataPaths();

  describe.each(PIPELINE_WORKFLOWS)('%s', (workflowPath) => {
    const content = readFileSync(path.join(ROOT, workflowPath), 'utf-8');
    const gitAddPaths = extractGitAddPathsFromWorkflow(workflowPath);

    it('YAML parses without error', () => {
      const { load } = require('js-yaml') as typeof import('js-yaml');
      expect(() => load(content)).not.toThrow();
    });

    it('does not git add any gitignored path', () => {
      for (const addPath of gitAddPaths) {
        const normalized = addPath.replace(/\/$/, '');
        const violating = gitignoredPaths.find(
          (ignored) => normalized === ignored || normalized.startsWith(ignored + '/')
        );
        expect(
          violating,
          `"git add ${addPath}" in ${workflowPath} matches gitignored pattern "${violating}"`
        ).toBeUndefined();
      }
    });
  });

  it('daily workflow commit step targets data/dailies/', () => {
    const content = readFileSync(
      path.join(ROOT, '.github/workflows/daily-pipeline.yml'),
      'utf-8'
    );
    expect(content).toContain('git add data/dailies/');
  });

  it('weekly workflow commit step targets data/reports', () => {
    const content = readFileSync(
      path.join(ROOT, '.github/workflows/weekly-report-automation.yml'),
      'utf-8'
    );
    expect(content).toContain('git add data/reports');
  });

  it('gitignored data paths include the known problem paths', () => {
    expect(gitignoredPaths).toContain('data/pro-packs');
    expect(gitignoredPaths).toContain('data/daily-drafts');
    expect(gitignoredPaths).toContain('data/daily-inputs');
  });
});
