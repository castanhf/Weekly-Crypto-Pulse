import { describe, expect, it } from 'vitest';

import { validateArtifact } from '@/lib/reports/artifact-validator';

const PLACEHOLDER_DAILY = JSON.stringify({
  schemaVersion: 'daily@1.0',
  generatedAt: '2026-05-05T06:00:00.000Z',
  publishedAt: '2026-05-05',
  slug: '2026-05-05-markets-quiet',
  headline: 'Markets are quiet today.',
  summary: "Today's daily report could not be assembled. The full pulse will resume tomorrow.",
  whatMoved: { winners: [], losers: [], topTracked: [] },
  whyItMoved:
    "Today's report could not be generated due to upstream data unavailability. Normal coverage resumes tomorrow.",
  worthKnowing: [],
  snapshot: {
    totalMarketCapUsd: 0,
    btcDominancePct: 0,
    ethDominancePct: 0,
    fearGreedIndex: 0
  },
  tags: ['placeholder', 'pipeline-failure']
});

describe('catastrophic-failure placeholder daily artifact', () => {
  it('validates successfully against daily@1.0', () => {
    expect(() => validateArtifact(PLACEHOLDER_DAILY, 'placeholder.json')).not.toThrow();
  });

  it('has schemaVersion daily@1.0', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as { schemaVersion: string };

    expect(parsed.schemaVersion).toBe('daily@1.0');
  });

  it('has all required top-level string fields non-empty', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as Record<string, unknown>;

    expect(parsed.slug).toBe('2026-05-05-markets-quiet');
    expect(parsed.headline).toBe('Markets are quiet today.');
    expect(typeof parsed.whyItMoved).toBe('string');
    expect((parsed.whyItMoved as string).length).toBeGreaterThan(0);
  });

  it('has empty whatMoved arrays', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as {
      whatMoved: Record<string, unknown[]>;
    };

    expect(parsed.whatMoved.winners).toEqual([]);
    expect(parsed.whatMoved.losers).toEqual([]);
    expect(parsed.whatMoved.topTracked).toEqual([]);
  });

  it('has worthKnowing as empty array (within schema max of 4)', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as { worthKnowing: unknown[] };

    expect(Array.isArray(parsed.worthKnowing)).toBe(true);
    expect(parsed.worthKnowing.length).toBeLessThanOrEqual(4);
  });

  it('has numeric snapshot fields (zeros are valid for a placeholder)', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as {
      snapshot: Record<string, unknown>;
    };

    expect(typeof parsed.snapshot.totalMarketCapUsd).toBe('number');
    expect(typeof parsed.snapshot.btcDominancePct).toBe('number');
    expect(typeof parsed.snapshot.ethDominancePct).toBe('number');
    expect(typeof parsed.snapshot.fearGreedIndex).toBe('number');
  });

  it('has placeholder and pipeline-failure tags', () => {
    const parsed = JSON.parse(PLACEHOLDER_DAILY) as { tags: string[] };

    expect(parsed.tags).toContain('placeholder');
    expect(parsed.tags).toContain('pipeline-failure');
  });
});
