import { describe, expect, it } from 'vitest';

import sitemap from './sitemap';
import { getAllReports } from '@/lib/reports/report-repository';
import { loadAllArtifacts } from '@/lib/reports/artifact-repository';

describe('sitemap', () => {
  it('contains all static discoverable routes', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith('/'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/reports'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/pro'))).toBe(true);
  });

  it('contains all weekly report slugs', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    const weeklyReports = getAllReports();

    for (const report of weeklyReports) {
      expect(urls.some((u) => u.includes(`/reports/${report.metadata.slug}`))).toBe(true);
    }
  });

  it('contains at most 30 daily entries', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    const allDailies = loadAllArtifacts().filter((a) => a.kind === 'daily');
    const dailyUrlsInSitemap = urls.filter((u) => {
      const slug = u.split('/reports/')[1];
      return allDailies.some((d) => d.slug === slug);
    });

    expect(dailyUrlsInSitemap.length).toBeLessThanOrEqual(30);
  });

  it('all URLs are absolute', () => {
    const entries = sitemap();

    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
    }
  });

  it('weekly and daily entries have lastModified', () => {
    const entries = sitemap();
    const weeklyReports = getAllReports();
    const weeklyUrls = new Set(weeklyReports.map((r) => r.metadata.slug));

    const reportEntries = entries.filter((e) => {
      const slug = e.url.split('/reports/')[1];
      return slug !== undefined;
    });

    for (const entry of reportEntries) {
      expect(entry.lastModified).toBeDefined();
    }
  });
});
