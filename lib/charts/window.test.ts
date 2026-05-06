import { describe, expect, it } from 'vitest';

import type { WeeklyArtifact } from '@/lib/reports/artifact-types';
import { computeRegimeHistoryWindow, computeSnapshotTrendWindow } from './window';

const makeArtifact = (publishedAt: string, overrides?: Partial<WeeklyArtifact['report']['marketSnapshot']> & { regime?: WeeklyArtifact['report']['regime'] }): WeeklyArtifact => ({
  kind: 'weekly',
  publishedAt,
  slug: `${publishedAt}-slug`,
  report: {
    metadata: {
      title: `Report ${publishedAt}`,
      slug: `${publishedAt}-slug`,
      publishedAt,
      weekLabel: `Week of ${publishedAt}`,
      summary: 'Test summary',
      tags: ['crypto']
    },
    regime: overrides?.regime ?? 'range-bound',
    marketSnapshot: {
      totalMarketCapUsd: overrides?.totalMarketCapUsd ?? 2_000_000_000_000,
      btcDominancePct: overrides?.btcDominancePct ?? 52,
      ethDominancePct: overrides?.ethDominancePct ?? 16,
      fearGreedIndex: overrides?.fearGreedIndex ?? 55
    },
    movers: [],
    sections: [],
    signals: {
      thesis: [],
      riskChecklist: ['r1', 'r2', 'r3', 'r4', 'r5'],
      watchlistLevels: [],
      changedSinceLastWeek: []
    }
  },
  artifact: {
    fileName: `${publishedAt}.json`,
    schemaVersion: 'weekly@1.1'
  }
});

const TWENTY_ARTIFACTS = Array.from({ length: 20 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 6 + i * 7));
  return makeArtifact(date.toISOString().slice(0, 10));
});

describe('computeSnapshotTrendWindow', () => {
  it('returns up to windowSize items from a large archive', () => {
    const result = computeSnapshotTrendWindow({
      asOfDate: TWENTY_ARTIFACTS[19]!.publishedAt,
      artifacts: TWENTY_ARTIFACTS
    });
    expect(result).toHaveLength(12);
  });

  it('returns fewer items when archive has fewer weeklies than windowSize', () => {
    const small = TWENTY_ARTIFACTS.slice(0, 3);
    const result = computeSnapshotTrendWindow({
      asOfDate: small[2]!.publishedAt,
      artifacts: small
    });
    expect(result).toHaveLength(3);
  });

  it('excludes weeklies with publishedAt after asOfDate', () => {
    const asOfDate = TWENTY_ARTIFACTS[5]!.publishedAt;
    const result = computeSnapshotTrendWindow({ asOfDate, artifacts: TWENTY_ARTIFACTS });
    expect(result.every((p) => p.publishedAt <= asOfDate)).toBe(true);
  });

  it('returns items in ascending chronological order', () => {
    const shuffled = [...TWENTY_ARTIFACTS].sort(() => Math.random() - 0.5);
    const result = computeSnapshotTrendWindow({
      asOfDate: TWENTY_ARTIFACTS[19]!.publishedAt,
      artifacts: shuffled
    });
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.publishedAt >= result[i - 1]!.publishedAt).toBe(true);
    }
  });

  it('accepts asOfDate as a Date object', () => {
    const date = new Date('2026-03-09T00:00:00.000Z');
    const result = computeSnapshotTrendWindow({ asOfDate: date, artifacts: TWENTY_ARTIFACTS });
    expect(result.every((p) => p.publishedAt <= '2026-03-09')).toBe(true);
  });

  it('accepts asOfDate as an ISO string', () => {
    const result = computeSnapshotTrendWindow({
      asOfDate: '2026-03-09',
      artifacts: TWENTY_ARTIFACTS
    });
    expect(result.every((p) => p.publishedAt <= '2026-03-09')).toBe(true);
  });

  it('returns empty array for empty artifacts', () => {
    const result = computeSnapshotTrendWindow({
      asOfDate: '2026-05-05',
      artifacts: []
    });
    expect(result).toEqual([]);
  });

  it('includes all four numeric snapshot fields per point', () => {
    const artifact = makeArtifact('2026-04-14', {
      totalMarketCapUsd: 2_500_000_000_000,
      btcDominancePct: 54.5,
      ethDominancePct: 17.2,
      fearGreedIndex: 62
    });
    const result = computeSnapshotTrendWindow({ asOfDate: '2026-04-14', artifacts: [artifact] });
    expect(result).toHaveLength(1);
    expect(result[0]!.totalMarketCapUsd).toBe(2_500_000_000_000);
    expect(result[0]!.btcDominancePct).toBe(54.5);
    expect(result[0]!.ethDominancePct).toBe(17.2);
    expect(result[0]!.fearGreedIndex).toBe(62);
  });

  it('weekLabel is human-readable', () => {
    const result = computeSnapshotTrendWindow({
      asOfDate: '2026-04-14',
      artifacts: [makeArtifact('2026-04-14')]
    });
    expect(result[0]!.weekLabel).toMatch(/[A-Z][a-z]+ \d+/);
    expect(result[0]!.weekLabel.length).toBeLessThan(12);
  });

  it('respects custom windowSize', () => {
    const result = computeSnapshotTrendWindow({
      asOfDate: TWENTY_ARTIFACTS[19]!.publishedAt,
      windowSize: 5,
      artifacts: TWENTY_ARTIFACTS
    });
    expect(result).toHaveLength(5);
  });
});

describe('computeRegimeHistoryWindow', () => {
  it('includes regime per point', () => {
    const artifact = makeArtifact('2026-04-14', { regime: 'risk-on' });
    const result = computeRegimeHistoryWindow({ asOfDate: '2026-04-14', artifacts: [artifact] });
    expect(result[0]!.regime).toBe('risk-on');
  });

  it('returns 12-item window from large archive', () => {
    const result = computeRegimeHistoryWindow({
      asOfDate: TWENTY_ARTIFACTS[19]!.publishedAt,
      artifacts: TWENTY_ARTIFACTS
    });
    expect(result).toHaveLength(12);
  });

  it('returns empty array for empty artifacts', () => {
    expect(computeRegimeHistoryWindow({ asOfDate: '2026-05-05', artifacts: [] })).toEqual([]);
  });
});
