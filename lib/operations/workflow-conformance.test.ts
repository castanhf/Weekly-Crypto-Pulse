// @vitest-environment node
/**
 * Guards against workflow commit steps adding gitignored directories.
 *
 * Root cause of hotfix v2.1.3: daily-pipeline.yml added data/daily-drafts/
 * and data/daily-inputs/ (both gitignored), causing git add to fail.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

const PIPELINE_WORKFLOWS = [
  '.github/workflows/daily-pipeline.yml',
  '.github/workflows/weekly-report-automation.yml'
] as const;

// Specific gitignored subdirectories — regex checks for these anywhere in a git add arg list
const GITIGNORED_SUBDIRS = [
  'data/daily-drafts',
  'data/daily-inputs',
  'data/weekly-drafts'
] as const;

describe('GitHub Actions workflow conformance', () => {
  describe.each(PIPELINE_WORKFLOWS)('%s', (workflowPath) => {
    const content = readFileSync(path.join(ROOT, workflowPath), 'utf-8');

    it('does not git add gitignored directories', () => {
      for (const gitignored of GITIGNORED_SUBDIRS) {
        expect(
          content,
          `Workflow must not "git add ${gitignored}" — that path is gitignored`
        ).not.toMatch(new RegExp(`git add[^\\n]*${gitignored.replace('/', '\\/')}`));
      }
    });

    it('does not git add the entire data/ directory (too broad)', () => {
      // "git add data/" with no subdirectory after the slash — would include all gitignored dirs.
      // Matches "git add data/" at end-of-line or followed by whitespace.
      expect(content).not.toMatch(/git add data\/(?:\s|$)/m);
    });

    it('YAML parses without error', () => {
      const { load } = require('js-yaml') as typeof import('js-yaml');
      expect(() => load(content)).not.toThrow();
    });
  });

  it('daily workflow commit step targets only data/dailies/', () => {
    const content = readFileSync(
      path.join(ROOT, '.github/workflows/daily-pipeline.yml'),
      'utf-8'
    );
    expect(content).toContain('git add data/dailies/');
  });

  it('weekly workflow commit step targets only data/reports and data/pro-packs', () => {
    const content = readFileSync(
      path.join(ROOT, '.github/workflows/weekly-report-automation.yml'),
      'utf-8'
    );
    expect(content).toContain('git add data/reports data/pro-packs');
  });
});
