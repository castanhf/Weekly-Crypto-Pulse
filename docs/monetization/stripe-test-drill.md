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

## Purchase drill checklist (test mode)

Use this checklist on Preview first, then Production if needed.

1. Confirm deploy environment has `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` set to a **test** link.
2. Open site home page and a report page.
3. Click each "Upgrade with Stripe" CTA.
4. Verify each click opens Stripe Checkout in a new tab.
5. Complete checkout with a Stripe test card (for example `4242 4242 4242 4242`, any future expiry/CVC/ZIP).
6. Confirm Stripe displays successful payment confirmation.
7. Return to the site (manually or via configured return URL).
8. Open `/pro` and verify no "checkout unavailable" warning appears when env is configured.

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
- Unexpected live charges risk:
  - Ensure Stripe dashboard is in **Test mode** before creating/using link.
