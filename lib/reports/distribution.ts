import type { Report } from '@/domain/report';
import { siteConfig } from '@/lib/site';

type DistributionContext = Readonly<{
  siteOrigin: string;
  generatedAt: Date;
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

const renderRssItem = (report: Report, siteOrigin: string): string => {
  const reportUrl = getReportUrl(siteOrigin, report.metadata.slug);

  return `<item>\n<title>${escapeXml(report.metadata.title)}</title>\n<link>${reportUrl}</link>\n<guid>${reportUrl}</guid>\n<pubDate>${toRssDate(report.metadata.publishedAt)}</pubDate>\n<description>${escapeXml(report.metadata.summary)}</description>\n</item>`;
};

export const createRssFeed = (reports: ReadonlyArray<Report>, context: DistributionContext): string => {
  const { siteOrigin, generatedAt } = context;
  const rssItems = reports.map((report) => renderRssItem(report, siteOrigin)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n<title>${escapeXml(siteConfig.name)}</title>\n<link>${siteOrigin}</link>\n<description>${escapeXml(siteConfig.description)}</description>\n<language>en-us</language>\n<lastBuildDate>${generatedAt.toUTCString()}</lastBuildDate>\n${rssItems}\n</channel>\n</rss>`;
};

const renderSectionHtml = (heading: string, body: string, highlights: ReadonlyArray<string>): string => {
  const highlightsMarkup =
    highlights.length === 0
      ? ''
      : `<ul>\n${highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('\n')}\n</ul>`;

  return `<section>\n<h2>${escapeHtml(heading)}</h2>\n${formatParagraphs(body)}\n${highlightsMarkup}\n</section>`;
};

export const createEmailReportHtml = (report: Report, context: DistributionContext): string => {
  const { siteOrigin } = context;
  const reportUrl = getReportUrl(siteOrigin, report.metadata.slug);
  const archiveUrl = `${siteOrigin}/reports`;

  const sectionsHtml = report.sections
    .map((section) => renderSectionHtml(section.heading, section.body, section.highlights))
    .join('\n');

  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>${escapeHtml(report.metadata.title)} | ${escapeHtml(siteConfig.name)}</title>\n</head>\n<body style="margin:0;padding:16px;color:#111;font-family:Arial,Helvetica,sans-serif;line-height:1.5">\n<main style="max-width:720px;margin:0 auto">\n<header>\n<p><strong>${escapeHtml(siteConfig.name)}</strong></p>\n<h1>${escapeHtml(report.metadata.title)}</h1>\n<p><strong>Week:</strong> ${escapeHtml(report.metadata.weekLabel)}<br /><strong>Published:</strong> ${escapeHtml(
    report.metadata.publishedAt
  )}</p>\n<p>${escapeHtml(report.metadata.summary)}</p>\n<p><a href="${reportUrl}">Read this report on the website</a></p>\n<hr />\n</header>\n${sectionsHtml}\n<hr />\n<footer>\n<p><a href="${archiveUrl}">Browse all reports</a></p>\n<p>This report is informational only and is not investment advice.</p>\n<p><a href="${getEmailReportUrl(siteOrigin, report.metadata.slug)}">Permanent email-friendly link</a></p>\n</footer>\n</main>\n</body>\n</html>`;
};

export const createDistributionContext = (siteOrigin: string, now: Date = new Date()): DistributionContext => ({
  siteOrigin: stripTrailingSlash(siteOrigin),
  generatedAt: now
});
