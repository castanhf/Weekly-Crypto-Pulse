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
  includedContentBlocks: ReadonlyArray<ContentBlockId>;
  excludedContentBlocks: ReadonlyArray<ContentBlockId>;
  editorialRole: EditorialRole;
  valueHierarchyLabel: string;
}>;

export const CONTENT_BLOCK_LABELS: Readonly<Record<ContentBlockId, string>> = {
  archiveAccess: 'Public archive access and issue discovery',
  latestReportRead: 'Latest free report and summary context',
  marketSnapshotMetrics: 'Core market snapshot metrics and orientation signals',
  methodologyAndDisclaimer: 'Methodology, disclaimer, and process context',
  weeklyDecisionBrief: 'One paid weekly decision brief for the selected issue',
  fullNarrative: 'Full narrative analysis across regime, flow, and rotation',
  signalsPackage: 'Signals package with thesis bullets, risks, and watchlist levels',
  monthlyContinuity: 'Month-long continuity across the purchased weekly issues',
  crossIssueTracking: 'Cross-issue comparison to track weekly changes over the month'
} as const;

export const CONTENT_TIERS: Readonly<Record<ContentTierId, ContentTierDefinition>> = {
  free: {
    id: 'free',
    name: 'Free',
    purpose: 'Orient readers to the current market setup before they decide whether they need paid depth.',
    targetReaderNeed: 'A fast public read on what matters this week without a purchase decision yet.',
    includedContentBlocks: ['archiveAccess', 'latestReportRead', 'marketSnapshotMetrics', 'methodologyAndDisclaimer'],
    excludedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'orientation',
    valueHierarchyLabel: 'Top-of-funnel public orientation layer.'
  },
  weeklyPro: {
    id: 'weeklyPro',
    name: 'Weekly Pro',
    purpose: 'Turn one week of research into a decision-ready brief for paid readers.',
    targetReaderNeed: 'A focused weekly view with enough depth to make or update a market decision now.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer', 'monthlyContinuity', 'crossIssueTracking'],
    editorialRole: 'decision',
    valueHierarchyLabel: 'Entry paid layer for one issue and one decision cycle.'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Monthly Bundle',
    purpose: 'Extend Weekly Pro into a month-long operating cadence with consistent weekly follow-through.',
    targetReaderNeed: 'Ongoing continuity across the month so decisions can be reviewed as the market evolves.',
    includedContentBlocks: ['weeklyDecisionBrief', 'fullNarrative', 'signalsPackage', 'monthlyContinuity', 'crossIssueTracking'],
    excludedContentBlocks: ['archiveAccess', 'latestReportRead', 'methodologyAndDisclaimer'],
    editorialRole: 'continuity',
    valueHierarchyLabel: 'Best-value paid layer for continuity across the month.'
  }
} as const;

export const CONTENT_TIER_IDS: ReadonlyArray<ContentTierId> = ['free', 'weeklyPro', 'monthlyBundle'];

export const getContentTierDefinition = (tierId: ContentTierId): ContentTierDefinition => CONTENT_TIERS[tierId];

export const getContentBlockLabel = (contentBlockId: ContentBlockId): string => CONTENT_BLOCK_LABELS[contentBlockId];
