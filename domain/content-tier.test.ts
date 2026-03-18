import { describe, expect, it } from 'vitest';

import { CONTENT_TIER_IDS, getContentTierDefinition } from '@/domain/content-tier';

describe('content tiers', () => {
  it('keeps the editorial hierarchy from orientation to continuity', () => {
    expect(CONTENT_TIER_IDS).toEqual(['free', 'weeklyPro', 'monthlyBundle']);
  });

  it('defines free as the orientation tier', () => {
    expect(getContentTierDefinition('free')).toMatchObject({
      editorialRole: 'orientation',
      includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer']
    });
  });

  it('defines weekly pro as the decision tier', () => {
    expect(getContentTierDefinition('weeklyPro')).toMatchObject({
      editorialRole: 'decision',
      includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage']
    });
  });

  it('defines monthly bundle as the continuity tier', () => {
    expect(getContentTierDefinition('monthlyBundle')).toMatchObject({
      editorialRole: 'continuity',
      includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking']
    });
  });
});
