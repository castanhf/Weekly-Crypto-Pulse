# R2 Release Notes

This document tracks all merged PRs across the R2 release phases.

## Release plan

R2 ships in two phases:

- **R2.0** — Invisible-to-readers infrastructure. Schema versioning, repository unification, agent additions, security baseline, brand simplification, plainspoken pass on chrome, build-time chart computation infrastructure.
- **R2.1** — Reader-visible launch. Daily pipeline activation, unified archive, charts on weeklies, merged paid block, /pro restructure, email list, Pro-pack updates.

## Architectural exceptions noted in R2

Two deliberate exceptions to the original "four env vars" line in the architectural constitution:

- `OPENAI_API_KEY` — added as a fallback LLM provider for pipeline reliability when GitHub Models is unavailable. Hard usage cap set in OpenAI dashboard.
- Beehiiv API key — added for email distribution via Beehiiv (newsletter signup and daily/weekly digest emails).

The Decision Register language updates from strict "four env vars" to "minimal env vars, justified additions only."

## R2.0 — Merged PRs

_(populated as PRs land in `release/r2.0`)_

## R2.1 — Merged PRs

_(populated as PRs land in `release/r2.1`)_
