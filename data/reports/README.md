# Report Artifacts

Place generated report JSON artifacts in this directory:

- Path: `data/reports/*.json`
- Supported extension: `.json`
- Current schema version: `1.0`

## Supported JSON shapes

### Preferred (versioned artifact)

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-03-01T18:00:00.000Z",
  "report": {
    "metadata": {
      "title": "...",
      "slug": "...",
      "publishedAt": "YYYY-MM-DD",
      "weekLabel": "...",
      "summary": "...",
      "tags": ["..."]
    },
    "regime": "risk-on | risk-off | range-bound | transition",
    "marketSnapshot": {
      "totalMarketCapUsd": 0,
      "btcDominancePct": 0,
      "ethDominancePct": 0,
      "fearGreedIndex": 0
    },
    "movers": [
      {
        "symbol": "BTC",
        "name": "Bitcoin",
        "changePct7d": 0,
        "catalyst": "..."
      }
    ],
    "sections": [
      {
        "id": "overview",
        "heading": "...",
        "body": "...",
        "highlights": ["..."]
      }
    ],
    "signals": {
      "thesis": ["..."],
      "riskChecklist": ["... (exactly 5 items)"],
      "watchlistLevels": [
        {
          "asset": "BTC",
          "level": "...",
          "context": "..."
        }
      ],
      "changedSinceLastWeek": ["..."]
    }
  }
}
```

### Backward-compatible (legacy)

A root-level report object (without `schemaVersion`) is still accepted to keep older files working.
