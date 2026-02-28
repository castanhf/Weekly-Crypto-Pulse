import { notFound } from 'next/navigation';

import { reports } from '@/data/reports';

type ReportDetailPageProps = {
  params: {
    slug: string;
  };
};

export default function ReportDetailPage({ params }: ReportDetailPageProps): JSX.Element {
  const report = reports.find((entry) => entry.slug === params.slug);

  if (!report) {
    notFound();
  }

  return (
    <article className="space-y-4">
      <p className="text-sm uppercase tracking-[0.14em] text-muted">Report placeholder</p>
      <h1 className="text-3xl font-semibold tracking-tight">{report.title}</h1>
      <p className="text-sm text-muted">Published: {report.publishedAt}</p>
      <p className="max-w-2xl leading-relaxed text-muted">{report.summary}</p>
    </article>
  );
}
