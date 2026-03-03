import { notFound } from 'next/navigation';

import { ExecutiveSummary } from '@/components/reports/executive-summary';
import { MarketSnapshotCards } from '@/components/reports/market-snapshot';
import { MethodologyNote } from '@/components/reports/methodology-note';
import { RegimeSection } from '@/components/reports/regime-section';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportSections } from '@/components/reports/report-sections';
import { WinnersAndLosers } from '@/components/reports/winners-losers';
import { getReportBySlug } from '@/lib/reports/report-repository';

type ReportDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function ReportDetailPage({ params }: ReportDetailPageProps): JSX.Element {
  const report = getReportBySlug(params.slug);

  if (!report) {
    notFound();
  }

  return (
    <article className="space-y-6">
      <ReportHero metadata={report.metadata} />
      <ExecutiveSummary summary={report.metadata.summary} />
      <MarketSnapshotCards snapshot={report.marketSnapshot} />
      <WinnersAndLosers movers={report.movers} />
      <RegimeSection regime={report.regime} />
      <ReportSections sections={report.sections} />
      <MethodologyNote />
    </article>
  );
}
