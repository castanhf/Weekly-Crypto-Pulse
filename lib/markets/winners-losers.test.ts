import { describe, expect, it } from 'vitest';

import { computeMovers, DAILY_TOP_N, WEEKLY_TOP_N } from './winners-losers';
import type { MoverCandidate } from './winners-losers';

const makeCandidate = (symbol: string, changePct24h: number, priceUsd = 100): MoverCandidate => ({
  symbol,
  name: `${symbol} name`,
  changePct24h,
  priceUsd,
  marketCapUsd: 1_000_000_000
});

describe('computeMovers', () => {
  describe('daily (N=1)', () => {
    it('returns exactly 1 winner and 1 loser', () => {
      const candidates = [
        makeCandidate('AAA', 10),
        makeCandidate('BBB', 5),
        makeCandidate('CCC', -3),
        makeCandidate('DDD', -8)
      ];
      const result = computeMovers(candidates, 'daily');
      expect(result.winners).toHaveLength(DAILY_TOP_N);
      expect(result.losers).toHaveLength(DAILY_TOP_N);
    });

    it('picks the best winner (highest changePct24h)', () => {
      const candidates = [makeCandidate('AAA', 10), makeCandidate('BBB', 5), makeCandidate('CCC', -3)];
      const result = computeMovers(candidates, 'daily');
      expect(result.winners[0]?.symbol).toBe('AAA');
    });

    it('picks the worst loser (most negative changePct24h)', () => {
      const candidates = [makeCandidate('AAA', 10), makeCandidate('BBB', -3), makeCandidate('CCC', -8)];
      const result = computeMovers(candidates, 'daily');
      expect(result.losers[0]?.symbol).toBe('CCC');
    });

    it('computes priceChange24hUsd correctly', () => {
      const candidates = [makeCandidate('AAA', 10, 200), makeCandidate('BBB', -5, 100)];
      const result = computeMovers(candidates, 'daily');
      // priceChange24hUsd = Math.round(priceUsd * changePct24h) / 100
      expect(result.winners[0]?.priceChange24hUsd).toBe(20); // Math.round(200 * 10) / 100
      expect(result.losers[0]?.priceChange24hUsd).toBe(-5); // Math.round(100 * -5) / 100
    });
  });

  describe('weekly (N=3)', () => {
    it('returns exactly 3 winners and 3 losers', () => {
      const candidates = [
        makeCandidate('A', 15),
        makeCandidate('B', 10),
        makeCandidate('C', 5),
        makeCandidate('D', 2),
        makeCandidate('E', -2),
        makeCandidate('F', -7),
        makeCandidate('G', -12)
      ];
      const result = computeMovers(candidates, 'weekly');
      expect(result.winners).toHaveLength(WEEKLY_TOP_N);
      expect(result.losers).toHaveLength(WEEKLY_TOP_N);
    });

    it('winners are sorted best-first', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', 15), makeCandidate('C', 10), makeCandidate('D', -5)];
      const result = computeMovers(candidates, 'weekly');
      expect(result.winners.map((w) => w.symbol)).toEqual(['B', 'C', 'A']);
    });

    it('losers are sorted worst-first', () => {
      const candidates = [
        makeCandidate('A', 5),
        makeCandidate('B', -2),
        makeCandidate('C', -8),
        makeCandidate('D', -15)
      ];
      const result = computeMovers(candidates, 'weekly');
      expect(result.losers.map((l) => l.symbol)).toEqual(['D', 'C', 'B']);
    });
  });

  describe('market regime detection', () => {
    it('returns mixed when positive and negative exist', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', -3)];
      expect(computeMovers(candidates, 'daily').marketRegime).toBe('mixed');
    });

    it('returns all-positive when all candidates > 0', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', 2), makeCandidate('C', 0.1)];
      expect(computeMovers(candidates, 'daily').marketRegime).toBe('all-positive');
    });

    it('returns all-negative when all candidates < 0', () => {
      const candidates = [makeCandidate('A', -5), makeCandidate('B', -2), makeCandidate('C', -0.1)];
      expect(computeMovers(candidates, 'daily').marketRegime).toBe('all-negative');
    });

    it('returns mixed for empty candidates', () => {
      expect(computeMovers([], 'daily').marketRegime).toBe('mixed');
    });
  });

  describe('section labels', () => {
    it('uses Winners/Losers for mixed regime', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', -3)];
      const { sectionLabels } = computeMovers(candidates, 'daily');
      expect(sectionLabels.winners).toBe('Winners');
      expect(sectionLabels.losers).toBe('Losers');
    });

    it('uses Winners/Weakest gainers for all-positive regime', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', 2)];
      const { sectionLabels } = computeMovers(candidates, 'daily');
      expect(sectionLabels.winners).toBe('Winners');
      expect(sectionLabels.losers).toBe('Weakest gainers');
    });

    it('uses Smallest losses/Losers for all-negative regime', () => {
      const candidates = [makeCandidate('A', -5), makeCandidate('B', -2)];
      const { sectionLabels } = computeMovers(candidates, 'daily');
      expect(sectionLabels.winners).toBe('Smallest losses');
      expect(sectionLabels.losers).toBe('Losers');
    });
  });

  describe('edge cases', () => {
    it('returns empty arrays for empty candidates', () => {
      const result = computeMovers([], 'daily');
      expect(result.winners).toHaveLength(0);
      expect(result.losers).toHaveLength(0);
    });

    it('handles single candidate (same asset in both arrays)', () => {
      const result = computeMovers([makeCandidate('A', 5)], 'daily');
      expect(result.winners).toHaveLength(1);
      expect(result.losers).toHaveLength(1);
      expect(result.winners[0]?.symbol).toBe('A');
      expect(result.losers[0]?.symbol).toBe('A');
    });

    it('handles fewer candidates than N (weekly)', () => {
      const candidates = [makeCandidate('A', 5), makeCandidate('B', -3)];
      const result = computeMovers(candidates, 'weekly');
      expect(result.winners).toHaveLength(2);
      expect(result.losers).toHaveLength(2);
    });
  });
});
