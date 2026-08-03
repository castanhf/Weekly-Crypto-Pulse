import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReportViewTracker } from '@/components/analytics/report-view-tracker';
import { RegimeHistoryStrip } from '@/components/charts/RegimeHistoryStrip';
import { SnapshotTrendChart } from '@/components/charts/SnapshotTrendChart';
import { PaidBlock } from '@/components/conversion/PaidBlock';
import { PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { ArticleNavigation } from '@/components/reports/article-navigation';
import { DailyReportPage } from '@/components/reports/daily-report-page';
import { ExecutiveSummary } from '@/components/reports/executive-summary';
import { MarketSnapshotCards } from '@/components/reports/market-snapshot';
import { MethodologyNote } from '@/components/reports/methodology-note';
import { RegimeSection } from '@/components/reports/regime-section';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportSections } from '@/components/reports/report-sections';
import { ReportShareBlock } from '@/components/reports/report-share-block';
import { WinnersAndLosers } from '@/components/reports/winners-losers';
import { computeRegimeHistoryWindow, computeSnapshotTrendWindow } from '@/lib/charts/window';
import { loadAllArtifacts, loadArtifactBySlug } from '@/lib/reports/artifact-repository';
import type { Artifact, WeeklyArtifact } from '@/lib/reports/artifact-types';
import { createDailyMetadata, createReportMetadata, toAbsoluteUrl } from '@/lib/seo';

type ReportDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const generateStaticParams = (): Array<{ slug: string }> =>
  loadAllArtifacts().map((artifact) => ({ slug: artifact.slug }));

export const generateMetadata = async (props: ReportDetailPageProps): Promise<Metadata> => {
  const params = await props.params;
  const artifact = loadArtifactBySlug(params.slug);

  if (!artifact) {
    return {
      title: 'Report not found',
      description: 'The requested report could not be found.'
    };
  }

  if (artifact.kind === 'daily') {
    return createDailyMetadata(artifact.daily);
  }

  return createReportMetadata(artifact.report);
};

export default async function ReportDetailPage(props: ReportDetailPageProps): Promise<JSX.Element> {
  const params = await props.params;
  const artifact = loadArtifactBySlug(params.slug);

  if (!artifact) {
    notFound();
  }

  const allArtifacts = loadAllArtifacts();
  const artifactIndex = allArtifacts.findIndex((a) => a.slug === params.slug);
  const prevArtifact: Artifact | null = artifactIndex < allArtifacts.length - 1 ? (allArtifacts[artifactIndex + 1] ?? null) : null;
  const nextArtifact: Artifact | null = artifactIndex > 0 ? (allArtifacts[artifactIndex - 1] ?? null) : null;

  if (artifact.kind === 'daily') {
    return <DailyReportPage artifact={artifact.daily} next={nextArtifact} prev={prevArtifact} />;
  }

  const report = artifact.report;
  const reportUrl = toAbsoluteUrl(`/reports/${report.metadata.slug}`);

  const weeklyArtifacts = allArtifacts.filter((a): a is WeeklyArtifact => a.kind === 'weekly');
  const snapshotTrendData = computeSnapshotTrendWindow({ asOfDate: artifact.publishedAt, artifacts: weeklyArtifacts });
  const regimeHistoryData = computeRegimeHistoryWindow({ asOfDate: artifact.publishedAt, artifacts: weeklyArtifacts });

  return (
    <PageShell className="space-y-10 sm:space-y-14 lg:space-y-16">
      <ReportViewTracker reportSlug={report.metadata.slug} />
      <ReportHero metadata={report.metadata} />

      <PageSection className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,0.75fr)] xl:items-start">
        <div className="order-first space-y-8 xl:space-y-10">
          <ExecutiveSummary summary={report.metadata.summary} />
          <MarketSnapshotCards snapshot={report.marketSnapshot} />
          <WinnersAndLosers movers={report.movers} sectionLabels={report.sectionLabels} />
          <RegimeSection regime={report.regime} />
          <ReportSections sections={report.sections} />
          <MethodologyNote />
        </div>

        <div className="order-last space-y-4 xl:sticky xl:top-36">
          <ReportShareBlock title={report.metadata.title} url={reportUrl} />
        </div>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-8 border-white/10 bg-surface p-5 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">12-week context</p>
            <h2 className="mt-1 text-[1.1rem] font-semibold tracking-tight">Market snapshot trend</h2>
          </div>
          <SnapshotTrendChart data={snapshotTrendData} />
          <div>
            <h2 className="mb-1 text-[1.1rem] font-semibold tracking-tight">Regime history</h2>
            <p className="mb-4 text-sm text-muted">Each cell is one weekly report. The highlighted cell is this issue.</p>
            <RegimeHistoryStrip data={regimeHistoryData} currentPublishedAt={artifact.publishedAt} />
          </div>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <PaidBlock />
      </PageSection>

      <PageSection>
        <ArticleNavigation next={nextArtifact} prev={prevArtifact} />
      </PageSection>
    </PageShell>
  );
}
