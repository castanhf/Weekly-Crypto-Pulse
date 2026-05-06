import { describe, expect, it } from 'vitest';

import { createDistributionContext, createEmailReportHtml, createRssFeed } from '@/lib/reports/distribution';
import { getAllReports } from '@/lib/reports/report-repository';

describe('report distribution', () => {
  it('builds RSS XML with report entries and email enclosure links', () => {
    const reports = getAllReports();
    const feedXml = createRssFeed(reports, createDistributionContext('https://weeklycryptopulse.com', new Date('2026-03-03T00:00:00Z')));

    expect(feedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(feedXml).toContain('<rss version="2.0">');
    expect(feedXml).toContain('<title>Crypto Pulse</title>');

    const firstReport = reports[0];
    expect(feedXml).toContain(`<link>https://weeklycryptopulse.com/reports/${firstReport.metadata.slug}</link>`);
    expect(feedXml).toContain(`<enclosure url="https://weeklycryptopulse.com/reports/${firstReport.metadata.slug}/email" type="text/html" length="0" />`);
  });

  it('builds email-friendly report HTML from the same report model', () => {
    const report = getAllReports()[0];
    const emailHtml = createEmailReportHtml(report, createDistributionContext('https://weeklycryptopulse.com/'));

    expect(emailHtml).toContain('<!doctype html>');
    expect(emailHtml).toContain(`<h1>${report.metadata.title}</h1>`);
    expect(emailHtml).toContain(`<li><strong>Total market cap:</strong> $${report.marketSnapshot.totalMarketCapUsd.toLocaleString('en-US')}</li>`);
    expect(emailHtml).toContain('<h2>Top movers (7d)</h2>');
    expect(emailHtml).toContain(`href="https://weeklycryptopulse.com/reports/${report.metadata.slug}"`);
    expect(emailHtml).toContain('Permanent email-friendly link');
  });
});
