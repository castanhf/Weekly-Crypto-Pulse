import { describe, expect, it } from 'vitest';

import type { DailyArtifact } from '@/domain/daily';
import { composeSundayDigest } from '@/lib/email/compose-sunday-digest';

const makeDailyArtifact = (overrides: Partial<DailyArtifact> = {}): DailyArtifact => ({
  schemaVersion: 'daily@1.1',
  generatedAt: '2026-05-12T06:00:00.000Z',
  publishedAt: '2026-05-12',
  slug: '2026-05-12-btc-hits-record',
  headline: 'BTC hits a new record as ETF inflows spike',
  summary: 'Bitcoin crossed $105K on Tuesday as spot ETF daily inflows hit $1.2B.',
  whatMoved: { winners: [], losers: [], topTracked: [] },
  whyItMoved: 'Institutional buying drove the move.',
  worthKnowing: ['ETF inflows hit a 30-day high', 'DXY fell 0.3% on weak jobs data'],
  snapshot: { totalMarketCapUsd: 3_200_000_000_000, btcDominancePct: 56.1, ethDominancePct: 13.2, fearGreedIndex: 74 },
  tags: ['bitcoin', 'etf'],
  ...overrides
});

const FRAMING = 'ETF buying dominated the week, with three consecutive record inflows pulling Bitcoin above $105K for the first time. The Senate stablecoin bill advanced to a full floor vote. Altcoins lagged throughout.';

describe('composeSundayDigest', () => {
  it('produces a subject with week-end date', () => {
    const dailies = [makeDailyArtifact({ publishedAt: '2026-05-11' })];
    const { subject } = composeSundayDigest({ weekDailies: dailies, framing: FRAMING });
    expect(subject).toContain('Crypto Pulse — Week in dailies');
    expect(subject).toContain('May 11');
  });

  it('includes framing paragraph in both HTML and plaintext', () => {
    const { htmlBody, plaintextBody } = composeSundayDigest({ weekDailies: [makeDailyArtifact()], framing: FRAMING });
    expect(htmlBody).toContain('ETF buying dominated');
    expect(plaintextBody).toContain('ETF buying dominated');
  });

  it('includes a link to each daily in the HTML body', () => {
    const dailies = [
      makeDailyArtifact({ slug: '2026-05-06-day-1' }),
      makeDailyArtifact({ slug: '2026-05-07-day-2' })
    ];
    const { htmlBody } = composeSundayDigest({ weekDailies: dailies, framing: FRAMING });
    expect(htmlBody).toContain('/reports/2026-05-06-day-1');
    expect(htmlBody).toContain('/reports/2026-05-07-day-2');
  });

  it('includes each daily headline in plaintext', () => {
    const dailies = [makeDailyArtifact({ headline: 'BTC hits a record' })];
    const { plaintextBody } = composeSundayDigest({ weekDailies: dailies, framing: FRAMING });
    expect(plaintextBody).toContain('BTC hits a record');
  });

  it('includes a daily opt-in prompt', () => {
    const { htmlBody, plaintextBody } = composeSundayDigest({ weekDailies: [makeDailyArtifact()], framing: FRAMING });
    expect(htmlBody.toLowerCase()).toContain('daily');
    expect(plaintextBody.toLowerCase()).toContain('daily');
  });

  it('HTML body starts with a valid doctype', () => {
    const { htmlBody } = composeSundayDigest({ weekDailies: [makeDailyArtifact()], framing: FRAMING });
    expect(htmlBody).toMatch(/^<!doctype html>/i);
  });

  it('handles an empty dailies array gracefully', () => {
    const { subject, htmlBody } = composeSundayDigest({ weekDailies: [], framing: FRAMING });
    expect(subject).toBeTruthy();
    expect(htmlBody).toContain('<!doctype html>');
  });

  it('escapes HTML special characters in headlines', () => {
    const dailies = [makeDailyArtifact({ headline: 'BTC & ETH surge: <5%>' })];
    const { htmlBody } = composeSundayDigest({ weekDailies: dailies, framing: FRAMING });
    expect(htmlBody).not.toContain('<5%>');
    expect(htmlBody).toContain('&lt;5%&gt;');
  });
});
