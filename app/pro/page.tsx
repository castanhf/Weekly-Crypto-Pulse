import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { getProOffersPageData } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

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

const secondaryCtaClassName =
  'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line px-4 py-3 text-center text-sm font-medium transition hover:border-ink sm:w-auto';

export default function ProPage(): JSX.Element {
  const { missingPaymentLinkEnvVarNames, offers } = getProOffersPageData();
  const hasMissingOfferLink = missingPaymentLinkEnvVarNames.length > 0;

  return (
    <PageShell>
      <PageHeader
        actions={
          <div className="grid gap-3 sm:grid-cols-2">
            {offers.map((offer) => (
              <ProCta key={offer.id} checkoutTarget={offer.checkoutTarget} label={offer.product.ctaLabel} />
            ))}
          </div>
        }
        className="rounded-[2rem] border border-line/80 bg-white px-5 py-6 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:px-8 sm:py-8"
        description="The hierarchy is editorial, not promotional. Free is for orientation. Weekly Pro is for a single decision. Monthly Bundle is for continuity across the month."
        eyebrow="Pro offers"
        title="Free, Weekly Pro, and Monthly Bundle."
      />

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description="Both paid products use Stripe Payment Links and remain one-time purchases. The distinction is the job to be done: one issue when the current setup needs a decision now, or a continuity workflow when the full month needs to stay connected."
          id="offers-heading"
          title="Paid one-time products"
        />

        {hasMissingOfferLink ? (
          <SurfaceCard className="space-y-3 border-amber-300 bg-amber-50" id="checkout-unavailable">
            <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
            <p className="text-sm leading-7 text-muted">
              One or more Stripe Payment Links are not configured for this environment. Set{' '}
              {missingPaymentLinkEnvVarNames.map((envVarName) => (
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono" key={envVarName}>
                  {envVarName}
                </code>
              ))}
              in Vercel to enable paid checkout.
            </p>
          </SurfaceCard>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(18rem,0.9fr)] lg:items-start">
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer) => {
              const isBestValue = offer.pricing.tier === 'bestValueOffer';

              return (
                <article
                  className={`space-y-5 rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8 ${
                    isBestValue ? 'border-ink ring-1 ring-ink/10' : 'border-line/80'
                  }`}
                  key={offer.id}
                >
                  <div className="space-y-3">
                    <p
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                        isBestValue ? 'bg-ink text-paper' : 'bg-paper text-ink'
                      }`}
                    >
                      {offer.pricing.valueLabel}
                    </p>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold tracking-tight">{offer.product.name}</h3>
                      <p className="text-base font-semibold text-ink">
                        {offer.pricing.displayPrice} {offer.pricing.displayPeriodLabel}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-muted">{offer.product.shortDescription}</p>
                  </div>

                  <dl className="grid gap-4 text-sm">
                    <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                      <dt className="font-semibold text-ink">Best used when</dt>
                      <dd className="mt-2 leading-7 text-muted">{offer.product.audience}</dd>
                    </div>
                    <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                      <dt className="font-semibold text-ink">Value framing</dt>
                      <dd className="mt-2 leading-7 text-muted">{offer.pricing.comparisonHint}</dd>
                    </div>
                  </dl>

                  <div className="space-y-4 text-sm">
                    <section aria-label={`${offer.product.name} includes`} className="space-y-2">
                      <h4 className="font-semibold">Functionally includes</h4>
                      <ul className="list-disc space-y-2 pl-5 leading-7 text-ink marker:text-muted">
                        {offer.product.includes.map((deliverable) => (
                          <li key={deliverable}>{deliverable}</li>
                        ))}
                      </ul>
                    </section>

                    <section aria-label={`${offer.product.name} delivery`} className="space-y-1">
                      <h4 className="font-semibold">Delivery model</h4>
                      <p className="leading-7 text-muted">{offer.product.deliveryModel}</p>
                    </section>

                    <section aria-label={`${offer.product.name} exclusions`} className="space-y-2">
                      <h4 className="font-semibold">Not included</h4>
                      <ul className="list-disc space-y-2 pl-5 leading-7 text-muted marker:text-muted">
                        {offer.product.excludes.map((excludedItem) => (
                          <li key={excludedItem}>{excludedItem}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <ProCta
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-ink px-4 py-3 text-center text-sm font-medium transition hover:bg-ink hover:text-paper"
                      label={offer.product.ctaLabel}
                      checkoutTarget={offer.checkoutTarget}
                    />
                    {isBestValue ? null : (
                      <a className={secondaryCtaClassName} href="#tier-differentiation-heading">
                        See tier breakdown
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <SurfaceCard className="space-y-3 bg-paper">
              <h2 className="text-lg font-semibold tracking-tight">Where the line moves</h2>
              <p className="text-sm leading-7 text-muted">
                Free tells you what changed. Weekly Pro tells you what to do with this week. Monthly Bundle keeps the
                thesis connected so each weekly decision is carried into the next one and resolved at month end.
              </p>
            </SurfaceCard>
            <SurfaceCard className="space-y-3 bg-paper">
              <h2 className="text-lg font-semibold tracking-tight">Pricing hierarchy</h2>
              <p className="text-sm leading-7 text-muted">
                Single Issue is the entry offer for one decision cycle. Monthly Bundle is the best-value offer because it
                adds continuity and a month-end synthesis, not just more files.
              </p>
            </SurfaceCard>
          </div>
        </div>
      </PageSection>

      <TierDifferentiation
        description="Each tier answers a different reader need: public orientation, a single-week decision memo, or a continuity workflow that ties the month together."
        title="Editorial hierarchy by function"
      />

      <PageSection aria-labelledby="faq-heading">
        <SectionIntro id="faq-heading" title="FAQs" />
        <div className="grid gap-4 lg:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <SurfaceCard className="space-y-3" key={item.question}>
              <h3 className="text-base font-semibold tracking-tight">{item.question}</h3>
              <p className="text-sm leading-7 text-muted">{item.answer}</p>
            </SurfaceCard>
          ))}
        </div>
      </PageSection>
    </PageShell>
  );
}
