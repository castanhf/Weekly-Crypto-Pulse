import { describe, expect, it } from 'vitest';

import type { Report } from '@/domain/report';
import { composeWeeklyEmail } from '@/lib/email/compose-weekly-email';

const baseReport: Report = {
  metadata: {
    title: 'Weekly Crypto Pulse: Bitcoin rallies to new highs as ETF flows accelerate',
    slug: '2026-05-12-bitcoin-rallies-to-new-highs',
    publishedAt: '2026-05-12',
    weekLabel: 'May 12, 2026',
    summary: 'Bitcoin broke $100K on strong ETF inflows. ETH lagged. Macro tailwinds held.',
    tags: ['bitcoin', 'etf', 'macro']
  },
  regime: 'risk-on',
  marketSnapshot: {
    totalMarketCapUsd: 3_200_000_000_000,
    btcDominancePct: 56.2,
    ethDominancePct: 13.1,
    fearGreedIndex: 72
  },
  movers: [],
  sections: [],
  signals: {
    thesis: [],
    riskChecklist: [],
    watchlistLevels: [],
    changedSinceLastWeek: []
  }
};

describe('composeWeeklyEmail', () => {
  it('produces a subject with the em-dash format', () => {
    const { subject } = composeWeeklyEmail(baseReport);
    expect(subject).toBe('Weekly Crypto Pulse — Bitcoin rallies to new highs as ETF flows accelerate');
  });

  it('uses plainspokenOpening headline when available', () => {
    const reportWithOpening: Report = {
      ...baseReport,
      plainspokenOpening: {
        headline: 'Six straight weeks of ETF buying, and this week broke the record',
        body: 'A longer plainspoken body goes here with 200-300 words of prose.'
      }
    };
    const { subject, htmlBody, plaintextBody } = composeWeeklyEmail(reportWithOpening);
    expect(subject).toContain('ETF buying');
    expect(htmlBody).toContain('Six straight weeks');
    expect(plaintextBody).toContain('Six straight weeks');
  });

  it('falls back to metadata headline when plainspokenOpening is absent', () => {
    const { subject, htmlBody, plaintextBody } = composeWeeklyEmail(baseReport);
    expect(subject).toContain('Bitcoin rallies');
    expect(htmlBody).toContain('Bitcoin rallies to new highs');
    expect(plaintextBody).toContain('Bitcoin rallies to new highs');
  });

  it('includes a CTA link to the report URL', () => {
    const { htmlBody, plaintextBody } = composeWeeklyEmail(baseReport);
    expect(htmlBody).toContain('/reports/2026-05-12-bitcoin-rallies-to-new-highs');
    expect(plaintextBody).toContain('/reports/2026-05-12-bitcoin-rallies-to-new-highs');
  });

  it('includes an opt-in prompt for daily emails', () => {
    const { htmlBody, plaintextBody } = composeWeeklyEmail(baseReport);
    expect(htmlBody.toLowerCase()).toContain('daily');
    expect(plaintextBody.toLowerCase()).toContain('daily');
  });

  it('HTML body starts with a valid doctype', () => {
    const { htmlBody } = composeWeeklyEmail(baseReport);
    expect(htmlBody).toMatch(/^<!doctype html>/i);
  });

  it('plaintext body does not contain HTML tags', () => {
    const { plaintextBody } = composeWeeklyEmail(baseReport);
    expect(plaintextBody).not.toMatch(/<[a-z]/i);
  });

  it('escapes HTML special characters in the report title', () => {
    const reportWithSpecialChars: Report = {
      ...baseReport,
      metadata: {
        ...baseReport.metadata,
        title: 'Weekly Crypto Pulse: Bitcoin & ETH surge <5%>'
      }
    };
    const { htmlBody } = composeWeeklyEmail(reportWithSpecialChars);
    expect(htmlBody).not.toContain('<5%>');
    expect(htmlBody).toContain('&lt;5%&gt;');
  });

  it('includes a hidden preheader span drawn from the report summary', () => {
    const { htmlBody } = composeWeeklyEmail(baseReport);
    expect(htmlBody).toContain('display:none;max-height:0;overflow:hidden');
    expect(htmlBody).toContain('Bitcoin broke $100K');
  });

  it('includes the Apple message-reformatting meta tag', () => {
    const { htmlBody } = composeWeeklyEmail(baseReport);
    expect(htmlBody).toContain('x-apple-disable-message-reformatting');
  });
});
