# Pro fulfillment runbook (manual, no database)

This runbook defines a repeatable manual fulfillment flow for Pro buyers while keeping the product static-first.

## Scope and constraints

- No database, auth, or webhook automation.
- Payment confirmation is done manually in Stripe.
- Pro packs are generated from committed report artifacts only (`data/reports/*.json`).
- Delivery is performed manually via email.
- Do not store personal data in this repository.

## Preconditions

- Access to Stripe Dashboard (test and/or live mode as appropriate).
- Latest repository state and dependencies installed.
- Buyer email and order reference available from Stripe.

## 1) Confirm payment in Stripe

1. Open Stripe Dashboard.
2. Toggle to the correct mode:
   - **Test mode** for drills.
   - **Live mode** for real fulfillment.
3. Open **Payments** and locate the transaction.
4. Verify all of the following:
   - Status is `Succeeded`.
   - Amount/currency match the expected offer.
   - Buyer email is present.
   - Payment timestamp is recorded.
5. Copy a minimal reference for operations (for example: payment ID and date).

If payment is not `Succeeded`, do not generate or send the Pro pack.

## 2) Generate Pro pack with watermark via CLI

1. Pull latest `main`.
2. Confirm target report slug exists in `data/reports`.
3. Run:

```bash
pnpm generate:pro -- --slug <report-slug> --buyerEmail <buyer-email> --orderRef <stripe-payment-id>
```

Optional flag:

```bash
--purchasedAt <ISO-8601 timestamp>
```

4. Verify the generated artifact exists:

```bash
data/pro-packs/<report-slug>.md
```

5. Review the file to confirm watermark fields (email/order/date) are correct and content rendering is intact.

## 3) Send fulfillment email manually

1. Use the template in `docs/monetization/email-templates.md`.
2. Attach the generated Pro pack (`.md` or exported PDF).
3. Send to the buyer email confirmed in Stripe.
4. Keep messaging concise and professional.

Include this disclaimer line in the message:

> License: Personal use only. This file includes a buyer-specific watermark.

## 4) Record minimal evidence (optional)

Record only non-sensitive operational evidence outside this repository (for example, private ops notes):

- report slug
- send date/time
- Stripe payment ID (or redacted reference)
- delivery status (`sent`, `resent`, `failed`)

Do **not** commit buyer email addresses, full names, or payment screenshots to git.

## Local fulfillment assistant (optional, local-only)

A local helper page is available at `/internal/fulfillment` to reduce copy/paste mistakes when preparing manual delivery.

- It accepts `buyerEmail`, `orderRef`, and `slug`.
- It outputs a ready-to-run CLI command for `generate:pro` and a copy-ready fulfillment email body.
- It does not write files, send emails, or persist data.

This route is server-gated and disabled by default. If `ENABLE_FULFILLMENT_ASSIST` is not exactly `true`, the route returns `404`.

Enable locally only:

```bash
ENABLE_FULFILLMENT_ASSIST=true npm run dev
```

For Vercel:

- Keep `ENABLE_FULFILLMENT_ASSIST` unset (recommended), or set it to `false` in Preview and Production environments.
- Do not enable this flag in production deployments.

## Failure handling

- Payment not successful: request buyer to retry checkout; do not fulfill.
- Wrong or bounced email: resend using corrected email after buyer confirmation.
- Attachment issue: resend using same generated artifact unless report input changed.
- Regeneration needed: rerun the CLI with corrected watermark metadata.
