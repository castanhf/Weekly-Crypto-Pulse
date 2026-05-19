import { describe, expect, it } from 'vitest';

import { isStuckLoop } from '@/lib/agents/stuck-loop';

describe('isStuckLoop', () => {
  it('detects stuck when headline and all failed check IDs are identical', () => {
    const result = isStuckLoop(
      'Bitcoin holds $78K as market drifts',
      'Bitcoin holds $78K as market drifts',
      ['10 — Headline Specificity Check', '12 — Causal Attribution Check'],
      ['10 — Headline Specificity Check', '12 — Causal Attribution Check']
    );
    expect(result).toBe(true);
  });

  it('is NOT stuck when headline differs even if same checks failed', () => {
    const result = isStuckLoop(
      'Bitcoin rises to $79K amid regulatory clarity',
      'Bitcoin holds $78K as market drifts',
      ['10 — Headline Specificity Check'],
      ['10 — Headline Specificity Check']
    );
    expect(result).toBe(false);
  });

  it('is NOT stuck when headlines match but different check IDs failed', () => {
    const result = isStuckLoop(
      'Bitcoin holds $78K as market drifts',
      'Bitcoin holds $78K as market drifts',
      ['11 — Summary Editorial Check'],
      ['10 — Headline Specificity Check', '12 — Causal Attribution Check']
    );
    expect(result).toBe(false);
  });

  it('is NOT stuck when current failedCheckIds is empty (approved state)', () => {
    const result = isStuckLoop(
      'Bitcoin holds $78K as market drifts',
      'Bitcoin holds $78K as market drifts',
      [],
      ['10 — Headline Specificity Check']
    );
    expect(result).toBe(false);
  });

  it('is NOT stuck when check IDs differ in count', () => {
    const result = isStuckLoop(
      'Bitcoin holds $78K',
      'Bitcoin holds $78K',
      ['10 — Headline Specificity Check'],
      ['10 — Headline Specificity Check', '12 — Causal Attribution Check']
    );
    expect(result).toBe(false);
  });

  it('normalizes whitespace in headline comparison', () => {
    const result = isStuckLoop(
      '  Bitcoin  holds  $78K  ',
      'Bitcoin holds $78K',
      ['10 — Headline Specificity Check'],
      ['10 — Headline Specificity Check']
    );
    expect(result).toBe(true);
  });

  it('normalizes case in headline comparison', () => {
    const result = isStuckLoop(
      'BITCOIN HOLDS $78K AS MARKET DRIFTS',
      'bitcoin holds $78k as market drifts',
      ['10 — Headline Specificity Check'],
      ['10 — Headline Specificity Check']
    );
    expect(result).toBe(true);
  });

  it('different headlines, no failed checks → not stuck', () => {
    const result = isStuckLoop('New headline', 'Old headline', [], []);
    expect(result).toBe(false);
  });
});
