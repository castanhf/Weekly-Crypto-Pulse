import type { SchemaVersion } from './schema-version';

export type { SchemaVersion };

export type Regime = 'risk-on' | 'risk-off' | 'range-bound' | 'transition';

export type ReportMetadata = Readonly<{
  title: string;
  slug: string;
  publishedAt: string;
  weekLabel: string;
  summary: string;
  tags: ReadonlyArray<string>;
}>;

export type MarketSnapshot = Readonly<{
  totalMarketCapUsd: number;
  btcDominancePct: number;
  ethDominancePct: number;
  fearGreedIndex: number;
}>;

export type Mover = Readonly<{
  symbol: string;
  name: string;
  changePct7d: number;
  catalyst: string;
}>;

export type ReportSection = Readonly<{
  id: string;
  heading: string;
  body: string;
  highlights: ReadonlyArray<string>;
}>;

export type WatchlistLevel = Readonly<{
  asset: string;
  level: string;
  context: string;
}>;

export type ReportSignals = Readonly<{
  thesis: ReadonlyArray<string>;
  riskChecklist: ReadonlyArray<string>;
  watchlistLevels: ReadonlyArray<WatchlistLevel>;
  changedSinceLastWeek: ReadonlyArray<string>;
}>;

export type PlainspokenOpening = Readonly<{
  headline: string;
  body: string;
}>;

export type Report = Readonly<{
  metadata: ReportMetadata;
  regime: Regime;
  marketSnapshot: MarketSnapshot;
  movers: ReadonlyArray<Mover>;
  sections: ReadonlyArray<ReportSection>;
  signals: ReportSignals;
  /** Weekly v1.1 additive field. Present on new weeklies; absent on v1.0 artifacts. */
  plainspokenOpening?: PlainspokenOpening;
}>;

export type ReportArtifact = Readonly<{
  schemaVersion: SchemaVersion;
  report: Report;
  generatedAt?: string;
}>;

export type ParsedReportArtifact = Readonly<{
  report: Report;
  artifact: Readonly<{
    schemaVersion: SchemaVersion | 'legacy';
    generatedAt?: string;
  }>;
}>;
