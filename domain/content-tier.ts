export type ContentTierId = 'free' | 'weeklyPro' | 'monthlyBundle';

export type ContentBlockId =
  | 'archiveAccess'
  | 'latestReportRead'
  | 'marketSnapshotMetrics'
  | 'methodologyAndDisclaimer'
  | 'weeklyDecisionBrief'
  | 'fullNarrative'
  | 'signalsPackage'
  | 'monthlyContinuity'
  | 'crossIssueTracking';

export type EditorialRole = 'orientation' | 'decision' | 'continuity';

export type ContentTierDefinition = Readonly<{
  id: ContentTierId;
  name: string;
  purpose: string;
  targetReaderNeed: string;
  workflowMoment: string;
  primaryQuestion: string;
  primaryOutcome: string;
  differentiationBoundary: string;
  includedContentBlocks: ReadonlyArray<ContentBlockId>;
  excludedContentBlocks: ReadonlyArray<ContentBlockId>;
  editorialRole: EditorialRole;
  valueHierarchyLabel: string;
}>;

export const CONTENT_BLOCK_LABELS: Readonly<Record<ContentBlockId, string>> = {
  archiveAccess: 'Public archive access and issue discovery',
  latestReportRead: 'Public weekly report for market orientation',
  marketSnapshotMetrics: 'Core market snapshot metrics and descriptive market read',
  methodologyAndDisclaimer: 'Methodology, disclaimer, and process context',
  weeklyDecisionBrief: 'Decision memo with posture, scenario framing, and invalidation for one issue',
  fullNarrative: 'Full narrative analysis across regime, flows, and rotation for the paid thesis',
  signalsPackage: 'Decision checklist with thesis bullets, risks, and watchlist levels',
  monthlyContinuity: 'Month-end continuity summary that reconciles the four paid weekly issues',
  crossIssueTracking: 'Cross-issue tracker showing what changed, persisted, or broke week to week'
} as const;

export const CONTENT_TIERS: Readonly<Record<ContentTierId, ContentTierDefinition>> = {
  free: {
    id: 'free',
    name: 'Free',
    purpose: 'Give every reader a credible public read on the current market setup before any purchase decision.',
    targetReaderNeed: 'A fast orientation pass on what changed this week and why it matters.',
    workflowMoment: 'Use before you decide whether deeper follow-through is necessary.',
    primaryQuestion: 'What is the market environment right now?',
    primaryOutcome: 'A shared baseline for reading the week without committing to a paid workflow.',
    differentiationBoundary:
      'Stops at orientation. It describes the setup, but it does not turn that setup into a paid decision memo or a month-long continuity workflow.',
    includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer'],
    excludedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'orientation',
    valueHierarchyLabel: 'Public orientation layer.'
  },
  weeklyPro: {
    id: 'weeklyPro',
    name: 'Weekly Pro',
    purpose: 'Turn one week of research into a decision brief when the free read is no longer enough.',
    targetReaderNeed: 'A decision-ready interpretation of one issue when positioning or risk needs to be updated now.',
    workflowMoment: 'Use when the current week requires a concrete decision, not just awareness.',
    primaryQuestion: 'What should I do with this week\'s setup?',
    primaryOutcome: 'One issue, one decision cycle, with a clearer posture, invalidation, and actionable checkpoints.',
    differentiationBoundary:
      'Starts where Free stops: it moves from descriptive orientation into a decision memo. It still stops before any cross-week continuity or month-end synthesis.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'decision',
    valueHierarchyLabel: 'Entry paid layer for a single issue and a single decision cycle.'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Monthly Bundle',
    purpose: 'Extend Weekly Pro into a month-long operating cadence with explicit carry-forward from week to week.',
    targetReaderNeed: 'Continuity across several weekly issues so the thesis can be reviewed, updated, and reconciled as conditions evolve.',
    workflowMoment: 'Use when one issue is not enough and you want the month to stay connected from week to week.',
    primaryQuestion: 'How is the market thesis developing across the full month?',
    primaryOutcome: 'A continuity workflow with recurring decision support, cross-issue tracking, and a month-end synthesis.',
    differentiationBoundary:
      'Not just four reports together. It adds the continuity layer: what carried forward, what changed, and how the month resolved in aggregate.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer'],
    editorialRole: 'continuity',
    valueHierarchyLabel: 'Best-value paid layer for continuity across the month.'
  }
} as const;

export const CONTENT_TIER_IDS: ReadonlyArray<ContentTierId> = ['free', 'weeklyPro', 'monthlyBundle'];

export const getContentTierDefinition = (tierId: ContentTierId): ContentTierDefinition => CONTENT_TIERS[tierId];

export const getContentBlockLabel = (contentBlockId: ContentBlockId): string => CONTENT_BLOCK_LABELS[contentBlockId];
