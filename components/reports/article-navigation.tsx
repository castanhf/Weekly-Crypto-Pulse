import Link from 'next/link';

import type { Artifact } from '@/lib/reports/artifact-types';

type ArticleNavigationProps = Readonly<{
  prev: Artifact | null;
  next: Artifact | null;
}>;

const getArtifactLabel = (artifact: Artifact): string => {
  if (artifact.kind === 'daily') return artifact.daily.headline;
  return artifact.report.metadata.title;
};

const getArtifactKindLabel = (artifact: Artifact): string =>
  artifact.kind === 'daily' ? 'Daily briefing' : 'Weekly report';

export function ArticleNavigation({ prev, next }: ArticleNavigationProps): JSX.Element | null {
  if (!prev && !next) return null;

  return (
    <nav aria-label="Article navigation" className="grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link
          className="group flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-white/20 hover:bg-surface/80 sm:p-6"
          href={`/reports/${prev.slug}`}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
            ← {getArtifactKindLabel(prev)}
          </p>
          <p className="text-sm font-medium leading-6 text-paper line-clamp-2 group-hover:text-paper/80">
            {getArtifactLabel(prev)}
          </p>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          className="group flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-surface p-5 text-right transition hover:border-white/20 hover:bg-surface/80 sm:p-6"
          href={`/reports/${next.slug}`}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {getArtifactKindLabel(next)} →
          </p>
          <p className="text-sm font-medium leading-6 text-paper line-clamp-2 group-hover:text-paper/80">
            {getArtifactLabel(next)}
          </p>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
