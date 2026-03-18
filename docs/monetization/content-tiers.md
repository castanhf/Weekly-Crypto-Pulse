# Editorial content tiers

Weekly Crypto Pulse uses a three-tier editorial model that maps directly to product value.

## Value hierarchy

- **Free = orientation**: establish context and help readers decide whether to go deeper.
- **Weekly Pro = decision**: deliver one issue of decision-grade analysis.
- **Monthly Bundle = continuity**: extend Weekly Pro structure across the month.

## Domain model source of truth

- Canonical tier definitions live in `domain/content-tier.ts`.
- The model is typed and reusable across pages, pricing copy, and operations docs.
- Each tier definition includes:
  - purpose
  - target reader need
  - included content blocks
  - excluded content blocks
  - editorial role in the value hierarchy
