import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/llm/client', () => ({ callLlm: vi.fn() }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    access: vi.fn(),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined)
  };
});

import { callLlm } from '../lib/llm/client';
import * as fs from 'node:fs/promises';
import { reviewDailyReport } from './review-daily-report';

const TARGET_DATE = '2026-05-07';

const MOCK_DRAFT = JSON.stringify({
  schemaVersion: 'daily@1.0',
  generatedAt: '2026-05-07T06:30:00.000Z',
  publishedAt: TARGET_DATE,
  slug: `${TARGET_DATE}-bitcoin-holds-above-95000`,
  headline: 'Bitcoin holds above $95,000 as markets drift sideways.',
  summary: 'Bitcoin traded in a tight range above $95,000 on Wednesday.',
  whatMoved: { winners: [], losers: [], topTracked: [] },
  whyItMoved: 'Markets drifted on light volume with no major catalysts.',
  worthKnowing: ['For deeper context, see this week\'s Weekly Pulse: https://weekly-crypto-pulse.com/reports/2026-04-28-bull-market-thesis'],
  snapshot: { totalMarketCapUsd: 3_200_000_000_000, btcDominancePct: 58.7, ethDominancePct: 13.1, fearGreedIndex: 72 },
  tags: ['crypto', 'daily']
});

const MOCK_RESEARCHER = JSON.stringify({
  targetDate: TARGET_DATE,
  marketSnapshot: { totalMarketCapUsd: 3_200_000_000_000, btcDominancePct: 58.7, ethDominancePct: 13.1, fearGreedIndex: 72 },
  topTracked: [],
  movers: { winners: [], losers: [] },
  newsItems: []
});

const APPROVED_RESPONSE = {
  content: JSON.stringify({
    verdict: 'APPROVED',
    failedItems: [],
    passingItems: ['1 — Register Check', '2 — Advisory Framing Check', '3 — Winners-and-Losers Check',
      '4 — Stablecoin/Derivative Narration Check', '5 — Length Check', '6 — Section Completeness',
      '7 — Schema Check', '8 — Factual Traceability Check', '9 — Footer Check']
  }),
  provider: 'github-models' as const,
  model: 'gpt-4o-mini' as const,
  usage: { inputTokens: 1000, outputTokens: 200 },
  rawResponse: {}
};

const REVISION_RESPONSE = {
  content: JSON.stringify({
    verdict: 'REVISION_REQUESTED',
    failedItems: [{ checkItem: '2 — Advisory Framing Check', verdict: 'FAIL' as const, detail: 'Found advisory phrasing', quotedText: 'you should' }],
    passingItems: ['1 — Register Check']
  }),
  provider: 'github-models' as const,
  model: 'gpt-4o-mini' as const,
  usage: { inputTokens: 1000, outputTokens: 200 },
  rawResponse: {}
};

describe('reviewDailyReport', () => {
  beforeEach(() => {
    vi.mocked(callLlm).mockReset();
    vi.mocked(fs.access).mockReset().mockRejectedValue({ code: 'ENOENT' }); // No sentinel, no errors file
    vi.mocked(fs.mkdir).mockReset().mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockReset().mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockReset().mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.includes(`draft-${TARGET_DATE}.json`)) {
        return MOCK_DRAFT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      if (p.includes('local-daily-input')) {
        return MOCK_RESEARCHER as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });
  });

  it('writes approval marker when LLM approves', async () => {
    vi.mocked(callLlm).mockResolvedValue(APPROVED_RESPONSE);

    const result = await reviewDailyReport(TARGET_DATE, 1);

    expect(result).toBe('approved');

    const writeCalls = vi.mocked(fs.writeFile).mock.calls;
    const approvalCall = writeCalls.find(([p]) => typeof p === 'string' && p.includes(`.approved-${TARGET_DATE}`));
    expect(approvalCall).toBeDefined();
    const approvalContent = JSON.parse(approvalCall![1] as string) as { allChecksPassed: boolean };
    expect(approvalContent.allChecksPassed).toBe(true);
  });

  it('writes revision request when LLM rejects', async () => {
    vi.mocked(callLlm).mockResolvedValue(REVISION_RESPONSE);

    const result = await reviewDailyReport(TARGET_DATE, 1);

    expect(result).toBe('revision-requested');

    const writeCalls = vi.mocked(fs.writeFile).mock.calls;
    const revisionsCall = writeCalls.find(([p]) => typeof p === 'string' && p.includes(`.revisions-${TARGET_DATE}`));
    expect(revisionsCall).toBeDefined();
    const revisionsContent = JSON.parse(revisionsCall![1] as string) as { revisionRound: number; failedItems: unknown[] };
    expect(revisionsContent.revisionRound).toBe(1);
    expect(revisionsContent.failedItems).toHaveLength(1);
  });

  it('auto-approves on round 3 without LLM call', async () => {
    const result = await reviewDailyReport(TARGET_DATE, 3);

    expect(result).toBe('approved');
    expect(vi.mocked(callLlm)).not.toHaveBeenCalled();

    const writeCalls = vi.mocked(fs.writeFile).mock.calls;
    const approvalCall = writeCalls.find(([p]) => typeof p === 'string' && p.includes(`.approved-${TARGET_DATE}`));
    expect(approvalCall).toBeDefined();
    const approvalContent = JSON.parse(approvalCall![1] as string) as { autoApproved: boolean; allChecksPassed: boolean };
    expect(approvalContent.autoApproved).toBe(true);
    expect(approvalContent.allChecksPassed).toBe(false);
  });

  it('passes revision round number to LLM prompt', async () => {
    vi.mocked(callLlm).mockResolvedValue(APPROVED_RESPONSE);

    await reviewDailyReport(TARGET_DATE, 2);

    expect(vi.mocked(callLlm)).toHaveBeenCalledTimes(1);
    const llmCall = vi.mocked(callLlm).mock.calls[0];
    const userMessage = llmCall[0].messages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('round 2');
  });
});
