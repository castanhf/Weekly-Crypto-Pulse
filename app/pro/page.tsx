import type { Metadata } from 'next';

import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
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
      <section className="rounded-[2rem] border border-line/80 bg-gradient-to-br from-white via-white to-paper/70 p-5 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Pro offers</p>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  Free for orientation. Paid offers for the decision and the follow-through.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  The page is structured around the two one-time paid products first: Single Issue when this week needs a
                  decision now, and Monthly Bundle when you want the month to remain connected from issue to issue.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line/80 bg-white px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Entry offer</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">Single Issue</h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Best when you want one weekly decision brief without committing to a longer arc.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-ink px-5 py-5 text-paper shadow-[0_16px_40px_rgba(16,24,40,0.16)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/70">Best value</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight">Monthly Bundle</h2>
                <p className="mt-2 text-sm leading-7 text-paper/80">
                  Best when weekly decisions need continuity and a month-end synthesis, not just more files.
                </p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Purchase model</dt>
                <dd className="mt-2 text-sm font-medium text-ink">One-time Stripe checkout</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Identity source</dt>
                <dd className="mt-2 text-sm font-medium text-ink">Stripe payment details</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Site model</dt>
                <dd className="mt-2 text-sm font-medium text-ink">Static-first, no accounts</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            {offers.map((offer) => {
              const isBestValue = offer.pricing.tier === 'bestValueOffer';

              return (
                <article
                  className={`space-y-5 rounded-[1.75rem] border p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8 ${
                    isBestValue
                      ? 'border-ink bg-ink text-paper shadow-[0_20px_45px_rgba(16,24,40,0.16)]'
                      : 'border-line/80 bg-white'
                  }`}
                  key={offer.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                          isBestValue ? 'bg-white/10 text-paper' : 'bg-paper text-ink'
                        }`}
                      >
                        {offer.pricing.valueLabel}
                      </p>
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">{offer.product.name}</h2>
                        <p className={`text-sm font-semibold ${isBestValue ? 'text-paper/80' : 'text-muted'}`}>
                          {offer.pricing.displayPrice} {offer.pricing.displayPeriodLabel}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        isBestValue ? 'border-white/10 bg-white/5 text-paper/80' : 'border-line/80 bg-paper text-muted'
                      }`}
                    >
                      <p className="font-semibold text-current">Best used when</p>
                      <p className="mt-2 max-w-xs leading-7">{offer.product.audience}</p>
                    </div>
                  </div>

                  <p className={`text-sm leading-7 ${isBestValue ? 'text-paper/80' : 'text-muted'}`}>
                    {offer.product.shortDescription}
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div
                      className={`rounded-2xl border px-4 py-4 ${
                        isBestValue ? 'border-white/10 bg-white/5' : 'border-line/80 bg-paper'
                      }`}
                    >
                      <h3 className="text-sm font-semibold">What you receive</h3>
                      <ul
                        className={`mt-3 list-disc space-y-2 pl-5 text-sm leading-7 marker:text-current ${
                          isBestValue ? 'text-paper/85' : 'text-ink'
                        }`}
                      >
                        {offer.product.includes.map((deliverable) => (
                          <li key={deliverable}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className={`rounded-2xl border px-4 py-4 ${
                        isBestValue ? 'border-white/10 bg-white/5' : 'border-line/80 bg-paper'
                      }`}
                    >
                      <h3 className="text-sm font-semibold">Why this tier exists</h3>
                      <p className={`mt-3 text-sm leading-7 ${isBestValue ? 'text-paper/80' : 'text-muted'}`}>
                        {offer.pricing.comparisonHint}
                      </p>
                      <p className={`mt-3 text-sm leading-7 ${isBestValue ? 'text-paper/80' : 'text-muted'}`}>
                        {offer.product.deliveryModel}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <ProCta
                      className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${
                        isBestValue
                          ? 'border border-white bg-white text-ink hover:bg-paper'
                          : 'border border-ink bg-ink text-paper hover:bg-ink/90'
                      }`}
                      checkoutTarget={offer.checkoutTarget}
                      label={offer.product.ctaLabel}
                    />
                    <a
                      className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${
                        isBestValue
                          ? 'border-white/15 text-paper hover:border-white/40 hover:bg-white/5'
                          : 'border-line text-ink hover:border-ink'
                      }`}
                      href="#tier-differentiation-heading"
                    >
                      Compare tiers
                    </a>
                  </div>
                </article>
              );
            })}

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
          </div>
        </div>
      </section>

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description="Both paid products remain one-time purchases through Stripe Payment Links. The decision is about scope: a single issue when the setup is clear, or a month-long workflow when each weekly view should carry into the next one."
          id="offers-heading"
          title="How to choose the right paid scope"
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <SurfaceCard className="space-y-4 bg-white">
            <h2 className="text-lg font-semibold tracking-tight">Decision guide</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-sm font-semibold">Choose Single Issue</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  You already know the current setup matters and want one focused brief for the week in front of you.
                </p>
              </div>
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-sm font-semibold">Choose Monthly Bundle</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  You want continuity across the month so weekly positioning changes can be tracked and resolved in one arc.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3 bg-paper">
            <h2 className="text-lg font-semibold tracking-tight">What stays constant</h2>
            <p className="text-sm leading-7 text-muted">
              Free tells you what changed. Weekly Pro tells you what to do with this week. Monthly Bundle keeps the thesis
              connected so each weekly decision is carried into the next one and closed with a month-end synthesis.
            </p>
          </SurfaceCard>
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
