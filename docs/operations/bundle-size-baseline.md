# Bundle Size Baseline

Captured from `release/r2.1.1` after WCP-129 (Tailwind v4) + WCP-158 (React 19) + WCP-149 (TS 6) merges (2026-05-20) via `npm run build`.

## How to run the analyzer

```bash
npm run build:analyze   # sets ANALYZE=true; opens two HTML reports in the browser
                        #   client.html  — client-side chunks
                        #   nodejs.html  — server-side chunks
```

The HTML reports are written to `.next/analyze/` and are **not** committed to the repository.

## Baseline snapshot (2026-05-20)

| Metric | Value |
|---|---|
| Total static JS (`/.next/static/chunks/`) | **1.1 MB** (12 chunks) |
| Largest chunk | **~359 KB** (recharts + report page) |
| Second largest | **~228 KB** (framework / Next.js runtime) |
| Build time | ~30 s |

### Top chunks by size (uncompressed)

| Approximate size | Role |
|---|---|
| 359 KB | Report page bundle (includes recharts) |
| 228 KB | Next.js framework runtime |
| 150 KB | Shared UI / page-shell components |
| 113 KB | Shared async chunk (reports, pro) |
| 55 KB | Analytics and conversion |

## Budget guidance

These are soft targets — break them deliberately if a feature requires it, but investigate and document any chunk that grows more than 20 % beyond these baselines.

| Chunk | Soft budget |
|---|---|
| Any single chunk | 400 KB uncompressed |
| Total static JS | 1.5 MB uncompressed |

## Updating this baseline

Re-run `npm run build` after a significant dependency change (recharts version bump, new framework, etc.) and update the table above.
