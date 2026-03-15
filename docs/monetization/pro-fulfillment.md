# Pro fulfillment runbook (manual, no database)

This runbook defines a repeatable Pro fulfillment workflow for one-time purchases using only committed report artifacts.

## Scope and constraints

- No database.
- No auth/accounts.
- No runtime crypto API fetching.
- Stripe is the payment source of truth.
- Pro packs are generated from committed `data/reports/*.json` artifacts.
- Fulfillment is manual delivery.

## Generate steps

1. Pull the latest repository state.
2. Confirm the target report exists under `data/reports`.
3. Run the generator:

```bash
npm run generate:pro -- --slug <report-slug>
```

4. Confirm output exists:

```bash
data/pro-packs/<report-slug>.md
```

5. Optional deterministic check (same slug should produce identical output):

```bash
npm run generate:pro -- --slug <report-slug>
git diff -- data/pro-packs/<report-slug>.md
```

If the diff is empty, output is deterministic.

## Manual delivery steps

1. In Stripe Dashboard, locate the payment and confirm:
   - Status is `Succeeded`.
   - Product matches purchased offer (`Single Issue` or `Monthly Bundle`).
   - Buyer email is present.
2. Open `docs/monetization/email-templates.md` and select the correct template.
3. Attach `data/pro-packs/<report-slug>.md` or export it to PDF and attach the PDF.
4. Send the email to the Stripe-confirmed buyer email.
5. Add the license note in the email body:

> License: Personal use only. Redistribution is not allowed.

## Edge cases checklist

- [ ] Payment is not `Succeeded` → do not deliver; request retry.
- [ ] Buyer email missing in Stripe → request confirmation before delivery.
- [ ] Wrong report slug selected → regenerate with correct slug and resend.
- [ ] Generated file missing sections → validate source artifact with `npm run validate:reports`.
- [ ] Buyer requests resend → resend existing artifact if report artifact has not changed.
- [ ] Markdown rendering issue in buyer client → export markdown to PDF and resend.
- [ ] Monthly Bundle purchase → deliver all eligible weekly report Pro packs for the covered month.

## Data handling policy

- Do not commit buyer email addresses, names, payment IDs, or screenshots.
- Keep operational records in private systems outside this repository.
- Treat Stripe Dashboard as the source of truth for payment identity and status.
