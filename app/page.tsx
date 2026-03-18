import type { Metadata } from 'next';
import Link from 'next/link';

import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { formatCompactUsd, formatIsoDate, formatPercent } from '@/components/reports/report-formatters';
import { getContentTierDefinition } from '@/domain/content-tier';
import { getProCheckoutTarget } from '@/lib/pro-offers';
import { getLatestReport } from '@/lib/reports/report-repository';
import { createHomeMetadata } from '@/lib/seo';

export const metadata: Metadata = createHomeMetadata();

const METRICS = [
  'Market structure and risk regime',
  'Institutional flows and positioning',
  'Major asset leadership and momentum'
] as const;

export default function HomePage(): JSX.Element {
  const latestReport = getLatestReport();

  if (!latestReport) {
    return (
      <section className="space-y-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Weekly crypto research</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Weekly Crypto Pulse</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Data-driven weekly briefs on crypto market structure, flows, and risk.
        </p>
      </section>
    );
  }

  const latestReportHref = `/reports/${latestReport.metadata.slug}`;
  const weeklyProCheckoutTarget = getProCheckoutTarget('singleIssue');
  const monthlyBundleCheckoutTarget = getProCheckoutTarget('monthlyBundle');
  const freeTier = getContentTierDefinition('free');
  const weeklyProTier = getContentTierDefinition('weeklyPro');
  const monthlyBundleTier = getContentTierDefinition('monthlyBundle');

  return (
    <section className="space-y-12">
      <header className="space-y-5 border-b border-line pb-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Weekly crypto research</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Institutional-grade signal with a clear ladder from orientation to decision to continuity.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Weekly Crypto Pulse publishes a public market read for orientation, then offers paid products for readers who
          need a single-week decision brief or month-long follow-through.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper"
            href={latestReportHref}
          >
            Read latest report
          </Link>
          <Link className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink" href="/pro">
            Compare paid offers
          </Link>
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="latest-report-heading">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight" id="latest-report-heading">
            Latest free report
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            The public report is the orientation layer. It helps you identify the current setup before deciding whether
            a weekly decision brief or a month-long bundle is warranted.
          </p>
        </div>
        <article className="space-y-4 border border-line bg-white p-6">
          <div className="space-y-1">
            <p className="text-sm text-muted">Published {formatIsoDate(latestReport.metadata.publishedAt)}</p>
            <h3 className="text-xl font-semibold tracking-tight">{latestReport.metadata.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{latestReport.metadata.summary}</p>
          </div>
          <dl className="grid gap-4 border-y border-line py-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Total market cap</dt>
              <dd className="text-lg font-medium">{formatCompactUsd(latestReport.marketSnapshot.totalMarketCapUsd)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">BTC dominance</dt>
              <dd className="text-lg font-medium">{formatPercent(latestReport.marketSnapshot.btcDominancePct)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Fear &amp; greed</dt>
              <dd className="text-lg font-medium">{latestReport.marketSnapshot.fearGreedIndex}</dd>
            </div>
          </dl>
          <Link className="text-sm font-medium text-ink underline underline-offset-4" href={latestReportHref}>
            Open full report
          </Link>
        </article>
      </section>

      <section className="space-y-3" aria-labelledby="measures-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="measures-heading">
          What we measure each week
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Every issue follows the same measurement sequence so the public layer and paid layers stay comparable from one
          week to the next.
        </p>
        <ul className="space-y-2 text-sm text-ink">
          {METRICS.map((metric) => (
            <li className="border-l-2 border-line pl-3" key={metric}>
              {metric}
            </li>
          ))}
        </ul>
      </section>

      <TierDifferentiation
        description="The distinction is functional. Free helps you understand the current environment. Weekly Pro helps you act on one issue. Monthly Bundle helps you keep the thesis connected across the month."
        title="How each tier is meant to be used"
      />

      <section className="space-y-4 border border-line bg-white p-6" aria-labelledby="offers-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="offers-heading">
          Choose the paid scope that matches the job
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {freeTier.name} remains the public baseline. {weeklyProTier.name} is the entry offer when this week requires a
          decision. {monthlyBundleTier.name} is the best-value offer when you want the month to remain connected from
          issue to issue.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[freeTier, weeklyProTier, monthlyBundleTier].map((tier) => (
            <article className="border border-line p-4" key={tier.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{tier.editorialRole}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight">{tier.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{tier.targetReaderNeed}</p>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Weekly Pro — Single Issue" />
          <ProCta
            className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink"
            label="Buy Monthly Bundle — Best value"
            checkoutTarget={monthlyBundleCheckoutTarget}
          />
          <Link className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink" href="/pro">
            View full comparison
          </Link>
        </div>
      </section>
    </section>
  );
}
