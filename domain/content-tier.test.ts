import { describe, expect, it } from 'vitest';

import { CONTENT_TIER_ORDER, getContentTierDefinition } from '@/domain/content-tier';

describe('content tier definitions', () => {
  it('keeps the editorial value hierarchy from orientation to continuity', () => {
    expect(CONTENT_TIER_ORDER).toEqual(['free', 'weeklyPro', 'monthlyBundle']);
  });

  it('defines free as orientation content', () => {
    expect(getContentTierDefinition('free')).toMatchObject({
      id: 'free',
      editorialRoleInValueHierarchy: 'orientation'
    });
  });

  it('defines weekly pro as decision content', () => {
    expect(getContentTierDefinition('weeklyPro')).toMatchObject({
      id: 'weeklyPro',
      editorialRoleInValueHierarchy: 'decision'
    });
  });

  it('defines monthly bundle as continuity content', () => {
    expect(getContentTierDefinition('monthlyBundle')).toMatchObject({
      id: 'monthlyBundle',
      editorialRoleInValueHierarchy: 'continuity'
    });
  });
});
