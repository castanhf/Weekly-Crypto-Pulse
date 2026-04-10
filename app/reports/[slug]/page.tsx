import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReportViewTracker } from '@/components/analytics/report-view-tracker';
import { PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { ArtifactTrustCard } from '@/components/reports/artifact-trust-card';
import { ExecutiveSummary } from '@/components/reports/executive-summary';
import { MarketSnapshotCards } from '@/components/reports/market-snapshot';
import { MethodologyNote } from '@/components/reports/methodology-note';
import { RegimeSection } from '@/components/reports/regime-section';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportSections } from '@/components/reports/report-sections';
import { ReportShareBlock } from '@/components/reports/report-share-block';
import { WinnersAndLosers } from '@/components/reports/winners-losers';
import { getProCheckoutTarget } from '@/lib/pro-offers';
import { getAllReports, getReportArtifactBySlug, getReportBySlug } from '@/lib/reports/report-repository';
import { createReportMetadata, toAbsoluteUrl } from '@/lib/seo';

type ReportDetailPageProps = {
  params: {
    slug: string;
  };
};

const secondaryCtaClassName =
  'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 py-3 text-center text-sm font-medium transition hover:border-ink sm:w-auto';

export const generateStaticParams = (): Array<ReportDetailPageProps['params']> =>
  getAllReports().map((report) => ({ slug: report.metadata.slug }));

export const generateMetadata = ({ params }: ReportDetailPageProps): Metadata => {
  const report = getReportBySlug(params.slug);

  if (!report) {
    return {
      title: 'Report not found',
      description: 'The requested report could not be found.'
    };
  }

  return createReportMetadata(report);
};

export default function ReportDetailPage({ params }: ReportDetailPageProps): JSX.Element {
  const reportArtifact = getReportArtifactBySlug(params.slug);
  const report = reportArtifact?.report;

  if (!report) {
    notFound();
  }

  const reportUrl = toAbsoluteUrl(`/reports/${report.metadata.slug}`);
  const weeklyProCheckoutTarget = getProCheckoutTarget('singleIssue');
  const monthlyBundleCheckoutTarget = getProCheckoutTarget('monthlyBundle');

  return (
    <PageShell className="space-y-10 sm:space-y-14 lg:space-y-16">
      <ReportViewTracker reportSlug={report.metadata.slug} />
      <ReportHero metadata={report.metadata} />
      <PageSection className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,0.75fr)] xl:items-start">
        <div className="order-first space-y-8 xl:order-first xl:space-y-10">
          <SurfaceCard className="border-line/70 bg-gradient-to-b from-white to-paper/60 text-base leading-8 text-muted" aria-label="Tier context">
            <p>
              This page is part of the <span className="font-semibold text-ink">Free</span> layer and is designed for
              orientation. If you need a paid decision brief for this exact issue, choose{' '}
              <span className="font-semibold text-ink">Weekly Pro — Single Issue</span>. If you want continuity across
              several weekly updates, choose the <span className="font-semibold text-ink">Monthly Bundle</span>.
            </p>
          </SurfaceCard>

          {reportArtifact ? (
            <ArtifactTrustCard
              description="This report page is rendered from the committed artifact used at build time. No runtime market-data fetch is required to show the report."
              reportArtifact={reportArtifact}
              title="Report trust cues"
            />
          ) : null}

          <ExecutiveSummary summary={report.metadata.summary} />
          <MarketSnapshotCards snapshot={report.marketSnapshot} />
          <WinnersAndLosers movers={report.movers} />
          <RegimeSection regime={report.regime} />
          <div className="space-y-4">
            <div className="rounded-2xl border border-line/70 bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pro signals layer</p>
              <h2 className="mt-2 text-[1.3rem] font-semibold tracking-tight">Decision checklist, risk review, and watchlist levels</h2>
              <p className="mt-3 text-base leading-8 text-muted">
                The Pro signals package for this issue includes a thesis checklist, a risk review, and concrete watchlist
                levels with entry context — the actionable layer that sits on top of the free orientation.
              </p>

              {report.signals.thesis[0] ? (
                <div className="mt-4 select-none overflow-hidden rounded-xl border border-line/60 bg-paper px-4 py-3" aria-hidden="true">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">This week&rsquo;s thesis — preview</p>
                  <p className="mt-2 blur-sm text-sm leading-7 text-ink">{report.signals.thesis[0]}</p>
                </div>
              ) : null}

              <div className="mt-5">
                <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Unlock Pro signals — Single Issue" />
              </div>
            </div>
          </div>

          <SurfaceCard className="space-y-5 border-line/70 bg-white/95">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Paid depth when needed</p>
              <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[2.1rem]">Need an actionable brief, not just orientation?</h2>
              <p className="max-w-3xl text-base leading-8 text-muted">
                Stay in reading mode, then choose paid depth only if this issue changes your workflow. Weekly Pro covers
                one decision cycle; Monthly Bundle keeps the thesis connected across the month.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
              <ProCta className={secondaryCtaClassName} label="Buy Monthly Bundle" checkoutTarget={monthlyBundleCheckoutTarget} />
            </div>
          </SurfaceCard>

          <ReportSections sections={report.sections} />
          <MethodologyNote />
        </div>

        <div className="order-last space-y-4 xl:order-last xl:sticky xl:top-24">
          <ReportShareBlock title={report.metadata.title} url={reportUrl} />
          <SurfaceCard className="space-y-5 border-line/70 bg-gradient-to-br from-white via-white to-paper/90">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pro decision layer</p>
              <h2 className="text-[1.45rem] font-semibold tracking-tight">Choose paid depth only when the workflow changes</h2>
              <p className="text-base leading-8 text-muted">
                Stripe Payment Links handle one-time purchases for each product. No subscriptions and no account setup.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Decision</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">Weekly Pro — Single Issue</h3>
                <p className="mt-2 text-base leading-8 text-muted">
                  Best when this week requires deeper execution context and one issue is enough.
                </p>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Continuity</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">Monthly Bundle</h3>
                <p className="mt-2 text-base leading-8 text-muted">
                  Best when you want week-to-week continuity instead of evaluating each report in isolation.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
              <ProCta className={secondaryCtaClassName} label="Buy Monthly Bundle" checkoutTarget={monthlyBundleCheckoutTarget} />
            </div>
          </SurfaceCard>
        </div>
      </PageSection>
    </PageShell>
  );
}
