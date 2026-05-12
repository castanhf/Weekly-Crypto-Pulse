import type { Report } from '@/domain/report';
import { SITE_NAME, SITE_URL, WEEKLY_TITLE_PREFIX } from '@/lib/site';

const ACCENT = '#F7931A';
const CANVAS = '#0d1b2e';
const MUTED = '#94a3b8';
const PAPER = '#F5F7FA';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const extractHeadline = (report: Report): string => {
  const colon = report.metadata.title.indexOf(':');
  return colon >= 0 ? report.metadata.title.slice(colon + 1).trim() : report.metadata.title;
};

const renderWeeklyEmailHtml = (report: Report, reportUrl: string): string => {
  const headline = report.plainspokenOpening?.headline ?? extractHeadline(report);
  const body = report.plainspokenOpening?.body ?? report.metadata.summary;
  const escapedHeadline = escapeHtml(headline);
  const escapedBody = escapeHtml(body);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(SITE_NAME)} — Weekly</title>
</head>
<body style="margin:0;padding:16px;background:${CANVAS};color:${PAPER};font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<main style="max-width:640px;margin:0 auto">
<header style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px">
<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${ACCENT};margin:0 0 4px">${escapeHtml(SITE_NAME)}</p>
<p style="font-size:12px;color:${MUTED};margin:0">Weekly crypto market report</p>
</header>
<h1 style="font-size:24px;font-weight:600;line-height:1.3;margin:0 0 16px;letter-spacing:-0.01em">${escapedHeadline}</h1>
<p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 24px;white-space:pre-wrap">${escapedBody}</p>
<p style="margin:0 0 32px">
<a href="${reportUrl}" style="display:inline-block;background:${ACCENT};color:${CANVAS};font-size:14px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px">Read the full weekly report →</a>
</p>
<p style="font-size:13px;color:${MUTED};margin:0 0 8px">Want daily coverage too?
<a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none">Opt in from the homepage</a>.</p>
<footer style="border-top:1px solid rgba(255,255,255,0.1);margin-top:32px;padding-top:16px">
<p style="font-size:12px;color:${MUTED};margin:0">
<a href="${SITE_URL}/reports" style="color:${MUTED}">Browse all reports</a> ·
This report is informational only and is not investment advice.
</p>
</footer>
</main>
</body>
</html>`;
};

const renderWeeklyEmailPlaintext = (report: Report, reportUrl: string): string => {
  const headline = report.plainspokenOpening?.headline ?? extractHeadline(report);
  const body = report.plainspokenOpening?.body ?? report.metadata.summary;

  return `${SITE_NAME} — Weekly crypto market report

${headline}

${body}

Read the full weekly report: ${reportUrl}

Want daily coverage too? Opt in from the homepage: ${SITE_URL}

---
Browse all reports: ${SITE_URL}/reports
This report is informational only and is not investment advice.`;
};

export type WeeklyEmailComposition = {
  subject: string;
  htmlBody: string;
  plaintextBody: string;
};

export const composeWeeklyEmail = (report: Report): WeeklyEmailComposition => {
  const headline = report.plainspokenOpening?.headline ?? extractHeadline(report);
  const subject = `${WEEKLY_TITLE_PREFIX} — ${headline}`;
  const reportUrl = `${SITE_URL}/reports/${report.metadata.slug}`;

  return {
    subject,
    htmlBody: renderWeeklyEmailHtml(report, reportUrl),
    plaintextBody: renderWeeklyEmailPlaintext(report, reportUrl)
  };
};
