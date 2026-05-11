import Link from 'next/link';

import { SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { getProProductDefinition } from '@/domain/pro-product';
import { getProCheckoutTarget } from '@/lib/pro-offers';

type Props = {
  variant?: 'inline' | 'standalone';
};

// ---------------------------------------------------------------------------
// Inline variant — compact block at the end of report pages
// ---------------------------------------------------------------------------

function InlinePaidBlock(): JSX.Element {
  const checkoutTarget = getProCheckoutTarget('singleIssue');
  const { includes, deliveryModel } = getProProductDefinition('singleIssue');

  return (
    <SurfaceCard className="space-y-6 border-accent/20 bg-gradient-to-br from-surface to-canvas/50 p-5 sm:p-7">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">The Pro Pack</p>
        <h2 className="text-[1.35rem] font-semibold tracking-tight sm:text-[1.6rem]">
          The decision layer on top of the free report.
        </h2>
        <p className="max-w-2xl text-base leading-8 text-muted">
          The Pro Pack adds the signals this report doesn't publish: a decision memo, thesis checklist, risk review, and
          watchlist levels. If this week changes your position, Pro has the actionable detail.
        </p>
      </div>

      <ul className="space-y-2.5">
        {includes.map((item) => (
          <li className="flex gap-3 text-sm leading-7 text-muted" key={item}>
            <span className="mt-0.5 shrink-0 font-semibold text-accent">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ProCta checkoutTarget={checkoutTarget} label="Buy this week's Pro Pack" />
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted underline underline-offset-4 hover:text-paper"
          href="/pro"
        >
          Compare plans
        </Link>
      </div>

      <p className="text-xs leading-6 text-muted/70">{deliveryModel}</p>
    </SurfaceCard>
  );
}

// ---------------------------------------------------------------------------
// Standalone variant — more prominent block used on /pro as a final CTA
// ---------------------------------------------------------------------------

function StandalonePaidBlock(): JSX.Element {
  const singleIssueTarget = getProCheckoutTarget('singleIssue');
  const monthlyBundleTarget = getProCheckoutTarget('monthlyBundle');
  const { includes, deliveryModel } = getProProductDefinition('singleIssue');

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Ready to add Pro?</p>
        <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[2rem]">
          One payment. Pro Pack by email within 24 hours.
        </h2>
        <p className="max-w-2xl text-base leading-8 text-muted">
          No subscription and no account. Pay once through Stripe, receive the Pro Pack by email. For one week or four.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {includes.map((item) => (
          <li className="flex gap-3 text-base leading-7 text-muted" key={item}>
            <span className="mt-0.5 shrink-0 font-semibold text-accent">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ProCta checkoutTarget={singleIssueTarget} label="Buy Single Issue" />
        <ProCta
          checkoutTarget={monthlyBundleTarget}
          label="Buy Monthly Bundle"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-paper transition hover:border-white/40 hover:bg-white/5"
        />
      </div>

      <p className="text-xs leading-6 text-muted/70">{deliveryModel}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

export function PaidBlock({ variant = 'inline' }: Props): JSX.Element {
  if (variant === 'standalone') {
    return <StandalonePaidBlock />;
  }
  return <InlinePaidBlock />;
}
