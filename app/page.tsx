import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentWidth, PageHeader, PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { editorialLabelClassName, getCtaClassName, getSectionTileClassName } from '@/components/layout/ui-primitives';
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

const EDITORIAL_PATH = [
  {
    label: 'Free',
    description: 'Start with the weekly orientation layer to understand the setup.'
  },
  {
    label: 'Weekly Pro',
    description: 'Move to a single-issue decision brief when timing matters this week.'
  },
  {
    label: 'Monthly Bundle',
    description: 'Keep decisions coherent across the month with connected weekly issues.'
  }
] as const;

const primaryCtaClassName = getCtaClassName({ fullWidth: true });
const secondaryCtaClassName = getCtaClassName({ fullWidth: true, tone: 'secondary' });

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
              className={primaryCtaClassName}
              href={latestReportHref}
            >
              Read latest free report
            </Link>
            <Link className={secondaryCtaClassName} href="/pro">
              Explore Pro products
            </Link>
          </>
        }
        className="rounded-[2rem] border border-line/80 bg-white px-5 py-7 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:px-8 sm:py-9"
        description="Weekly Crypto Pulse keeps the homepage editorial: one public report for orientation, one paid path for weekly decisions, and one bundle for month-long continuity."
        eyebrow="Weekly crypto research"
        title="Read the market setup, then choose the depth you need this week."
      />

      <PageSection aria-labelledby="focus-heading" className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] xl:items-stretch">
        <SurfaceCard className="space-y-5 bg-gradient-to-br from-white via-white to-paper/70">
          <p className={editorialLabelClassName}>Latest report</p>
          <div className="space-y-3">
            <h2 className="text-[1.75rem] font-semibold tracking-tight sm:text-[2.25rem]" id="focus-heading">
              {latestReport.metadata.title}
            </h2>
            <p className="text-base leading-8 text-muted">{latestReport.metadata.summary}</p>
            <p className="text-base leading-8 text-muted">Published {formatIsoDate(latestReport.metadata.publishedAt)}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className={getCtaClassName()} href={latestReportHref}>
              Open full report
            </Link>
            <Link className={secondaryCtaClassName} href="/pro">
              Compare Free vs Pro
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-5 border-ink/10 bg-paper/70">
          <p className={editorialLabelClassName}>Path to Pro</p>
          <div className="space-y-4">
            {EDITORIAL_PATH.map((step) => (
              <div className="space-y-1 border-l-2 border-line pl-3" key={step.label}>
                <p className="text-base font-semibold text-ink">{step.label}</p>
                <p className="text-base leading-8 text-muted">{step.description}</p>
              </div>
            ))}
          </div>
          <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Weekly Pro — Single Issue" />
        </SurfaceCard>
      </PageSection>

      <PageSection aria-labelledby="latest-report-heading">
        <SectionIntro
          description="The public report is the baseline read. Snapshot metrics keep each issue scannable before you decide whether to move into Pro."
          id="latest-report-heading"
          title="This week at a glance"
        />
        <SurfaceCard>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className={getSectionTileClassName('subtle', 'rounded-xl')}>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Total market cap</dt>
              <dd className="mt-2 text-xl font-medium">{formatCompactUsd(latestReport.marketSnapshot.totalMarketCapUsd)}</dd>
            </div>
            <div className={getSectionTileClassName('subtle', 'rounded-xl')}>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">BTC dominance</dt>
              <dd className="mt-2 text-xl font-medium">{formatPercent(latestReport.marketSnapshot.btcDominancePct)}</dd>
            </div>
            <div className={getSectionTileClassName('subtle', 'rounded-xl')}>
              <dt className="text-xs uppercase tracking-[0.12em] text-muted">Fear &amp; greed</dt>
              <dd className="mt-2 text-xl font-medium">{latestReport.marketSnapshot.fearGreedIndex}</dd>
            </div>
          </dl>
        </SurfaceCard>
      </PageSection>

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description={`${freeTier.name} keeps orientation public. ${weeklyProTier.name} is the entry offer for a single decision cycle. ${monthlyBundleTier.name} is the best-value option for continuity across the month.`}
          id="offers-heading"
          title="Free and Pro, by editorial job"
        />
        <SurfaceCard className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {[freeTier, weeklyProTier, monthlyBundleTier].map((tier) => {
              const toneClassName =
                tier.id === 'weeklyPro'
                  ? 'border-ink bg-ink text-paper'
                  : tier.id === 'monthlyBundle'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-line/80 bg-paper';

              const mutedClassName = tier.id === 'weeklyPro' ? 'text-paper/75' : 'text-muted';

              return (
                <article className={`space-y-3 rounded-xl border px-5 py-5 ${toneClassName}`} key={tier.id}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${mutedClassName}`}>{tier.editorialRole}</p>
                  <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>
                  <p className={`text-base leading-8 ${mutedClassName}`}>{tier.targetReaderNeed}</p>
                </article>
              );
            })}
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

      <PageSection aria-labelledby="measures-heading" className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <SectionIntro
          description="Each issue follows the same sequence so Free and Pro stay comparable over time."
          id="measures-heading"
          title="What we measure each week"
        />
        <SurfaceCard>
          <ul className="space-y-4 text-base leading-8 text-ink">
            {METRICS.map((metric) => (
              <li className="border-l-2 border-line pl-4" key={metric}>
                {metric}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </PageSection>

      <TierDifferentiation
        description="The distinction is functional. Free explains the environment. Weekly Pro supports one decision week. Monthly Bundle keeps the thesis connected across the month."
        title="How each tier is meant to be used"
      />
    </PageShell>
  );
}
