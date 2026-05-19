import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/llm/client', () => ({ callLlm: vi.fn() }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    access: vi.fn(),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined)
  };
});

import { callLlm } from '../lib/llm/client';
import * as fs from 'node:fs/promises';
import { generateDailyReport } from './generate-daily-report';

const TARGET_DATE = '2026-05-07';

const MOCK_RESEARCHER_INPUT = JSON.stringify({
  generatedAt: '2026-05-07T06:00:00.000Z',
  targetDate: TARGET_DATE,
  marketSnapshot: {
    totalMarketCapUsd: 3_200_000_000_000,
    btcDominancePct: 58.7,
    ethDominancePct: 13.1,
    fearGreedIndex: 72
  },
  topTracked: Array.from({ length: 15 }, (_, i) => ({
    symbol: i === 0 ? 'BTC' : `TK${i}`,
    name: i === 0 ? 'Bitcoin' : `Token${i}`,
    marketCapRank: i + 1,
    priceUsd: 95000,
    changePct24h: 2.1,
    marketCapUsd: 1_880_000_000_000,
    isStablecoin: false,
    isWrappedOrDerivative: false
  })),
  movers: {
    winners: [{ symbol: 'SOL', name: 'Solana', marketCapRank: 5, priceUsd: 180, changePct24h: 5.2, priceChange24hUsd: 9.36, marketCapUsd: 80_000_000_000, catalyst: 'Network activity surge.' }],
    losers: [{ symbol: 'XRP', name: 'XRP', marketCapRank: 6, priceUsd: 0.55, changePct24h: -3.1, priceChange24hUsd: -0.02, marketCapUsd: 60_000_000_000, catalyst: 'Profit taking.' }],
    sectionLabels: { winners: 'Winners', losers: 'Losers' },
    marketRegime: 'mixed'
  },
  capitalFlows: { notableTvlMovements: [] },
  newsItems: []
});

const MOCK_WRITER_OUTPUT = {
  headline: 'Bitcoin holds above $95,000 as markets drift sideways.',
  summary: 'Bitcoin held steady above $95,000 on Wednesday, with most top-20 assets trading within 2% of Tuesday\'s close. The Fear & Greed Index remained in Greed territory at 72, reflecting continued optimism despite light trading volume.',
  whatMoved: {
    winners: [{ symbol: 'SOL', name: 'Solana', changePct24h: 5.2, catalyst: 'Network activity surge.' }],
    losers: [{ symbol: 'XRP', name: 'XRP', changePct24h: -3.1, catalyst: 'Profit taking.' }],
    topTracked: Array.from({ length: 15 }, (_, i) => ({
      symbol: i === 0 ? 'BTC' : `TK${i}`,
      name: i === 0 ? 'Bitcoin' : `Token${i}`,
      priceUsd: 95000,
      changePct24h: 2.1,
      marketCapUsd: 1_880_000_000_000,
      isStablecoin: false
    }))
  },
  whyItMoved: 'Crypto markets spent Wednesday in a holding pattern, with most major assets trading within a tight range. Bitcoin remained above the $95,000 level that has served as support since last week. The Fear & Greed Index at 72 suggests markets remain in Greed territory, though momentum has cooled from recent highs. No major macro catalysts moved markets. US equity markets were also subdued, with investors waiting for Thursday\'s Federal Reserve minutes. Ethereum performed in line with Bitcoin, with both assets recording modest gains of around 2% for the session. DeFi total value locked held steady across major chains. The session underscored how quickly market energy can dissipate without fresh catalysts — even in a broadly bullish environment.',
  worthKnowing: [],
  snapshot: {
    totalMarketCapUsd: 3_200_000_000_000,
    btcDominancePct: 58.7,
    ethDominancePct: 13.1,
    fearGreedIndex: 72
  },
  tags: ['bitcoin', 'sideways-action', 'fed-minutes']
};

const MOCK_LLM_RESPONSE = {
  content: JSON.stringify(MOCK_WRITER_OUTPUT),
  provider: 'github-models' as const,
  model: 'gpt-4o-mini' as const,
  usage: { inputTokens: 800, outputTokens: 600 },
  rawResponse: {}
};

const MOCK_WEEKLY_ARTIFACT = JSON.stringify({
  report: { metadata: { slug: '2026-05-06-bitcoin-holds-steady-ahead-of-fed' } }
});

describe('generateDailyReport', () => {
  beforeEach(() => {
    vi.mocked(callLlm).mockReset();
    vi.mocked(fs.access).mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(callLlm).mockResolvedValue(MOCK_LLM_RESPONSE);
  });

  it('produces a valid daily@1.1 artifact draft', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    expect(writtenDraft).toBeDefined();
    const draft = JSON.parse(writtenDraft!) as {
      schemaVersion: string;
      publishedAt: string;
      slug: string;
      headline: string;
      worthKnowing: string[];
      whatMoved: { topTracked: unknown[] };
    };

    expect(draft.schemaVersion).toBe('daily@1.2');
    expect(draft.publishedAt).toBe(TARGET_DATE);
    expect(draft.slug).toMatch(new RegExp(`^${TARGET_DATE}-`));
    expect(draft.headline).toBeTruthy();
    expect(draft.whatMoved.topTracked).toHaveLength(15);
  });

  it('populates weeklyFooter field when a weekly artifact exists', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['2026-05-06-bitcoin-holds-steady-ahead-of-fed.json'] as unknown as ReturnType<typeof fs.readdir> extends Promise<infer T> ? T : never);
    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      if (p.includes('2026-05-06-bitcoin-holds-steady-ahead-of-fed.json')) {
        return MOCK_WEEKLY_ARTIFACT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    const draft = JSON.parse(writtenDraft!) as {
      weeklyFooter?: { text: string; weeklySlug: string };
      worthKnowing: string[];
    };
    expect(draft.weeklyFooter).toBeDefined();
    expect(draft.weeklyFooter!.weeklySlug).toBe('2026-05-06-bitcoin-holds-steady-ahead-of-fed');
    expect(draft.weeklyFooter!.text).toContain('Crypto Pulse');
    // worthKnowing should NOT contain a footer URL
    expect(draft.worthKnowing.every((item) => !item.includes('/reports/'))).toBe(true);
  });

  it('omits weeklyFooter when no weekly artifacts exist', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    const draft = JSON.parse(writtenDraft!) as { weeklyFooter?: unknown };
    expect(draft.weeklyFooter).toBeUndefined();
  });

  it('worthKnowing allows up to 4 editorial bullets (no footer hack)', async () => {
    const outputWithFourBullets = {
      ...MOCK_WRITER_OUTPUT,
      worthKnowing: [
        'Ethereum DeFi TVL fell 5% on Arbitrum.',
        'SEC clarified staking rules for institutional providers.',
        'Solana validator upgrades completed without incident.',
        'Fed minutes release Thursday may move risk assets.'
      ]
    };

    vi.mocked(callLlm).mockResolvedValue({
      ...MOCK_LLM_RESPONSE,
      content: JSON.stringify(outputWithFourBullets)
    });

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    const draft = JSON.parse(writtenDraft!) as { worthKnowing: string[] };
    expect(draft.worthKnowing).toHaveLength(4);
    expect(draft.worthKnowing[0]).toContain('Ethereum');
  });

  it('incorporates revision notes from previous editor round', async () => {
    const revisionNotes = JSON.stringify({
      revisionRound: 1,
      failedItems: [{ checkItem: '2 — Advisory Framing Check', detail: 'Found "you should" in whyItMoved', quotedText: 'you should' }],
      passingItems: []
    });

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      const p = filePath as string;
      if (p.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      if (p.includes(`.revisions-${TARGET_DATE}`)) {
        return revisionNotes as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    // .revisions file exists
    vi.mocked(fs.access).mockImplementation(async (filePath) => {
      if ((filePath as string).includes(`.revisions-${TARGET_DATE}`)) return;
      throw { code: 'ENOENT' };
    });

    await generateDailyReport(TARGET_DATE);

    const llmCalls = vi.mocked(callLlm).mock.calls;
    expect(llmCalls.length).toBeGreaterThanOrEqual(1);
    const userMessage = llmCalls[0][0].messages.find((m) => m.role === 'user');
    expect(userMessage?.content).toContain('REVISION NOTES');
  });

  it('snapshot.totalMarketCapUsd comes from researcher data, not LLM output', async () => {
    const llmOutputWithWrongCap = {
      ...MOCK_WRITER_OUTPUT,
      snapshot: { totalMarketCapUsd: 2807000000, btcDominancePct: 58.7, ethDominancePct: 13.1, fearGreedIndex: 72 }
    };

    vi.mocked(callLlm).mockResolvedValue({ ...MOCK_LLM_RESPONSE, content: JSON.stringify(llmOutputWithWrongCap) });

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    const draft = JSON.parse(writtenDraft!) as { snapshot: { totalMarketCapUsd: number } };
    expect(draft.snapshot.totalMarketCapUsd).toBeGreaterThan(1e11);
    expect(draft.snapshot.totalMarketCapUsd).toBe(3_200_000_000_000);
  });

  it('topTracked.marketCapUsd is populated from researcher data, not LLM output', async () => {
    const llmOutputWithZeroCaps = {
      ...MOCK_WRITER_OUTPUT,
      whatMoved: {
        ...MOCK_WRITER_OUTPUT.whatMoved,
        topTracked: MOCK_WRITER_OUTPUT.whatMoved.topTracked.map((a) => ({ ...a, marketCapUsd: 0 }))
      }
    };

    vi.mocked(callLlm).mockResolvedValue({ ...MOCK_LLM_RESPONSE, content: JSON.stringify(llmOutputWithZeroCaps) });

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    let writtenDraft: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (filePath, content) => {
      if (typeof filePath === 'string' && filePath.includes(`draft-${TARGET_DATE}.json`)) {
        writtenDraft = content as string;
      }
    });

    await generateDailyReport(TARGET_DATE);

    const draft = JSON.parse(writtenDraft!) as { whatMoved: { topTracked: Array<{ symbol: string; marketCapUsd: number }> } };
    const btc = draft.whatMoved.topTracked.find((a) => a.symbol === 'BTC');
    expect(btc).toBeDefined();
    expect(btc!.marketCapUsd).toBeGreaterThan(0);
    expect(btc!.marketCapUsd).toBe(1_880_000_000_000);
  });

  it('calls Anthropic as primary provider', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    await generateDailyReport(TARGET_DATE);

    const llmCall = vi.mocked(callLlm).mock.calls[0];
    expect(llmCall[1]?.primary).toBe('anthropic');
    expect(llmCall[1]?.secondary).toBe('github-models');
  });

  it('attempts self-correction when first LLM response fails validation', async () => {
    const invalidOutput = { ...MOCK_WRITER_OUTPUT, whatMoved: { ...MOCK_WRITER_OUTPUT.whatMoved, topTracked: [] } };

    vi.mocked(callLlm)
      .mockResolvedValueOnce({ ...MOCK_LLM_RESPONSE, content: JSON.stringify(invalidOutput) })
      .mockResolvedValueOnce(MOCK_LLM_RESPONSE);

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (typeof filePath === 'string' && filePath.includes('local-daily-input')) {
        return MOCK_RESEARCHER_INPUT as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never;
      }
      throw { code: 'ENOENT' };
    });

    await generateDailyReport(TARGET_DATE);

    expect(vi.mocked(callLlm)).toHaveBeenCalledTimes(2);
  });
});
