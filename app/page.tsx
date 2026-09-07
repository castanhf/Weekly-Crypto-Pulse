import type { Metadata } from 'next';
import Link from 'next/link';

import { NewsletterSignup } from '@/components/email/newsletter-signup';
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
  'Total market size and whether investors are leaning into risk or pulling back',
  'Where money is moving, and whether that movement is broadening or narrowing',
  'Which assets led last week and which fell behind'
] as const;

const EDITORIAL_PATH = [
  {
    label: 'Free',
    price: null as string | null,
    description: 'The public layer. Weekly reports every Monday, plus shorter daily updates in between. All free.'
  },
  {
    label: 'Weekly Pro',
    price: '$29 one-time' as string | null,
    description: 'Go deeper on one specific week when the free read is not enough.'
  },
  {
    label: 'Monthly Bundle',
    price: '$79 one-time' as string | null,
    description: 'Follow four Pro weeks in a row, with a summary at the end of the month.'
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
          description="Free weekly and daily reports on what's happening in the crypto market."
          eyebrow="Crypto research"
          title="Crypto Pulse"
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
        className="rounded-[2rem] border border-white/10 bg-surface px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Free weekly and daily reports on what's happening in crypto. Pro adds the decision layer when you need more than a summary."
        eyebrow="Crypto research"
        title="Read the market. Then decide how deep you need to go."
      />

      <PageSection aria-labelledby="focus-heading" className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] xl:items-stretch">
        <SurfaceCard className="space-y-5 bg-gradient-to-br from-surface via-surface to-canvas/50">
          <p className={editorialLabelClassName}>Latest weekly report</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">Path to Pro</p>
          <div className="space-y-4">
            {EDITORIAL_PATH.map((step) => (
              <div className="space-y-1 border-l-2 border-ink/20 pl-3" key={step.label}>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-semibold text-ink">{step.label}</p>
                  {step.price ? <p className="text-sm font-medium text-ink/50">{step.price}</p> : null}
                </div>
                <p className="text-base leading-8 text-ink/65">{step.description}</p>
              </div>
            ))}
          </div>
          <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
        </SurfaceCard>
      </PageSection>

      <PageSection aria-labelledby="latest-report-heading">
        <SectionIntro
          description="Three numbers from this week's free report. A fast read before you click in."
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
          description="Free gives you the picture every week. Pro adds what we'd watch and how we'd think about it — the decision layer on top of the orientation layer."
          id="offers-heading"
          title="Free and Pro"
        />
        <SurfaceCard className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {[freeTier, weeklyProTier, monthlyBundleTier].map((tier) => {
              const toneClassName =
                tier.id === 'weeklyPro'
                  ? 'border-accent/40 bg-ink text-paper'
                  : tier.id === 'monthlyBundle'
                    ? 'border-accent/30 bg-gradient-to-br from-accent/20 via-surface to-surface'
                    : 'border-white/10 bg-surface';

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
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
            <ProCta className={secondaryCtaClassName} label="Buy Monthly Bundle" checkoutTarget={monthlyBundleCheckoutTarget} />
            <Link className={secondaryCtaClassName} href="/pro">
              View full comparison
            </Link>
          </div>
        </SurfaceCard>
      </PageSection>

      <PageSection aria-labelledby="measures-heading">
        <SectionIntro
          description="Same sequence every week so you can compare issues side by side."
          id="measures-heading"
          title="What we measure each week"
        />
        <SurfaceCard>
          <ul className="space-y-4 text-base leading-8 text-paper">
            {METRICS.map((metric) => (
              <li className="border-l-2 border-line pl-4" key={metric}>
                {metric}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </PageSection>

      <TierDifferentiation
        description="Free explains what's happening. Weekly Pro adds what to watch and how to think about it, for one week. Monthly Bundle does that for four weeks running."
        title="How each tier is meant to be used"
      />

      <PageSection aria-labelledby="newsletter-heading">
        <SurfaceCard className="space-y-5">
          <h2 className="text-xl font-semibold tracking-tight" id="newsletter-heading">
            Get Crypto Pulse in your inbox
          </h2>
          <p className="text-base leading-8 text-muted">
            Weekly anchor reports on Mondays. Sunday digest of the week&apos;s daily coverage. Opt in for daily emails if you
            want them — most readers don&apos;t.
          </p>
          <NewsletterSignup />
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
