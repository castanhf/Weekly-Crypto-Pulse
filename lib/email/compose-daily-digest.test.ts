import { describe, expect, it } from 'vitest';

import type { DailyArtifact } from '@/domain/daily';
import { composeDailyDigest } from '@/lib/email/compose-daily-digest';

const makeDaily = (overrides: Partial<DailyArtifact> = {}): DailyArtifact => ({
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

describe('composeDailyDigest', () => {
  it('produces a subject with the daily prefix and headline', () => {
    const { subject } = composeDailyDigest(makeDaily());
    expect(subject).toBe('Daily Crypto Pulse — BTC hits a new record as ETF inflows spike');
  });

  it('includes the headline and summary in HTML and plaintext', () => {
    const { htmlBody, plaintextBody } = composeDailyDigest(makeDaily());
    expect(htmlBody).toContain('BTC hits a new record');
    expect(htmlBody).toContain('Bitcoin crossed $105K');
    expect(plaintextBody).toContain('BTC hits a new record');
    expect(plaintextBody).toContain('Bitcoin crossed $105K');
  });

  it('includes a CTA link to the report', () => {
    const { htmlBody, plaintextBody } = composeDailyDigest(makeDaily());
    expect(htmlBody).toContain('/reports/2026-05-12-btc-hits-record');
    expect(plaintextBody).toContain('/reports/2026-05-12-btc-hits-record');
  });

  it('includes worthKnowing items in HTML output', () => {
    const { htmlBody } = composeDailyDigest(makeDaily());
    expect(htmlBody).toContain('ETF inflows hit a 30-day high');
    expect(htmlBody).toContain('DXY fell 0.3%');
  });

  it('includes worthKnowing items in plaintext output', () => {
    const { plaintextBody } = composeDailyDigest(makeDaily());
    expect(plaintextBody).toContain('ETF inflows hit a 30-day high');
  });

  it('omits worthKnowing section when array is empty', () => {
    const daily = makeDaily({ worthKnowing: [] });
    const { htmlBody } = composeDailyDigest(daily);
    expect(htmlBody).not.toContain('Top things worth knowing');
  });

  it('HTML body starts with a valid doctype', () => {
    const { htmlBody } = composeDailyDigest(makeDaily());
    expect(htmlBody).toMatch(/^<!doctype html>/i);
  });

  it('plaintext body does not contain HTML tags', () => {
    const { plaintextBody } = composeDailyDigest(makeDaily());
    expect(plaintextBody).not.toMatch(/<[a-z]/i);
  });

  it('escapes HTML special characters in headline', () => {
    const daily = makeDaily({ headline: 'BTC & ETH: <5%> gain' });
    const { htmlBody } = composeDailyDigest(daily);
    expect(htmlBody).not.toContain('<5%>');
    expect(htmlBody).toContain('&lt;5%&gt;');
  });
});
