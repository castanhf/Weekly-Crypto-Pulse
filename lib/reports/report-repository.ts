import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Report } from '@/domain/report';
import { parseReportJson } from '@/lib/reports/report-parser';

export const REPORTS_DIRECTORY_PATH = join(process.cwd(), 'data', 'reports');

const isReportJsonFile = (fileName: string): boolean => fileName.endsWith('.json');
const REPORT_FILE_NAME_PATTERN = /\.json$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const readReportFromFile = (fileName: string): Report => {
  const filePath = join(REPORTS_DIRECTORY_PATH, fileName);
  const fileContent = readFileSync(filePath, 'utf-8');

  return parseReportJson(fileContent, fileName);
};

const getSlugFromFileName = (fileName: string): string => fileName.replace(REPORT_FILE_NAME_PATTERN, '');

const assertIsoDate = (publishedAt: string, slug: string): void => {
  if (!ISO_DATE_PATTERN.test(publishedAt)) {
    throw new Error(`Invalid report data: report "${slug}" has non-ISO publishedAt "${publishedAt}".`);
  }
};

const byPublishedAtDesc = (left: Report, right: Report): number => {
  const publishedAtSortOrder = right.metadata.publishedAt.localeCompare(left.metadata.publishedAt);

  if (publishedAtSortOrder !== 0) {
    return publishedAtSortOrder;
  }

  return right.metadata.slug.localeCompare(left.metadata.slug);
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

const readSortedReportsFromDisk = (): ReadonlyArray<Report> => {
  const reportFileNames = readdirSync(REPORTS_DIRECTORY_PATH).filter(isReportJsonFile).sort((left, right) => left.localeCompare(right));
  const fileNamesBySlug = new Map<string, string>(
    reportFileNames.map((fileName) => [getSlugFromFileName(fileName), fileName] as const)
  );
  const reports = reportFileNames.map(readReportFromFile).sort(byPublishedAtDesc);

  validateReportCollection(reports, fileNamesBySlug);

  return reports;
};

const assertSlug = (slug: string): string => {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    throw new Error('Invalid slug: expected non-empty string.');
  }

  return normalizedSlug;
};

export const getAllReports = (): ReadonlyArray<Report> => readSortedReportsFromDisk();

export const getReportBySlug = (slug: string): Report | undefined => {
  const normalizedSlug = assertSlug(slug);

  return readSortedReportsFromDisk().find((report) => report.metadata.slug === normalizedSlug);
};

export const getLatestReport = (): Report | undefined => readSortedReportsFromDisk()[0];
