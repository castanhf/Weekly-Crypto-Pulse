import { WEEKLY_SCHEMA_V1_0, WEEKLY_SCHEMA_V1_1, type SchemaVersion } from '@/domain/schema-version';
import {
  type MarketSnapshot,
  type Mover,
  type ParsedReportArtifact,
  type PlainspokenOpening,
  type Regime,
  type Report,
  type ReportMetadata,
  type ReportSection,
  type ReportSignals,
  type WatchlistLevel
} from '@/domain/report';
import { assertArray, assertNumber, assertRecord, assertString, assertStringArray } from '@/lib/reports/json-assertions';

const VALID_REGIMES: ReadonlySet<Regime> = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

/** Schema versions the parser accepts from on-disk artifacts. */
const SUPPORTED_SCHEMA_VERSIONS: ReadonlySet<string> = new Set([
  '1.0',            // legacy format produced before the weekly@* prefix was introduced
  WEEKLY_SCHEMA_V1_0,
  WEEKLY_SCHEMA_V1_1
]);

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

const parseSections = (value: unknown): ReadonlyArray<ReportSection> => {
  const sections = parseCollection(value, 'sections', (entry, index) => {
    const sectionFieldPath = `sections[${index}]`;
    const section = assertRecord(entry, sectionFieldPath);

    return {
      id: assertString(section.id, `${sectionFieldPath}.id`),
      heading: assertString(section.heading, `${sectionFieldPath}.heading`),
      body: assertString(section.body, `${sectionFieldPath}.body`),
      highlights: assertStringArray(section.highlights, `${sectionFieldPath}.highlights`)
    };
  });

  const sectionIds = new Set<string>();

  for (const section of sections) {
    if (sectionIds.has(section.id)) {
      throw new Error(`Invalid report data: duplicate section id "${section.id}".`);
    }

    sectionIds.add(section.id);
  }

  return sections;
};

const parseWatchlistLevels = (value: unknown): ReadonlyArray<WatchlistLevel> =>
  parseCollection(value, 'signals.watchlistLevels', (entry, index) => {
    const levelFieldPath = `signals.watchlistLevels[${index}]`;
    const level = assertRecord(entry, levelFieldPath);

    return {
      asset: assertString(level.asset, `${levelFieldPath}.asset`),
      level: assertString(level.level, `${levelFieldPath}.level`),
      context: assertString(level.context, `${levelFieldPath}.context`)
    };
  });

const parseSignals = (value: unknown): ReportSignals => {
  const signals = assertRecord(value, 'signals');
  const riskChecklist = assertStringArray(signals.riskChecklist, 'signals.riskChecklist');

  if (riskChecklist.length !== 5) {
    throw new Error('Invalid report data at "signals.riskChecklist": expected exactly 5 items.');
  }

  return {
    thesis: assertStringArray(signals.thesis, 'signals.thesis'),
    riskChecklist,
    watchlistLevels: parseWatchlistLevels(signals.watchlistLevels),
    changedSinceLastWeek: assertStringArray(signals.changedSinceLastWeek, 'signals.changedSinceLastWeek')
  };
};

const parsePlainspokenOpening = (value: unknown): PlainspokenOpening | undefined => {
  if (value === undefined || value === null) return undefined;

  const opening = assertRecord(value, 'plainspokenOpening');

  return {
    headline: assertString(opening.headline, 'plainspokenOpening.headline'),
    body: assertString(opening.body, 'plainspokenOpening.body')
  };
};

const parseReportShape = (rawReport: unknown): Report => {
  const report = assertRecord(rawReport, 'report');

  return {
    metadata: parseMetadata(report.metadata),
    regime: parseRegime(report.regime),
    marketSnapshot: parseMarketSnapshot(report.marketSnapshot),
    movers: parseMovers(report.movers),
    sections: parseSections(report.sections),
    signals: parseSignals(report.signals),
    plainspokenOpening: parsePlainspokenOpening(report.plainspokenOpening)
  };
};

/** Normalises the on-disk schemaVersion to the canonical SchemaVersion type.
 *  The legacy "1.0" string (used before the weekly@* prefix was introduced)
 *  is mapped to WEEKLY_SCHEMA_V1_0. */
const parseSchemaVersion = (value: unknown): SchemaVersion => {
  const schemaVersion = assertString(value, 'schemaVersion');

  if (schemaVersion === '1.0') return WEEKLY_SCHEMA_V1_0;

  if (!SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)) {
    throw new Error(`Invalid report data at "schemaVersion": unsupported version "${schemaVersion}".`);
  }

  return schemaVersion as SchemaVersion;
};

const parseGeneratedAt = (value: unknown): string => {
  const generatedAt = assertString(value, 'generatedAt');

  if (Number.isNaN(Date.parse(generatedAt))) {
    throw new Error(`Invalid report data at "generatedAt": expected ISO timestamp, received "${generatedAt}".`);
  }

  return generatedAt;
};

const isVersionedArtifact = (value: Record<string, unknown>): value is Record<'schemaVersion' | 'report', unknown> =>
  'schemaVersion' in value;

export const parseReportArtifactJson = (rawJson: string, source: string): ParsedReportArtifact => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in report file "${source}".`);
  }

  const root = assertRecord(parsed, 'root');

  if (!isVersionedArtifact(root)) {
    return {
      report: parseReportShape(root),
      artifact: {
        schemaVersion: 'legacy'
      }
    };
  }

  const schemaVersion = parseSchemaVersion(root.schemaVersion);
  const generatedAt = 'generatedAt' in root && root.generatedAt !== undefined ? parseGeneratedAt(root.generatedAt) : undefined;

  return {
    report: parseReportShape(root.report),
    artifact: {
      schemaVersion,
      generatedAt
    }
  };
};

export const parseReportJson = (rawJson: string, source: string): Report => parseReportArtifactJson(rawJson, source).report;
