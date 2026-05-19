# Model Configuration

## Overview

The pipeline uses two LLM providers in a primary/fallback pattern via `lib/llm/client.ts`:

- **Anthropic** (primary for writer, editor, Sunday digest): Claude Sonnet 4.6 — 200K context, high quality
- **GitHub Models** (primary for researchers, fallback for writer/editor): gpt-4o-mini — free tier, sufficient for data gathering

## Per-Agent Configuration

Each script defines its own `*_LLM` constant to make routing intent explicit and self-documenting:

```typescript
// Pattern B — per-agent LLM config (writer, editor, Sunday digest)
const WRITER_LLM = {
  model: 'gpt-4o-mini' as const, // used only by github-models fallback; anthropic always uses Sonnet 4.6
  primary: 'anthropic' as const,
  secondary: 'github-models' as const
} as const;
```

> **Why `model: 'gpt-4o-mini'` with `primary: 'anthropic'`?**
> The Anthropic provider in `lib/llm/providers/anthropic.ts` hardcodes `claude-sonnet-4-6` and ignores `request.model`. The `model` field is only consumed by the GitHub Models provider, which uses it as the fallback model name. Specifying `gpt-4o-mini` here ensures the fallback is a valid, free-tier GitHub Models model.

## Agent Routing Table

| Script | `*_LLM` const | Primary | Fallback | Model used |
|--------|--------------|---------|----------|------------|
| `generate-daily-input.ts` | (inline) | github-models | anthropic | gpt-4o-mini / Sonnet 4.6 |
| `generate-report-input.ts` | (inline) | github-models | anthropic | gpt-4o-mini / Sonnet 4.6 |
| `generate-daily-report.ts` | `WRITER_LLM` | **anthropic** | github-models | **Sonnet 4.6** / gpt-4o-mini |
| `review-daily-report.ts` | `EDITOR_LLM` | **anthropic** | github-models | **Sonnet 4.6** / gpt-4o-mini |
| `run-sunday-digest-pipeline.ts` | `SUNDAY_DIGEST_LLM` | **anthropic** | github-models | **Sonnet 4.6** / gpt-4o-mini |

## Swapping Models

To change a model for a single agent, update only that agent's `*_LLM` constant. No other files need to change.

To change the Anthropic model globally, update `ANTHROPIC_MODEL` in `lib/llm/providers/anthropic.ts`.

## Rationale for Anthropic-Primary (writer/editor)

WCP-151 testing on gpt-4o-mini revealed a quality ceiling that prompt engineering alone could not overcome:
- Advisory framing persisted through 5 rounds despite exhaustive spec updates
- Editor Check 3 hallucinated ~40% of rounds (false positives on movers)
- Summaries consistently led with prices despite explicit counter-examples in spec

During a WCP-151 run, the GitHub Models 413 error triggered an automatic Sonnet 4.6 fallback, which produced noticeably better output on the first pass. WCP-152 formalizes Sonnet 4.6 as the primary for content-generation agents.

## Per Policy C

If Sonnet 4.6 output is observably worse than gpt-4o-mini output in practice, document the finding and propose adjustments. Do not autonomously revert.
