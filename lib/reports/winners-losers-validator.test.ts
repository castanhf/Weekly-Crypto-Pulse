import { describe, expect, it } from 'vitest';

import type { DailyArtifact, MoverEntry } from '@/domain/daily';
import { validateWinnersLosers } from '@/lib/reports/winners-losers-validator';
import type { ResearcherMoversInput } from '@/lib/reports/winners-losers-validator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = 'daily@1.2' as const;

const makeArtifact = (
  winners: MoverEntry[],
  losers: MoverEntry[]
): DailyArtifact => ({
  schemaVersion: SCHEMA_VERSION,
  generatedAt: '2026-05-12T00:00:00.000Z',
  publishedAt: '2026-05-12',
  slug: '2026-05-12-test-headline',
  headline: 'Test headline',
  summary: 'Test summary.',
  whatMoved: {
    winners,
    losers,
    topTracked: []
  },
  whyItMoved: 'Markets moved because of reasons.',
  worthKnowing: [],
  snapshot: {
    totalMarketCapUsd: 2_500_000_000_000,
    btcDominancePct: 55.0,
    ethDominancePct: 12.0,
    fearGreedIndex: 60
  },
  tags: ['bitcoin', 'ethereum']
});

const makeMover = (symbol: string, name: string, changePct24h: number): MoverEntry => ({
  symbol,
  name,
  changePct24h,
  catalyst: 'test catalyst'
});

const makeResearcherMover = (symbol: string, name: string, changePct24h: number) => ({
  symbol,
  name,
  changePct24h
});

// ---------------------------------------------------------------------------
// Tests — new top-N rule (daily@1.2): always exactly 1 winner + 1 loser
// ---------------------------------------------------------------------------

describe('validateWinnersLosers', () => {
  describe('correct artifact', () => {
    it('passes when artifact has exactly 1 winner and 1 loser matching researcher', () => {
      const artifact = makeArtifact(
        [makeMover('SOL', 'Solana', 5.2)],
        [makeMover('XRP', 'XRP', -3.1)]
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('missing winners in artifact', () => {
    it('fails when artifact winners array is empty', () => {
      const artifact = makeArtifact(
        [],
        [makeMover('XRP', 'XRP', -3.1)]
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes('winners'))).toBe(true);
    });

    it('reports the missing winner symbol', () => {
      const artifact = makeArtifact([], [makeMover('XRP', 'XRP', -3.1)]);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.violations.some((v) => v.includes('SOL'))).toBe(true);
    });
  });

  describe('missing losers in artifact', () => {
    it('fails when artifact losers array is empty', () => {
      const artifact = makeArtifact([makeMover('SOL', 'Solana', 5.2)], []);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes('losers'))).toBe(true);
    });

    it('reports the missing loser symbol', () => {
      const artifact = makeArtifact([makeMover('SOL', 'Solana', 5.2)], []);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.violations.some((v) => v.includes('XRP'))).toBe(true);
    });
  });

  describe('missing both winners and losers', () => {
    it('reports violations for both arrays when both are empty', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('wrong symbol in artifact', () => {
    it('fails when artifact winner symbol does not match researcher', () => {
      const artifact = makeArtifact(
        [makeMover('ETH', 'Ethereum', 2.0)], // wrong — researcher says SOL
        [makeMover('XRP', 'XRP', -3.1)]
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes('SOL'))).toBe(true);
    });

    it('fails when artifact loser symbol does not match researcher', () => {
      const artifact = makeArtifact(
        [makeMover('SOL', 'Solana', 5.2)],
        [makeMover('BTC', 'Bitcoin', -0.5)] // wrong — researcher says XRP
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.includes('XRP'))).toBe(true);
    });
  });

  describe('extra entries in artifact', () => {
    it('fails when artifact has more winners than expected', () => {
      const artifact = makeArtifact(
        [makeMover('SOL', 'Solana', 5.2), makeMover('ADA', 'Cardano', 4.1)],
        [makeMover('XRP', 'XRP', -3.1)]
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('SOL', 'Solana', 5.2)],
        losers: [makeResearcherMover('XRP', 'XRP', -3.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
    });
  });
});
