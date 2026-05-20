import type { DailyArtifact } from '../../domain/daily';
import { DAILY_TOP_N } from '../markets/winners-losers';

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
 * Validates that a daily artifact's whatMoved arrays match the researcher's
 * always-populated top-N selection (introduced in WCP-153, daily@1.2).
 *
 * Rule: the researcher always provides exactly DAILY_TOP_N winners and DAILY_TOP_N
 * losers. The artifact must mirror them exactly — any deviation (omission, addition,
 * symbol mismatch) is a violation.
 */
export const validateWinnersLosers = (
  artifact: DailyArtifact,
  researcherMovers: ResearcherMoversInput
): WinnersLosersValidationResult => {
  const violations: string[] = [];

  if (artifact.whatMoved.winners.length !== DAILY_TOP_N) {
    violations.push(
      `whatMoved.winners must have exactly ${DAILY_TOP_N} entry, got ${artifact.whatMoved.winners.length}`
    );
  }

  if (artifact.whatMoved.losers.length !== DAILY_TOP_N) {
    violations.push(
      `whatMoved.losers must have exactly ${DAILY_TOP_N} entry, got ${artifact.whatMoved.losers.length}`
    );
  }

  // Verify symbols match researcher
  const researcherWinnerSymbols = researcherMovers.winners.map((m) => m.symbol.toUpperCase());
  const artifactWinnerSymbols = artifact.whatMoved.winners.map((m) => m.symbol.toUpperCase());
  for (const sym of researcherWinnerSymbols) {
    if (!artifactWinnerSymbols.includes(sym)) {
      violations.push(`Winner ${sym} from researcher is missing from artifact`);
    }
  }

  const researcherLoserSymbols = researcherMovers.losers.map((m) => m.symbol.toUpperCase());
  const artifactLoserSymbols = artifact.whatMoved.losers.map((m) => m.symbol.toUpperCase());
  for (const sym of researcherLoserSymbols) {
    if (!artifactLoserSymbols.includes(sym)) {
      violations.push(`Loser ${sym} from researcher is missing from artifact`);
    }
  }

  return { valid: violations.length === 0, violations };
};
