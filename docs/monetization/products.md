# Product operations: one-time paid products

## Editorial tier model

The product ladder uses one reusable editorial hierarchy across the site and operations docs:

- **Free = orientation:** public context that helps readers understand the week before buying.
- **Weekly Pro = decision:** one issue of paid analysis intended to support the current decision cycle.
- **Monthly Bundle = continuity:** the same Weekly Pro depth delivered across the month so readers can track changes.

## Product definitions

### Weekly Crypto Pulse Pro — Single Issue
- One-time purchase for one specific Pro weekly report.
- Buyer receives one issue only.
- Best for readers who want a single decision-focused report.
- Editorial tier mapping: **Weekly Pro = decision**.

### Weekly Crypto Pulse Pro — Monthly Bundle
- One-time purchase for one month of Pro coverage.
- Buyer receives four weekly Pro reports for that month.
- Best value for readers who want continuity across the month.
- Editorial tier mapping: **Monthly Bundle = continuity**.

## Single Issue vs Monthly Bundle

| Area | Single Issue | Monthly Bundle |
|---|---|---|
| Deliverables | 1 Pro weekly issue | 4 Pro weekly issues |
| Delivery window | One-time after payment confirmation | Across the purchased month |
| Use case | Entry offer | Best value offer |
| Editorial intent | Weekly Pro = decision | Monthly Bundle = continuity |

## Delivery timing

- Delivery starts only after Stripe payment status is `Succeeded`.
- Single Issue: deliver once, as soon as the purchased issue artifact is ready.
- Monthly Bundle: deliver each weekly issue when available during the purchased month.
- Stripe is the source of truth for buyer email and payment identity.

## Free vs paid scope

- Free content: orientation only (public pages, archive context, methodology/disclaimer context).
- Weekly Pro content: decision-grade report content for one committed issue artifact.
- Monthly Bundle content: the same decision-grade report structure, delivered with continuity across the purchased month.
- No database, no accounts, and no entitlement system are used for fulfillment.
