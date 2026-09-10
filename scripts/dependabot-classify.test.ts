import { describe, expect, it } from 'vitest';

// vitest resolves ESM .mjs imports at runtime via Vite/esbuild
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — no declaration file for .mjs; types are asserted below
import { classifyUpdate } from './dependabot-classify.mjs';

const classify: (title: string, body?: string) => 'patch' | 'minor' | 'major' | 'unknown' = classifyUpdate;

describe('classifyUpdate — single package semver', () => {
  it('detects patch', () => {
    expect(classify('Bump foo from 1.2.3 to 1.2.4')).toBe('patch');
  });
  it('detects minor', () => {
    expect(classify('Bump foo from 1.2.3 to 1.3.0')).toBe('minor');
  });
  it('detects major', () => {
    expect(classify('Bump foo from 1.2.3 to 2.0.0')).toBe('major');
  });
  it('handles conventional-commit prefix', () => {
    expect(classify('build(deps): bump postcss from 8.5.25 to 8.5.28')).toBe('patch');
  });
});

describe('classifyUpdate — Actions major-only', () => {
  it('detects major (different integers)', () => {
    expect(classify('Bump actions/checkout from 3 to 4')).toBe('major');
  });
  it('detects patch (same integer)', () => {
    expect(classify('Bump actions/checkout from 4 to 4')).toBe('patch');
  });
});

describe('classifyUpdate — grouped updates', () => {
  // PR body excerpt from actual PR #252
  const realBody = `
Bumps the patch-and-minor group with 4 updates in the / directory.

Updates \`fast-xml-parser\` from 5.10.1 to 5.11.1
Updates \`@testing-library/react\` from 16.3.2 to 16.3.3
Updates \`eslint-config-next\` from 16.2.12 to 16.3.4
Updates \`postcss\` from 8.5.25 to 8.5.28
`;

  it('classifies PR #252 (all minor/patch bumps) as minor', () => {
    const title = 'build(deps): bump the patch-and-minor group across 1 directory with 4 updates';
    expect(classify(title, realBody)).toBe('minor');
  });

  it('classifies as patch when all bumps are patch-level', () => {
    const title = 'build(deps): bump the patch group with 2 updates';
    const body = `
Updates \`foo\` from 1.2.3 to 1.2.4
Updates \`bar\` from 2.0.0 to 2.0.1
`;
    expect(classify(title, body)).toBe('patch');
  });

  it('escalates to major when one constituent is a major bump', () => {
    const title = 'build(deps): bump the mixed group with 3 updates';
    const body = `
Updates \`foo\` from 1.2.3 to 1.2.4
Updates \`bar\` from 1.0.0 to 2.0.0
Updates \`baz\` from 3.1.0 to 3.2.0
`;
    expect(classify(title, body)).toBe('major');
  });

  it('falls back to group-name heuristic when body has no version lines', () => {
    expect(classify('build(deps): bump the patch-and-minor group with 2 updates', '')).toBe('minor');
    expect(classify('build(deps): bump the patch group with 1 update', '')).toBe('patch');
    expect(classify('build(deps): bump the major group with 1 update', '')).toBe('major');
  });

  it('returns unknown for unrecognised group name with no body', () => {
    expect(classify('build(deps): bump the something group with 1 update', '')).toBe('unknown');
  });
});

describe('classifyUpdate — fallback', () => {
  it('returns unknown for unrecognised title format', () => {
    expect(classify('chore: unrelated PR')).toBe('unknown');
  });
});
