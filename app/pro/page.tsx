import type { Metadata } from 'next';

import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { PRO_PRODUCT_IDS, getProProductDefinition } from '@/domain/pro-product';
import { getProPricingDefinition } from '@/domain/pro-pricing';
import {
  getMissingProOfferEnvVarNames,
  getProCheckoutTarget,
  hasMissingProOfferPaymentLink
} from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

const OFFER_CARDS = [...PRO_PRODUCT_IDS];

const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Is this a subscription?',
    answer:
      'No. Both products are one-time purchases through Stripe Payment Links. Weekly Crypto Pulse does not run subscription billing.'
  },
  {
    question: 'Do I need an account or login?',
    answer:
      'No. This site has no user authentication and no entitlement system. Stripe checkout confirms purchase identity and payment status.'
  },
  {
    question: 'How is Pro access delivered?',
    answer:
      'After successful Stripe checkout, fulfillment follows the existing Pro operations workflow. Stripe payment details are the source of truth for fulfillment.'
  }
] as const;

export default function ProPage(): JSX.Element {
  const hasMissingOfferLink = hasMissingProOfferPaymentLink();
  const missingEnvVarNames = getMissingProOfferEnvVarNames();

  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Pricing</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Free, Weekly Pro, and Monthly Bundle.</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          The hierarchy is editorial, not promotional. Free is for orientation. Weekly Pro is for a single decision.
          Monthly Bundle is for continuity across the month.
        </p>
      </header>

      {hasMissingOfferLink ? (
        <section className="space-y-2 border border-amber-300 bg-amber-50 p-4" id="checkout-unavailable">
          <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
          <p className="text-sm text-muted">
            One or more Stripe Payment Links are not configured for this environment. Set{' '}
            {missingEnvVarNames.map((envVarName) => (
              <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono" key={envVarName}>
                {envVarName}
              </code>
            ))}
            in Vercel to enable paid checkout.
          </p>
        </section>
      ) : null}

      <section className="rounded border border-line bg-paper p-4 text-sm text-ink">
        <p>
          <span className="font-semibold">Where the line moves:</span> Free tells you what changed. Weekly Pro tells
          you what to do with this week. Monthly Bundle keeps the thesis connected so each weekly decision is carried
          into the next one and resolved at month end.
        </p>
      </section>

      <TierDifferentiation
        description="Each tier answers a different reader need: public orientation, a single-week decision memo, or a continuity workflow that ties the month together."
        title="Editorial hierarchy by function"
      />

      <section aria-labelledby="offers-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight" id="offers-heading">
            Paid one-time products
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            Both paid products use Stripe Payment Links and remain one-time purchases. The distinction is the job to be
            done: one issue when the current setup needs a decision now, or a continuity workflow when the full month
            needs to stay connected.
          </p>
        </div>

        <div className="rounded border border-line bg-paper p-4 text-sm text-ink">
          <p>
            <span className="font-semibold">Pricing hierarchy:</span> Single Issue is the entry offer for one decision
            cycle. Monthly Bundle is the best-value offer because it adds continuity and a month-end synthesis, not
            just more files.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {OFFER_CARDS.map((productId) => {
            const product = getProProductDefinition(productId);
            const checkoutTarget = getProCheckoutTarget(productId);
            const pricing = getProPricingDefinition(productId);
            const isBestValue = pricing.tier === 'bestValueOffer';

            return (
              <article
                className={`space-y-4 border bg-white p-5 ${isBestValue ? 'border-ink shadow-sm' : 'border-line'}`}
                key={product.id}
              >
                <div className="space-y-2">
                  <p
                    className={`inline-flex px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      isBestValue ? 'bg-ink text-paper' : 'bg-paper text-ink'
                    }`}
                  >
                    {pricing.valueLabel}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight">{product.name}</h3>
                  <p className="text-base font-semibold text-ink">
                    {pricing.displayPrice} {pricing.displayPeriodLabel}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{product.shortDescription}</p>
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-medium">Best used when:</span> {product.audience}
                  </p>
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-medium">Value framing:</span> {pricing.comparisonHint}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <section aria-label={`${product.name} includes`} className="space-y-2">
                    <h4 className="font-semibold">Functionally includes</h4>
                    <ul className="list-disc space-y-2 pl-5 text-ink">
                      {product.includes.map((deliverable) => (
                        <li key={deliverable}>{deliverable}</li>
                      ))}
                    </ul>
                  </section>

                  <section aria-label={`${product.name} delivery`} className="space-y-1">
                    <h4 className="font-semibold">Delivery model</h4>
                    <p className="text-muted">{product.deliveryModel}</p>
                  </section>

                  <section aria-label={`${product.name} exclusions`} className="space-y-2">
                    <h4 className="font-semibold">Not included</h4>
                    <ul className="list-disc space-y-1 pl-5 text-muted">
                      {product.excludes.map((excludedItem) => (
                        <li key={excludedItem}>{excludedItem}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <ProCta
                  className="inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper"
                  label={product.ctaLabel}
                  checkoutTarget={checkoutTarget}
                />
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight" id="faq-heading">
          FAQs
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <article className="border border-line bg-white p-4" key={item.question}>
              <h3 className="text-base font-semibold tracking-tight">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
