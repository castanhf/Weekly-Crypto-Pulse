import type { DailyArtifact } from '@/domain/daily';
import { isExcludedFromMovers } from '@/lib/markets/asset-categories';

/** Minimal researcher movers shape the validator needs — avoids coupling to script types. */
export type ResearcherMoversInput = Readonly<{
  winners: ReadonlyArray<Readonly<{ symbol: string; name: string; changePct24h: number }>>;
  losers: ReadonlyArray<Readonly<{ symbol: string; name: string; changePct24h: number }>>;
}>;

export type WinnersLosersValidationResult = Readonly<{
  valid: boolean;
  violations: string[];
}>;

/**
 * Validates that a daily artifact's whatMoved arrays are populated whenever
 * the researcher identified qualifying movers.
 *
 * A violation occurs when the researcher found eligible movers (rank 16–50,
 * >5% move, excluding stablecoins and wrapped/derivative tokens) but the
 * artifact's corresponding array is empty — indicating LLM omission rather
 * than a genuinely quiet day.
 */
export const validateWinnersLosers = (
  artifact: DailyArtifact,
  researcherMovers: ResearcherMoversInput
): WinnersLosersValidationResult => {
  const violations: string[] = [];

  const eligibleWinners = researcherMovers.winners.filter(
    (a) => !isExcludedFromMovers(a.symbol)
  );
  const eligibleLosers = researcherMovers.losers.filter(
    (a) => !isExcludedFromMovers(a.symbol)
  );

  if (eligibleWinners.length > 0 && artifact.whatMoved.winners.length === 0) {
    const missing = eligibleWinners.map((a) => a.symbol).join(', ');
    violations.push(`Missing winners: ${missing}`);
  }

  if (eligibleLosers.length > 0 && artifact.whatMoved.losers.length === 0) {
    const missing = eligibleLosers.map((a) => a.symbol).join(', ');
    violations.push(`Missing losers: ${missing}`);
  }

  return { valid: violations.length === 0, violations };
};
