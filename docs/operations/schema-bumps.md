# Schema Bump Checklist

When bumping an artifact schema version (e.g., `daily@1.1` → `daily@1.2`, or `weekly@1.2` → `weekly@1.3`), update **all of the following layers** in the same PR. Missing any layer creates a latent bug that surfaces only when a real artifact of the new version is written to `data/`.

The schema enforcement test (`lib/reports/schema-bump-coverage.test.ts`) acts as the automated guard: it walks `VALID_DAILY_SCHEMA_VERSIONS` and `VALID_WEEKLY_SCHEMA_VERSIONS` and verifies that both the validator and the repository parser handle every listed version. If you add a new constant to those arrays without updating the downstream layers, the test fails before any production artifact is affected.

---

## Layers to update

### 1 — Domain constants (`domain/schema-version.ts`)

- [ ] Add the new schema version string constant (e.g., `DAILY_SCHEMA_V1_3`)
- [ ] Add it to the `SchemaVersion` union type
- [ ] Add it to the appropriate `VALID_*_SCHEMA_VERSIONS` array (`VALID_DAILY_SCHEMA_VERSIONS` or `VALID_WEEKLY_SCHEMA_VERSIONS`)
- [ ] If it is the new "current" version for a cadence, note that in a JSDoc comment on the constant

The `VALID_SCHEMA_VERSIONS` set is derived from the two arrays — no separate update needed.

### 2 — Validator (`lib/reports/artifact-validator.ts`)

- [ ] Add a `validateDailyV*` or `validateWeeklyV*` function for the new version
- [ ] Wire it into the `validateArtifact` dispatch switch (the `default` case should remain an `isValidSchemaVersion` check so unknown versions throw clearly)
- [ ] The new validator should call the previous version's validation logic for inherited fields, then add rules for new fields

### 3 — Repository (reader layer)

**For daily artifacts** (`lib/reports/daily-repository.ts`):
- [ ] Add the new constant to the schema version guard (`if (schemaVersion !== ... && ...)`)
- [ ] Extend the `parsedSchemaVersion` ternary to return the correct constant for the new version
- [ ] Parse any new optional fields (e.g., `priceUsd`, `sectionLabels`) in the appropriate parse helper — use spread with `undefined` checks so old artifacts without those fields still parse cleanly

**For weekly artifacts** (`lib/reports/report-parser.ts`):
- [ ] Add the new constant to the import line from `domain/schema-version`
- [ ] Add it to the `SUPPORTED_SCHEMA_VERSIONS` set
- [ ] Add parsing for any new optional fields in `parseReportShape` — same spread-with-undefined-check pattern

### 4 — Pipeline scripts (writer layer)

- [ ] `scripts/generate-daily-report.ts` (or `generate-local-report.ts` for weekly): set `schemaVersion` to the new constant from `domain/schema-version`
- [ ] Update any `INLINE_SYSTEM_PROMPT` or `EDITOR_API_NOTE` constants in editor scripts that reference the schema version by string
- [ ] Update the agent spec files if they reference a specific schema version string (Check 7 in `daily_editor.md`)

### 5 — Agent specs (`.claude/agents/*.md`)

- [ ] `daily_editor.md` — Check 7 (Schema Check): add the new version to the accepted list; keep the previous version as a legacy-valid option
- [ ] `daily_writer.md` — update any schema version references
- [ ] If this is a weekly schema bump: update `weekly_editor.md` and `weekly_writer.md` equivalents

### 6 — React components (renderer layer)

- [ ] `components/reports/daily-report-page.tsx` — render any new fields; add a fallback (`?? 'default'` or conditional) so old artifacts without the new fields still render correctly
- [ ] `components/reports/winners-losers.tsx` — same for any new weekly fields
- [ ] Other components that consume artifact fields

### 7 — Tests

- [ ] `lib/reports/artifact-validator.test.ts` — add test cases for the new schema version (valid artifact, missing required field, wrong type)
- [ ] `lib/reports/daily-repository.test.ts` (if it exists) — add test cases for reading and parsing the new version
- [ ] `lib/reports/schema-bump-coverage.test.ts` — **no manual update needed** if the new constant is added to `VALID_*_SCHEMA_VERSIONS`; the parametric test picks it up automatically

### 8 — Documentation

- [ ] `docs/operations/decision-register.md` — add an entry documenting the rationale for the schema bump and the version transition
- [ ] Update this checklist if the bump revealed a new required layer (e.g., a new cache layer, a new renderer component)

---

## Pre-merge validation

Before merging a schema bump PR, verify:

- [ ] `npm run typecheck` is clean
- [ ] `npm run test` passes — specifically, `schema-bump-coverage.test.ts` must pass for all versions
- [ ] `npm run validate:reports` passes for existing artifacts in `data/` (backward compatibility preserved)
- [ ] `npm run validate:agents` passes
- [ ] `npm run build` succeeds

---

## After merging

- Tomorrow's scheduled cron should produce an artifact with the new schema version
- The site must render both old (legacy schema) and new artifacts side-by-side without errors
- Check the `data/dailies/` or `data/reports/` directory after the next pipeline run to confirm the new artifact has the expected `schemaVersion` field

---

## History of schema bumps

| Version | PR | Rationale |
|---|---|---|
| `daily@1.0` | WCP-102 | Initial daily artifact format |
| `daily@1.1` | WCP-132 | Additive `weeklyFooter` field; replaces the `worthKnowing[3]` hack |
| `daily@1.2` | WCP-153 | Top-N winners/losers rule (N=1); `MoverEntry` gains `priceUsd` + `priceChange24hUsd`; `whatMoved` gains `sectionLabels` |
| `weekly@1.0` | R1 | Initial weekly artifact format (legacy `"1.0"` string) |
| `weekly@1.1` | — | Additive `plainspokenOpening` field |
| `weekly@1.2` | WCP-123 | Additive `capitalFlows` field (DeFiLlama TVL data) |
| `weekly@1.3` | WCP-153 | Additive `sectionLabels` field on report (adaptive winners/losers labels) |
