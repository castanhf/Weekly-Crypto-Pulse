// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

const EXPECTED_CHECK_IDS: ReadonlyArray<string> = [
  '1 — Register Check',
  '2 — Advisory Framing Check',
  '3 — Winners-and-Losers Check',
  '4 — Stablecoin and Derivative Narration Check',
  '5 — Length Check',
  '6 — Section Completeness Check',
  '7 — Schema Check',
  '8 — Factual Traceability Check',
  '9 — Weekly Footer Check',
  '10 — Headline Specificity Check',
  '11 — Summary Editorial Check',
  '12 — Causal Attribution Check',
  '13 — Tag Specificity Check',
  '14 — Quiet-Day Honesty Check',
  '15 — Substantive Revision Check (Rounds 2+)'
];

const extractMarkdownCheckIds = (source: string): string[] => {
  const ids: string[] = [];
  for (const line of source.split('\n')) {
    const m = line.match(/^###\s+Checklist Item\s+(\d+)\s+—\s+(.+)$/);
    if (m) ids.push(`${m[1]} — ${m[2].trim()}`);
  }
  return ids;
};

const extractInlineCheckIds = (source: string): string[] => {
  const promptMatch = source.match(/INLINE_SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`\s*;/);
  if (!promptMatch) return [];
  const promptBody = promptMatch[1];
  const ids: string[] = [];
  for (const line of promptBody.split('\n')) {
    const m = line.match(/^(\d+)\s+—\s+([^:]+)/);
    if (m) {
      const rawName = m[2].trim().replace(/\s*\([^)]+\)$/, '').replace(/\s*\([A-Z ]+\)$/, '').trim();
      ids.push(`${m[1]} — ${rawName}`);
    }
  }
  return ids;
};

describe('daily editor spec consistency', () => {
  const markdownSource = readFileSync(path.join(ROOT, '.claude/agents/daily_editor.md'), 'utf-8');
  const tsSource = readFileSync(path.join(ROOT, 'scripts/review-daily-report.ts'), 'utf-8');

  const markdownIds = extractMarkdownCheckIds(markdownSource);
  const inlineIds = extractInlineCheckIds(tsSource);

  it('markdown spec has exactly 15 checklist items', () => {
    expect(markdownIds).toHaveLength(15);
  });

  it('inline fallback prompt has exactly 15 checklist items', () => {
    expect(inlineIds).toHaveLength(15);
  });

  it.each(EXPECTED_CHECK_IDS.map((id) => [id] as const))(
    'markdown spec contains check "%s"',
    (checkId) => {
      expect(markdownIds).toContain(checkId);
    }
  );

  it('inline fallback prompt check numbers match markdown spec check numbers', () => {
    const markdownNums = markdownIds.map((id) => id.split(' — ')[0]);
    const inlineNums = inlineIds.map((id) => id.split(' — ')[0]);
    expect(inlineNums).toEqual(markdownNums);
  });

  it('inline fallback prompt check 9 name is "Weekly Footer Check"', () => {
    const check9 = inlineIds.find((id) => id.startsWith('9 — '));
    expect(check9).toBe('9 — Weekly Footer Check');
  });

  it('file header comment cites 15-item checklist', () => {
    expect(tsSource).toMatch(/runs the 15-item editorial/);
  });

  it('INLINE_SYSTEM_PROMPT header cites 15-item checklist', () => {
    expect(tsSource).toMatch(/against the 15-item editorial checklist/);
  });
});
