import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { formatIsoDate } from '@/components/reports/report-formatters';
import { createReportsArchiveMetadata } from '@/lib/seo';
import { getAllReports } from '@/lib/reports/report-repository';

export const metadata: Metadata = createReportsArchiveMetadata();

export default function ReportsPage(): JSX.Element {
  const reports = getAllReports();

  return (
    <PageShell>
      <PageHeader
        description="Browse every public Weekly Crypto Pulse issue in reverse chronological order."
        eyebrow="Reports archive"
        title="Public weekly reports, organized for quick scanning."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(17rem,0.8fr)] lg:items-start">
        <ul className="space-y-4">
          {reports.map((report) => {
            const reportUrl = `/reports/${report.metadata.slug}`;

            return (
              <li key={report.metadata.slug}>
                <SurfaceCard className="space-y-4">
                  <p className="text-sm leading-7 text-muted">Published {formatIsoDate(report.metadata.publishedAt)}</p>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      <Link className="transition hover:text-muted" href={reportUrl}>
                        {report.metadata.title}
                      </Link>
                    </h2>
                    <p className="max-w-3xl text-sm leading-7 text-muted">{report.metadata.summary}</p>
                  </div>
                  <Link className="inline-flex text-sm font-medium text-ink underline underline-offset-4" href={reportUrl}>
                    Read free report
                  </Link>
                </SurfaceCard>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-8">
          <SurfaceCard className="space-y-4 bg-paper">
            <h2 className="text-lg font-semibold tracking-tight">How to use the archive</h2>
            <p className="text-sm leading-7 text-muted">
              Archive reports are the <span className="font-semibold text-ink">Free</span> layer for orientation.
              Readers who need a deeper decision brief for one week or continuity across the month can compare the paid
              offers on the Pro page.
            </p>
            <Link className="inline-flex font-medium text-ink underline underline-offset-4" href="/pro">
              Compare Weekly Pro and Monthly Bundle
            </Link>
          </SurfaceCard>
        </aside>
      </div>
    </PageShell>
  );
}
