# LLM Integration

## Provider architecture

The pipeline uses two LLM providers with automatic fallback:

| Role | Provider | Model |
|---|---|---|
| Primary | GitHub Models | `gpt-4o-mini` (researcher input), `gpt-4o-mini` (other scripts) |
| Fallback | Anthropic | `claude-sonnet-4-6` (all scripts) |

The writer and editor pipelines (`generate-daily-report.ts`, `review-daily-report.ts`) use Anthropic as primary.

### Client (`lib/llm/client.ts`)

`callLlm(request, options?)` wraps both providers behind a retry + fallback loop:
- Attempts the `primary` provider with exponential backoff (default 3 retries)
- On exhausted retries, falls through to the `secondary` provider (same retry logic)
- Passes `secondary: null` to disable fallback (used by smoke tests)

### Provider notes

**GitHub Models** (`lib/llm/providers/github-models.ts`):
- Reads `GITHUB_TOKEN` from the environment
- Endpoint: `https://models.inference.ai.azure.com/chat/completions`
- Supports `jsonMode` via `response_format: { type: 'json_object' }`

**Anthropic** (`lib/llm/providers/anthropic.ts`):
- Reads `ANTHROPIC_API_KEY` from the environment
- Model is hardcoded to `claude-sonnet-4-6`; the `model` field in `LlmRequest` is advisory only
- JSON mode is handled via system-prompt instructions (no `response_format` equivalent)

## Smoke test

`npm run smoke:llm` validates both providers end-to-end:

```
LLM Smoke Test
==============
✓ GITHUB_TOKEN present
✓ ANTHROPIC_API_KEY present
✓ github-models (gpt-4o-mini) responded (10in / 2out tokens): "PONG"
✓ anthropic (claude-sonnet-4-6) responded (15in / 2out tokens): "PONG"
```

The test exits non-zero if **either** provider fails. Both must succeed for the smoke test to pass.

Run locally before any LLM-dependent pipeline work:
```bash
npm run smoke:llm
```

In CI the smoke test is not run automatically (it incurs API costs). Run it manually after rotating credentials.

## Environment variables

| Variable | Provider | Notes |
|---|---|---|
| `GITHUB_TOKEN` | GitHub Models | Auto-injected by GitHub Actions; set in `.env.local` for local dev |
| `ANTHROPIC_API_KEY` | Anthropic | GitHub Actions secret; set in `.env.local` for local dev; rotate annually (1 Jan) |

## Error kinds

| Kind | Provider | Retryable | Typical cause |
|---|---|---|---|
| `auth` | both | No | Missing or invalid API key |
| `rate-limit` | both | Yes | Request rate exceeded |
| `transient` | both | Yes | 5xx from provider, network error |
| `schema-validation` | both | No | LLM output failed JSON schema check |
| `unknown` | both | No | Unexpected non-5xx error |
