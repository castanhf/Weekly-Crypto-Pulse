import type { Regime } from '../../domain/report';
import type { WeeklyArtifact } from '../reports/artifact-types';

export type ChartWindowOptions = Readonly<{
  asOfDate: Date | string;
  windowSize?: number;
  artifacts: ReadonlyArray<WeeklyArtifact>;
}>;

export type SnapshotTrendPoint = Readonly<{
  publishedAt: string;
  weekLabel: string;
  totalMarketCapUsd: number;
  btcDominancePct: number;
  ethDominancePct: number;
  fearGreedIndex: number;
}>;

export type RegimeHistoryPoint = Readonly<{
  publishedAt: string;
  weekLabel: string;
  regime: Regime;
}>;

const DEFAULT_WINDOW_SIZE = 12;

const SHORT_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

const toIsoDateString = (asOfDate: Date | string): string =>
  typeof asOfDate === 'string' ? asOfDate : asOfDate.toISOString().slice(0, 10);

const toShortWeekLabel = (publishedAt: string): string =>
  SHORT_LABEL_FORMATTER.format(new Date(`${publishedAt}T00:00:00.000Z`));

const resolveWindow = (options: ChartWindowOptions): ReadonlyArray<WeeklyArtifact> => {
  const asOfDateStr = toIsoDateString(options.asOfDate);
  const windowSize = options.windowSize ?? DEFAULT_WINDOW_SIZE;

  return options.artifacts
    .filter((a) => a.publishedAt <= asOfDateStr)
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, windowSize)
    .reverse();
};

export const computeSnapshotTrendWindow = (options: ChartWindowOptions): SnapshotTrendPoint[] =>
  resolveWindow(options).map((a) => ({
    publishedAt: a.publishedAt,
    weekLabel: toShortWeekLabel(a.publishedAt),
    totalMarketCapUsd: a.report.marketSnapshot.totalMarketCapUsd,
    btcDominancePct: a.report.marketSnapshot.btcDominancePct,
    ethDominancePct: a.report.marketSnapshot.ethDominancePct,
    fearGreedIndex: a.report.marketSnapshot.fearGreedIndex
  }));

export const computeRegimeHistoryWindow = (options: ChartWindowOptions): RegimeHistoryPoint[] =>
  resolveWindow(options).map((a) => ({
    publishedAt: a.publishedAt,
    weekLabel: toShortWeekLabel(a.publishedAt),
    regime: a.report.regime
  }));
