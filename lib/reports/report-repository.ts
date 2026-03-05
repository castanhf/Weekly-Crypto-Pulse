import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Report } from '@/domain/report';
import { parseReportJson } from '@/lib/reports/report-parser';

export const REPORTS_DIRECTORY_PATH = join(process.cwd(), 'data', 'reports');

const isReportJsonFile = (fileName: string): boolean => fileName.endsWith('.json');

const readReportFromFile = (fileName: string): Report => {
  const filePath = join(REPORTS_DIRECTORY_PATH, fileName);
  const fileContent = readFileSync(filePath, 'utf-8');

  return parseReportJson(fileContent, fileName);
};

const byPublishedAtDesc = (left: Report, right: Report): number =>
  right.metadata.publishedAt.localeCompare(left.metadata.publishedAt);

const validateUniqueSlugs = (reports: ReadonlyArray<Report>): void => {
  const seenSlugs = new Set<string>();

  for (const report of reports) {
    const { slug } = report.metadata;

    if (seenSlugs.has(slug)) {
      throw new Error(`Invalid report data: duplicate slug "${slug}".`);
    }

    seenSlugs.add(slug);
  }
};

const loadReports = (): ReadonlyArray<Report> => {
  const reportFileNames = readdirSync(REPORTS_DIRECTORY_PATH).filter(isReportJsonFile).sort((left, right) => left.localeCompare(right));
  const reports = reportFileNames.map(readReportFromFile).sort(byPublishedAtDesc);

  validateUniqueSlugs(reports);

  return reports;
};

export const getAllReports = (): ReadonlyArray<Report> => loadReports();

export const getReportBySlug = (slug: string): Report | undefined => {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    throw new Error('Invalid slug: expected non-empty string.');
  }

  return loadReports().find((report) => report.metadata.slug === normalizedSlug);
};

export const getLatestReport = (): Report | undefined => loadReports()[0];
