import { describe, expect, it } from 'vitest';

import type { DailyArtifact, MoverEntry } from '@/domain/daily';
import { validateWinnersLosers } from '@/lib/reports/winners-losers-validator';
import type { ResearcherMoversInput } from '@/lib/reports/winners-losers-validator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = 'daily@1.1' as const;

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
// Tests
// ---------------------------------------------------------------------------

describe('validateWinnersLosers', () => {
  describe('both arrays empty when no movers', () => {
    it('passes when researcher has no winners and no losers', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = { winners: [], losers: [] };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('winners present in researcher and artifact', () => {
    it('passes when researcher winners match artifact winners', () => {
      const artifact = makeArtifact(
        [makeMover('LINK', 'Chainlink', 12.5)],
        []
      );
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('LINK', 'Chainlink', 12.5)],
        losers: []
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('missing winners in artifact', () => {
    it('fails when researcher has winners but artifact has none', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('LINK', 'Chainlink', 12.5)],
        losers: []
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain('LINK');
      expect(result.violations[0]).toContain('Missing winners');
    });

    it('lists all missing winner symbols in the violation message', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [
          makeResearcherMover('LINK', 'Chainlink', 12.5),
          makeResearcherMover('DOT', 'Polkadot', 8.3)
        ],
        losers: []
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.violations[0]).toContain('LINK');
      expect(result.violations[0]).toContain('DOT');
    });
  });

  describe('missing losers in artifact', () => {
    it('fails when researcher has losers but artifact has none', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [],
        losers: [makeResearcherMover('ATOM', 'Cosmos', -9.1)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain('ATOM');
      expect(result.violations[0]).toContain('Missing losers');
    });
  });

  describe('missing both winners and losers', () => {
    it('reports two violations when both arrays are empty despite researcher data', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [makeResearcherMover('LINK', 'Chainlink', 7.2)],
        losers: [makeResearcherMover('ATOM', 'Cosmos', -6.4)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(2);
    });
  });

  describe('stablecoin exclusion', () => {
    it('passes when the only researcher winner is a stablecoin', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        // USDT is a stablecoin — should be excluded from winners/losers check
        winners: [makeResearcherMover('USDT', 'Tether', 5.2)],
        losers: []
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(true);
    });

    it('passes when the only researcher loser is a wrapped/derivative token', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [],
        // WBTC is a wrapped token — excluded
        losers: [makeResearcherMover('WBTC', 'Wrapped Bitcoin', -6.8)]
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(true);
    });

    it('fails when a non-stablecoin winner is missing despite stablecoin in researcher data', () => {
      const artifact = makeArtifact([], []);
      const movers: ResearcherMoversInput = {
        winners: [
          makeResearcherMover('USDT', 'Tether', 5.1), // excluded (stablecoin)
          makeResearcherMover('LINK', 'Chainlink', 11.2) // should appear in artifact
        ],
        losers: []
      };

      const result = validateWinnersLosers(artifact, movers);

      expect(result.valid).toBe(false);
      expect(result.violations[0]).toContain('LINK');
      expect(result.violations[0]).not.toContain('USDT');
    });

    it('covers multiple stablecoin symbols from the registry', () => {
      const stablecoins = ['USDC', 'DAI', 'BUSD', 'FDUSD'];
      for (const symbol of stablecoins) {
        const artifact = makeArtifact([], []);
        const movers: ResearcherMoversInput = {
          winners: [makeResearcherMover(symbol, symbol, 6.0)],
          losers: []
        };

        const result = validateWinnersLosers(artifact, movers);
        expect(result.valid).toBe(true);
      }
    });
  });
});
