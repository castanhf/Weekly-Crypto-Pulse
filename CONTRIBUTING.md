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

## Communication

Discussions happen via GitHub Issues. Email contact is for security issues only — see [SECURITY.md](SECURITY.md).
