import type { DailyArtifact, WeeklyArtifact, Artifact } from '@/lib/reports/artifact-types';
import { getAllReportArtifacts, type ReportArtifactRecord } from '@/lib/reports/report-repository';
import { loadAllDailies, type DailyArtifactRecord } from '@/lib/reports/daily-repository';

const toWeeklyArtifact = (record: ReportArtifactRecord): WeeklyArtifact => ({
  kind: 'weekly',
  publishedAt: record.report.metadata.publishedAt,
  slug: record.report.metadata.slug,
  report: record.report,
  artifact: record.artifact
});

const toDailyArtifact = (record: DailyArtifactRecord): DailyArtifact => ({
  kind: 'daily',
  publishedAt: record.daily.publishedAt,
  slug: record.daily.slug,
  daily: record.daily,
  artifact: record.artifact
});

const byPublishedAtDesc = (left: Artifact, right: Artifact): number => {
  const order = right.publishedAt.localeCompare(left.publishedAt);

  if (order !== 0) return order;

  return right.slug.localeCompare(left.slug);
};

export const loadAllArtifacts = (): ReadonlyArray<Artifact> => {
  const weeklies = getAllReportArtifacts().map(toWeeklyArtifact);
  const dailies = loadAllDailies().map(toDailyArtifact);

  return [...weeklies, ...dailies].sort(byPublishedAtDesc);
};

export const loadArtifactsByDateRange = (startIso: string, endIso: string): ReadonlyArray<Artifact> =>
  loadAllArtifacts().filter((artifact) => artifact.publishedAt >= startIso && artifact.publishedAt <= endIso);

export const loadLatestArtifacts = (limit: number): ReadonlyArray<Artifact> =>
  loadAllArtifacts().slice(0, limit);
