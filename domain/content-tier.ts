export type ContentTierId = 'free' | 'weeklyPro' | 'monthlyBundle';

export type EditorialValueRole = 'orientation' | 'decision' | 'continuity';

export type ContentBlock =
  | 'publicReportHighlights'
  | 'archiveIndexAndDiscovery'
  | 'methodologyAndDisclaimer'
  | 'weeklyProFullNarrative'
  | 'weeklyProSignalsPackage'
  | 'weeklyProRiskChecklist'
  | 'monthlyIssueSequence'
  | 'monthlyContinuitySummary';

export type ContentTierDefinition = Readonly<{
  id: ContentTierId;
  name: string;
  purpose: string;
  targetReaderNeed: string;
  includedContentBlocks: ReadonlyArray<ContentBlock>;
  excludedContentBlocks: ReadonlyArray<ContentBlock>;
  editorialRoleInValueHierarchy: EditorialValueRole;
}>;

const createContentTierDefinition = (definition: ContentTierDefinition): ContentTierDefinition => definition;

export const CONTENT_TIER_DEFINITIONS: Readonly<Record<ContentTierId, ContentTierDefinition>> = {
  free: createContentTierDefinition({
    id: 'free',
    name: 'Free',
    purpose: 'Orient the reader to market context, product framing, and report cadence before purchase.',
    targetReaderNeed: 'Fast situational awareness and confidence about whether deeper paid analysis is needed.',
    includedContentBlocks: ['publicReportHighlights', 'archiveIndexAndDiscovery', 'methodologyAndDisclaimer'],
    excludedContentBlocks: [
      'weeklyProFullNarrative',
      'weeklyProSignalsPackage',
      'weeklyProRiskChecklist',
      'monthlyIssueSequence',
      'monthlyContinuitySummary'
    ],
    editorialRoleInValueHierarchy: 'orientation'
  }),
  weeklyPro: createContentTierDefinition({
    id: 'weeklyPro',
    name: 'Weekly Pro',
    purpose: 'Support one concrete weekly decision with full narrative and structured signals.',
    targetReaderNeed: 'Decision-grade context for one issue without committing to a full month.',
    includedContentBlocks: ['weeklyProFullNarrative', 'weeklyProSignalsPackage', 'weeklyProRiskChecklist'],
    excludedContentBlocks: ['archiveIndexAndDiscovery', 'monthlyIssueSequence', 'monthlyContinuitySummary'],
    editorialRoleInValueHierarchy: 'decision'
  }),
  monthlyBundle: createContentTierDefinition({
    id: 'monthlyBundle',
    name: 'Monthly Bundle',
    purpose: 'Preserve continuity by carrying the Pro framework across a full month of issues.',
    targetReaderNeed: 'Consistent week-to-week tracking, reducing context resets between issues.',
    includedContentBlocks: [
      'weeklyProFullNarrative',
      'weeklyProSignalsPackage',
      'weeklyProRiskChecklist',
      'monthlyIssueSequence',
      'monthlyContinuitySummary'
    ],
    excludedContentBlocks: ['publicReportHighlights', 'archiveIndexAndDiscovery', 'methodologyAndDisclaimer'],
    editorialRoleInValueHierarchy: 'continuity'
  })
} as const;

export const CONTENT_TIER_ORDER: ReadonlyArray<ContentTierId> = ['free', 'weeklyPro', 'monthlyBundle'];

export const getContentTierDefinition = (tierId: ContentTierId): ContentTierDefinition => CONTENT_TIER_DEFINITIONS[tierId];
