import Link from 'next/link';

import { reports } from '@/data/reports';

export default function ReportsPage(): JSX.Element {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
      <p className="text-muted">Placeholder index route for weekly report archives.</p>
      <ul className="divide-y divide-line border-y border-line">
        {reports.map((report) => (
          <li className="py-4" key={report.metadata.slug}>
            <Link className="block space-y-1" href={`/reports/${report.metadata.slug}`}>
              <p className="text-lg font-medium">{report.metadata.title}</p>
              <p className="text-sm text-muted">{report.metadata.publishedAt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
