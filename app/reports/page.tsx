import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { formatIsoDate } from '@/components/reports/report-formatters';
import { createReportsArchiveMetadata } from '@/lib/seo';
import { getAllReports } from '@/lib/reports/report-repository';

export const metadata: Metadata = createReportsArchiveMetadata();

const archiveCtaClassName =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-ink px-4 py-3 text-center text-sm font-medium transition hover:bg-ink hover:text-paper';

export default function ReportsPage(): JSX.Element {
  const reports = getAllReports();

  return (
    <PageShell>
      <PageHeader
        description="Browse every public Weekly Crypto Pulse issue in reverse chronological order."
        eyebrow="Reports archive"
        title="Public weekly reports, organized for quick scanning."
      />

      <PageSection className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.8fr)] lg:items-start">
        <aside className="order-first lg:order-last lg:sticky lg:top-24">
          <SurfaceCard className="space-y-5 bg-paper">
            <h2 className="text-lg font-semibold tracking-tight">How to use the archive</h2>
            <p className="text-base leading-8 text-muted">
              Archive reports are the <span className="font-semibold text-ink">Free</span> layer for orientation.
              Readers who need a deeper decision brief for one week or continuity across the month can compare the paid
              offers on the Pro page.
            </p>
            <Link className={archiveCtaClassName} href="/pro">
              Compare Weekly Pro and Monthly Bundle
            </Link>
          </SurfaceCard>
        </aside>

        <ul className="space-y-4">
          {reports.map((report) => {
            const reportUrl = `/reports/${report.metadata.slug}`;

            return (
              <li key={report.metadata.slug}>
                <SurfaceCard className="space-y-5 sm:space-y-6">
                  <p className="text-base leading-8 text-muted">Published {formatIsoDate(report.metadata.publishedAt)}</p>
                  <div className="space-y-3">
                    <h2 className="text-[1.45rem] font-semibold tracking-tight sm:text-[1.75rem]">
                      <Link className="transition hover:text-muted" href={reportUrl}>
                        {report.metadata.title}
                      </Link>
                    </h2>
                    <p className="text-base leading-8 text-muted">{report.metadata.summary}</p>
                  </div>
                  <Link className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline underline-offset-4" href={reportUrl}>
                    Read free report
                  </Link>
                </SurfaceCard>
              </li>
            );
          })}
        </ul>
      </PageSection>
    </PageShell>
  );
}
