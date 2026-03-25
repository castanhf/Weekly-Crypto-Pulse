import type { ReportMetadata } from '@/domain/report';

import { formatIsoDate } from '@/components/reports/report-formatters';

type ReportHeroProps = {
  metadata: ReportMetadata;
};

export function ReportHero({ metadata }: ReportHeroProps): JSX.Element {
  return (
    <header className="space-y-6 border-b border-line/80 pb-8 sm:space-y-7 sm:pb-10">
      <div className="max-w-4xl space-y-3.5 sm:space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{metadata.weekLabel}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{metadata.title}</h1>
        <p className="text-base leading-8 text-muted sm:text-lg">
          Public weekly orientation for the crypto market, structured for fast scanning before deeper paid work.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-line/70 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Published {formatIsoDate(metadata.publishedAt)}</p>
        <ul className="flex flex-wrap gap-2.5">
          {metadata.tags.map((tag) => (
            <li className="rounded-full border border-line/80 px-3 py-1 text-xs font-medium text-muted" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
