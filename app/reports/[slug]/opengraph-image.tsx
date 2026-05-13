import { ImageResponse } from 'next/og';

import { loadAllArtifacts, loadArtifactBySlug } from '@/lib/reports/artifact-repository';
import { DAILY_TITLE_PREFIX, SITE_NAME, WEEKLY_TITLE_PREFIX } from '@/lib/site';

export const runtime = 'nodejs';
export const alt = 'Crypto Pulse report preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const generateStaticParams = (): Array<{ slug: string }> =>
  loadAllArtifacts().map((a) => ({ slug: a.slug }));

type Params = { params: Promise<{ slug: string }> };

const CANVAS = '#0d1b2e';
const SURFACE = '#132238';
const ACCENT = '#F7931A';
const PAPER = '#F5F7FA';
const MUTED = '#94a3b8';

function FallbackCard(): JSX.Element {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: CANVAS, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, color: ACCENT, fontWeight: 700 }}>{SITE_NAME}</div>
    </div>
  );
}

type CardProps = {
  cadence: string;
  headline: string;
  publishDate: string;
  isWeekly: boolean;
};

function ReportCard({ cadence, headline, publishDate, isWeekly }: CardProps): JSX.Element {
  const badgeColor = isWeekly ? ACCENT : '#60a5fa';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: CANVAS,
        padding: '64px 72px',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Top row: brand + cadence badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 28, color: ACCENT, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 14,
            color: badgeColor,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            background: `${badgeColor}22`,
            border: `1px solid ${badgeColor}66`,
            borderRadius: 32,
            padding: '6px 16px'
          }}
        >
          {cadence}
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: headline.length > 80 ? 44 : headline.length > 60 ? 50 : 58,
          color: PAPER,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          maxWidth: '90%'
        }}
      >
        {headline}
      </div>

      {/* Bottom: date + divider bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 3, background: ACCENT, borderRadius: 2 }} />
        <div style={{ fontSize: 22, color: MUTED }}>{publishDate}</div>
      </div>

      {/* Subtle surface decoration */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 320,
          height: '100%',
          background: `linear-gradient(to left, ${SURFACE}88, transparent)`,
          display: 'flex'
        }}
      />
    </div>
  );
}

export default async function OpenGraphImage({ params }: Params): Promise<ImageResponse> {
  const { slug } = await params;
  const artifact = loadArtifactBySlug(slug);

  if (!artifact) {
    return new ImageResponse(<FallbackCard />, size);
  }

  const isWeekly = artifact.kind === 'weekly';
  const cadence = isWeekly ? WEEKLY_TITLE_PREFIX : DAILY_TITLE_PREFIX;
  const headline = isWeekly
    ? (() => {
        const rawTitle = artifact.report.metadata.title;
        const colon = rawTitle.indexOf(':');
        return colon >= 0 ? rawTitle.slice(colon + 1).trim() : rawTitle;
      })()
    : artifact.daily.headline;

  const publishDate = new Date(artifact.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return new ImageResponse(<ReportCard cadence={cadence} headline={headline} isWeekly={isWeekly} publishDate={publishDate} />, size);
}
