import type { Report } from '@/domain/report';

import { sampleWeeklyReport } from '@/data/sample-report';

export const reports: ReadonlyArray<Report> = [sampleWeeklyReport];

export const latestReport: Report = reports[0];

export const findReportBySlug = (slug: string): Report | undefined =>
  reports.find((report) => report.metadata.slug === slug);
