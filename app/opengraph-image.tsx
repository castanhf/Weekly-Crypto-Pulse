import { ImageResponse } from 'next/og';

import { SITE_NAME } from '@/lib/site';

export const alt = 'Crypto Pulse — Weekly and daily crypto market reports';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CANVAS = '#0d1b2e';
const SURFACE = '#132238';
const ACCENT = '#F7931A';
const PAPER = '#F5F7FA';
const MUTED = '#94a3b8';

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, background: ACCENT, borderRadius: '50%', display: 'flex' }} />
        <div style={{ fontSize: 16, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Weekly crypto research
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 72, color: ACCENT, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 30, color: PAPER, fontWeight: 400, lineHeight: 1.4, maxWidth: 700 }}>
          Free weekly and daily crypto market reports. What happened and what it means.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${ACCENT}40`,
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 18,
            color: PAPER,
            display: 'flex'
          }}
        >
          Weekly reports
        </div>
        <div
          style={{
            background: SURFACE,
            border: `1px solid #60a5fa40`,
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 18,
            color: PAPER,
            display: 'flex'
          }}
        >
          Daily reports
        </div>
        <div
          style={{
            background: `${ACCENT}22`,
            border: `1px solid ${ACCENT}66`,
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 18,
            color: ACCENT,
            fontWeight: 600,
            display: 'flex'
          }}
        >
          Pro Pack
        </div>
      </div>
    </div>,
    size
  );
}
