import { describe, expect, it } from 'vitest';

import { CONTENT_TIER_IDS, getContentTierDefinition } from '@/domain/content-tier';

describe('content tiers', () => {
  it('keeps the editorial hierarchy from orientation to continuity', () => {
    expect(CONTENT_TIER_IDS).toEqual(['free', 'weeklyPro', 'monthlyBundle']);
  });

  it('defines free as the orientation tier', () => {
    expect(getContentTierDefinition('free')).toMatchObject({
      editorialRole: 'orientation',
      workflowMoment: 'Use before you decide whether deeper follow-through is necessary.',
      primaryQuestion: 'What is the market environment right now?',
      includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer']
    });
  });

  it('defines weekly pro as the decision tier', () => {
    expect(getContentTierDefinition('weeklyPro')).toMatchObject({
      editorialRole: 'decision',
      workflowMoment: 'Use when the current week requires a concrete decision, not just awareness.',
      primaryQuestion: 'How should this week change my posture or watchlist?',
      includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage']
    });
  });

  it('defines monthly bundle as the continuity tier', () => {
    expect(getContentTierDefinition('monthlyBundle')).toMatchObject({
      editorialRole: 'continuity',
      workflowMoment: 'Use when one issue is not enough and you want the month to stay connected from week to week.',
      primaryQuestion: 'How is the market thesis developing across the full month?',
      includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking']
    });
  });
});
