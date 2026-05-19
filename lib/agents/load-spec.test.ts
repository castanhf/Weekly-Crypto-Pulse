import { describe, expect, it } from 'vitest';

import { loadAgentSpec } from '@/lib/agents/load-spec';

describe('loadAgentSpec', () => {
  it('loads a real agent spec and returns non-null content', () => {
    const spec = loadAgentSpec('daily_writer');
    expect(spec).not.toBeNull();
    expect(typeof spec).toBe('string');
    expect(spec!.length).toBeGreaterThan(100);
  });

  it('strips frontmatter — result does not start with ---', () => {
    const spec = loadAgentSpec('daily_writer');
    expect(spec).not.toBeNull();
    expect(spec!.startsWith('---')).toBe(false);
  });

  it('strips frontmatter — does not contain the name field', () => {
    const spec = loadAgentSpec('daily_writer');
    expect(spec).not.toBeNull();
    expect(spec).not.toContain('name: daily_writer');
  });

  it('preserves the spec body content', () => {
    const spec = loadAgentSpec('daily_writer');
    expect(spec).not.toBeNull();
    expect(spec).toContain('## Mission');
  });

  it('loads the daily_editor spec', () => {
    const spec = loadAgentSpec('daily_editor');
    expect(spec).not.toBeNull();
    expect(spec).toContain('## Mission');
  });

  it('returns null for a non-existent agent name', () => {
    const spec = loadAgentSpec('nonexistent_agent_xyz_12345');
    expect(spec).toBeNull();
  });
});
