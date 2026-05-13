import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Report } from '../../domain/report';
import { parseReportArtifactJson } from './report-parser';

export const REPORTS_DIRECTORY_PATH = join(process.cwd(), 'data', 'reports');

export type ReportArtifactRecord = Readonly<{
  report: Report;
  artifact: Readonly<{
    fileName: string;
    schemaVersion: ReturnType<typeof parseReportArtifactJson>['artifact']['schemaVersion'];
    generatedAt?: string;
  }>;
}>;

const isReportJsonFile = (fileName: string): boolean => fileName.endsWith('.json');
const REPORT_FILE_NAME_PATTERN = /\.json$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const readReportArtifactFromFile = (fileName: string): ReportArtifactRecord => {
  const filePath = join(REPORTS_DIRECTORY_PATH, fileName);
  const fileContent = readFileSync(filePath, 'utf-8');
  const parsedArtifact = parseReportArtifactJson(fileContent, fileName);

  return {
    report: parsedArtifact.report,
    artifact: {
      fileName,
      schemaVersion: parsedArtifact.artifact.schemaVersion,
      generatedAt: parsedArtifact.artifact.generatedAt
    }
  };
};

const getSlugFromFileName = (fileName: string): string => fileName.replace(REPORT_FILE_NAME_PATTERN, '');

const assertIsoDate = (publishedAt: string, slug: string): void => {
  if (!ISO_DATE_PATTERN.test(publishedAt)) {
    throw new Error(`Invalid report data: report "${slug}" has non-ISO publishedAt "${publishedAt}".`);
  }
};

const byPublishedAtDesc = (left: ReportArtifactRecord, right: ReportArtifactRecord): number => {
  const publishedAtSortOrder = right.report.metadata.publishedAt.localeCompare(left.report.metadata.publishedAt);

  if (publishedAtSortOrder !== 0) {
    return publishedAtSortOrder;
  }

  return right.report.metadata.slug.localeCompare(left.report.metadata.slug);
};

const validateReportCollection = (reports: ReadonlyArray<Report>, fileNamesBySlug: ReadonlyMap<string, string>): void => {
  const seenSlugs = new Set<string>();

  for (const report of reports) {
    const { publishedAt, slug } = report.metadata;

    if (seenSlugs.has(slug)) {
      throw new Error(`Invalid report data: duplicate slug "${slug}".`);
    }

    assertIsoDate(publishedAt, slug);

    const matchingFileName = fileNamesBySlug.get(slug);
    if (!matchingFileName) {
      throw new Error(`Invalid report data: missing artifact file mapping for slug "${slug}".`);
    }

    seenSlugs.add(slug);
  }
};

const readSortedReportArtifactsFromDisk = (): ReadonlyArray<ReportArtifactRecord> => {
  const reportFileNames = readdirSync(REPORTS_DIRECTORY_PATH).filter(isReportJsonFile).sort((left, right) => left.localeCompare(right));
  const fileNamesBySlug = new Map<string, string>(
    reportFileNames.map((fileName) => [getSlugFromFileName(fileName), fileName] as const)
  );
  const reportArtifacts = reportFileNames.map(readReportArtifactFromFile).sort(byPublishedAtDesc);
  const reports = reportArtifacts.map((reportArtifact) => reportArtifact.report);

  validateReportCollection(reports, fileNamesBySlug);

  return reportArtifacts;
};

const assertSlug = (slug: string): string => {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    throw new Error('Invalid slug: expected non-empty string.');
  }

  return normalizedSlug;
};

export const getAllReportArtifacts = (): ReadonlyArray<ReportArtifactRecord> => readSortedReportArtifactsFromDisk();

export const getAllReports = (): ReadonlyArray<Report> => getAllReportArtifacts().map((reportArtifact) => reportArtifact.report);

export const getReportArtifactBySlug = (slug: string): ReportArtifactRecord | undefined => {
  const normalizedSlug = assertSlug(slug);

  return getAllReportArtifacts().find((reportArtifact) => reportArtifact.report.metadata.slug === normalizedSlug);
};

export const getReportBySlug = (slug: string): Report | undefined => {
  return getReportArtifactBySlug(slug)?.report;
};

export const getLatestReportArtifact = (): ReportArtifactRecord | undefined => getAllReportArtifacts()[0];

export const getLatestReport = (): Report | undefined => getLatestReportArtifact()?.report;
