# Stripe test drill (Payment Links, test mode)

This runbook makes Stripe Payment Link testing practical and repeatable while keeping Weekly Crypto Pulse static-first.

## Scope

- Stripe is used only as payment processor and source of truth for buyer/payment identity.
- No database, no auth, no webhooks, no entitlements.
- Product model is one-time only:
  - **Weekly Crypto Pulse Pro — Single Issue**
  - **Weekly Crypto Pulse Pro — Monthly Bundle**

## Site configuration used for paid CTAs

Paid CTAs use public environment variables:

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`

Set them in Vercel:

1. Open **Vercel → Project Settings → Environment Variables**.
2. Add both variables using Stripe **test mode** Payment Link URLs.
3. Apply to `Preview` for drill validation first (optionally `Production` when ready).
4. Redeploy the target environment.

### Fail-safe behavior when links are missing

- If a link is missing, the corresponding CTA routes to `/pro#checkout-unavailable`.
- `/pro` shows a warning that one or more checkout options are unavailable.
- Users are never sent to a broken external link.

## Create Payment Links in Stripe test mode

Repeat this once per one-time product.

1. Open Stripe Dashboard and enable **Test mode**.
2. Go to **Product catalog** and create/select the product:
   - `Weekly Crypto Pulse Pro — Single Issue`
   - `Weekly Crypto Pulse Pro — Monthly Bundle`
3. Create a **one-time** price for each product.
4. Create a **Payment Link** for each product/price.
5. (Optional) Set a return URL back to `https://<your-preview-domain>/pro`.
6. Copy the two URLs (`https://buy.stripe.com/test_...`).
7. Paste each URL into its matching Vercel variable.

## Purchase drill checklist (repeatable)

Run on a Preview deployment first.

### A) Configuration sanity check

- [ ] Confirm both env vars are present in the same Vercel environment.
- [ ] Confirm each value is a Stripe **test** link (`/test_` in URL path).
- [ ] Redeploy after any variable change.

### B) CTA click + redirect checks

- [ ] Open `/pro`.
- [ ] Click **Buy Single Issue** → Stripe checkout opens in a new tab.
- [ ] Click **Buy Monthly Bundle (Best Value)** → Stripe checkout opens in a new tab.
- [ ] Open `/` and `/reports/<valid-slug>` and click any Pro CTA; verify redirect behavior is the same.

### C) Test purchase checks

For each offer, complete a payment in Stripe test mode:

- [ ] Use test card `4242 4242 4242 4242` with any future expiry/CVC/ZIP.
- [ ] Stripe shows successful confirmation.
- [ ] Payment appears in Stripe test dashboard with expected product/amount.

### D) Fail-safe check (missing env)

- [ ] Temporarily remove one CTA env variable in Preview and redeploy.
- [ ] Click the affected CTA and confirm navigation to `/pro#checkout-unavailable`.
- [ ] Confirm `/pro` warning message is visible.
- [ ] Restore env var and redeploy.

## Expected outcomes to verify

- **CTA click behavior**
  - Each offer CTA points to its configured Stripe test Payment Link.
  - If not configured, CTA falls back to `/pro#checkout-unavailable`.
- **Redirect behavior**
  - Stripe checkout opens in a new tab.
  - Optional return URL lands back on `/pro` when configured.
- **Confirmation messaging**
  - Stripe displays successful payment confirmation after test purchase.
  - `/pro` warning appears only when one or more links are missing.


## Support triage (manual)

### User says: "I paid but didn't receive"

1. Ask for payer email, approximate payment time, and last 4 digits used.
2. Search Stripe Payments by email/time and verify status.
3. If payment succeeded, manually fulfill or resend the deliverable and reply with confirmation.
4. If payment is missing or pending, ask the user to check statement status and retry with a clear next step.

### User requests resend

1. Verify successful payment in Stripe.
2. Resend the promised deliverable using your manual fulfillment process.
3. Log resend reason and timestamp in your operations tracker.

### User requests refund

1. Confirm purchase in Stripe and verify it is inside your refund-policy window.
2. Execute refund in Stripe (full or partial per policy).
3. Reply with confirmation, refunded amount, and expected settlement timing.
4. Log refund reason for monthly review.

## Troubleshooting

- CTA still goes to `/pro#checkout-unavailable`:
  - Verify the correct env var name was set.
  - Verify value is not empty/whitespace.
  - Redeploy the environment.
- Stripe checkout does not open:
  - Confirm URL starts with `https://buy.stripe.com/` and was copied from test mode.
- Risk of real charge:
  - Confirm Stripe dashboard **Test mode** is enabled before running the drill.
