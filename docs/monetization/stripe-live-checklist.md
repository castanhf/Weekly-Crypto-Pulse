# Stripe live go-live checklist

This checklist is for Weekly Crypto Pulse's current monetization setup only: two one-time products, two Stripe Payment Links, no subscriptions, no accounts, no database, and no runtime checkout logic beyond outbound CTA links.

## 1) Live account readiness

- [ ] Stripe account is fully activated in **live mode**.
- [ ] Business details, public business name, support email, statement descriptor, and payout schedule are complete.
- [ ] Team members who need refunds/payout visibility have Stripe Dashboard access.
- [ ] Refund policy and support contact shown on the site match what Stripe customers will see.

## 2) Bank payouts setup

- [ ] Add and verify the live bank account used for payouts.
- [ ] Confirm payout schedule and expected delay in **Stripe → Balances → Payouts**.
- [ ] Confirm the bank account name matches the legal business entity.
- [ ] Record who will check the first payout and where that confirmation will be logged.

## 3) Create the two live one-time products

In Stripe **live mode**, create or confirm these exact products:

- [ ] `Weekly Crypto Pulse Pro — Single Issue`
- [ ] `Weekly Crypto Pulse Pro — Monthly Bundle`

For each product:

- [ ] Use a **one-time** price only.
- [ ] Confirm copy reflects the offer correctly:
  - Single Issue = entry offer, one Pro issue.
  - Monthly Bundle = best value offer, month continuity across weekly issues.
- [ ] Do not create recurring prices or subscriptions.

## 4) Create the two live Payment Links

Create one live Payment Link per live one-time price:

- [ ] Payment Link for `Weekly Crypto Pulse Pro — Single Issue`
- [ ] Payment Link for `Weekly Crypto Pulse Pro — Monthly Bundle`

For each Payment Link:

- [ ] Link points to the correct live product and live one-time price.
- [ ] Return URL goes back to `https://<production-domain>/pro`.
- [ ] Collected customer email is enabled so Stripe remains the buyer identity source of truth.
- [ ] Save the final live URLs (`https://buy.stripe.com/...`).

Then update Vercel **Production** environment variables:

- [ ] `STRIPE_PAYMENT_LINK_WEEKLY_PRO=<live single-issue link>`
- [ ] `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE=<live monthly-bundle link>`
- [ ] Redeploy Production after updating the variables.

## 5) Test-mode drill before switching traffic

Before relying on live links:

- [ ] Run the full test flow in `docs/monetization/stripe-test-drill.md`.
- [ ] Confirm `/pro`, `/`, and one `/reports/<slug>` page all open Stripe checkout correctly from paid CTAs.
- [ ] Confirm missing-link fallback still routes to `/pro#checkout-unavailable` when a variable is removed in Preview.
- [ ] Confirm the Production deployment contains live links only after the Preview drill is complete.

## 6) First live payment validation

Use a small real purchase once Production is deployed with live links.

- [ ] Open `/pro` on the production domain.
- [ ] Click each CTA once and confirm it opens the expected **live** Stripe checkout.
- [ ] Complete one real purchase with a controlled buyer email you can monitor.
- [ ] Confirm Stripe shows `Succeeded` for the correct product, amount, and buyer email.
- [ ] Confirm the support/fulfillment process can identify the payment from Stripe data alone.

## 7) Payout verification

After the first live payment settles:

- [ ] Confirm the payment moves from successful charge to the expected payout flow in Stripe.
- [ ] Confirm the payout arrives in the connected bank account.
- [ ] Match payout amount and fees against the Stripe balance transaction details.
- [ ] Log the date of the first successful payout for future finance checks.

## Done when

- [ ] Both live CTAs point to the correct live Payment Links.
- [ ] First live payment is successful and traceable in Stripe.
- [ ] First payout reaches the bank account.
- [ ] No subscriptions, no extra products, and no non-Stripe buyer recordkeeping were introduced.
