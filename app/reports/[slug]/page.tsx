import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReportViewTracker } from '@/components/analytics/report-view-tracker';
import { PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { ExecutiveSummary } from '@/components/reports/executive-summary';
import { MarketSnapshotCards } from '@/components/reports/market-snapshot';
import { MethodologyNote } from '@/components/reports/methodology-note';
import { RegimeSection } from '@/components/reports/regime-section';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportSections } from '@/components/reports/report-sections';
import { ReportSignalsBlock } from '@/components/reports/report-signals';
import { ReportShareBlock } from '@/components/reports/report-share-block';
import { WinnersAndLosers } from '@/components/reports/winners-losers';
import { getProCheckoutTarget } from '@/lib/pro-offers';
import { getAllReports, getReportBySlug } from '@/lib/reports/report-repository';
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
  const report = getReportBySlug(params.slug);

  if (!report) {
    notFound();
  }

  const reportUrl = toAbsoluteUrl(`/reports/${report.metadata.slug}`);
  const weeklyProCheckoutTarget = getProCheckoutTarget('singleIssue');
  const monthlyBundleCheckoutTarget = getProCheckoutTarget('monthlyBundle');

  return (
    <PageShell className="space-y-8 sm:space-y-12 lg:space-y-14">
      <ReportViewTracker reportSlug={report.metadata.slug} />
      <ReportHero metadata={report.metadata} />
      <PageSection className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.75fr)] xl:items-start">
        <div className="order-last space-y-6 xl:order-first">
          <SurfaceCard className="text-sm leading-7 text-muted" aria-label="Tier context">
            <p>
              This page is part of the <span className="font-semibold text-ink">Free</span> layer and is meant to orient
              you to the current week. If you need a paid decision brief for this issue, use{' '}
              <span className="font-semibold text-ink">Weekly Pro — Single Issue</span>. If you need the thesis to stay
              connected across several weekly issues, use the <span className="font-semibold text-ink">Monthly Bundle</span>.
            </p>
          </SurfaceCard>
          <ExecutiveSummary summary={report.metadata.summary} />
          <MarketSnapshotCards snapshot={report.marketSnapshot} />
          <WinnersAndLosers movers={report.movers} />
          <RegimeSection regime={report.regime} />
          <ReportSignalsBlock signals={report.signals} />
          <ReportSections sections={report.sections} />
          <MethodologyNote />
        </div>

        <div className="order-first space-y-4 xl:order-last xl:sticky xl:top-24">
          <ReportShareBlock title={report.metadata.title} url={reportUrl} />
          <SurfaceCard className="space-y-4 bg-gradient-to-br from-white via-white to-paper/90">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Choose the paid depth only if the workflow changes</h2>
              <p className="text-sm leading-7 text-muted">
                Weekly Pro is for acting on this specific issue. Monthly Bundle is for staying aligned as the thesis evolves
                over several weekly reports. Both remain one-time purchases through Stripe Payment Links.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Decision</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">Weekly Pro — Single Issue</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Best when this week requires a deeper decision brief and one issue is enough.
                </p>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Continuity</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight">Monthly Bundle</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Best when you want week-to-week continuity rather than evaluating each issue in isolation.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ProCta checkoutTarget={weeklyProCheckoutTarget} label="Buy Single Issue" />
              <ProCta className={secondaryCtaClassName} label="Buy Monthly Bundle" checkoutTarget={monthlyBundleCheckoutTarget} />
            </div>
          </SurfaceCard>
        </div>
      </PageSection>
    </PageShell>
  );
}
