import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentWidth, PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { formatIsoDate } from '@/components/reports/report-formatters';
import type { Regime } from '@/domain/report';
import { createReportsArchiveMetadata } from '@/lib/seo';
import { getAllReportArtifacts } from '@/lib/reports/report-repository';

export const metadata: Metadata = createReportsArchiveMetadata();

const REGIME_BADGE_CLASS_NAMES: Record<Regime, string> = {
  'risk-on': 'border-green-700/50 bg-green-900/30 text-green-400',
  'risk-off': 'border-red-700/50 bg-red-900/30 text-red-400',
  'range-bound': 'border-amber-600/50 bg-amber-900/30 text-amber-400',
  transition: 'border-amber-600/50 bg-amber-900/30 text-amber-400'
} as const;

const REGIME_LABELS: Record<Regime, string> = {
  'risk-on': 'Risk-on',
  'risk-off': 'Risk-off',
  'range-bound': 'Range-bound',
  transition: 'Transition'
} as const;

const archiveCtaClassName =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-accent px-4 py-3 text-center text-sm font-medium transition hover:bg-accent hover:text-ink';

export default function ReportsPage(): JSX.Element {
  const reportArtifacts = getAllReportArtifacts();

  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Every report is free to read. Newest first."
        eyebrow="Reports archive"
        title="All reports, free to read."
      />

      <PageSection>
        <ContentWidth className="mx-auto" size="feature">
          <div className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.8fr)] xl:items-start">
            <ul className="space-y-4 sm:space-y-5">
              {reportArtifacts.map(({ report }) => {
                const reportUrl = `/reports/${report.metadata.slug}`;

                return (
                  <li key={report.metadata.slug}>
                    <SurfaceCard className="space-y-5 p-5 sm:space-y-6 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-paper">{report.metadata.weekLabel}</p>
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Published {formatIsoDate(report.metadata.publishedAt)}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${REGIME_BADGE_CLASS_NAMES[report.regime]}`}
                        >
                          {REGIME_LABELS[report.regime]}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-[1.3rem] font-semibold tracking-tight sm:text-[1.75rem]">
                          <Link className="transition hover:text-muted" href={reportUrl}>
                            {report.metadata.title}
                          </Link>
                        </h2>
                        <p className="text-base leading-7 text-muted sm:leading-8">{report.metadata.summary}</p>
                      </div>
                      <Link className="inline-flex min-h-11 items-center text-sm font-medium text-paper underline underline-offset-4" href={reportUrl}>
                        Read free report
                      </Link>
                    </SurfaceCard>
                  </li>
                );
              })}
            </ul>

            <aside className="space-y-4 xl:sticky xl:top-24">
              <SurfaceCard className="space-y-5 bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight">How to use the archive</h2>
                <p className="text-base leading-8 text-muted">
                  Every report here is free to read. They cover what happened in crypto markets that week and what it
                  meant. If you want the decision layer — more detail on what to watch — head over to the{' '}
                  <span className="font-semibold text-paper">Pro</span> page.
                </p>
                <Link className={archiveCtaClassName} href="/pro">
                  Compare Weekly Pro and Monthly Bundle
                </Link>
              </SurfaceCard>
            </aside>
          </div>
        </ContentWidth>
      </PageSection>
    </PageShell>
  );
}
