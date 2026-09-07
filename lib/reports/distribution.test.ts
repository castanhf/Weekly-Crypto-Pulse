import { describe, expect, it } from 'vitest';

import { createDistributionContext, createEmailReportHtml, createRssFeed } from '@/lib/reports/distribution';
import { getAllReports } from '@/lib/reports/report-repository';

describe('report distribution', () => {
  it('builds RSS XML without atom namespace when no feedUrl is given', () => {
    const reports = getAllReports();
    const feedXml = createRssFeed(reports, createDistributionContext('https://weeklycryptopulse.com', new Date('2026-03-03T00:00:00Z')));

    expect(feedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(feedXml).toContain('<rss version="2.0">');
    expect(feedXml).toContain('<title>Crypto Pulse</title>');
    expect(feedXml).not.toContain('atom:link');

    const firstReport = reports[0];
    expect(feedXml).toContain(`<link>https://weeklycryptopulse.com/reports/${firstReport.metadata.slug}</link>`);
    expect(feedXml).toContain(`<enclosure url="https://weeklycryptopulse.com/reports/${firstReport.metadata.slug}/email" type="text/html" length="0" />`);
  });

  it('includes atom self-link when feedUrl is provided', () => {
    const reports = getAllReports();
    const feedXml = createRssFeed(
      reports,
      createDistributionContext('https://weeklycryptopulse.com', new Date('2026-03-03T00:00:00Z'), 'https://weeklycryptopulse.com/rss.xml')
    );

    expect(feedXml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(feedXml).toContain('<atom:link href="https://weeklycryptopulse.com/rss.xml" rel="self" type="application/rss+xml" />');
  });

  it('builds email-friendly report HTML from the same report model', () => {
    const report = getAllReports()[0];
    const emailHtml = createEmailReportHtml(report, createDistributionContext('https://weeklycryptopulse.com/'));

    expect(emailHtml).toContain('<!doctype html>');
    expect(emailHtml).toContain(report.metadata.title);
    expect(emailHtml).toContain('<strong>Total market cap:</strong>');
    expect(emailHtml).toContain('<h2 style=');
    expect(emailHtml).toContain(`href="https://weeklycryptopulse.com/reports/${report.metadata.slug}"`);
    expect(emailHtml).toContain('Email-friendly link');
  });
});
