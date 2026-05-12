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
    shortDescription: 'Good for one week when the free report is not enough and you need more detail.',
    audience: 'You want more than this week\'s summary, and you don\'t need to track the market across the whole month.',
    includes: [
      'One Pro weekly report for the selected issue',
      'Decision memo for that week: posture, scenario framing, and invalidation',
      'Signals package: thesis bullets, risk checklist, and watchlist levels for the current decision cycle',
      'Single-week decision scorecard that makes the current setup actionable without requiring month-long tracking',
      'Embedded market snapshot trend and regime history charts (12-week visual context, the same data shown on the free weekly page)'
    ],
    excludes: [
      'No subscription billing',
      'No user account or entitlement system',
      'No database-backed access management',
      'No cross-week continuity layer beyond the selected issue'
    ],
    deliveryModel: 'Pay once through Stripe. We deliver the report to your email based on your payment record.',
    ctaLabel: 'Buy Single Issue'
  },
  monthlyBundle: {
    id: 'monthlyBundle',
    name: 'Weekly Crypto Pulse Pro — Monthly Bundle',
    shortDescription: 'The better-value option when you want four weeks connected, not four separate reads.',
    audience: 'You want to follow the market week by week, with a wrap-up at the end of the month that shows what shifted.',
    includes: [
      'Four Pro weekly issues for the active month, each with embedded market snapshot and regime history charts',
      'Cross-issue continuity ledger showing what persisted, changed, and failed week to week',
      'One month-end synthesis artifact that reconciles recurring thesis points, regime distribution, key movers, and decision carry-forward',
      'Better per-issue value than buying each issue individually when continuity matters'
    ],
    excludes: ['No subscription billing', 'No user account or entitlement system', 'No database-backed access management'],
    deliveryModel:
      'Pay once through Stripe. We send each weekly report as it\'s ready, then the month-end summary after the last issue.',
    ctaLabel: 'Buy Monthly Bundle'
  }
} as const;

export const PRO_PRODUCT_IDS: ReadonlyArray<ProProductId> = Object.keys(PRO_PRODUCTS) as Array<ProProductId>;

export const getProProductDefinition = (productId: ProProductId): ProProductDefinition => PRO_PRODUCTS[productId];
