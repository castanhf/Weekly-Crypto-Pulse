export type ProProductId = 'singleIssue' | 'monthlyBundle';

export type ProProductDefinition = Readonly<{
  id: ProProductId;
  name: string;
  shortDescription: string;
  audience: string;
  includes: ReadonlyArray<string>;
  excludes: ReadonlyArray<string>;
  deliveryModel: string;
  ctaLabel: string;
}>;

export const PRO_PRODUCTS: Readonly<Record<ProProductId, ProProductDefinition>> = {
  singleIssue: {
    id: 'singleIssue',
    name: 'Weekly Crypto Pulse Pro — Single Issue',
    shortDescription: 'Entry offer for one week when the current setup needs a concrete decision, not just awareness.',
    audience: 'You want a deeper read for this week only and do not need month-long continuity.',
    includes: [
      'One Pro weekly report for the selected issue',
      'Full narrative: regime, factor flow, and rotation context for that week',
      'Signals package: thesis bullets, risk checklist, and watchlist levels for the current decision cycle'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel: 'One-time Stripe Payment Link checkout with fulfillment tied to Stripe payment records.',
    ctaLabel: 'Buy Single Issue'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Weekly Crypto Pulse Pro — Monthly Bundle',
    shortDescription: 'Best-value offer when you want to track how the thesis evolves across the month.',
    audience: 'You want continuity across four weekly issues so the narrative and risk changes stay connected.',
    includes: [
      'Four Pro weekly issues for the active month',
      'The same full report structure each week to keep comparisons consistent',
      'Better per-issue value than buying each issue individually when continuity matters'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel: 'One-time Stripe Payment Link checkout with fulfillment tied to Stripe payment records.',
    ctaLabel: 'Buy Monthly Bundle'
  }
} as const;

export const PRO_PRODUCT_IDS: ReadonlyArray<ProProductId> = Object.keys(PRO_PRODUCTS) as Array<ProProductId>;

export const getProProductDefinition = (productId: ProProductId): ProProductDefinition => PRO_PRODUCTS[productId];
