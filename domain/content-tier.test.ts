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
      differentiationBoundary:
        'Stops at orientation. It describes the setup, but it does not turn that setup into a paid decision memo or a month-long continuity workflow.',
      includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer', 'orientationTakeaways']
    });
  });

  it('defines weekly pro as the decision tier', () => {
    expect(getContentTierDefinition('weeklyPro')).toMatchObject({
      editorialRole: 'decision',
      workflowMoment: 'Use when the current week requires a concrete decision, not just awareness.',
      primaryQuestion: "What should I do with this week's setup?",
      differentiationBoundary:
        'Starts where Free stops: it moves from descriptive orientation into a decision memo. It still stops before any cross-week continuity or month-end synthesis.',
      includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'decisionScorecard', 'weeklyExecutionChecklist']
    });
  });

  it('defines monthly bundle as the continuity tier', () => {
    expect(getContentTierDefinition('monthlyBundle')).toMatchObject({
      editorialRole: 'continuity',
      workflowMoment: 'Use when one issue is not enough and you want the month to stay connected from week to week.',
      primaryQuestion: 'How is the market thesis developing across the full month?',
      differentiationBoundary:
        'Not just four reports together. It adds the continuity layer: what carried forward, what changed, and how the month resolved in aggregate.',
      includedContentBlocks: [
        'weeklyDecisionBrief',
        'fullNarrative',
        'signalsPackage',
        'decisionScorecard',
        'weeklyExecutionChecklist',
        'monthlyContinuity',
        'crossIssueTracking'
      ]
    });
  });
});
