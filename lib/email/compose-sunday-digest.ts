import type { DailyArtifact } from '../../domain/daily';
import { SITE_NAME, SITE_URL } from '../site';

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

const renderDailyEntryHtml = (daily: DailyArtifact): string => {
  const url = `${SITE_URL}/reports/${daily.slug}`;
  return `<li style="margin-bottom:16px">
<a href="${url}" style="font-size:15px;font-weight:600;color:${PAPER};text-decoration:none">${escapeHtml(daily.headline)}</a>
<p style="font-size:13px;color:${MUTED};margin:4px 0 0;line-height:1.5">${escapeHtml(daily.summary)}</p>
</li>`;
};

const renderDailyEntryPlaintext = (daily: DailyArtifact): string => {
  const url = `${SITE_URL}/reports/${daily.slug}`;
  return `• ${daily.headline}\n  ${daily.summary}\n  ${url}`;
};

const formatWeekEndDate = (dailies: ReadonlyArray<DailyArtifact>): string => {
  const last = dailies[dailies.length - 1];
  if (!last) return '';
  return new Date(last.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const renderSundayDigestHtml = (dailies: ReadonlyArray<DailyArtifact>, framing: string): string => {
  const entriesHtml = dailies.map(renderDailyEntryHtml).join('\n');
  const preheader = escapeHtml(framing.slice(0, 140));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(SITE_NAME)} — Week in dailies</title>
</head>
<body style="margin:0;padding:16px;background:${CANVAS};color:${PAPER};font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>
<main style="max-width:640px;margin:0 auto">
<header style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px">
<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${ACCENT};margin:0 0 4px">${escapeHtml(SITE_NAME)}</p>
<p style="font-size:12px;color:${MUTED};margin:0">Week in dailies</p>
</header>
<p style="font-size:15px;color:${MUTED};line-height:1.7;margin:0 0 24px;white-space:pre-wrap">${escapeHtml(framing)}</p>
<ul style="list-style:none;padding:0;margin:0 0 24px">
${entriesHtml}
</ul>
<p style="font-size:13px;color:${MUTED};margin:0 0 8px">
Want to get these daily, not Sunday?
<a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none">Opt in from the homepage</a>.
</p>
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

const renderSundayDigestPlaintext = (dailies: ReadonlyArray<DailyArtifact>, framing: string): string => {
  const entries = dailies.map(renderDailyEntryPlaintext).join('\n\n');

  return `${SITE_NAME} — Week in dailies

${framing}

${entries}

Want to get these daily, not Sunday? Opt in from the homepage: ${SITE_URL}

---
Browse all reports: ${SITE_URL}/reports
This digest is informational only and is not investment advice.`;
};

export type SundayDigestComposition = {
  subject: string;
  htmlBody: string;
  plaintextBody: string;
};

export const composeSundayDigest = ({
  weekDailies,
  framing
}: {
  weekDailies: ReadonlyArray<DailyArtifact>;
  framing: string;
}): SundayDigestComposition => {
  const formattedDate = formatWeekEndDate(weekDailies);
  const subject = `${SITE_NAME} — Week in dailies${formattedDate ? ` (${formattedDate})` : ''}`;

  return {
    subject,
    htmlBody: renderSundayDigestHtml(weekDailies, framing),
    plaintextBody: renderSundayDigestPlaintext(weekDailies, framing)
  };
};
