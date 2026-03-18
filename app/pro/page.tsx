import type { Metadata } from 'next';

import { ProCta } from '@/components/pro/pro-cta';
import { CONTENT_TIER_IDS, getContentBlockLabel, getContentTierDefinition } from '@/domain/content-tier';
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
const EDITORIAL_TIER_CARDS = [...CONTENT_TIER_IDS];

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
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Clear weekly offer: Free vs Pro.</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Free is for orientation. Weekly Pro is for decision support. Monthly Bundle is for continuity across the
          month.
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

      <section aria-labelledby="editorial-hierarchy-heading" className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight" id="editorial-hierarchy-heading">
            Editorial value hierarchy
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">
            The tiers use one editorial ladder: Free gives orientation, Weekly Pro supports the current decision, and
            Monthly Bundle maintains continuity as new issues are published.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {EDITORIAL_TIER_CARDS.map((tierId) => {
            const tier = getContentTierDefinition(tierId);

            return (
              <article className="space-y-4 border border-line bg-white p-5" key={tier.id}>
                <div className="space-y-2">
                  <p className="inline-flex bg-paper px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                    {tier.editorialRole}
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight">{tier.name}</h3>
                  <p className="text-sm leading-relaxed text-muted">{tier.purpose}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <section className="space-y-1">
                    <h4 className="font-semibold">Reader need</h4>
                    <p className="text-muted">{tier.targetReaderNeed}</p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">Included content blocks</h4>
                    <ul className="list-disc space-y-1 pl-5 text-ink">
                      {tier.includedContentBlocks.map((contentBlockId) => (
                        <li key={contentBlockId}>{getContentBlockLabel(contentBlockId)}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">Excluded content blocks</h4>
                    <ul className="list-disc space-y-1 pl-5 text-muted">
                      {tier.excludedContentBlocks.map((contentBlockId) => (
                        <li key={contentBlockId}>{getContentBlockLabel(contentBlockId)}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-1">
                    <h4 className="font-semibold">Editorial role</h4>
                    <p className="text-muted">{tier.valueHierarchyLabel}</p>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="offers-heading" className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight" id="offers-heading">
          Paid one-time products
        </h2>

        <div className="rounded border border-line bg-paper p-4 text-sm text-ink">
          <p>
            <span className="font-semibold">Value hierarchy:</span> Single Issue is the entry product. Monthly Bundle is
            the best value product.
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
                    <span className="font-medium">Value framing:</span> {pricing.comparisonHint}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <section aria-label={`${product.name} includes`} className="space-y-2">
                    <h4 className="font-semibold">Includes</h4>
                    <ul className="list-disc space-y-2 pl-5 text-ink">
                      {product.includes.map((deliverable) => (
                        <li key={deliverable}>{deliverable}</li>
                      ))}
                    </ul>
                  </section>

                  <section aria-label={`${product.name} audience`} className="space-y-1">
                    <h4 className="font-semibold">Who it is for</h4>
                    <p className="text-muted">{product.audience}</p>
                  </section>

                  <section aria-label={`${product.name} delivery`} className="space-y-1">
                    <h4 className="font-semibold">How delivery works</h4>
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
