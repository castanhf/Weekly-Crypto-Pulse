import { SurfaceCard } from '@/components/layout/page-shell';
import { composeClassNames } from '@/components/layout/ui-primitives';
import { formatIsoDate, formatIsoDateTime } from '@/components/reports/report-formatters';
import type { ReportArtifactRecord } from '@/lib/reports/report-repository';

type TrustItem = Readonly<{
  label: string;
  value: string;
}>;

type ArtifactTrustCardProps = Readonly<{
  reportArtifact: ReportArtifactRecord;
  description: string;
  title?: string;
  className?: string;
  extraItems?: ReadonlyArray<TrustItem>;
}>;

const getSchemaLabel = (schemaVersion: ReportArtifactRecord['artifact']['schemaVersion']): string =>
  schemaVersion === 'legacy' ? 'Legacy artifact' : `Schema v${schemaVersion}`;

const getGeneratedAtLabel = (generatedAt: string | undefined): string => (generatedAt ? formatIsoDateTime(generatedAt) : 'Not recorded');

export function ArtifactTrustCard({
  reportArtifact,
  description,
  title = 'Freshness and source',
  className,
  extraItems = []
}: ArtifactTrustCardProps): JSX.Element {
  const trustItems: ReadonlyArray<TrustItem> = [
    { label: 'Published', value: formatIsoDate(reportArtifact.report.metadata.publishedAt) },
    { label: 'Artifact generated', value: getGeneratedAtLabel(reportArtifact.artifact.generatedAt) },
    { label: 'Artifact schema', value: getSchemaLabel(reportArtifact.artifact.schemaVersion) },
    { label: 'Render source', value: 'Committed local JSON artifact' },
    ...extraItems
  ];

  return (
    <SurfaceCard className={composeClassNames('space-y-4 border-line/70 bg-paper/70', className)}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Freshness and source</p>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <p className="text-base leading-8 text-muted">{description}</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {trustItems.map((item) => (
          <div className="rounded-2xl border border-line/80 bg-white px-4 py-4" key={item.label}>
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</dt>
            <dd className="mt-2 text-base font-medium leading-7 text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>
    </SurfaceCard>
  );
}
