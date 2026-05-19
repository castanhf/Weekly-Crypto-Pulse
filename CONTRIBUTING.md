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

## Import conventions

This project has two import styles depending on where the file lives:

- **Next.js components (under `app/`, `components/`):** use the `@/` path alias for clarity (e.g., `import { foo } from '@/lib/site'`).
- **Library code consumed by Node scripts (`lib/agents/`, `lib/reports/`, `lib/email/`, `lib/market-data/`, `lib/markets/`, `lib/news/`, `lib/llm/`, `lib/charts/`, `lib/cache/`):** use relative imports (e.g., `import { foo } from '../../domain/schema-version'`).

Why: pipeline scripts compile via `tsconfig.scripts.json` and run via plain Node, which cannot resolve TypeScript path aliases. Files in script-consumed directories must use relative imports to remain importable from compiled scripts.

`npm run test` includes a static check (`lib/import-convention.test.ts`) that fails if any `@/` import appears in a source file under those directories.

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

Pipeline scripts that use these agents load the spec at startup via:

```typescript
import { loadAgentSpec } from '../lib/agents/load-spec';

const specBody = loadAgentSpec('daily_writer');
const SYSTEM_PROMPT = specBody !== null ? `${specBody}\n\n${API_NOTE}` : INLINE_FALLBACK;
```

The `API_NOTE` appended to each spec tells the model to return JSON (not write files) since it is called via API, not as an interactive Claude agent. The inline fallback is kept to prevent pipeline failure if the spec file is somehow missing.

**Do not** duplicate spec content as inline constants in scripts. The drift between agent spec files and inline constants caused editorial quality issues in R2.1.1; this convention prevents recurrence.

## Communication

Discussions happen via GitHub Issues. Email contact is for security issues only — see [SECURITY.md](SECURITY.md).
