# Contributing to Crypto Pulse

## Welcome

Thank you for your interest. Crypto Pulse is a single-author portfolio project. Contributions are welcome within the scope outlined below — but the editorial direction, architectural decisions, and LLM agent prompts are set and are not subject to community input.

## What's in scope

- **Bug fixes** — anything that causes incorrect behavior, broken builds, or test failures
- **Test coverage improvements** — additional unit or integration tests for existing behavior
- **Documentation clarifications** — typos, outdated instructions, unclear explanations in docs or code comments
- **Refactors that improve clarity** — without changing architecture or behavior
- **Accessibility improvements** — WCAG compliance, semantic HTML, keyboard navigation
- **Performance improvements** — measurable, targeted, with no architectural change

## What's out of scope

- Feature additions that change the editorial direction (the editorial decisions are set)
- Architectural changes — the static-first, no-database, no-auth approach is locked
- Changes to the LLM agent prompts in `.claude/agents/` — these are editorially curated; if you spot a quality issue, open an issue to discuss before proposing a change
- Pro tier deliverable changes
- Brand or naming changes
- New dependencies without a strong justification

## How to contribute

1. **Open an issue first.** Describe your proposed change. For bugs, include reproduction steps, the expected behavior, and the actual behavior.
2. **Wait for a response.** Confirm the change is in scope before writing code.
3. **Fork, implement, and open a PR.** Reference the issue in the PR description.
4. **Keep PRs small and focused.** One concern per PR.

## Code style

The project uses Prettier and ESLint. Run both before opening a PR:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript strict mode
```

TypeScript strict mode is non-negotiable. No `any`, no `as unknown as`, no suppression of type errors with comments unless there is a documented reason.

## Tests

```bash
npm run test  # Vitest unit + integration tests
```

New code should include tests where applicable. Bug fixes should include a regression test.

### Component rendering tests

React components are tested with `@testing-library/react` under a `happy-dom` environment (configured globally in `vitest.config.ts`). Test files use the `.test.tsx` extension and live alongside the component they test.

Key patterns:
- Mock `next/link` as a plain `<a>` tag so links render without the Next.js router
- Mock `next/navigation` hooks (e.g. `usePathname`) using `vi.hoisted(() => vi.fn())` to avoid temporal-dead-zone issues with hoisted `vi.mock`
- Mock side-effectful modules (`@/lib/analytics/events`, etc.) when testing components that use them
- `@testing-library/jest-dom/vitest` matchers (`toBeInTheDocument`, `toHaveAttribute`, etc.) are available globally via `vitest.setup.ts`

Tests that mock `node:fs` or other Node.js internals require `// @vitest-environment node` at the top of the file (the global environment is `happy-dom`).

## Import conventions

This project has two import styles depending on where the file lives:

- **Next.js components (under `app/`, `components/`):** use the `@/` path alias for clarity (e.g., `import { foo } from '@/lib/site'`).
- **Library code consumed by Node scripts (`lib/agents/`, `lib/reports/`, `lib/email/`, `lib/market-data/`, `lib/markets/`, `lib/news/`, `lib/llm/`, `lib/charts/`, `lib/cache/`):** use relative imports (e.g., `import { foo } from '../../domain/schema-version'`).
- **Pipeline scripts (under `scripts/`):** use relative imports — same constraint as the `lib/` directories above (e.g., `import { foo } from '../lib/llm/client'`).

Why: pipeline scripts compile via `tsconfig.scripts.json` and run via plain Node, which cannot resolve TypeScript path aliases. Files in script-consumed directories must use relative imports to remain importable from compiled scripts.

`npm run test` includes a static check (`lib/import-convention.test.ts`) that fails if any `@/` import appears in a source file under those directories, including `scripts/`.

## Environment variables

Pipeline scripts load environment variables via `dotenv` at the script entry point. This means:

- **Local development:** create a `.env.local` file in the repo root with required vars (see `.env.example`). Scripts load it automatically at startup via `dotenv.config({ path: '.env.local' })`.
- **CI (GitHub Actions):** secrets are injected into the runner's environment via the workflow's `env:` block. Scripts read them directly from `process.env`; no file is needed, and `dotenv` silently skips the missing file.

When adding a new pipeline script entry point that reads env vars, add the following at the very top of the file, before any other imports:

```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
```

Do **not** use Node's `--env-file` flag in npm scripts — it requires the file to exist and breaks in CI with exit code 9.

`npm run test` includes a static check (`lib/env-loading.test.ts`) that fails if a listed entry-point script is missing the dotenv import, or if any npm script reintroduces `--env-file`.

## Agent specifications

All editorial agent prompts are defined in `.claude/agents/*.md` files. These files are the **single source of truth** for agent behavior (voice rules, checklist items, output format, examples).

### Pattern 1 — Full spec loading (writer and editor)

Pipeline scripts that use editorial agents (writer, editor) load the full spec at startup via `loadAgentSpec`, then append an API note that overrides the `## Outputs` section (which describes file writing — not applicable in API mode):

```typescript
import { loadAgentSpec } from '../lib/agents/load-spec';

const WRITER_API_NOTE = `\n\n## API Mode Output (overrides ## Outputs above)\n...return JSON instead of writing files...`;

const specBody = loadAgentSpec('daily_writer');
const SYSTEM_PROMPT = specBody !== null ? `${specBody}${WRITER_API_NOTE}` : INLINE_SYSTEM_PROMPT;
```

The inline fallback (`INLINE_SYSTEM_PROMPT`) is kept to prevent pipeline failure if the spec file is somehow missing. With Anthropic (200K context) as primary for writer and editor, full spec loading is safe — no context budget concern.

**Do not** duplicate spec content as inline constants in scripts as the primary source. The drift between agent spec files and inline constants caused editorial quality issues in R2.1.1; the `.claude/agents/*.md` files are authoritative.

**Keeping the inline fallback in sync.** Scripts that use full spec loading still carry an `INLINE_SYSTEM_PROMPT` constant as a fallback. When you update a checklist in the markdown spec (add, remove, or rename an item), you must update the inline fallback too — including the item count in the header. The automated guard is `lib/agents/editor-spec-consistency.test.ts`: it parses both the markdown spec and the inline fallback and asserts that all check numbers and key names match. Run it before committing spec changes:

```bash
npx vitest run lib/agents/editor-spec-consistency.test.ts
```

### Pattern 2 — Researcher (no spec file)

Researcher scripts (`generate-daily-input.ts`, `generate-report-input.ts`) use inline `SYSTEM_PROMPT` constants directly with no spec file. These agents do structured data gathering, not prose generation, so the prompt is short and stable enough not to warrant a separate spec file.

### Per-agent LLM config

Each content-generating script defines its own `*_LLM` constant to make provider routing explicit:

```typescript
const WRITER_LLM = {
  model: 'gpt-4o-mini' as const, // used only by github-models fallback; anthropic ignores this
  primary: 'anthropic' as const,
  secondary: 'github-models' as const
} as const;

// callsite:
await callLlm({ model: WRITER_LLM.model, ... }, { primary: WRITER_LLM.primary, secondary: WRITER_LLM.secondary, ... });
```

Writer, editor, and Sunday digest use `primary: 'anthropic'`. Researchers use `primary: 'github-models'`. See `docs/operations/model-configuration.md` for the full routing table and rationale.

## Schema bumps

When you add or change the shape of a report artifact, bump the schema version. The process is an 8-layer checklist documented at `docs/operations/schema-bumps.md`. The automated guard is:

```bash
npm run test  # lib/reports/schema-bump-coverage.test.ts fails if a new version is listed in VALID_*_SCHEMA_VERSIONS but not supported by the validator or repository parser
```

Checklist summary: domain constant → TypeScript type → validator → repository parser → agent spec (writer) → agent spec (editor) → React component → test.

## Bundle size

Monitor bundle size after any significant dependency change (new library, framework upgrade):

```bash
npm run build:analyze   # opens .next/analyze/client.html and nodejs.html
```

Soft budgets (from `docs/operations/bundle-size-baseline.md`):

| Chunk | Soft budget |
|---|---|
| Any single chunk | 400 KB uncompressed |
| Total static JS | 1.5 MB uncompressed |

Current baseline: 1.1 MB / 11 chunks (post-Tailwind v4). If a chunk grows >20% beyond baseline, investigate and document before merging.

## Smoke tests

Two smoke tests validate environment configuration without spending significant tokens or API quota:

```bash
npm run smoke:llm      # validates GitHub Models + Anthropic credentials; ~30 seconds
npm run smoke:beehiiv  # validates Beehiiv connectivity (informational; email distribution is currently disabled)
```

Run `smoke:llm` after any LLM provider config change. Run `smoke:beehiiv` after any Beehiiv credentials rotation.

## Communication

Discussions happen via GitHub Issues. Email contact is for security issues only — see [SECURITY.md](SECURITY.md).
