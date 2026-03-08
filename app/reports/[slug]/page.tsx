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
import { WinnersAndLosers } from '@/components/reports/winners-losers';
import { getAllReports, getReportBySlug } from '@/lib/reports/report-repository';
import { createReportMetadata } from '@/lib/seo';

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

  return (
    <article className="space-y-6">
      <ReportViewTracker reportSlug={report.metadata.slug} />
      <ReportHero metadata={report.metadata} />
      <ExecutiveSummary summary={report.metadata.summary} />
      <MarketSnapshotCards snapshot={report.marketSnapshot} />
      <WinnersAndLosers movers={report.movers} />
      <RegimeSection regime={report.regime} />
      <ReportSections sections={report.sections} />
      <MethodologyNote />
      <footer className="space-y-3 border-t border-line pt-6">
        <h2 className="text-xl font-semibold tracking-tight">Need the full Pro version?</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Pro includes deeper context, expanded analysis, and a sharper weekly risk framing.
        </p>
        <ProCta label="Upgrade with Stripe" />
      </footer>
    </article>
  );
}
