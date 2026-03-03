import type { ReportMetadata } from '@/domain/report';

import { formatIsoDate } from '@/components/reports/report-formatters';

type ReportHeroProps = {
  metadata: ReportMetadata;
};

export function ReportHero({ metadata }: ReportHeroProps): JSX.Element {
  return (
    <header className="space-y-4 border-b border-line pb-6">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{metadata.weekLabel}</p>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{metadata.title}</h1>
      <p className="text-sm text-muted">Published {formatIsoDate(metadata.publishedAt)}</p>
      <ul className="flex flex-wrap gap-2">
        {metadata.tags.map((tag) => (
          <li className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted" key={tag}>
            {tag}
          </li>
        ))}
      </ul>
    </header>
  );
}
