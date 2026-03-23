import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentWidth, PageHeader, PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
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

const secondaryCtaClassName =
  'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 py-3 text-center text-sm font-medium transition hover:border-ink sm:w-auto';

export default function HomePage(): JSX.Element {
  const latestReport = getLatestReport();

  if (!latestReport) {
    return (
      <PageShell>
        <PageHeader
          description="Data-driven weekly briefs on crypto market structure, flows, and risk."
          eyebrow="Weekly crypto research"
          title="Weekly Crypto Pulse"
          titleClassName="max-w-3xl"
        />
      </PageShell>
    );
  }

  const latestReportHref = `/reports/${latestReport.metadata.slug}`;
  const weeklyProCheckoutTarget = getProCheckoutTarget('singleIssue');
  const monthlyBundleCheckoutTarget = getProCheckoutTarget('monthlyBundle');
  const freeTier = getContentTierDefinition('free');
  const weeklyProTier = getContentTierDefinition('weeklyPro');
  const monthlyBundleTier = getContentTierDefinition('monthlyBundle');

  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-ink bg-ink px-4 py-3 text-center text-sm font-medium text-paper transition hover:bg-ink/90 sm:w-auto"
              href={latestReportHref}
            >
              Read latest free report
            </Link>
            <Link className={secondaryCtaClassName} href="/pro">
              Compare paid offers
            </Link>
          </>
        }
        className="rounded-[2rem] border border-line/80 bg-white px-5 py-6 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:px-8 sm:py-8"
        description="Weekly Crypto Pulse publishes a public market read for orientation, then offers paid products for readers who need a single-week decision brief or month-long follow-through."
        eyebrow="Weekly crypto research"
        title="Weekly coverage with a clear ladder from orientation to decision to continuity."
      />

      <PageSection aria-labelledby="latest-report-heading">
        <SectionIntro
          description="The public report is the orientation layer. It helps you identify the current setup before deciding whether a weekly decision brief or a month-long bundle is warranted."
          id="latest-report-heading"
          title="Latest free report"
        />
        <SurfaceCard className="space-y-6 bg-gradient-to-br from-white via-white to-paper/80">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)] lg:items-start">
            <ContentWidth className="space-y-4" size="feature">
              <p className="text-sm leading-7 text-muted">Published {formatIsoDate(latestReport.metadata.publishedAt)}</p>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{latestReport.metadata.title}</h3>
                <p className="text-sm leading-7 text-muted">{latestReport.metadata.summary}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink px-4 py-3 text-sm font-medium transition hover:bg-ink hover:text-paper" href={latestReportHref}>
                  Open full report
                </Link>
                <Link className={secondaryCtaClassName} href="/pro">
                  See Pro options
                </Link>
              </div>
            </ContentWidth>
            <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-muted">Total market cap</dt>
                <dd className="mt-2 text-lg font-medium">{formatCompactUsd(latestReport.marketSnapshot.totalMarketCapUsd)}</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-muted">BTC dominance</dt>
                <dd className="mt-2 text-lg font-medium">{formatPercent(latestReport.marketSnapshot.btcDominancePct)}</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs uppercase tracking-[0.12em] text-muted">Fear &amp; greed</dt>
                <dd className="mt-2 text-lg font-medium">{latestReport.marketSnapshot.fearGreedIndex}</dd>
              </div>
            </dl>
          </div>
        </SurfaceCard>
      </PageSection>

      <PageSection aria-labelledby="measures-heading" className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <SectionIntro
          description="Every issue follows the same measurement sequence so the public layer and paid layers stay comparable from one week to the next."
          id="measures-heading"
          title="What we measure each week"
        />
        <SurfaceCard>
          <ul className="space-y-4 text-sm leading-7 text-ink">
            {METRICS.map((metric) => (
              <li className="border-l-2 border-line pl-4" key={metric}>
                {metric}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </PageSection>

      <TierDifferentiation
        description="The distinction is functional. Free helps you understand the current environment. Weekly Pro helps you act on one issue. Monthly Bundle helps you keep the thesis connected across the month."
        title="How each tier is meant to be used"
      />

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description={`${freeTier.name} remains the public baseline. ${weeklyProTier.name} is the entry offer when this week requires a decision. ${monthlyBundleTier.name} is the best-value offer when you want the month to remain connected from issue to issue.`}
          id="offers-heading"
          title="Choose the paid scope that matches the job"
        />
        <SurfaceCard className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[freeTier, weeklyProTier, monthlyBundleTier].map((tier) => (
              <article className="space-y-3 rounded-xl border border-line/80 bg-paper px-5 py-5" key={tier.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{tier.editorialRole}</p>
                <h3 className="text-base font-semibold tracking-tight">{tier.name}</h3>
                <p className="text-sm leading-7 text-muted">{tier.targetReaderNeed}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Weekly Pro — Single Issue" />
            <ProCta className={secondaryCtaClassName} label="Buy Monthly Bundle — Best value" checkoutTarget={monthlyBundleCheckoutTarget} />
            <Link className={secondaryCtaClassName} href="/pro">
              View full comparison
            </Link>
          </div>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
