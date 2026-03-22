import type { ReportMetadata } from '@/domain/report';

import { formatIsoDate } from '@/components/reports/report-formatters';

type ReportHeroProps = {
  metadata: ReportMetadata;
};

export function ReportHero({ metadata }: ReportHeroProps): JSX.Element {
  return (
    <header className="space-y-5 border-b border-line/80 pb-8 sm:pb-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{metadata.weekLabel}</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">{metadata.title}</h1>
        <p className="text-sm leading-7 text-muted">Published {formatIsoDate(metadata.publishedAt)}</p>
      </div>
      <ul className="flex flex-wrap gap-2.5">
        {metadata.tags.map((tag) => (
          <li className="rounded-full border border-line/80 px-3 py-1 text-xs font-medium text-muted" key={tag}>
            {tag}
          </li>
        ))}
      </ul>
    </header>
  );
}
