import type { DailyArtifact } from '../../domain/daily';
import { DAILY_TITLE_PREFIX, SITE_NAME, SITE_URL } from '../site';

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

const renderWorthKnowingHtml = (items: ReadonlyArray<string>): string => {
  if (items.length === 0) return '';
  const listItems = items.map((item) => `<li style="margin-bottom:8px;font-size:14px;color:${MUTED};line-height:1.5">${escapeHtml(item)}</li>`).join('\n');
  return `<h2 style="font-size:15px;font-weight:600;color:${PAPER};margin:24px 0 12px">Top things worth knowing today</h2>
<ul style="list-style:disc;padding-left:20px;margin:0">${listItems}</ul>`;
};

const renderDailyDigestHtml = (daily: DailyArtifact, reportUrl: string): string => {
  const worthKnowingHtml = renderWorthKnowingHtml(daily.worthKnowing);
  const preheader = escapeHtml(daily.summary.slice(0, 140));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(SITE_NAME)} — Daily</title>
</head>
<body style="margin:0;padding:16px;background:${CANVAS};color:${PAPER};font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>
<main style="max-width:640px;margin:0 auto">
<header style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px">
<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${ACCENT};margin:0 0 4px">${escapeHtml(SITE_NAME)}</p>
<p style="font-size:12px;color:${MUTED};margin:0">Daily digest</p>
</header>
<h1 style="font-size:22px;font-weight:600;line-height:1.3;margin:0 0 12px;letter-spacing:-0.01em">${escapeHtml(daily.headline)}</h1>
<p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 20px">${escapeHtml(daily.summary)}</p>
<p style="margin:0 0 24px">
<a href="${reportUrl}" style="display:inline-block;background:${ACCENT};color:${CANVAS};font-size:14px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px">Read the full daily →</a>
</p>
${worthKnowingHtml}
<footer style="border-top:1px solid rgba(255,255,255,0.1);margin-top:32px;padding-top:16px">
<p style="font-size:12px;color:${MUTED};margin:0">
<a href="${SITE_URL}/reports" style="color:${MUTED}">Browse all reports</a> ·
This digest is informational only and is not investment advice.
</p>
</footer>
</main>
</body>
</html>`;
};

const renderDailyDigestPlaintext = (daily: DailyArtifact, reportUrl: string): string => {
  const worthKnowingSection =
    daily.worthKnowing.length > 0
      ? `\nTop things worth knowing today:\n${daily.worthKnowing.map((item) => `• ${item}`).join('\n')}`
      : '';

  return `${SITE_NAME} — Daily digest

${daily.headline}

${daily.summary}

Read the full daily: ${reportUrl}${worthKnowingSection}

---
Browse all reports: ${SITE_URL}/reports
This digest is informational only and is not investment advice.`;
};

export type DailyDigestComposition = {
  subject: string;
  htmlBody: string;
  plaintextBody: string;
};

export const composeDailyDigest = (daily: DailyArtifact): DailyDigestComposition => {
  const subject = `${DAILY_TITLE_PREFIX} — ${daily.headline}`;
  const reportUrl = `${SITE_URL}/reports/${daily.slug}`;

  return {
    subject,
    htmlBody: renderDailyDigestHtml(daily, reportUrl),
    plaintextBody: renderDailyDigestPlaintext(daily, reportUrl)
  };
};
