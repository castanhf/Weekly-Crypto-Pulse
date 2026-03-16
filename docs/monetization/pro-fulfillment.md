# Pro fulfillment runbook (manual, no database)

This runbook defines a repeatable Pro fulfillment workflow for one-time purchases using only committed report artifacts.

## Scope and constraints

- No database.
- No auth/accounts.
- No runtime crypto API fetching.
- Stripe is the payment source of truth.
- Pro packs are generated from committed `data/reports/*.json` artifacts.
- Fulfillment is manual delivery.

## Product delivery definitions

### Weekly Crypto Pulse Pro — Single Issue

- **What gets delivered**: 1 Pro weekly report for the purchased issue.
- **When it gets delivered**: once, after Stripe payment is confirmed as `Succeeded`.
- **How it is delivered**: manual email delivery to the Stripe-confirmed buyer email.

### Weekly Crypto Pulse Pro — Monthly Bundle

- **What gets delivered**:
  - 4 Pro weekly reports for the purchased month.
  - 1 monthly Pro summary delivered at month end.
- **When it gets delivered**:
  - Weekly reports are delivered across the purchased month as each issue is available.
  - Monthly summary is delivered at the end of the purchased month.
- **How it is delivered**: manual email delivery to the Stripe-confirmed buyer email.

## Operator steps

1. In Stripe Dashboard, locate the payment and confirm:
   - Status is `Succeeded`.
   - Product matches purchased offer (`Single Issue` or `Monthly Bundle`).
   - Buyer email is present.
2. Determine required deliverables from product rules:
   - Single Issue → deliver 1 Pro weekly report.
   - Monthly Bundle → deliver 4 weekly reports across month + 1 month-end summary.
3. Generate artifacts from committed report JSON files:

```bash
npm run generate:pro -- --slug <report-slug>
```

4. Confirm output exists:

```bash
data/pro-packs/<report-slug>.md
```

5. Open `docs/monetization/email-templates.md`, select the correct template, attach generated artifact (or exported PDF), and send to Stripe-confirmed buyer email.
6. Include the license note in every delivery email:

> License: Personal use only. Redistribution is not allowed.

## Optional deterministic check

Run generation twice for the same slug and verify no diff:

```bash
npm run generate:pro -- --slug <report-slug>
git diff -- data/pro-packs/<report-slug>.md
```

If the diff is empty, output is deterministic.

## Edge cases checklist

- [ ] Payment is not `Succeeded` → do not deliver; request retry.
- [ ] Buyer email missing in Stripe → request confirmation before delivery.
- [ ] Wrong report slug selected → regenerate with correct slug and resend.
- [ ] Generated file missing sections → validate source artifact with `npm run validate:reports`.
- [ ] Buyer requests resend → resend existing artifact if report artifact has not changed.
- [ ] Markdown rendering issue in buyer client → export markdown to PDF and resend.
- [ ] Monthly Bundle purchase → track all 5 deliverables (4 weekly + 1 month-end summary) before marking complete.

## Data handling policy

- Do not commit buyer email addresses, names, payment IDs, or screenshots.
- Keep operational records in private systems outside this repository.
- Treat Stripe Dashboard as the source of truth for payment identity and status.
