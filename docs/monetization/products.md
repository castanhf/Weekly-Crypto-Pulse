# Product operations: one-time paid products

For canonical editorial tier definitions, see `domain/content-tier.ts` and `docs/monetization/content-tiers.md`.

## Product definitions

### Weekly Crypto Pulse Pro — Single Issue
- One-time purchase for one specific Pro weekly report.
- Buyer receives one issue only.
- Best for readers who want a single decision-focused report.

### Weekly Crypto Pulse Pro — Monthly Bundle
- One-time purchase for one month of Pro coverage.
- Buyer receives four weekly Pro reports for that month plus one month-end Pro summary.
- Best value for readers who want continuity across the month.

## Single Issue vs Monthly Bundle

| Area | Single Issue | Monthly Bundle |
|---|---|---|
| Deliverables | 1 Pro weekly issue | 4 Pro weekly issues + 1 month-end summary |
| Delivery window | One-time after payment confirmation | Across the purchased month + month-end |
| Use case | Entry offer | Best value offer |
| Editorial intent | One report decision | Ongoing weekly + monthly continuity |

## Delivery timing

- Delivery starts only after Stripe payment status is `Succeeded`.
- Single Issue: deliver once, as soon as the purchased issue artifact is ready.
- Monthly Bundle: deliver each weekly issue when available, then deliver the month-end summary after the month closes.
- Stripe is the source of truth for buyer email and payment identity.

## Free vs paid scope

- Free content: orientation only (public pages, archive context, methodology/disclaimer context).
- Paid content (Pro): decision-grade report content generated from committed report artifacts.
- No database, no accounts, and no entitlement system are used for fulfillment.
