# Analytics operations

Crypto Pulse uses [Vercel Web Analytics](https://vercel.com/docs/analytics) with custom funnel events.

## Why this provider

- Native Vercel integration, no additional backend service.
- Lightweight script injection and event tracking.
- Fits the static-first deployment model.

## Environment variables (Vercel)

Configure these in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_ANALYTICS_ENABLED`
  - Set to `true` to enable analytics in Preview/Production.
  - Set to `false` (or leave unset) to disable script/event tracking.

No secret keys are required for this integration.

## Event catalog

### `view_report`

Triggered when a report detail page is viewed.

Payload:

- `reportSlug` (`string`): report slug from `/reports/[slug]`.

### `click_pro_cta`

Triggered when any `ProCta` button is clicked.

Payload:

- `destination` (`string`): final link target.
- `isOutbound` (`boolean`): whether the link points to external Stripe checkout.

### `outbound_stripe_payment_link`

Triggered only when `ProCta` points to an HTTPS `stripe.com`/`*.stripe.com` link and the click goes outbound.

Payload:

- `destination` (`string`): Stripe Payment Link URL.
- `isOutbound` (`boolean`): always `true` for this event.

## Validation checklist

1. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` in Vercel Preview.
2. Deploy a Preview build.
3. Open a report page and confirm `view_report` appears in Vercel Analytics events.
4. Click an `Upgrade with Stripe` CTA and confirm:
   - `click_pro_cta`
   - `outbound_stripe_payment_link` (only when Stripe link is configured).
5. Disable analytics with `NEXT_PUBLIC_ANALYTICS_ENABLED=false` and confirm events stop.
