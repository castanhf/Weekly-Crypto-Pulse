# Fulfillment checklists: one-time paid products

Use this for manual operations with Stripe as source of truth.

## Single Issue checklist

- [ ] Confirm Stripe payment is `Succeeded`.
- [ ] Confirm product is **Weekly Crypto Pulse Pro — Single Issue**.
- [ ] Confirm buyer email in Stripe.
- [ ] Identify purchased report slug.
- [ ] Generate artifact:
  - `npm run generate:pro -- --product singleIssue --slug <report-slug>`
- [ ] Verify output exists:
  - `data/pro-packs/<report-slug>.md`
- [ ] Send delivery email to Stripe-confirmed buyer email.
- [ ] Include license note: `Personal use only. Redistribution is not allowed.`

## Monthly Bundle checklist

- [ ] Confirm Stripe payment is `Succeeded`.
- [ ] Confirm product is **Weekly Crypto Pulse Pro — Monthly Bundle**.
- [ ] Confirm buyer email in Stripe.
- [ ] Confirm purchased month (`YYYY-MM`).
- [ ] Generate bundle artifacts:
  - `npm run generate:pro -- --product monthlyBundle --month <YYYY-MM>`
- [ ] Verify outputs exist:
  - `data/pro-packs/monthly-bundles/<YYYY-MM>-bundle.md`
  - `data/pro-packs/monthly-summaries/<YYYY-MM>-summary.md`
- [ ] Deliver each weekly issue during the month.
- [ ] Deliver month-end summary after month close.
- [ ] Include license note: `Personal use only. Redistribution is not allowed.`
