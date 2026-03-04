import type { MarketSnapshot, Mover, Regime, Report, ReportMetadata, ReportSection } from '@/domain/report';
import { assertArray, assertNumber, assertRecord, assertString, assertStringArray } from '@/lib/reports/json-assertions';

const VALID_REGIMES: ReadonlySet<Regime> = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

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

const parseCollection = <T>(
  value: unknown,
  fieldPath: string,
  parseItem: (item: unknown, index: number) => T
): ReadonlyArray<T> => assertArray(value, fieldPath).map(parseItem);

const parseMovers = (value: unknown): ReadonlyArray<Mover> =>
  parseCollection(value, 'movers', (entry, index) => {
    const moverFieldPath = `movers[${index}]`;
    const mover = assertRecord(entry, moverFieldPath);

    return {
      symbol: assertString(mover.symbol, `${moverFieldPath}.symbol`),
      name: assertString(mover.name, `${moverFieldPath}.name`),
      changePct7d: assertNumber(mover.changePct7d, `${moverFieldPath}.changePct7d`),
      catalyst: assertString(mover.catalyst, `${moverFieldPath}.catalyst`)
    };
  });

const parseSections = (value: unknown): ReadonlyArray<ReportSection> =>
  parseCollection(value, 'sections', (entry, index) => {
    const sectionFieldPath = `sections[${index}]`;
    const section = assertRecord(entry, sectionFieldPath);

    return {
      id: assertString(section.id, `${sectionFieldPath}.id`),
      heading: assertString(section.heading, `${sectionFieldPath}.heading`),
      body: assertString(section.body, `${sectionFieldPath}.body`),
      highlights: assertStringArray(section.highlights, `${sectionFieldPath}.highlights`)
    };
  });

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
