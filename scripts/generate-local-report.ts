import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CURRENT_REPORT_SCHEMA_VERSION,
  type MarketSnapshot,
  type Mover,
  type Regime,
  type ReportArtifact,
  type ReportSection,
  type ReportSignals,
  type WatchlistLevel
} from '../domain/report';
import {
  assertArray,
  assertNumber,
  assertRecord,
  assertString,
  assertStringArray
} from '../lib/reports/json-assertions';

type LocalReportWeekInput = Readonly<{
  publishedAt: string;
  label: string;
}>;

type LocalReportInput = Readonly<{
  generatedAt: string;
  week: LocalReportWeekInput;
  headline: string;
  summary: string;
  tags: ReadonlyArray<string>;
  regime: Regime;
  snapshot: MarketSnapshot;
  movers: ReadonlyArray<Mover>;
  sections: ReadonlyArray<ReportSection>;
  signals: ReportSignals;
}>;

const VALID_REGIMES: ReadonlySet<Regime> = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

const REPORT_INPUT_PATH = path.resolve(process.cwd(), 'data/report-inputs/local-report-input.json');
const OUTPUT_DIRECTORY = path.resolve(process.cwd(), 'data/reports');

const parseWeek = (value: unknown): LocalReportWeekInput => {
  const week = assertRecord(value, 'week');

  return {
    publishedAt: assertString(week.publishedAt, 'week.publishedAt'),
    label: assertString(week.label, 'week.label')
  };
};

const parseRegime = (value: unknown): Regime => {
  const regime = assertString(value, 'regime') as Regime;

  if (!VALID_REGIMES.has(regime)) {
    throw new Error(`Invalid input at "regime": unsupported value "${regime}".`);
  }

  return regime;
};

const parseSnapshot = (value: unknown): MarketSnapshot => {
  const snapshot = assertRecord(value, 'snapshot');

  return {
    totalMarketCapUsd: assertNumber(snapshot.totalMarketCapUsd, 'snapshot.totalMarketCapUsd'),
    btcDominancePct: assertNumber(snapshot.btcDominancePct, 'snapshot.btcDominancePct'),
    ethDominancePct: assertNumber(snapshot.ethDominancePct, 'snapshot.ethDominancePct'),
    fearGreedIndex: assertNumber(snapshot.fearGreedIndex, 'snapshot.fearGreedIndex')
  };
};

const parseMovers = (value: unknown): ReadonlyArray<Mover> =>
  assertArray(value, 'movers').map((entry, index) => {
    const mover = assertRecord(entry, `movers[${index}]`);

    return {
      symbol: assertString(mover.symbol, `movers[${index}].symbol`),
      name: assertString(mover.name, `movers[${index}].name`),
      changePct7d: assertNumber(mover.changePct7d, `movers[${index}].changePct7d`),
      catalyst: assertString(mover.catalyst, `movers[${index}].catalyst`)
    };
  });

const parseSections = (value: unknown): ReadonlyArray<ReportSection> =>
  assertArray(value, 'sections').map((entry, index) => {
    const section = assertRecord(entry, `sections[${index}]`);

    return {
      id: assertString(section.id, `sections[${index}].id`),
      heading: assertString(section.heading, `sections[${index}].heading`),
      body: assertString(section.body, `sections[${index}].body`),
      highlights: assertStringArray(section.highlights, `sections[${index}].highlights`)
    };
  });


const parseWatchlistLevels = (value: unknown): ReadonlyArray<WatchlistLevel> =>
  assertArray(value, 'signals.watchlistLevels').map((entry, index) => {
    const level = assertRecord(entry, `signals.watchlistLevels[${index}]`);

    return {
      asset: assertString(level.asset, `signals.watchlistLevels[${index}].asset`),
      level: assertString(level.level, `signals.watchlistLevels[${index}].level`),
      context: assertString(level.context, `signals.watchlistLevels[${index}].context`)
    };
  });

const parseSignals = (value: unknown): ReportSignals => {
  const signals = assertRecord(value, 'signals');
  const riskChecklist = assertStringArray(signals.riskChecklist, 'signals.riskChecklist');

  if (riskChecklist.length !== 5) {
    throw new Error('Invalid input at "signals.riskChecklist": expected exactly 5 items.');
  }

  return {
    thesis: assertStringArray(signals.thesis, 'signals.thesis'),
    riskChecklist,
    watchlistLevels: parseWatchlistLevels(signals.watchlistLevels),
    changedSinceLastWeek: assertStringArray(signals.changedSinceLastWeek, 'signals.changedSinceLastWeek')
  };
};

const parseInput = (rawInput: string): LocalReportInput => {
  const parsed = JSON.parse(rawInput) as unknown;
  const root = assertRecord(parsed, 'root');

  return {
    generatedAt: assertString(root.generatedAt, 'generatedAt'),
    week: parseWeek(root.week),
    headline: assertString(root.headline, 'headline'),
    summary: assertString(root.summary, 'summary'),
    tags: assertStringArray(root.tags, 'tags'),
    regime: parseRegime(root.regime),
    snapshot: parseSnapshot(root.snapshot),
    movers: parseMovers(root.movers),
    sections: parseSections(root.sections),
    signals: parseSignals(root.signals)
  };
};

const toSlug = (publishedAt: string, headline: string): string => {
  const normalizedHeadline = headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');

  return `${publishedAt}-${normalizedHeadline}`;
};

const buildArtifact = (input: LocalReportInput): ReportArtifact => {
  const slug = toSlug(input.week.publishedAt, input.headline);

  return {
    schemaVersion: CURRENT_REPORT_SCHEMA_VERSION,
    generatedAt: input.generatedAt,
    report: {
      metadata: {
        title: `Weekly Crypto Pulse: ${input.headline}`,
        slug,
        publishedAt: input.week.publishedAt,
        weekLabel: input.week.label,
        summary: input.summary,
        tags: input.tags
      },
      regime: input.regime,
      marketSnapshot: input.snapshot,
      movers: input.movers,
      sections: input.sections,
      signals: input.signals
    }
  };
};

const main = async (): Promise<void> => {
  const rawInput = await readFile(REPORT_INPUT_PATH, 'utf-8');
  const input = parseInput(rawInput);
  const artifact = buildArtifact(input);
  const outputPath = path.join(OUTPUT_DIRECTORY, `${artifact.report.metadata.slug}.json`);

  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf-8');

  console.log(`Generated report: ${path.relative(process.cwd(), outputPath)}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown generation error.';
  console.error(`Failed to generate report: ${message}`);
  process.exitCode = 1;
});
