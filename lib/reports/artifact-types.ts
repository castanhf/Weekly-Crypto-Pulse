import type { DailyArtifact as RawDailyArtifact } from '@/domain/daily';
import type { Report } from '@/domain/report';
import type { SchemaVersion } from '@/domain/schema-version';

export type WeeklyArtifact = Readonly<{
  kind: 'weekly';
  publishedAt: string;
  slug: string;
  report: Report;
  artifact: Readonly<{
    fileName: string;
    schemaVersion: SchemaVersion | 'legacy';
    generatedAt?: string;
  }>;
}>;

export type DailyArtifact = Readonly<{
  kind: 'daily';
  publishedAt: string;
  slug: string;
  daily: RawDailyArtifact;
  artifact: Readonly<{
    fileName: string;
    schemaVersion: SchemaVersion;
    generatedAt: string;
  }>;
}>;

export type Artifact = WeeklyArtifact | DailyArtifact;

export const isWeeklyArtifact = (artifact: Artifact): artifact is WeeklyArtifact => artifact.kind === 'weekly';
export const isDailyArtifact = (artifact: Artifact): artifact is DailyArtifact => artifact.kind === 'daily';
