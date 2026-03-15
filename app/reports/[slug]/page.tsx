import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReportViewTracker } from '@/components/analytics/report-view-tracker';
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
import { getAllReports, getReportBySlug } from '@/lib/reports/report-repository';
import { createReportMetadata, toAbsoluteUrl } from '@/lib/seo';

type ReportDetailPageProps = {
  params: {
    slug: string;
  };
};

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

  return (
    <article className="space-y-6">
      <ReportViewTracker reportSlug={report.metadata.slug} />
      <ReportHero metadata={report.metadata} />
      <ReportShareBlock title={report.metadata.title} url={reportUrl} />
      <ExecutiveSummary summary={report.metadata.summary} />
      <MarketSnapshotCards snapshot={report.marketSnapshot} />
      <WinnersAndLosers movers={report.movers} />
      <RegimeSection regime={report.regime} />
      <ReportSignalsBlock signals={report.signals} />
      <ReportSections sections={report.sections} />
      <MethodologyNote />
      <footer className="space-y-3 border-t border-line pt-6">
        <h2 className="text-xl font-semibold tracking-tight">Unlock this week&apos;s Pro decision brief</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Start with Weekly Crypto Pulse Pro — Single Issue for this report, or compare with the Monthly Bundle if you
          need continuity across the month.
        </p>
        <div className="flex flex-wrap gap-3">
          <ProCta label="Buy Single Issue for this report" offer="singleIssue" />
          <ProCta
            className="inline-flex border border-line px-4 py-2 text-sm font-medium transition hover:border-ink"
            label="Compare with Monthly Bundle"
            offer="monthlyBundle"
          />
        </div>
      </footer>
    </article>
  );
}
