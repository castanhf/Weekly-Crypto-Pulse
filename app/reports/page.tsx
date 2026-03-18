import type { Metadata } from 'next';
import Link from 'next/link';

import { formatIsoDate } from '@/components/reports/report-formatters';
import { createReportsArchiveMetadata } from '@/lib/seo';
import { getAllReports } from '@/lib/reports/report-repository';

export const metadata: Metadata = createReportsArchiveMetadata();

export default function ReportsPage(): JSX.Element {
  const reports = getAllReports();

  return (
    <section className="space-y-6">
      <header className="space-y-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reports archive</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Browse every public Weekly Crypto Pulse issue in reverse chronological order.
        </p>
        <div className="rounded border border-line bg-paper p-4 text-sm text-muted">
          <p>
            Archive reports are the <span className="font-semibold text-ink">Free</span> layer for orientation.
            Readers who need a deeper decision brief for one week or continuity across the month can compare the paid
            offers on the Pro page.
          </p>
          <Link className="mt-3 inline-flex font-medium text-ink underline underline-offset-4" href="/pro">
            Compare Weekly Pro and Monthly Bundle
          </Link>
        </div>
      </header>
      <ul className="divide-y divide-line border-y border-line">
        {reports.map((report) => {
          const reportUrl = `/reports/${report.metadata.slug}`;

          return (
            <li className="py-5" key={report.metadata.slug}>
              <article className="space-y-2">
                <p className="text-sm text-muted">Published {formatIsoDate(report.metadata.publishedAt)}</p>
                <h2 className="text-xl font-semibold tracking-tight">
                  <Link className="hover:underline" href={reportUrl}>
                    {report.metadata.title}
                  </Link>
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted">{report.metadata.summary}</p>
                <Link className="inline-flex text-sm font-medium text-ink underline underline-offset-4" href={reportUrl}>
                  Read full report
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
