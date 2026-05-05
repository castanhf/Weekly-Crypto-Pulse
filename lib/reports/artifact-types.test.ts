import { describe, expect, it } from 'vitest';

import { isDailyArtifact, isWeeklyArtifact } from '@/lib/reports/artifact-types';
import type { Artifact } from '@/lib/reports/artifact-types';

const WEEKLY: Artifact = {
  kind: 'weekly',
  publishedAt: '2026-05-05',
  slug: '2026-05-05-test-weekly',
  report: {} as never,
  artifact: { fileName: '2026-05-05-test-weekly.json', schemaVersion: 'weekly@1.1' }
};

const DAILY: Artifact = {
  kind: 'daily',
  publishedAt: '2026-05-05',
  slug: '2026-05-05-test-daily',
  daily: {} as never,
  artifact: { fileName: '2026-05-05-test-daily.json', schemaVersion: 'daily@1.0', generatedAt: '2026-05-05T12:00:00.000Z' }
};

describe('isWeeklyArtifact', () => {
  it('returns true for a weekly artifact', () => {
    expect(isWeeklyArtifact(WEEKLY)).toBe(true);
  });

  it('returns false for a daily artifact', () => {
    expect(isWeeklyArtifact(DAILY)).toBe(false);
  });
});

describe('isDailyArtifact', () => {
  it('returns true for a daily artifact', () => {
    expect(isDailyArtifact(DAILY)).toBe(true);
  });

  it('returns false for a weekly artifact', () => {
    expect(isDailyArtifact(WEEKLY)).toBe(false);
  });
});
