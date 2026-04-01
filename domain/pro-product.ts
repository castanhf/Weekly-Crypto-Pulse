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
    shortDescription: 'Entry offer for one week when the free report frames the setup but a decision still has to be made.',
    audience: 'You want this week turned into a decision memo and do not need the thesis carried across the rest of the month.',
    includes: [
      'One Pro weekly report for the selected issue',
      'Decision memo for that week: posture, scenario framing, and invalidation',
      'Signals package: thesis bullets, risk checklist, and watchlist levels for the current decision cycle',
      'Single-week decision scorecard that makes the current setup actionable without requiring month-long tracking'
    ],
    excludes: [
      'No subscription billing',
      'No user account or entitlement system',
      'No database-backed access management',
      'No cross-week continuity layer beyond the selected issue'
    ],
    deliveryModel: 'One-time Stripe Payment Link checkout with fulfillment tied to Stripe payment records.',
    ctaLabel: 'Buy Single Issue'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Weekly Crypto Pulse Pro — Monthly Bundle',
    shortDescription: 'Best-value offer for a continuity workflow, not just a discount on four isolated reports.',
    audience: 'You want weekly decisions to compound across the month, with a month-end view of what persisted, changed, or failed.',
    includes: [
      'Four Pro weekly issues for the active month',
      'Cross-issue continuity ledger showing what persisted, changed, and failed week to week',
      'One month-end synthesis artifact that reconciles recurring thesis points, regime distribution, key movers, and decision carry-forward',
      'Better per-issue value than buying each issue individually when continuity matters'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel:
      'One-time Stripe Payment Link checkout with weekly fulfillment across the purchased month plus a month-end summary.',
    ctaLabel: 'Buy Monthly Bundle'
  }
} as const;

export const PRO_PRODUCT_IDS: ReadonlyArray<ProProductId> = Object.keys(PRO_PRODUCTS) as Array<ProProductId>;

export const getProProductDefinition = (productId: ProProductId): ProProductDefinition => PRO_PRODUCTS[productId];
