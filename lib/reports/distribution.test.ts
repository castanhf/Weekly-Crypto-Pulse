import { describe, expect, it } from 'vitest';

import { getAllReports } from '@/lib/reports/report-repository';
import { createDistributionContext, createEmailReportHtml, createRssFeed } from '@/lib/reports/distribution';

describe('report distribution', () => {
  it('builds RSS XML with report entries', () => {
    const reports = getAllReports();
    const feedXml = createRssFeed(reports, createDistributionContext('https://weeklycryptopulse.com', new Date('2026-03-03T00:00:00Z')));

    expect(feedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(feedXml).toContain('<rss version="2.0">');
    expect(feedXml).toContain('<title>Weekly Crypto Pulse</title>');

    const firstReport = reports[0];
    expect(feedXml).toContain(`<link>https://weeklycryptopulse.com/reports/${firstReport.metadata.slug}</link>`);
  });

  it('builds email-friendly report HTML from the same report model', () => {
    const report = getAllReports()[0];
    const emailHtml = createEmailReportHtml(report, createDistributionContext('https://weeklycryptopulse.com/'));

    expect(emailHtml).toContain('<!doctype html>');
    expect(emailHtml).toContain(`<h1>${report.metadata.title}</h1>`);
    expect(emailHtml).toContain(`href="https://weeklycryptopulse.com/reports/${report.metadata.slug}"`);
    expect(emailHtml).toContain('Permanent email-friendly link');
  });
});
