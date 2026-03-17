import type { ProProductId } from '@/domain/pro-product';

export type ProPricingTier = 'entryOffer' | 'bestValueOffer';

export type ProPricingDefinition = Readonly<{
  productId: ProProductId;
  tier: ProPricingTier;
  displayPrice: string;
  displayPeriodLabel: string;
  valueLabel: string;
  comparisonHint: string;
}>;

const createPricingDefinition = (pricingDefinition: ProPricingDefinition): ProPricingDefinition => pricingDefinition;

export const PRO_PRICING_CONFIG: Readonly<Record<ProProductId, ProPricingDefinition>> = {
  singleIssue: createPricingDefinition({
    productId: 'singleIssue',
    tier: 'entryOffer',
    displayPrice: '$29',
    displayPeriodLabel: 'one-time',
    valueLabel: 'Entry offer',
    comparisonHint: 'Best when you need one week of focused decision support without a bigger commitment.'
  }),
  monthlyBundle: createPricingDefinition({
    productId: 'monthlyBundle',
    tier: 'bestValueOffer',
    displayPrice: '$79',
    displayPeriodLabel: 'one-time',
    valueLabel: 'Best value',
    comparisonHint: 'Lower effective price per issue than buying weekly, with continuity across the month.'
  })
} as const;

export const PRO_PRICING_HIERARCHY: ReadonlyArray<ProProductId> = ['singleIssue', 'monthlyBundle'];

export const getProPricingDefinition = (productId: ProProductId): ProPricingDefinition => PRO_PRICING_CONFIG[productId];
