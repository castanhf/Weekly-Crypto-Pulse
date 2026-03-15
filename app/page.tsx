import type { Metadata } from 'next';
import Link from 'next/link';

import { ProCta } from '@/components/pro/pro-cta';
import { formatCompactUsd, formatIsoDate, formatPercent } from '@/components/reports/report-formatters';
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

  return (
    <section className="space-y-12">
      <header className="space-y-5 border-b border-line pb-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Weekly crypto research</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Institutional-grade signal for a market that moves 24/7.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Weekly Crypto Pulse distills the noise into one concise report so operators can assess regime, flows, and
          positioning faster.
        </p>
        <Link
          className="inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper"
          href={latestReportHref}
        >
          Read latest report
        </Link>
      </header>

      <section className="space-y-4" aria-labelledby="latest-report-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="latest-report-heading">
          Latest report
        </h2>
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
          What we measure
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Each issue tracks the same core indicators to keep weekly comparisons consistent and decision-ready.
        </p>
        <ul className="space-y-2 text-sm text-ink">
          {METRICS.map((metric) => (
            <li className="border-l-2 border-line pl-3" key={metric}>
              {metric}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 border border-line bg-white p-6" aria-labelledby="pro-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="pro-heading">
          Weekly Crypto Pulse Pro
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Free gives orientation. Pro supports decisions. Start with the Single Issue when you need one week, or choose
          the Monthly Bundle for best value per issue and continuity.
        </p>
        <div className="flex flex-wrap gap-3">
          <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
          <ProCta
            className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink"
            label="Buy Monthly Bundle (best value)"
            checkoutTarget={monthlyBundleCheckoutTarget}
          />
          <Link className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink" href="/pro">
            Compare offers
          </Link>
        </div>
      </section>
    </section>
  );
}
