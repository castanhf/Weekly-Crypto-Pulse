import type { Metadata } from 'next';

import { PaidBlock } from '@/components/conversion/PaidBlock';
import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { composeClassNames, getCtaClassName } from '@/components/layout/ui-primitives';
import { ProCta } from '@/components/pro/pro-cta';
import { getProProductDefinition } from '@/domain/pro-product';
import { getProOffersPageData, type ProOfferCard } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

// ---------------------------------------------------------------------------
// Offer card (pricing section)
// ---------------------------------------------------------------------------

type OfferMetric = Readonly<{ label: string; value: string }>;

const offerCardClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border border-white/10 bg-surface text-paper shadow-[0_18px_35px_rgba(0,0,0,0.3)]',
  bestValueOffer: 'border border-accent/40 bg-accent text-ink shadow-[0_24px_50px_rgba(247,147,26,0.25)]'
};

const offerSurfaceClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border border-white/10 bg-canvas/50 text-paper',
  bestValueOffer: 'border border-ink/15 bg-ink/20 text-ink'
};

const offerMutedTextClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'text-muted',
  bestValueOffer: 'text-ink/70'
};

const offerListClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'text-paper marker:text-muted',
  bestValueOffer: 'text-ink/80 marker:text-ink/50'
};

const OFFER_METRICS: Readonly<Record<ProOfferCard['id'], ReadonlyArray<OfferMetric>>> = {
  singleIssue: [
    { label: 'Coverage', value: '1 weekly Pro issue' },
    { label: 'Covers', value: 'This week only' },
    { label: 'Price', value: '$29 for one issue' }
  ],
  monthlyBundle: [
    { label: 'Coverage', value: '4 weekly Pro issues + month-end synthesis' },
    { label: 'Covers', value: 'All four weekly issues in the month' },
    { label: 'Effective rate', value: '$19.75 per issue · saves $37 vs four singles' }
  ]
};

function OfferCard({ offer }: Readonly<{ offer: ProOfferCard }>): JSX.Element {
  const { pricing, product, checkoutTarget } = offer;
  const metrics = OFFER_METRICS[offer.id];
  const isBestValue = pricing.tier === 'bestValueOffer';

  return (
    <article className={`flex h-full flex-col rounded-[2rem] border p-5 sm:p-8 ${offerCardClassNames[pricing.tier]}`}>
      <div className="space-y-7 sm:space-y-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
                isBestValue ? 'border-white/10 bg-white/10 text-paper' : 'border-white/10 bg-canvas/50 text-paper'
              }`}
            >
              {pricing.valueLabel}
            </p>
            <p className={`text-sm font-medium ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.comparisonHint}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[1.7rem] font-semibold tracking-tight sm:text-[1.95rem]">{product.name}</h3>
            <p className={`text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.shortDescription}</p>
          </div>
        </header>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">One-time price</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{pricing.displayPrice}</p>
          <p className={`mt-2 text-base leading-7 ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.displayPeriodLabel}</p>
        </div>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <dl className="grid gap-3 lg:grid-cols-3">
            {metrics.map((metric) => (
              <div
                className={`rounded-2xl border px-4 py-4 ${isBestValue ? 'border-white/10 bg-black/10' : 'border-white/10 bg-surface'}`}
                key={metric.label}
              >
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-current/65">{metric.label}</dt>
                <dd className="mt-2 text-base font-medium leading-7 text-current">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-base font-semibold text-current">Included</h4>
            <ul className={`mt-4 list-disc space-y-3 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-current">Best for</h4>
            <p className={`mt-2 text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.audience}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-current/10 pt-7">
        <p className={`mb-5 max-w-md text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.deliveryModel}</p>
        <ProCta
          className={composeClassNames(
            isBestValue ? getCtaClassName({ tone: 'inverted' }) : getCtaClassName({ tone: 'primary' }),
            'w-full sm:w-auto'
          )}
          checkoutTarget={checkoutTarget}
          label={product.ctaLabel}
        />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProPage(): JSX.Element {
  const { missingPaymentLinkEnvVarNames, offers } = getProOffersPageData();
  const hasMissingOfferLink = missingPaymentLinkEnvVarNames.length > 0;
  const singleIssueProduct = getProProductDefinition('singleIssue');

  return (
    <PageShell className="space-y-16 sm:space-y-20 lg:space-y-24">

      {/* 1 — Hero */}
      <section className="rounded-[2rem] bg-brand px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="max-w-3xl space-y-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/60">The Pro Pack</p>
          <h1 className="text-[2rem] font-semibold tracking-tight text-white sm:text-[2.8rem] sm:leading-[1.1]">
            The decision layer on top of the free weekly.
          </h1>
          <p className="text-base leading-8 text-white/70">
            Every Monday, Crypto Pulse publishes a free orientation report. The Pro Pack adds the signals the free version
            doesn't publish — decision memo, thesis checklist, risk review, and watchlist levels. Pay once through Stripe,
            receive by email. One issue or four.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <ProCta checkoutTarget={offers[0]?.checkoutTarget ?? { href: '/pro#pricing', kind: 'checkoutUnavailable' }} label="Buy Single Issue" />
            <ProCta
              checkoutTarget={offers[1]?.checkoutTarget ?? { href: '/pro#pricing', kind: 'checkoutUnavailable' }}
              label="Buy Monthly Bundle"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/50 hover:text-white"
            />
          </div>
        </div>
      </section>

      {/* 2 — What Pro delivers */}
      <PageSection aria-labelledby="what-pro-delivers-heading">
        <SectionIntro
          description="Five deliverables with every Pro issue — none of them on the free site."
          id="what-pro-delivers-heading"
          title="What the Pro Pack includes"
        />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {singleIssueProduct.includes.map((item, i) => (
            <li
              className="flex gap-4 rounded-2xl border border-white/10 bg-surface px-5 py-5"
              key={item}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {i + 1}
              </span>
              <p className="text-base leading-7 text-muted">{item}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* 3 — How it works */}
      <PageSection aria-labelledby="how-it-works-heading">
        <SectionIntro
          description="The model is manual fulfillment — no account, no subscription, no automation. Here's what happens between payment and delivery."
          id="how-it-works-heading"
          title="How it works"
        />
        <ol className="mt-8 space-y-5">
          {[
            {
              step: '1',
              heading: 'Pay through Stripe',
              body: 'Click the payment link. Stripe handles the transaction and records the email on your order. No account is created — Stripe knows you by your payment record.'
            },
            {
              step: '2',
              heading: 'We verify and deliver',
              body: 'After your payment goes through, we check the Stripe dashboard and send the Pro Pack to your email within 24 hours. Delivery is manual, not instant — that\'s the tradeoff for keeping the infrastructure simple.'
            },
            {
              step: '3',
              heading: 'For Monthly Bundle: four reports plus a month-end synthesis',
              body: 'Each weekly Pro report arrives on Monday as it\'s published. After the fourth issue, we send the month-end synthesis that reconciles what held, what shifted, and what the month-long pattern looks like.'
            }
          ].map(({ step, heading, body }) => (
            <li className="flex gap-5 rounded-2xl border border-white/10 bg-surface px-5 py-5 sm:px-6" key={step}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-paper">
                {step}
              </span>
              <div className="space-y-1.5">
                <p className="font-semibold text-paper">{heading}</p>
                <p className="text-base leading-8 text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* 4 — Pricing */}
      <PageSection aria-labelledby="pricing-heading" id="pricing">
        <SectionIntro
          description="Two options — one issue if this specific week needs more depth, four issues if you want to follow the market through the month."
          id="pricing-heading"
          title="Choose your coverage"
        />

        {hasMissingOfferLink ? (
          <SurfaceCard className="mt-6 space-y-3 border-accent/30 bg-accent/10" id="checkout-unavailable">
            <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
            <p className="text-base leading-8 text-muted">
              One or more Stripe Payment Links are not configured for this environment. Set{' '}
              {missingPaymentLinkEnvVarNames.map((envVarName) => (
                <code className="mx-1 rounded bg-accent/20 px-1 py-0.5 font-mono" key={envVarName}>
                  {envVarName}
                </code>
              ))}
              in Vercel to enable paid checkout.
            </p>
          </SurfaceCard>
        ) : null}

        <div className="mt-8 grid gap-7 lg:grid-cols-2 lg:items-stretch">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </PageSection>

      {/* 5 — The Crypto Pulse approach */}
      <PageSection aria-labelledby="approach-heading">
        <SectionIntro
          description={undefined}
          id="approach-heading"
          title="The Crypto Pulse approach"
        />
        <div className="mx-auto mt-6 max-w-3xl space-y-6 text-base leading-8 text-muted">
          <p>
            Crypto Pulse publishes every Monday, regardless of whether the market did anything interesting. If it was a
            quiet week, the free report says so directly. If there was a real move, the free report explains it without
            calling it a trading signal. That's the register: honest orientation for readers who know how to use market
            information.
          </p>
          <p>
            Pro adds the signals layer. The decision memo, thesis, and risk checklist are the analyst's working notes —
            the structured reasoning behind the weekly orientation. They're useful if you're actually making decisions
            based on what the report says. If you're reading to stay oriented, the free version has what you need.
          </p>
          <p>
            The payment model is manual fulfillment: you pay through Stripe once, we verify and deliver the report to
            your email, and there's nothing else to manage. No subscription, no account, no login. The tradeoff is that
            delivery takes up to 24 hours rather than being instant — that's a structural choice, not a bug.
          </p>
        </div>
      </PageSection>

      {/* 6 — Final CTA */}
      <PageSection>
        <SurfaceCard className="border-accent/20 bg-gradient-to-br from-surface to-canvas/50 p-6 sm:p-10">
          <PaidBlock variant="standalone" />
        </SurfaceCard>
      </PageSection>

    </PageShell>
  );
}
