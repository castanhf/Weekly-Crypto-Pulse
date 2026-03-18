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
  includedContentBlocks: ReadonlyArray<ContentBlockId>;
  excludedContentBlocks: ReadonlyArray<ContentBlockId>;
  editorialRole: EditorialRole;
  valueHierarchyLabel: string;
}>;

export const CONTENT_BLOCK_LABELS: Readonly<Record<ContentBlockId, string>> = {
  archiveAccess: 'Public archive access and issue discovery',
  latestReportRead: 'Public weekly report for market orientation',
  marketSnapshotMetrics: 'Core market snapshot metrics and baseline signals',
  methodologyAndDisclaimer: 'Methodology, disclaimer, and process context',
  weeklyDecisionBrief: 'Paid weekly decision brief for one selected issue',
  fullNarrative: 'Full narrative analysis across regime, flows, and rotation',
  signalsPackage: 'Signals package with thesis bullets, risks, and watchlist levels',
  monthlyContinuity: 'Month-long continuity across the purchased weekly issues',
  crossIssueTracking: 'Cross-issue comparison to track what changed week to week'
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
    includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer'],
    excludedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'orientation',
    valueHierarchyLabel: 'Public orientation layer.'
  },
  weeklyPro: {
    id: 'weeklyPro',
    name: 'Weekly Pro',
    purpose: 'Turn one week of research into a decision brief for readers acting on the current setup.',
    targetReaderNeed: 'A decision-ready interpretation of one issue when positioning or risk needs to be updated now.',
    workflowMoment: 'Use when the current week requires a concrete decision, not just awareness.',
    primaryQuestion: 'How should this week change my posture or watchlist?',
    primaryOutcome: 'One issue, one decision cycle, with deeper interpretation and actionable checkpoints.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'decision',
    valueHierarchyLabel: 'Entry paid layer for a single issue and a single decision cycle.'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Monthly Bundle',
    purpose: 'Extend Weekly Pro into a month-long operating cadence with consistent weekly follow-through.',
    targetReaderNeed: 'Continuity across several weekly issues so the thesis can be reviewed as conditions evolve.',
    workflowMoment: 'Use when one issue is not enough and you want the month to stay connected from week to week.',
    primaryQuestion: 'How is the market thesis developing across the full month?',
    primaryOutcome: 'Continuity, comparison, and better per-issue value across the month.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer'],
    editorialRole: 'continuity',
    valueHierarchyLabel: 'Best-value paid layer for continuity across the month.'
  }
} as const;

export const CONTENT_TIER_IDS: ReadonlyArray<ContentTierId> = ['free', 'weeklyPro', 'monthlyBundle'];

export const getContentTierDefinition = (tierId: ContentTierId): ContentTierDefinition => CONTENT_TIERS[tierId];

export const getContentBlockLabel = (contentBlockId: ContentBlockId): string => CONTENT_BLOCK_LABELS[contentBlockId];
