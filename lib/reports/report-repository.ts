import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Report } from '@/domain/report';
import { parseReportJson } from '@/lib/reports/report-parser';

const REPORTS_DIRECTORY_PATH = join(process.cwd(), 'data', 'reports');

const readReportFromFile = (fileName: string): Report => {
  const filePath = join(REPORTS_DIRECTORY_PATH, fileName);
  const fileContent = readFileSync(filePath, 'utf-8');

  return parseReportJson(fileContent, fileName);
};

const byPublishedAtDesc = (left: Report, right: Report): number =>
  right.metadata.publishedAt.localeCompare(left.metadata.publishedAt);

export const getAllReports = (): ReadonlyArray<Report> => {
  const reportFileNames = readdirSync(REPORTS_DIRECTORY_PATH)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  return reportFileNames.map(readReportFromFile).sort(byPublishedAtDesc);
};

export const getReportBySlug = (slug: string): Report | undefined => {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    throw new Error('Invalid slug: expected non-empty string.');
  }

  return getAllReports().find((report) => report.metadata.slug === normalizedSlug);
};

export const getLatestReport = (): Report | undefined => getAllReports()[0];
