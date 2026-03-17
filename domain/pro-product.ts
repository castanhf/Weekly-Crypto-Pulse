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
    shortDescription: 'Entry offer for one week when you need a focused decision brief.',
    audience: 'Readers who want one decision-ready weekly Pro issue.',
    includes: [
      'One Pro weekly report for the selected issue',
      'Full narrative: regime, factor flow, and rotation context',
      'Signals package: thesis bullets, risk checklist, and watchlist levels'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel: 'One-time Stripe Payment Link checkout with operational fulfillment based on Stripe payment records.',
    ctaLabel: 'Buy Single Issue (best for this report)'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Weekly Crypto Pulse Pro — Monthly Bundle',
    shortDescription: 'Continuity offer for month-long tracking across weekly updates.',
    audience: 'Readers who want continuity and better per-issue value across the month.',
    includes: [
      'Four Pro weekly issues for the active month',
      'Same full report structure each week for consistency',
      'Better per-issue value than buying each issue individually'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel: 'One-time Stripe Payment Link checkout with operational fulfillment based on Stripe payment records.',
    ctaLabel: 'Buy Monthly Bundle (best value per issue)'
  }
} as const;

export const PRO_PRODUCT_IDS: ReadonlyArray<ProProductId> = Object.keys(PRO_PRODUCTS) as Array<ProProductId>;

export const getProProductDefinition = (productId: ProProductId): ProProductDefinition => PRO_PRODUCTS[productId];
