/**
 * Schema bump coverage test.
 *
 * For every schema version listed in VALID_DAILY_SCHEMA_VERSIONS and
 * VALID_WEEKLY_SCHEMA_VERSIONS, verifies that:
 *   1. validateArtifact accepts a minimal valid artifact for that version.
 *   2. The relevant repository parser also accepts it.
 *
 * If a new schema version is added to VALID_*_SCHEMA_VERSIONS but the
 * validator or repository is not updated, these tests fail immediately —
 * before any real artifact is written to data/.
 */
import { describe, expect, it } from 'vitest';

import { VALID_DAILY_SCHEMA_VERSIONS, VALID_WEEKLY_SCHEMA_VERSIONS } from '../../domain/schema-version';
import { validateArtifact } from './artifact-validator';
import { parseDailyArtifactJson } from './daily-repository';
import { parseReportArtifactJson } from './report-parser';

// ---------------------------------------------------------------------------
// Minimal fixture factories
// ---------------------------------------------------------------------------

const BASE_WEEKLY_REPORT = {
  metadata: {
    title: 'Weekly Crypto Pulse: Test',
    slug: '2026-05-05-test',
    publishedAt: '2026-05-05',
    weekLabel: 'Week of May 5, 2026',
    summary: 'Test summary.',
    tags: ['bitcoin']
  },
  regime: 'risk-on',
  marketSnapshot: {
    totalMarketCapUsd: 2_000_000_000_000,
    btcDominancePct: 57.5,
    ethDominancePct: 10.2,
    fearGreedIndex: 72
  },
  movers: [{ symbol: 'BTC', name: 'Bitcoin', changePct7d: 5.5, catalyst: 'ETF inflows.' }],
  sections: [{ id: 'macro', heading: 'Macro', body: 'Body text.', highlights: ['Point one.'] }],
  signals: {
    thesis: ['Thesis one.'],
    riskChecklist: ['Risk 1', 'Risk 2', 'Risk 3', 'Risk 4', 'Risk 5'],
    watchlistLevels: [{ asset: 'BTC', level: '$95,000', context: 'Key resistance.' }],
    changedSinceLastWeek: ['Change one.']
  }
};

const buildWeeklyArtifact = (schemaVersion: string): object => ({
  schemaVersion,
  generatedAt: '2026-05-05T06:00:00.000Z',
  report: BASE_WEEKLY_REPORT
});

const BASE_MOVER = { symbol: 'BTC', name: 'Bitcoin', changePct24h: 3.2, catalyst: 'ETF demand.', priceUsd: 95000, priceChange24hUsd: 3040 };
const BASE_LOSER = { symbol: 'ETH', name: 'Ethereum', changePct24h: -2.1, catalyst: 'Profit-taking.', priceUsd: 2000, priceChange24hUsd: -42 };
const BASE_TRACKED = { symbol: 'BTC', name: 'Bitcoin', priceUsd: 95000, changePct24h: 3.2, marketCapUsd: 1_800_000_000_000, isStablecoin: false };

const buildDailyArtifact = (schemaVersion: string): object => {
  const isV1_2 = schemaVersion === 'daily@1.2';
  return {
    schemaVersion,
    generatedAt: '2026-05-05T12:00:00.000Z',
    publishedAt: '2026-05-05',
    slug: '2026-05-05-test',
    headline: 'Test headline.',
    summary: 'Test summary.',
    whatMoved: {
      winners: isV1_2 ? [BASE_MOVER] : [{ symbol: 'BTC', name: 'Bitcoin', changePct24h: 3.2, catalyst: 'ETF demand.' }],
      losers: isV1_2 ? [BASE_LOSER] : [{ symbol: 'ETH', name: 'Ethereum', changePct24h: -2.1, catalyst: 'Profit-taking.' }],
      topTracked: [BASE_TRACKED],
      ...(isV1_2 ? { sectionLabels: { winners: 'Winners', losers: 'Losers' } } : {})
    },
    whyItMoved: 'BTC led gains on ETF demand.',
    worthKnowing: ['Worth knowing item.'],
    snapshot: {
      totalMarketCapUsd: 2_100_000_000_000,
      btcDominancePct: 58.1,
      ethDominancePct: 10.0,
      fearGreedIndex: 74
    },
    tags: ['bitcoin']
  };
};

// ---------------------------------------------------------------------------
// Daily schema versions
// ---------------------------------------------------------------------------

describe('daily schema bump coverage', () => {
  for (const version of VALID_DAILY_SCHEMA_VERSIONS) {
    it(`validateArtifact accepts daily@${version} minimal artifact`, () => {
      const artifact = buildDailyArtifact(version);
      expect(() => validateArtifact(JSON.stringify(artifact), 'test.json')).not.toThrow();
    });

    it(`daily-repository parses ${version} minimal artifact`, () => {
      const artifact = buildDailyArtifact(version);
      const result = parseDailyArtifactJson(JSON.stringify(artifact), 'test.json');
      expect(result.daily.schemaVersion).toBe(version);
    });
  }
});

// ---------------------------------------------------------------------------
// Weekly schema versions
// ---------------------------------------------------------------------------

describe('weekly schema bump coverage', () => {
  for (const version of VALID_WEEKLY_SCHEMA_VERSIONS) {
    it(`validateArtifact accepts ${version} minimal artifact`, () => {
      const artifact = buildWeeklyArtifact(version);
      expect(() => validateArtifact(JSON.stringify(artifact), 'test.json')).not.toThrow();
    });

    it(`report-parser accepts ${version} minimal artifact`, () => {
      const artifact = buildWeeklyArtifact(version);
      const result = parseReportArtifactJson(JSON.stringify(artifact), 'test.json');
      expect(result.artifact.schemaVersion).toBe(version);
    });
  }
});
