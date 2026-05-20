// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn()
}));

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { getAllDailySlugs, loadAllDailies, loadDailyBySlug } from '@/lib/reports/daily-repository';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SNAPSHOT = {
  totalMarketCapUsd: 2_100_000_000_000,
  btcDominancePct: 58.1,
  ethDominancePct: 10.0,
  fearGreedIndex: 74
};

const MOVER = { symbol: 'BTC', name: 'Bitcoin', changePct24h: 3.2, catalyst: 'ETF inflows.' };
const TRACKED = { symbol: 'BTC', name: 'Bitcoin', priceUsd: 95000, changePct24h: 3.2, marketCapUsd: 1_800_000_000_000, isStablecoin: false };

const makeDailyJson = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    schemaVersion: 'daily@1.0',
    generatedAt: '2026-05-05T12:00:00.000Z',
    publishedAt: '2026-05-05',
    slug: '2026-05-05-daily',
    headline: 'Bitcoin rallies to $95k.',
    summary: 'Markets moved higher on ETF demand.',
    whyItMoved: 'Spot ETF inflows drove the move.',
    worthKnowing: ['Fed minutes Thursday.'],
    tags: ['crypto', 'daily'],
    snapshot: SNAPSHOT,
    whatMoved: {
      winners: [MOVER],
      losers: [{ symbol: 'DOGE', name: 'Dogecoin', changePct24h: -4.1, catalyst: 'Profit-taking.' }],
      topTracked: [TRACKED]
    },
    ...overrides
  });

const DAILY_A_JSON = makeDailyJson({ publishedAt: '2026-05-07', slug: '2026-05-07-daily', generatedAt: '2026-05-07T12:00:00.000Z' });
const DAILY_B_JSON = makeDailyJson({ publishedAt: '2026-05-05', slug: '2026-05-05-daily', generatedAt: '2026-05-05T12:00:00.000Z' });

// ─── loadAllDailies ──────────────────────────────────────────────────────────

describe('loadAllDailies', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty array when directory does not exist', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(loadAllDailies()).toEqual([]);
  });

  it('returns empty array when directory contains no JSON files', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['.gitkeep'] as never);

    expect(loadAllDailies()).toEqual([]);
  });

  it('parses and returns a valid daily artifact', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['2026-05-05-daily.json'] as never);
    vi.mocked(readFileSync).mockReturnValue(makeDailyJson() as never);

    const result = loadAllDailies();

    expect(result).toHaveLength(1);
    expect(result[0]?.daily.slug).toBe('2026-05-05-daily');
    expect(result[0]?.daily.publishedAt).toBe('2026-05-05');
    expect(result[0]?.artifact.schemaVersion).toBe('daily@1.0');
    expect(result[0]?.artifact.fileName).toBe('2026-05-05-daily.json');
  });

  it('sorts dailies by publishedAt descending', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['2026-05-05-daily.json', '2026-05-07-daily.json'] as never);
    vi.mocked(readFileSync)
      .mockReturnValueOnce(DAILY_B_JSON as never)
      .mockReturnValueOnce(DAILY_A_JSON as never);

    const result = loadAllDailies();

    expect(result).toHaveLength(2);
    expect(result[0]?.daily.publishedAt).toBe('2026-05-07');
    expect(result[1]?.daily.publishedAt).toBe('2026-05-05');
  });

  it('throws on malformed JSON', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['bad.json'] as never);
    vi.mocked(readFileSync).mockReturnValue('not json' as never);

    expect(() => loadAllDailies()).toThrow('Invalid JSON in daily file "bad.json"');
  });

  it('throws when artifact fails validation', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['invalid.json'] as never);
    vi.mocked(readFileSync).mockReturnValue(makeDailyJson({ headline: '' }) as never);

    expect(() => loadAllDailies()).toThrow();
  });
});

// ─── loadDailyBySlug ─────────────────────────────────────────────────────────

describe('loadDailyBySlug', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['2026-05-05-daily.json'] as never);
    vi.mocked(readFileSync).mockReturnValue(makeDailyJson() as never);
  });

  it('returns the matching daily for an existing slug', () => {
    const result = loadDailyBySlug('2026-05-05-daily');

    expect(result?.daily.slug).toBe('2026-05-05-daily');
  });

  it('returns undefined for an unknown slug', () => {
    expect(loadDailyBySlug('unknown-slug')).toBeUndefined();
  });

  it('rejects empty slugs', () => {
    expect(() => loadDailyBySlug('   ')).toThrow('Invalid slug: expected non-empty string.');
  });
});

// ─── getAllDailySlugs ────────────────────────────────────────────────────────

describe('getAllDailySlugs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns all daily slugs', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['2026-05-05-daily.json', '2026-05-07-daily.json'] as never);
    vi.mocked(readFileSync)
      .mockReturnValueOnce(DAILY_B_JSON as never)
      .mockReturnValueOnce(DAILY_A_JSON as never);

    const slugs = getAllDailySlugs();

    expect(slugs).toHaveLength(2);
    expect(slugs).toContain('2026-05-05-daily');
    expect(slugs).toContain('2026-05-07-daily');
  });

  it('returns empty array when no dailies exist', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(getAllDailySlugs()).toEqual([]);
  });
});