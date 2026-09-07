import type { Mover, Report } from '../../domain/report';
import { siteConfig } from '../site';

type DistributionContext = Readonly<{
  siteOrigin: string;
  generatedAt: Date;
  feedUrl?: string;
}>;

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '');

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatParagraphs = (text: string): string =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('\n');

const toRssDate = (value: string): string => new Date(value).toUTCString();

const getReportUrl = (siteOrigin: string, slug: string): string => `${siteOrigin}/reports/${slug}`;
const getEmailReportUrl = (siteOrigin: string, slug: string): string => `${siteOrigin}/reports/${slug}/email`;
const getCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
const getPercent = (value: number): string => `${value.toFixed(1)}%`;

const renderRssItem = (report: Report, siteOrigin: string): string => {
  const reportUrl = getReportUrl(siteOrigin, report.metadata.slug);
  const emailUrl = getEmailReportUrl(siteOrigin, report.metadata.slug);

  return `<item>\n<title>${escapeXml(report.metadata.title)}</title>\n<link>${reportUrl}</link>\n<guid>${reportUrl}</guid>\n<pubDate>${toRssDate(report.metadata.publishedAt)}</pubDate>\n<description>${escapeXml(
    report.metadata.summary
  )}</description>\n<source url="${siteOrigin}/rss.xml">${escapeXml(siteConfig.name)}</source>\n<enclosure url="${emailUrl}" type="text/html" length="0" />\n</item>`;
};

export const createRssFeed = (reports: ReadonlyArray<Report>, context: DistributionContext): string => {
  const { siteOrigin, generatedAt, feedUrl } = context;
  const rssItems = reports.map((report) => renderRssItem(report, siteOrigin)).join('\n');
  const atomNs = feedUrl ? ' xmlns:atom="http://www.w3.org/2005/Atom"' : '';
  const selfLink = feedUrl ? `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />\n` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"${atomNs}>\n<channel>\n<title>${escapeXml(
    siteConfig.name
  )}</title>\n<link>${siteOrigin}</link>\n<description>${escapeXml(
    siteConfig.description
  )}</description>\n<language>en-us</language>\n<lastBuildDate>${generatedAt.toUTCString()}</lastBuildDate>\n${selfLink}${rssItems}\n</channel>\n</rss>`;
};

const renderSectionHtml = (heading: string, body: string, highlights: ReadonlyArray<string>): string => {
  const highlightsMarkup =
    highlights.length === 0
      ? ''
      : `<ul>\n${highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('\n')}\n</ul>`;

  return `<section>\n<h2>${escapeHtml(heading)}</h2>\n${formatParagraphs(body)}\n${highlightsMarkup}\n</section>`;
};

const renderMoverItem = (mover: Mover): string =>
  `<li><strong>${escapeHtml(mover.name)} (${escapeHtml(mover.symbol)}):</strong> ${escapeHtml(
    getPercent(mover.changePct7d)
  )} — ${escapeHtml(mover.catalyst)}</li>`;

export const createEmailReportHtml = (report: Report, context: DistributionContext): string => {
  const { siteOrigin } = context;
  const reportUrl = getReportUrl(siteOrigin, report.metadata.slug);
  const archiveUrl = `${siteOrigin}/reports`;

  const sectionsHtml = report.sections
    .map((section) => renderSectionHtml(section.heading, section.body, section.highlights))
    .join('\n');

  const accentColor = '#F7931A';
  const canvasColor = '#0d1b2e';
  const paperColor = '#F5F7FA';
  const mutedColor = '#94a3b8';
  const bodyTextColor = '#1a1a2e';

  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>${escapeHtml(
    report.metadata.title
  )} | ${escapeHtml(siteConfig.name)}</title>\n</head>\n<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:${bodyTextColor}">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 0">\n<tr><td align="center">\n<table role="presentation" width="100%" style="max-width:680px;margin:0 auto">\n<tr><td style="background:${canvasColor};border-radius:12px 12px 0 0;padding:24px 32px">\n<p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:${mutedColor}">${escapeHtml(siteConfig.name)}</p>\n<h1 style="margin:12px 0 0;font-size:22px;font-weight:700;color:${paperColor};line-height:1.3">${escapeHtml(report.metadata.title)}</h1>\n<p style="margin:8px 0 0;font-size:13px;color:${mutedColor}">${escapeHtml(report.metadata.weekLabel)} &middot; Published ${escapeHtml(report.metadata.publishedAt)}</p>\n</td></tr>\n<tr><td style="background:#ffffff;padding:28px 32px">\n<p style="margin:0 0 20px;color:#333">${escapeHtml(report.metadata.summary)}</p>\n<p style="margin:0 0 28px"><a href="${reportUrl}" style="display:inline-block;background:${accentColor};color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:10px 20px;border-radius:8px">Read on the website</a></p>\n<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px" />\n<h2 style="margin:0 0 12px;font-size:16px;color:${canvasColor}">Market snapshot</h2>\n<ul style="margin:0 0 24px;padding:0 0 0 20px;color:#444">\n<li><strong>Total market cap:</strong> ${escapeHtml(
    getCurrency(report.marketSnapshot.totalMarketCapUsd)
  )}</li>\n<li><strong>BTC dominance:</strong> ${escapeHtml(
    getPercent(report.marketSnapshot.btcDominancePct)
  )}</li>\n<li><strong>ETH dominance:</strong> ${escapeHtml(getPercent(
    report.marketSnapshot.ethDominancePct
  ))}</li>\n<li><strong>Fear &amp; Greed:</strong> ${escapeHtml(String(report.marketSnapshot.fearGreedIndex))}</li>\n</ul>\n<h2 style="margin:0 0 12px;font-size:16px;color:${canvasColor}">Top movers (7d)</h2>\n<ul style="margin:0 0 24px;padding:0 0 0 20px;color:#444">\n${report.movers.map(renderMoverItem).join('\n')}\n</ul>\n${sectionsHtml}\n</td></tr>\n<tr><td style="background:${canvasColor};border-radius:0 0 12px 12px;padding:20px 32px">\n<p style="margin:0 0 8px;font-size:12px;color:${mutedColor}"><a href="${archiveUrl}" style="color:${accentColor};text-decoration:none">Browse all reports</a> &middot; <a href="${getEmailReportUrl(siteOrigin, report.metadata.slug)}" style="color:${accentColor};text-decoration:none">Email-friendly link</a></p>\n<p style="margin:0;font-size:12px;color:${mutedColor}">This report is informational only and is not investment advice.</p>\n</td></tr>\n</table>\n</td></tr>\n</table>\n</body>\n</html>`;
};

export const createDistributionContext = (siteOrigin: string, now: Date = new Date(), feedUrl?: string): DistributionContext => ({
  siteOrigin: stripTrailingSlash(siteOrigin),
  generatedAt: now,
  feedUrl
});
