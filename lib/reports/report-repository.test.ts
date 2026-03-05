import { describe, expect, it } from 'vitest';

import { getAllReports, getLatestReport, getReportBySlug } from '@/lib/reports/report-repository';

describe('report repository', () => {
  it('returns reports sorted by publishedAt in descending order', () => {
    const reports = getAllReports();

    expect(reports.length).toBeGreaterThan(0);

    for (let index = 1; index < reports.length; index += 1) {
      const previousDate = reports[index - 1].metadata.publishedAt;
      const currentDate = reports[index].metadata.publishedAt;

      expect(previousDate >= currentDate).toBe(true);
    }
  });

  it('finds a report by an existing slug', () => {
    const [firstReport] = getAllReports();

    expect(firstReport).toBeDefined();

    const report = getReportBySlug(firstReport!.metadata.slug);

    expect(report).toEqual(firstReport);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getReportBySlug('missing-report')).toBeUndefined();
  });

  it('rejects empty slugs', () => {
    expect(() => getReportBySlug('   ')).toThrow('Invalid slug: expected non-empty string.');
  });

  it('returns the same report as the first sorted report for latest', () => {
    expect(getLatestReport()).toEqual(getAllReports()[0]);
  });
});
