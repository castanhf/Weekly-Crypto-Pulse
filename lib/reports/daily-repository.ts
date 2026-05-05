import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { DailyArtifact, MoverEntry, TrackedAssetEntry } from '@/domain/daily';
import { DAILY_SCHEMA_V1_0 } from '@/domain/schema-version';
import type { SchemaVersion } from '@/domain/schema-version';
import { assertArray, assertNumber, assertRecord, assertString, assertStringArray } from '@/lib/reports/json-assertions';

export const DAILIES_DIRECTORY_PATH = join(process.cwd(), 'data', 'dailies');

export type DailyArtifactRecord = Readonly<{
  daily: DailyArtifact;
  artifact: Readonly<{
    fileName: string;
    schemaVersion: SchemaVersion;
    generatedAt: string;
  }>;
}>;

const isJsonFile = (fileName: string): boolean => fileName.endsWith('.json');
const FILE_NAME_PATTERN = /\.json$/;

const parseMoverEntry = (entry: unknown, prefix: string): MoverEntry => {
  const mover = assertRecord(entry, prefix);

  return {
    symbol: assertString(mover.symbol, `${prefix}.symbol`),
    name: assertString(mover.name, `${prefix}.name`),
    changePct24h: assertNumber(mover.changePct24h, `${prefix}.changePct24h`),
    catalyst: assertString(mover.catalyst, `${prefix}.catalyst`)
  };
};

const parseTrackedAssetEntry = (entry: unknown, prefix: string): TrackedAssetEntry => {
  const asset = assertRecord(entry, prefix);

  if (typeof asset.isStablecoin !== 'boolean') {
    throw new Error(`Invalid report data at "${prefix}.isStablecoin": expected boolean.`);
  }

  return {
    symbol: assertString(asset.symbol, `${prefix}.symbol`),
    name: assertString(asset.name, `${prefix}.name`),
    priceUsd: assertNumber(asset.priceUsd, `${prefix}.priceUsd`),
    changePct24h: assertNumber(asset.changePct24h, `${prefix}.changePct24h`),
    marketCapUsd: assertNumber(asset.marketCapUsd, `${prefix}.marketCapUsd`),
    isStablecoin: asset.isStablecoin
  };
};

const parseDailyArtifactJson = (rawJson: string, fileName: string): DailyArtifactRecord => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in daily file "${fileName}".`);
  }

  const root = assertRecord(parsed, fileName);
  const schemaVersion = assertString(root.schemaVersion, 'schemaVersion');

  if (schemaVersion !== DAILY_SCHEMA_V1_0) {
    throw new Error(`${fileName}: unsupported daily schemaVersion "${schemaVersion}".`);
  }

  const generatedAt = assertString(root.generatedAt, 'generatedAt');
  const publishedAt = assertString(root.publishedAt, 'publishedAt');
  const slug = assertString(root.slug, 'slug');
  const headline = assertString(root.headline, 'headline');
  const summary = assertString(root.summary, 'summary');
  const whyItMoved = assertString(root.whyItMoved, 'whyItMoved');
  const tags = assertStringArray(root.tags, 'tags');

  const worthKnowing = assertArray(root.worthKnowing, 'worthKnowing');

  if (worthKnowing.length > 4) {
    throw new Error(`Invalid report data at "worthKnowing": expected at most 4 items, got ${worthKnowing.length}.`);
  }

  worthKnowing.forEach((entry, index) => assertString(entry, `worthKnowing[${index}]`));

  const snapshotRecord = assertRecord(root.snapshot, 'snapshot');
  const whatMovedRecord = assertRecord(root.whatMoved, 'whatMoved');
  const winners = assertArray(whatMovedRecord.winners, 'whatMoved.winners').map((e, i) => parseMoverEntry(e, `whatMoved.winners[${i}]`));
  const losers = assertArray(whatMovedRecord.losers, 'whatMoved.losers').map((e, i) => parseMoverEntry(e, `whatMoved.losers[${i}]`));
  const topTracked = assertArray(whatMovedRecord.topTracked, 'whatMoved.topTracked').map((e, i) => parseTrackedAssetEntry(e, `whatMoved.topTracked[${i}]`));

  const daily: DailyArtifact = {
    schemaVersion: DAILY_SCHEMA_V1_0,
    generatedAt,
    publishedAt,
    slug,
    headline,
    summary,
    whatMoved: { winners, losers, topTracked },
    whyItMoved,
    worthKnowing: worthKnowing as ReadonlyArray<string>,
    snapshot: {
      totalMarketCapUsd: assertNumber(snapshotRecord.totalMarketCapUsd, 'snapshot.totalMarketCapUsd'),
      btcDominancePct: assertNumber(snapshotRecord.btcDominancePct, 'snapshot.btcDominancePct'),
      ethDominancePct: assertNumber(snapshotRecord.ethDominancePct, 'snapshot.ethDominancePct'),
      fearGreedIndex: assertNumber(snapshotRecord.fearGreedIndex, 'snapshot.fearGreedIndex')
    },
    tags
  };

  return {
    daily,
    artifact: {
      fileName,
      schemaVersion: DAILY_SCHEMA_V1_0,
      generatedAt
    }
  };
};

const readDailyArtifactFromFile = (fileName: string): DailyArtifactRecord => {
  const filePath = join(DAILIES_DIRECTORY_PATH, fileName);
  const fileContent = readFileSync(filePath, 'utf-8');

  return parseDailyArtifactJson(fileContent, fileName);
};

const byPublishedAtDesc = (left: DailyArtifactRecord, right: DailyArtifactRecord): number => {
  const order = right.daily.publishedAt.localeCompare(left.daily.publishedAt);

  if (order !== 0) return order;

  return right.daily.slug.localeCompare(left.daily.slug);
};

const assertSlug = (slug: string): string => {
  const normalized = slug.trim();

  if (normalized.length === 0) {
    throw new Error('Invalid slug: expected non-empty string.');
  }

  return normalized;
};

export const loadAllDailies = (): ReadonlyArray<DailyArtifactRecord> => {
  if (!existsSync(DAILIES_DIRECTORY_PATH)) return [];

  const fileNames = readdirSync(DAILIES_DIRECTORY_PATH)
    .filter(isJsonFile)
    .sort((left, right) => left.localeCompare(right));

  return fileNames.map(readDailyArtifactFromFile).sort(byPublishedAtDesc);
};

export const loadDailyBySlug = (slug: string): DailyArtifactRecord | undefined => {
  const normalizedSlug = assertSlug(slug);

  return loadAllDailies().find((record) => record.daily.slug === normalizedSlug);
};

export const getAllDailySlugs = (): ReadonlyArray<string> =>
  loadAllDailies().map((record) => record.daily.slug);
