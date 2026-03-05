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

export type Report = Readonly<{
  metadata: ReportMetadata;
  regime: Regime;
  marketSnapshot: MarketSnapshot;
  movers: ReadonlyArray<Mover>;
  sections: ReadonlyArray<ReportSection>;
}>;

export const CURRENT_REPORT_SCHEMA_VERSION = '1.0' as const;

export type ReportSchemaVersion = typeof CURRENT_REPORT_SCHEMA_VERSION;

export type ReportArtifact = Readonly<{
  schemaVersion: ReportSchemaVersion;
  report: Report;
  generatedAt?: string;
}>;
