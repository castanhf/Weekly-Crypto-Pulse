import { describe, expect, it } from 'vitest';

import { validateArtifact, validateDailyV1_0, validateWeeklyV1_1 } from '@/lib/reports/artifact-validator';

// ─── Shared fixtures ────────────────────────────────────────────────────────

const BASE_WEEKLY_REPORT = {
  metadata: {
    title: 'Weekly Crypto Pulse: Test',
    slug: '2026-05-05-test',
    publishedAt: '2026-05-05',
    weekLabel: 'Week of May 5, 2026',
    summary: 'Test summary.',
    tags: ['crypto', 'weekly']
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

const BASE_WEEKLY_V1_1_ARTIFACT = {
  schemaVersion: 'weekly@1.1',
  generatedAt: '2026-05-05T06:00:00.000Z',
  report: BASE_WEEKLY_REPORT
};

const MOVER = { symbol: 'BTC', name: 'Bitcoin', changePct24h: 3.2, catalyst: 'Spot ETF demand.' };
const TRACKED = { symbol: 'BTC', name: 'Bitcoin', priceUsd: 95000, changePct24h: 3.2, marketCapUsd: 1_800_000_000_000, isStablecoin: false };
const STABLE_TRACKED = { symbol: 'USDT', name: 'Tether', priceUsd: 1.0, changePct24h: 0.01, marketCapUsd: 120_000_000_000, isStablecoin: true };

const BASE_DAILY_ARTIFACT = {
  schemaVersion: 'daily@1.0',
  generatedAt: '2026-05-05T12:00:00.000Z',
  publishedAt: '2026-05-05',
  slug: '2026-05-05-daily',
  headline: 'Bitcoin pushes toward $95k as ETF demand returns.',
  summary: 'Markets rallied on Monday with BTC leading the charge. ETF inflows were the primary catalyst.',
  whatMoved: {
    winners: [MOVER],
    losers: [{ symbol: 'DOGE', name: 'Dogecoin', changePct24h: -4.1, catalyst: 'Profit-taking after weekend run.' }],
    topTracked: [TRACKED, STABLE_TRACKED]
  },
  whyItMoved: 'Spot Bitcoin ETFs recorded their strongest single-day inflow since March, pulling price above the $93k level that had capped the prior week.',
  worthKnowing: ['Fed minutes release Thursday.', 'SOL staking yield hit 6.5% annualised.'],
  snapshot: {
    totalMarketCapUsd: 2_100_000_000_000,
    btcDominancePct: 58.1,
    ethDominancePct: 10.0,
    fearGreedIndex: 74
  },
  tags: ['crypto', 'daily']
};

// ─── validateWeeklyV1_1 ──────────────────────────────────────────────────────

describe('validateWeeklyV1_1', () => {
  it('validates a v1.1 artifact without plainspokenOpening', () => {
    expect(() => validateWeeklyV1_1(BASE_WEEKLY_V1_1_ARTIFACT, 'test.json')).not.toThrow();
  });

  it('validates a v1.1 artifact with a valid plainspokenOpening', () => {
    const artifact = {
      ...BASE_WEEKLY_V1_1_ARTIFACT,
      report: {
        ...BASE_WEEKLY_REPORT,
        plainspokenOpening: { headline: 'Markets calm.', body: 'A quiet week overall.' }
      }
    };

    expect(() => validateWeeklyV1_1(artifact, 'test.json')).not.toThrow();
  });

  it('rejects a plainspokenOpening with an empty headline', () => {
    const artifact = {
      ...BASE_WEEKLY_V1_1_ARTIFACT,
      report: {
        ...BASE_WEEKLY_REPORT,
        plainspokenOpening: { headline: '', body: 'Body text.' }
      }
    };

    expect(() => validateWeeklyV1_1(artifact, 'test.json')).toThrow();
  });

  it('rejects an artifact missing the regime field', () => {
    const { regime: _regime, ...reportWithoutRegime } = BASE_WEEKLY_REPORT;
    const artifact = { ...BASE_WEEKLY_V1_1_ARTIFACT, report: reportWithoutRegime };

    expect(() => validateWeeklyV1_1(artifact, 'test.json')).toThrow();
  });

  it('rejects a riskChecklist that does not have exactly 5 items', () => {
    const artifact = {
      ...BASE_WEEKLY_V1_1_ARTIFACT,
      report: {
        ...BASE_WEEKLY_REPORT,
        signals: { ...BASE_WEEKLY_REPORT.signals, riskChecklist: ['Only 1'] }
      }
    };

    expect(() => validateWeeklyV1_1(artifact, 'test.json')).toThrow('expected exactly 5 items');
  });
});

// ─── validateDailyV1_0 ──────────────────────────────────────────────────────

describe('validateDailyV1_0', () => {
  it('validates a valid daily@1.0 artifact', () => {
    expect(() => validateDailyV1_0(BASE_DAILY_ARTIFACT, 'test-daily.json')).not.toThrow();
  });

  it('validates a daily artifact with an empty worthKnowing array', () => {
    const artifact = { ...BASE_DAILY_ARTIFACT, worthKnowing: [] };

    expect(() => validateDailyV1_0(artifact, 'test-daily.json')).not.toThrow();
  });

  it('rejects worthKnowing with more than 4 items', () => {
    const artifact = {
      ...BASE_DAILY_ARTIFACT,
      worthKnowing: ['One', 'Two', 'Three', 'Four', 'Five']
    };

    expect(() => validateDailyV1_0(artifact, 'test-daily.json')).toThrow('expected at most 4 items');
  });

  it('rejects a non-numeric snapshot field', () => {
    const artifact = {
      ...BASE_DAILY_ARTIFACT,
      snapshot: { ...BASE_DAILY_ARTIFACT.snapshot, fearGreedIndex: '74' }
    };

    expect(() => validateDailyV1_0(artifact, 'test-daily.json')).toThrow('snapshot.fearGreedIndex');
  });

  it('rejects a topTracked entry with a non-boolean isStablecoin', () => {
    const artifact = {
      ...BASE_DAILY_ARTIFACT,
      whatMoved: {
        ...BASE_DAILY_ARTIFACT.whatMoved,
        topTracked: [{ ...TRACKED, isStablecoin: 'false' }]
      }
    };

    expect(() => validateDailyV1_0(artifact, 'test-daily.json')).toThrow('isStablecoin');
  });

  it('rejects an artifact missing the headline field', () => {
    const { headline: _headline, ...artifactWithoutHeadline } = BASE_DAILY_ARTIFACT;

    expect(() => validateDailyV1_0(artifactWithoutHeadline, 'test-daily.json')).toThrow();
  });
});

// ─── validateArtifact (dispatch) ────────────────────────────────────────────

describe('validateArtifact', () => {
  it('dispatches legacy "1.0" schemaVersion to the weekly@1.0 validator', () => {
    const artifact = JSON.stringify({ schemaVersion: '1.0', report: BASE_WEEKLY_REPORT });

    expect(() => validateArtifact(artifact, 'legacy.json')).not.toThrow();
  });

  it('dispatches weekly@1.0 to the weekly validator', () => {
    const artifact = JSON.stringify({ schemaVersion: 'weekly@1.0', report: BASE_WEEKLY_REPORT });

    expect(() => validateArtifact(artifact, 'w1-0.json')).not.toThrow();
  });

  it('dispatches weekly@1.1 to the weekly v1.1 validator', () => {
    const artifact = JSON.stringify(BASE_WEEKLY_V1_1_ARTIFACT);

    expect(() => validateArtifact(artifact, 'w1-1.json')).not.toThrow();
  });

  it('dispatches daily@1.0 to the daily validator', () => {
    const artifact = JSON.stringify(BASE_DAILY_ARTIFACT);

    expect(() => validateArtifact(artifact, 'daily.json')).not.toThrow();
  });

  it('rejects an unknown schemaVersion', () => {
    const artifact = JSON.stringify({ schemaVersion: 'weekly@9.9', report: BASE_WEEKLY_REPORT });

    expect(() => validateArtifact(artifact, 'unknown.json')).toThrow('unknown schemaVersion');
  });
});
