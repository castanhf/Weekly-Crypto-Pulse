import type { Mover } from '@/domain/report';

import { formatPercent } from '@/components/reports/report-formatters';
import { SectionCard } from '@/components/reports/section-card';

type WinnersLosersProps = {
  movers: ReadonlyArray<Mover>;
  sectionLabels?: Readonly<{ winners: string; losers: string }>;
};

type MoverTrend = 'winner' | 'loser';

const byPerformanceDesc = (left: Mover, right: Mover): number => right.changePct7d - left.changePct7d;

const isMoverByTrend = (mover: Mover, trend: MoverTrend): boolean => {
  if (trend === 'winner') {
    return mover.changePct7d > 0;
  }

  return mover.changePct7d < 0;
};

const getMoversByTrend = (movers: ReadonlyArray<Mover>, trend: MoverTrend): ReadonlyArray<Mover> =>
  movers.filter((mover) => isMoverByTrend(mover, trend)).sort(byPerformanceDesc);

const deriveSectionLabels = (movers: ReadonlyArray<Mover>): Readonly<{ winners: string; losers: string }> => {
  if (movers.length === 0) return { winners: 'Winners', losers: 'Losers' };
  if (movers.every((m) => m.changePct7d > 0)) return { winners: 'Winners', losers: 'Weakest gainers' };
  if (movers.every((m) => m.changePct7d < 0)) return { winners: 'Smallest losses', losers: 'Losers' };
  return { winners: 'Winners', losers: 'Losers' };
};

const MoverList = ({ items, emptyMessage }: { items: ReadonlyArray<Mover>; emptyMessage: string }): JSX.Element => {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((mover) => (
        <li className="rounded-md border border-line p-4" key={mover.symbol}>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-medium">
              {mover.name} <span className="text-sm text-muted">({mover.symbol})</span>
            </p>
            <p className="text-sm font-semibold">{formatPercent(mover.changePct7d)}</p>
          </div>
          <p className="mt-1 text-sm text-muted">{mover.catalyst}</p>
        </li>
      ))}
    </ul>
  );
};

export function WinnersAndLosers({ movers, sectionLabels }: WinnersLosersProps): JSX.Element {
  const winners = getMoversByTrend(movers, 'winner');
  const losers = getMoversByTrend(movers, 'loser');
  const labels = sectionLabels ?? deriveSectionLabels(movers);

  return (
    <SectionCard title="Top movers (7D)">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{labels.winners}</h3>
          <MoverList emptyMessage="None for this period." items={winners} />
        </div>
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{labels.losers}</h3>
          <MoverList emptyMessage="None for this period." items={losers} />
        </div>
      </div>
    </SectionCard>
  );
}
