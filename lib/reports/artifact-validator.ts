import { DAILY_SCHEMA_V1_0, DAILY_SCHEMA_V1_1, WEEKLY_SCHEMA_V1_0, WEEKLY_SCHEMA_V1_1, WEEKLY_SCHEMA_V1_2, isValidSchemaVersion } from '../../domain/schema-version';
import { assertArray, assertNumber, assertRecord, assertString, assertStringArray } from './json-assertions';
import type { JsonRecord } from './json-assertions';

const VALID_REGIMES = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

const validateRegime = (value: unknown): void => {
  const regime = assertString(value, 'report.regime');

  if (!VALID_REGIMES.has(regime)) {
    throw new Error(`Invalid report data at "report.regime": unsupported regime "${regime}".`);
  }
};

const validateMarketSnapshot = (snapshot: JsonRecord, prefix: string): void => {
  assertNumber(snapshot.totalMarketCapUsd, `${prefix}.totalMarketCapUsd`);
  assertNumber(snapshot.btcDominancePct, `${prefix}.btcDominancePct`);
  assertNumber(snapshot.ethDominancePct, `${prefix}.ethDominancePct`);
  assertNumber(snapshot.fearGreedIndex, `${prefix}.fearGreedIndex`);
};

const validateWeeklyReport = (value: unknown): void => {
  const report = assertRecord(value, 'report');
  const metadata = assertRecord(report.metadata, 'report.metadata');
  const marketSnapshot = assertRecord(report.marketSnapshot, 'report.marketSnapshot');

  assertString(metadata.title, 'report.metadata.title');
  assertString(metadata.slug, 'report.metadata.slug');
  assertString(metadata.publishedAt, 'report.metadata.publishedAt');
  assertString(metadata.weekLabel, 'report.metadata.weekLabel');
  assertString(metadata.summary, 'report.metadata.summary');
  assertStringArray(metadata.tags, 'report.metadata.tags');

  validateRegime(report.regime);
  validateMarketSnapshot(marketSnapshot, 'report.marketSnapshot');

  assertArray(report.movers, 'report.movers');
  assertArray(report.sections, 'report.sections');

  const signals = assertRecord(report.signals, 'report.signals');
  assertStringArray(signals.thesis, 'report.signals.thesis');
  const riskChecklist = assertStringArray(signals.riskChecklist, 'report.signals.riskChecklist');

  if (riskChecklist.length !== 5) {
    throw new Error('Invalid report data at "report.signals.riskChecklist": expected exactly 5 items.');
  }

  const watchlistLevels = assertArray(signals.watchlistLevels, 'report.signals.watchlistLevels');
  assertStringArray(signals.changedSinceLastWeek, 'report.signals.changedSinceLastWeek');

  watchlistLevels.forEach((entry, index) => {
    const level = assertRecord(entry, `report.signals.watchlistLevels[${index}]`);

    assertString(level.asset, `report.signals.watchlistLevels[${index}].asset`);
    assertString(level.level, `report.signals.watchlistLevels[${index}].level`);
    assertString(level.context, `report.signals.watchlistLevels[${index}].context`);
  });
};

export const validateWeeklyV1_0 = (artifact: JsonRecord, fileName: string): void => {
  try {
    validateWeeklyReport(artifact.report);
  } catch (error) {
    throw new Error(`${fileName} (weekly@1.0): ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateWeeklyV1_1 = (artifact: JsonRecord, fileName: string): void => {
  try {
    validateWeeklyReport(artifact.report);

    const report = artifact.report as JsonRecord;

    if (report.plainspokenOpening !== undefined) {
      const opening = assertRecord(report.plainspokenOpening, 'report.plainspokenOpening');

      assertString(opening.headline, 'report.plainspokenOpening.headline');
      assertString(opening.body, 'report.plainspokenOpening.body');
    }
  } catch (error) {
    throw new Error(`${fileName} (weekly@1.1): ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateWeeklyV1_2 = (artifact: JsonRecord, fileName: string): void => {
  try {
    validateWeeklyReport(artifact.report);

    const report = artifact.report as JsonRecord;

    if (report.plainspokenOpening !== undefined) {
      const opening = assertRecord(report.plainspokenOpening, 'report.plainspokenOpening');
      assertString(opening.headline, 'report.plainspokenOpening.headline');
      assertString(opening.body, 'report.plainspokenOpening.body');
    }

    if (report.capitalFlows !== undefined) {
      const capitalFlows = assertRecord(report.capitalFlows, 'report.capitalFlows');
      assertArray(capitalFlows.topChainsTvl, 'report.capitalFlows.topChainsTvl');
      assertArray(capitalFlows.notableMovements, 'report.capitalFlows.notableMovements');
    }
  } catch (error) {
    throw new Error(`${fileName} (weekly@1.2): ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateDailyV1_0 = (artifact: JsonRecord, fileName: string): void => {
  try {
    assertString(artifact.generatedAt, 'generatedAt');
    assertString(artifact.publishedAt, 'publishedAt');
    assertString(artifact.slug, 'slug');
    assertString(artifact.headline, 'headline');
    assertString(artifact.summary, 'summary');
    assertString(artifact.whyItMoved, 'whyItMoved');
    assertStringArray(artifact.tags, 'tags');

    const worthKnowing = assertArray(artifact.worthKnowing, 'worthKnowing');

    if (worthKnowing.length > 4) {
      throw new Error(`Invalid report data at "worthKnowing": expected at most 4 items, got ${worthKnowing.length}.`);
    }

    worthKnowing.forEach((entry, index) => assertString(entry, `worthKnowing[${index}]`));

    const snapshot = assertRecord(artifact.snapshot, 'snapshot');

    validateMarketSnapshot(snapshot, 'snapshot');

    const whatMoved = assertRecord(artifact.whatMoved, 'whatMoved');
    const winners = assertArray(whatMoved.winners, 'whatMoved.winners');
    const losers = assertArray(whatMoved.losers, 'whatMoved.losers');
    const topTracked = assertArray(whatMoved.topTracked, 'whatMoved.topTracked');

    winners.forEach((entry, index) => {
      const mover = assertRecord(entry, `whatMoved.winners[${index}]`);

      assertString(mover.symbol, `whatMoved.winners[${index}].symbol`);
      assertString(mover.name, `whatMoved.winners[${index}].name`);
      assertNumber(mover.changePct24h, `whatMoved.winners[${index}].changePct24h`);
      assertString(mover.catalyst, `whatMoved.winners[${index}].catalyst`);
    });

    losers.forEach((entry, index) => {
      const mover = assertRecord(entry, `whatMoved.losers[${index}]`);

      assertString(mover.symbol, `whatMoved.losers[${index}].symbol`);
      assertString(mover.name, `whatMoved.losers[${index}].name`);
      assertNumber(mover.changePct24h, `whatMoved.losers[${index}].changePct24h`);
      assertString(mover.catalyst, `whatMoved.losers[${index}].catalyst`);
    });

    topTracked.forEach((entry, index) => {
      const asset = assertRecord(entry, `whatMoved.topTracked[${index}]`);

      assertString(asset.symbol, `whatMoved.topTracked[${index}].symbol`);
      assertString(asset.name, `whatMoved.topTracked[${index}].name`);
      assertNumber(asset.priceUsd, `whatMoved.topTracked[${index}].priceUsd`);
      assertNumber(asset.changePct24h, `whatMoved.topTracked[${index}].changePct24h`);
      assertNumber(asset.marketCapUsd, `whatMoved.topTracked[${index}].marketCapUsd`);

      if (typeof asset.isStablecoin !== 'boolean') {
        throw new Error(`Invalid report data at "whatMoved.topTracked[${index}].isStablecoin": expected boolean.`);
      }
    });
  } catch (error) {
    throw new Error(`${fileName} (daily@1.0): ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const validateDailyV1_1 = (artifact: JsonRecord, fileName: string): void => {
  try {
    // All v1.0 validations still apply
    assertString(artifact.generatedAt, 'generatedAt');
    assertString(artifact.publishedAt, 'publishedAt');
    assertString(artifact.slug, 'slug');
    assertString(artifact.headline, 'headline');
    assertString(artifact.summary, 'summary');
    assertString(artifact.whyItMoved, 'whyItMoved');
    assertStringArray(artifact.tags, 'tags');

    const worthKnowing = assertArray(artifact.worthKnowing, 'worthKnowing');

    if (worthKnowing.length > 4) {
      throw new Error(`Invalid report data at "worthKnowing": expected at most 4 items, got ${worthKnowing.length}.`);
    }

    worthKnowing.forEach((entry, index) => assertString(entry, `worthKnowing[${index}]`));

    const snapshot = assertRecord(artifact.snapshot, 'snapshot');

    validateMarketSnapshot(snapshot, 'snapshot');

    const whatMoved = assertRecord(artifact.whatMoved, 'whatMoved');
    const winners = assertArray(whatMoved.winners, 'whatMoved.winners');
    const losers = assertArray(whatMoved.losers, 'whatMoved.losers');
    const topTracked = assertArray(whatMoved.topTracked, 'whatMoved.topTracked');

    winners.forEach((entry, index) => {
      const mover = assertRecord(entry, `whatMoved.winners[${index}]`);

      assertString(mover.symbol, `whatMoved.winners[${index}].symbol`);
      assertString(mover.name, `whatMoved.winners[${index}].name`);
      assertNumber(mover.changePct24h, `whatMoved.winners[${index}].changePct24h`);
      assertString(mover.catalyst, `whatMoved.winners[${index}].catalyst`);
    });

    losers.forEach((entry, index) => {
      const mover = assertRecord(entry, `whatMoved.losers[${index}]`);

      assertString(mover.symbol, `whatMoved.losers[${index}].symbol`);
      assertString(mover.name, `whatMoved.losers[${index}].name`);
      assertNumber(mover.changePct24h, `whatMoved.losers[${index}].changePct24h`);
      assertString(mover.catalyst, `whatMoved.losers[${index}].catalyst`);
    });

    topTracked.forEach((entry, index) => {
      const asset = assertRecord(entry, `whatMoved.topTracked[${index}]`);

      assertString(asset.symbol, `whatMoved.topTracked[${index}].symbol`);
      assertString(asset.name, `whatMoved.topTracked[${index}].name`);
      assertNumber(asset.priceUsd, `whatMoved.topTracked[${index}].priceUsd`);
      assertNumber(asset.changePct24h, `whatMoved.topTracked[${index}].changePct24h`);
      assertNumber(asset.marketCapUsd, `whatMoved.topTracked[${index}].marketCapUsd`);

      if (typeof asset.isStablecoin !== 'boolean') {
        throw new Error(`Invalid report data at "whatMoved.topTracked[${index}].isStablecoin": expected boolean.`);
      }
    });

    // v1.1 additive: optional weeklyFooter
    if (artifact.weeklyFooter !== undefined) {
      const footer = assertRecord(artifact.weeklyFooter, 'weeklyFooter');
      const footerText = assertString(footer.text, 'weeklyFooter.text');
      const weeklySlug = assertString(footer.weeklySlug, 'weeklyFooter.weeklySlug');

      if (!footerText) {
        throw new Error('Invalid report data at "weeklyFooter.text": expected non-empty string.');
      }

      if (!/^\d{4}-\d{2}-\d{2}-.+/.test(weeklySlug)) {
        throw new Error(`Invalid report data at "weeklyFooter.weeklySlug": expected YYYY-MM-DD-{slug} format, got "${weeklySlug}".`);
      }
    }
  } catch (error) {
    throw new Error(`${fileName} (daily@1.1): ${error instanceof Error ? error.message : String(error)}`);
  }
};

/** Detects the schema version and dispatches to the appropriate validator.
 *  Treats absent schemaVersion or the legacy "1.0" string as weekly@1.0. */
export const validateArtifact = (rawArtifact: string, fileName: string): void => {
  const artifact = assertRecord(JSON.parse(rawArtifact) as unknown, fileName);
  const raw = artifact.schemaVersion;

  if (raw === undefined || raw === '1.0' || raw === WEEKLY_SCHEMA_V1_0) {
    validateWeeklyV1_0(artifact, fileName);
    return;
  }

  if (!isValidSchemaVersion(raw)) {
    throw new Error(`${fileName}: unknown schemaVersion "${String(raw)}".`);
  }

  if (raw === WEEKLY_SCHEMA_V1_1) {
    validateWeeklyV1_1(artifact, fileName);
    return;
  }

  if (raw === WEEKLY_SCHEMA_V1_2) {
    validateWeeklyV1_2(artifact, fileName);
    return;
  }

  if (raw === DAILY_SCHEMA_V1_0) {
    validateDailyV1_0(artifact, fileName);
    return;
  }

  if (raw === DAILY_SCHEMA_V1_1) {
    validateDailyV1_1(artifact, fileName);
  }
};
