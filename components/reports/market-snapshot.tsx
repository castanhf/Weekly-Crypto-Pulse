import type { MarketSnapshot } from '@/domain/report';

import { formatCompactUsd, formatPercent } from '@/components/reports/report-formatters';
import { SectionCard } from '@/components/reports/section-card';

type SnapshotMetric = {
  label: string;
  value: string;
};

type MarketSnapshotProps = {
  snapshot: MarketSnapshot;
};

const getSnapshotMetrics = (snapshot: MarketSnapshot): ReadonlyArray<SnapshotMetric> => [
  {
    label: 'Total Market Cap',
    value: formatCompactUsd(snapshot.totalMarketCapUsd)
  },
  {
    label: 'BTC Dominance',
    value: formatPercent(snapshot.btcDominancePct)
  },
  {
    label: 'ETH Dominance',
    value: formatPercent(snapshot.ethDominancePct)
  },
  {
    label: 'Fear & Greed Index',
    value: snapshot.fearGreedIndex.toString()
  }
];

export function MarketSnapshotCards({ snapshot }: MarketSnapshotProps): JSX.Element {
  const metrics = getSnapshotMetrics(snapshot);

  return (
    <SectionCard title="Market Snapshot">
      <dl className="grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div className="space-y-1 rounded-md border border-line p-4" key={metric.label}>
            <dt className="text-sm text-muted">{metric.label}</dt>
            <dd className="text-2xl font-semibold tracking-tight">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
