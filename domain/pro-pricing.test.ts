import { describe, expect, it } from 'vitest';

import { PRO_PRICING_HIERARCHY, getProPricingDefinition } from '@/domain/pro-pricing';

describe('pro pricing', () => {
  it('keeps the pricing hierarchy from entry offer to best value', () => {
    expect(PRO_PRICING_HIERARCHY).toEqual(['singleIssue', 'monthlyBundle']);
  });

  it('provides display pricing metadata for single issue', () => {
    expect(getProPricingDefinition('singleIssue')).toEqual({
      productId: 'singleIssue',
      tier: 'entryOffer',
      displayPrice: '$29',
      displayPeriodLabel: 'one-time',
      valueLabel: 'Entry offer',
      comparisonHint: 'Use when the free orientation is clear but you still need one issue turned into a decision.'
    });
  });

  it('provides display pricing metadata for monthly bundle', () => {
    expect(getProPricingDefinition('monthlyBundle')).toEqual({
      productId: 'monthlyBundle',
      tier: 'bestValueOffer',
      displayPrice: '$79',
      displayPeriodLabel: 'one-time',
      valueLabel: 'Best value',
      comparisonHint:
        'Lower effective price per issue, plus the continuity layer and month-end synthesis that a single issue does not provide.'
    });
  });
});
