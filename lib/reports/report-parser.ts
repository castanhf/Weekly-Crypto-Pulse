import type { MarketSnapshot, Mover, Regime, Report, ReportMetadata, ReportSection } from '@/domain/report';

const VALID_REGIMES: ReadonlySet<Regime> = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const assertRecord = (value: unknown, fieldPath: string): JsonRecord => {
  if (!isRecord(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected object.`);
  }

  return value;
};

const assertString = (value: unknown, fieldPath: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid report data at "${fieldPath}": expected non-empty string.`);
  }

  return value;
};

const assertNumber = (value: unknown, fieldPath: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected number.`);
  }

  return value;
};

const assertStringArray = (value: unknown, fieldPath: string): ReadonlyArray<string> => {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected string array.`);
  }

  return value.map((entry, index) => assertString(entry, `${fieldPath}[${index}]`));
};

const parseMetadata = (value: unknown): ReportMetadata => {
  const metadata = assertRecord(value, 'metadata');

  return {
    title: assertString(metadata.title, 'metadata.title'),
    slug: assertString(metadata.slug, 'metadata.slug'),
    publishedAt: assertString(metadata.publishedAt, 'metadata.publishedAt'),
    weekLabel: assertString(metadata.weekLabel, 'metadata.weekLabel'),
    summary: assertString(metadata.summary, 'metadata.summary'),
    tags: assertStringArray(metadata.tags, 'metadata.tags')
  };
};

const parseRegime = (value: unknown): Regime => {
  const regime = assertString(value, 'regime');

  if (!VALID_REGIMES.has(regime as Regime)) {
    throw new Error(`Invalid report data at "regime": unsupported value "${regime}".`);
  }

  return regime as Regime;
};

const parseMarketSnapshot = (value: unknown): MarketSnapshot => {
  const marketSnapshot = assertRecord(value, 'marketSnapshot');

  return {
    totalMarketCapUsd: assertNumber(marketSnapshot.totalMarketCapUsd, 'marketSnapshot.totalMarketCapUsd'),
    btcDominancePct: assertNumber(marketSnapshot.btcDominancePct, 'marketSnapshot.btcDominancePct'),
    ethDominancePct: assertNumber(marketSnapshot.ethDominancePct, 'marketSnapshot.ethDominancePct'),
    fearGreedIndex: assertNumber(marketSnapshot.fearGreedIndex, 'marketSnapshot.fearGreedIndex')
  };
};

const parseMovers = (value: unknown): ReadonlyArray<Mover> => {
  if (!Array.isArray(value)) {
    throw new Error('Invalid report data at "movers": expected array.');
  }

  return value.map((entry, index) => {
    const mover = assertRecord(entry, `movers[${index}]`);

    return {
      symbol: assertString(mover.symbol, `movers[${index}].symbol`),
      name: assertString(mover.name, `movers[${index}].name`),
      changePct7d: assertNumber(mover.changePct7d, `movers[${index}].changePct7d`),
      catalyst: assertString(mover.catalyst, `movers[${index}].catalyst`)
    };
  });
};

const parseSections = (value: unknown): ReadonlyArray<ReportSection> => {
  if (!Array.isArray(value)) {
    throw new Error('Invalid report data at "sections": expected array.');
  }

  return value.map((entry, index) => {
    const section = assertRecord(entry, `sections[${index}]`);

    return {
      id: assertString(section.id, `sections[${index}].id`),
      heading: assertString(section.heading, `sections[${index}].heading`),
      body: assertString(section.body, `sections[${index}].body`),
      highlights: assertStringArray(section.highlights, `sections[${index}].highlights`)
    };
  });
};

export const parseReportJson = (rawJson: string, source: string): Report => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in report file "${source}".`);
  }

  const root = assertRecord(parsed, 'root');

  return {
    metadata: parseMetadata(root.metadata),
    regime: parseRegime(root.regime),
    marketSnapshot: parseMarketSnapshot(root.marketSnapshot),
    movers: parseMovers(root.movers),
    sections: parseSections(root.sections)
  };
};
