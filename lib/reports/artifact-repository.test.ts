import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/reports/report-repository', () => ({
  getAllReportArtifacts: vi.fn()
}));

vi.mock('@/lib/reports/daily-repository', () => ({
  loadAllDailies: vi.fn()
}));

import { getAllReportArtifacts } from '@/lib/reports/report-repository';
import { loadAllDailies } from '@/lib/reports/daily-repository';
import { loadAllArtifacts, loadArtifactsByDateRange, loadLatestArtifacts } from '@/lib/reports/artifact-repository';
import type { DailyArtifactRecord } from '@/lib/reports/daily-repository';
import type { ReportArtifactRecord } from '@/lib/reports/report-repository';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeWeeklyRecord = (publishedAt: string, slug: string): ReportArtifactRecord => ({
  report: {
    metadata: { title: `Report ${slug}`, slug, publishedAt, weekLabel: 'Week', summary: 'Summary', tags: [] },
    regime: 'risk-on',
    marketSnapshot: { totalMarketCapUsd: 2e12, btcDominancePct: 57, ethDominancePct: 10, fearGreedIndex: 70 },
    movers: [],
    sections: [],
    signals: { thesis: [], riskChecklist: ['1', '2', '3', '4', '5'], watchlistLevels: [], changedSinceLastWeek: [] }
  },
  artifact: { fileName: `${slug}.json`, schemaVersion: 'weekly@1.1', generatedAt: `${publishedAt}T06:00:00.000Z` }
});

const makeDailyRecord = (publishedAt: string, slug: string): DailyArtifactRecord => ({
  daily: {
    schemaVersion: 'daily@1.0',
    generatedAt: `${publishedAt}T12:00:00.000Z`,
    publishedAt,
    slug,
    headline: `Daily ${slug}`,
    summary: 'Summary.',
    whatMoved: { winners: [], losers: [], topTracked: [] },
    whyItMoved: 'Explanation.',
    worthKnowing: [],
    snapshot: { totalMarketCapUsd: 2e12, btcDominancePct: 58, ethDominancePct: 10, fearGreedIndex: 72 },
    tags: ['daily']
  },
  artifact: { fileName: `${slug}.json`, schemaVersion: 'daily@1.0', generatedAt: `${publishedAt}T12:00:00.000Z` }
});

// ─── loadAllArtifacts ────────────────────────────────────────────────────────

describe('loadAllArtifacts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty array when both repositories are empty', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([]);
    vi.mocked(loadAllDailies).mockReturnValue([]);

    expect(loadAllArtifacts()).toEqual([]);
  });

  it('returns only weeklies when no dailies exist', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([makeWeeklyRecord('2026-05-05', '2026-05-05-weekly')]);
    vi.mocked(loadAllDailies).mockReturnValue([]);

    const result = loadAllArtifacts();

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('weekly');
  });

  it('sets kind: "weekly" on weekly artifacts', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([makeWeeklyRecord('2026-05-05', '2026-05-05-weekly')]);
    vi.mocked(loadAllDailies).mockReturnValue([]);

    const [artifact] = loadAllArtifacts();

    expect(artifact?.kind).toBe('weekly');
  });

  it('sets kind: "daily" on daily artifacts', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([]);
    vi.mocked(loadAllDailies).mockReturnValue([makeDailyRecord('2026-05-05', '2026-05-05-daily')]);

    const [artifact] = loadAllArtifacts();

    expect(artifact?.kind).toBe('daily');
  });

  it('merges and sorts 3 weeklies and 4 dailies with interleaved dates', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([
      makeWeeklyRecord('2026-05-05', '2026-05-05-weekly'),
      makeWeeklyRecord('2026-04-28', '2026-04-28-weekly'),
      makeWeeklyRecord('2026-04-21', '2026-04-21-weekly')
    ]);
    vi.mocked(loadAllDailies).mockReturnValue([
      makeDailyRecord('2026-05-07', '2026-05-07-daily'),
      makeDailyRecord('2026-05-06', '2026-05-06-daily'),
      makeDailyRecord('2026-05-04', '2026-05-04-daily'),
      makeDailyRecord('2026-04-29', '2026-04-29-daily')
    ]);

    const result = loadAllArtifacts();

    expect(result).toHaveLength(7);

    const publishedDates = result.map((a) => a.publishedAt);

    for (let i = 1; i < publishedDates.length; i += 1) {
      expect(publishedDates[i - 1]! >= publishedDates[i]!).toBe(true);
    }

    expect(result[0]?.publishedAt).toBe('2026-05-07');
    expect(result[0]?.kind).toBe('daily');
    expect(result[1]?.publishedAt).toBe('2026-05-06');
    expect(result[1]?.kind).toBe('daily');
    expect(result[2]?.publishedAt).toBe('2026-05-05');
    expect(result[2]?.kind).toBe('weekly');
    expect(result[6]?.publishedAt).toBe('2026-04-21');
    expect(result[6]?.kind).toBe('weekly');
  });

  it('propagates publishedAt and slug on the unified artifact', () => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([makeWeeklyRecord('2026-05-05', '2026-05-05-weekly')]);
    vi.mocked(loadAllDailies).mockReturnValue([makeDailyRecord('2026-05-06', '2026-05-06-daily')]);

    const result = loadAllArtifacts();

    expect(result[0]?.publishedAt).toBe('2026-05-06');
    expect(result[0]?.slug).toBe('2026-05-06-daily');
    expect(result[1]?.publishedAt).toBe('2026-05-05');
    expect(result[1]?.slug).toBe('2026-05-05-weekly');
  });
});

// ─── loadArtifactsByDateRange ────────────────────────────────────────────────

describe('loadArtifactsByDateRange', () => {
  beforeEach(() => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([
      makeWeeklyRecord('2026-05-05', '2026-05-05-weekly'),
      makeWeeklyRecord('2026-04-28', '2026-04-28-weekly')
    ]);
    vi.mocked(loadAllDailies).mockReturnValue([
      makeDailyRecord('2026-05-07', '2026-05-07-daily'),
      makeDailyRecord('2026-05-03', '2026-05-03-daily')
    ]);
  });

  it('returns only artifacts within the date range (inclusive)', () => {
    const result = loadArtifactsByDateRange('2026-05-03', '2026-05-05');

    expect(result).toHaveLength(2);
    expect(result.every((a) => a.publishedAt >= '2026-05-03' && a.publishedAt <= '2026-05-05')).toBe(true);
  });

  it('returns empty array when no artifacts fall in the range', () => {
    const result = loadArtifactsByDateRange('2026-01-01', '2026-01-31');

    expect(result).toEqual([]);
  });

  it('includes the boundary dates', () => {
    const result = loadArtifactsByDateRange('2026-05-07', '2026-05-07');

    expect(result).toHaveLength(1);
    expect(result[0]?.publishedAt).toBe('2026-05-07');
  });
});

// ─── loadLatestArtifacts ─────────────────────────────────────────────────────

describe('loadLatestArtifacts', () => {
  beforeEach(() => {
    vi.mocked(getAllReportArtifacts).mockReturnValue([
      makeWeeklyRecord('2026-05-05', '2026-05-05-weekly'),
      makeWeeklyRecord('2026-04-28', '2026-04-28-weekly')
    ]);
    vi.mocked(loadAllDailies).mockReturnValue([
      makeDailyRecord('2026-05-07', '2026-05-07-daily'),
      makeDailyRecord('2026-05-06', '2026-05-06-daily'),
      makeDailyRecord('2026-05-04', '2026-05-04-daily')
    ]);
  });

  it('returns the N most recent artifacts', () => {
    const result = loadLatestArtifacts(3);

    expect(result).toHaveLength(3);
    expect(result[0]?.publishedAt).toBe('2026-05-07');
    expect(result[1]?.publishedAt).toBe('2026-05-06');
    expect(result[2]?.publishedAt).toBe('2026-05-05');
  });

  it('returns all artifacts when limit exceeds total count', () => {
    const result = loadLatestArtifacts(100);

    expect(result).toHaveLength(5);
  });

  it('returns empty array when limit is 0', () => {
    expect(loadLatestArtifacts(0)).toEqual([]);
  });
});
