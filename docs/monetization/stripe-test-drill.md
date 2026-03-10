# Stripe test drill (Payment Link)

This runbook keeps Stripe checkout testing practical and repeatable while preserving the static-first architecture.

## Scope and constraints

- Weekly Crypto Pulse uses a Stripe **Payment Link** only.
- The website does **not** run Stripe webhooks.
- The website does **not** use auth, accounts, or entitlements.
- The Pro CTA resolves to an environment-provided URL.

## Environment config used by the site

The Pro CTA reads this variable at build/runtime:

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`

Where to set it (Vercel-first):

1. Open Vercel project settings.
2. Go to **Settings → Environment Variables**.
3. Add `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` with your Stripe **test-mode Payment Link URL**.
4. Apply to **Preview** and/or **Production** depending on what you are drilling.
5. Redeploy so the new value is picked up.

### Fail-safe behavior when env is missing

If `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` is missing or empty:

- Pro CTAs route to `/pro#checkout-unavailable` instead of a dead external link.
- `/pro` shows a clear "Checkout is temporarily unavailable" message.

## Create a Payment Link in Stripe test mode

1. In Stripe Dashboard, toggle to **Test mode**.
2. Create or select a test product (for example: "Weekly Crypto Pulse Pro").
3. Create a recurring or one-time test price matching your offer.
4. Create a **Payment Link** for that price.
5. In Payment Link settings:
   - Keep post-payment behavior simple (Stripe hosted confirmation is enough for this drill).
   - Optional: configure a "return URL" back to `/pro` if you want a tighter loop.
6. Copy the Payment Link URL (looks like `https://buy.stripe.com/test_...`).
7. Paste it into Vercel as `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`.

## Scenario checklists

Use these in order: Preview first, then Production if needed.

### 1) First-time purchase

- [ ] Confirm the deployed environment has `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` set to a **test** link.
- [ ] Open home page, `/pro`, and one recent report page.
- [ ] Click each "Upgrade with Stripe" CTA and verify Checkout opens in a new tab.
- [ ] Complete checkout using test card `4242 4242 4242 4242` (future expiry/CVC/ZIP).
- [ ] Confirm Stripe shows successful payment confirmation.
- [ ] Verify the success page, receipt email (if enabled in Stripe), and no site-side errors.
- [ ] Return to `/pro` and confirm no `#checkout-unavailable` warning is shown.

### 2) Renewal month (manual verification)

This is a manual process because there are no webhooks or in-app entitlements.

- [ ] Create a **recurring** test subscription via Payment Link.
- [ ] In Stripe test mode, use **Test Clocks** (recommended) or advance time in your test flow to trigger the next billing cycle.
- [ ] Verify an invoice is generated and paid for renewal.
- [ ] Confirm renewal appears in Stripe: subscription status remains active, latest invoice is paid.
- [ ] Manually verify your operational record/source of truth is updated (for example support tracker or fulfillment log).
- [ ] If a renewal payment fails, record the failure state and planned support response before customer-facing rollout.

### 3) Refund/cancellation handling (manual steps)

- [ ] In Stripe test mode, locate a completed payment in **Payments**.
- [ ] Run a test refund (full first; partial if your policy allows it).
- [ ] Confirm Stripe marks payment as refunded and invoice/payment timelines reflect the refund.
- [ ] For subscriptions: cancel from Stripe and verify `cancel_at_period_end` vs immediate cancellation behavior matches your policy.
- [ ] Record the action in your manual ops/support tracker (reason, amount, date, operator).
- [ ] Verify customer-facing response template is ready (refund confirmed, expected bank processing window, cancellation effective date).

## Support triage (manual)

### User says: "I paid but didn’t receive"

1. Ask for payer email + approximate payment time + last 4 digits.
2. Search Stripe Payments by email/time and verify status.
3. If payment succeeded, manually fulfill or resend the deliverable and reply with confirmation.
4. If payment is missing/pending, ask user to check statement and retry with clear next step.

### User requests resend

1. Verify successful payment/subscription in Stripe.
2. Resend the promised deliverable using your manual fulfillment process.
3. Log resend reason and timestamp in support tracker.

### User requests refund

1. Confirm purchase in Stripe and check it is within your refund policy window.
2. Execute refund in Stripe (full or partial per policy).
3. Reply with confirmation, refunded amount, and expected settlement timing.
4. Log refund reason for monthly review.

## Expected outcomes to verify

- CTA click behavior
  - "Upgrade with Stripe" points to Stripe when env is configured.
  - CTA never leads to a broken external link when env is missing.
- Redirect behavior
  - Checkout opens Stripe hosted page in a new tab.
  - Optional return URL lands back on site (if configured in Stripe).
- Confirmation messaging
  - Stripe confirmation page indicates successful test purchase.
  - Site-side fallback message appears only when env is absent (`/pro#checkout-unavailable`).

## Troubleshooting

- CTA still opens `/pro#checkout-unavailable`:
  - Re-check `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` value and redeploy.
  - Verify no whitespace-only value was saved.
- Stripe page fails to load:
  - Confirm link starts with `https://buy.stripe.com/` and was copied from test mode.
- Renewal verification unclear:
  - Use Stripe Test Clocks to simulate cycle changes and verify invoice timeline deterministically.
- Unexpected live charges risk:
  - Ensure Stripe dashboard is in **Test mode** before creating/using link.
