# Pro fulfillment runbook (manual)

This runbook defines the manual fulfillment workflow for one-time Pro purchases while keeping Weekly Crypto Pulse static-first.

## Scope

- No database.
- No user accounts or auth.
- No runtime crypto API fetching for page rendering.
- Stripe is the payment processor and source of truth for payment status and buyer identity.
- Deliverables are generated from committed report artifacts only.
- Fulfillment is manual email delivery.

## Before you start

Confirm the purchase maps to one of the supported offers:

- **Weekly Crypto Pulse Pro — Single Issue**
- **Weekly Crypto Pulse Pro — Monthly Bundle**

Use Stripe data only for operational fulfillment. Do not store buyer personal data in this repository.

## Manual workflow

### 1) Confirm payment in Stripe

In Stripe Dashboard:

1. Open the payment or checkout session.
2. Confirm the payment status is `Succeeded`.
3. Confirm the product matches the purchased offer.
4. Confirm the buyer email is present.
5. Capture the minimum operational details needed to fulfill the order:
   - product name
   - report slug or bundle month
   - purchase date
   - Stripe payment or session reference

If the payment is not `Succeeded`, stop and do not deliver.

### 2) Generate the Pro pack with watermark

Generate the deliverable from committed report artifacts using the existing CLI. Supply buyer metadata so the generated file includes the buyer-specific watermark.

#### Single Issue

```bash
npm run generate:pro -- --product singleIssue --slug <report-slug> \
  --buyerEmail <buyer@example.com> --orderRef <stripe-ref> --purchasedAt <ISO-8601>
```

Expected output:

```text
data/pro-packs/<report-slug>.md
```

#### Monthly Bundle

Use one of the following depending on the order you are fulfilling.

```bash
npm run generate:pro -- --product monthlyBundle --month <YYYY-MM> \
  --buyerEmail <buyer@example.com> --orderRef <stripe-ref> --purchasedAt <ISO-8601>
```

```bash
npm run generate:pro -- --product monthlyBundle --month <YYYY-MM> --slugs <slug1,slug2,slug3,slug4> \
  --buyerEmail <buyer@example.com> --orderRef <stripe-ref> --purchasedAt <ISO-8601>
```

Expected outputs:

```text
data/pro-packs/monthly-bundles/<YYYY-MM>-bundle.md
data/pro-packs/monthly-summaries/<YYYY-MM>-summary.md
```

#### Watermark verification

After generation, open the produced file and verify that:

- the correct issue or month was generated
- the buyer-specific watermark is present
- the purchase metadata is masked or truncated as intended by the generator

If the output is wrong, regenerate before sending.

### 3) Attach and send the email manually

Use the templates in `docs/monetization/email-templates.md`.

Delivery rules:

- Send only to the email address confirmed in Stripe.
- Attach the generated markdown artifact or an exported PDF if that is the preferred buyer-facing format.
- Select the matching template:
  - new purchase email
  - monthly bundle purchase email
  - monthly summary delivery email
  - resend/support email
- Keep edits factual and concise.
- Include the license reminder in every fulfillment message.

Required license reminder:

> Personal use only. Redistribution is not permitted.

### 4) Record minimal evidence without storing personal data in the repo

Record fulfillment evidence in a private operational system outside this repository.

Store only the minimum needed to prove fulfillment happened, such as:

- fulfillment date
- product type
- report slug or bundle month
- partial Stripe reference, if needed
- delivery channel used
- operator initials
- resend or exception note, if applicable

Do **not** commit or store in this repo:

- buyer email address
- buyer name
- full Stripe payment ID or session ID
- screenshots containing personal data
- copied email contents with personal data

If you need a reference key, use a redacted form such as the last 6-8 characters of the Stripe reference in a private tracker only.

## Product-specific fulfillment notes

### Single Issue

- Deliver one Pro report for the purchased issue.
- Fulfill once, after Stripe payment is confirmed.
- Resends should use the resend/support template and the same buyer-confirmed destination email.

### Monthly Bundle

- Deliver weekly Pro issues as they become available during the purchased month.
- Deliver the monthly summary at month end.
- Use the monthly bundle purchase email when the order is first confirmed.
- Use the monthly summary delivery email when sending the end-of-month summary.

## Exception handling

- **Payment not found or not succeeded:** do not fulfill; verify details in Stripe first.
- **Missing buyer email in Stripe:** contact support workflow and wait for confirmation before sending.
- **Wrong slug or month selected:** regenerate the correct deliverable and resend.
- **Attachment problem or formatting issue:** export to PDF and resend using the resend/support template.
- **Buyer asks for a resend:** verify the original successful payment in Stripe, then resend manually.

## Repository data policy

- This repository stores product docs and static report artifacts only.
- Personal data must stay in Stripe or a separate private operations tool.
- Stripe remains the source of truth for buyer/payment identity.
