import type { Metadata } from 'next';

import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { composeClassNames, getCtaClassName } from '@/components/layout/ui-primitives';
import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { getProOffersPageData, type ProOfferCard } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

type OfferMetric = Readonly<{
  label: string;
  value: string;
}>;

type OfferNarrative = Readonly<{
  emphasis: string;
  metrics: ReadonlyArray<OfferMetric>;
}>;

const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Is this a subscription?',
    answer: 'No. You pay once through Stripe and get the report. There is no recurring charge and nothing to cancel.'
  },
  {
    question: 'Do I need an account or login?',
    answer: 'No account needed. You pay through Stripe, and we fulfill based on your payment record. Nothing to log into.'
  },
  {
    question: 'How is Pro access delivered?',
    answer:
      'After your Stripe payment goes through, we deliver the report to the email on your order. The fulfillment is manual — we check payment records and send the file.'
  }
] as const;

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

const offerCtaClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: getCtaClassName({ tone: 'primary' }),
  bestValueOffer: getCtaClassName({ tone: 'inverted' })
};

const offerSecondaryLinkClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: getCtaClassName({ tone: 'secondary' }),
  bestValueOffer: getCtaClassName({ className: 'border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/5' })
};

const OFFER_NARRATIVES: Readonly<Record<ProOfferCard['id'], OfferNarrative>> = {
  singleIssue: {
    emphasis: 'Good when this week specifically needs more than the free summary.',
    metrics: [
      { label: 'Coverage', value: '1 weekly Pro issue' },
      { label: 'Covers', value: 'This week only' },
      { label: 'Price', value: '$29 for one issue' }
    ]
  },
  monthlyBundle: {
    emphasis: 'Good when you want to follow the market week by week through a full month.',
    metrics: [
      { label: 'Coverage', value: '4 weekly Pro issues + month-end synthesis' },
      { label: 'Covers', value: 'All four weekly issues in the month' },
      { label: 'Effective rate', value: '$19.75 per issue • saves $37 vs four single issues' }
    ]
  }
} as const;

function OfferCard({ offer }: Readonly<{ offer: ProOfferCard }>): JSX.Element {
  const { pricing, product, checkoutTarget } = offer;
  const narrative = OFFER_NARRATIVES[offer.id];
  const isBestValueOffer = pricing.tier === 'bestValueOffer';

  return (
    <article className={`flex h-full flex-col rounded-[2rem] border p-5 sm:p-8 ${offerCardClassNames[pricing.tier]}`}>
      <div className="space-y-7 sm:space-y-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
                isBestValueOffer ? 'border-white/10 bg-white/10 text-paper' : 'border-white/10 bg-canvas/50 text-paper'
              }`}
            >
              {pricing.valueLabel}
            </p>
            <p className={`text-sm font-medium ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.comparisonHint}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[1.95rem]">{product.name}</h2>
            <p className={`text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.shortDescription}</p>
          </div>
        </header>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">One-time price</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{pricing.displayPrice}</p>
          <p className={`mt-2 text-base leading-7 ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.displayPeriodLabel}</p>
        </div>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">What this buys</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-current">{narrative.emphasis}</p>

          <dl className="mt-6 grid gap-3 lg:grid-cols-3">
            {narrative.metrics.map((metric) => (
              <div
                className={`rounded-2xl border px-4 py-4 ${
                  isBestValueOffer ? 'border-white/10 bg-black/10' : 'border-white/10 bg-surface'
                }`}
                key={metric.label}
              >
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-current/65">{metric.label}</dt>
                <dd className="mt-2 text-base font-medium leading-7 text-current">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-7 sm:space-y-8">
          <div>
            <h3 className="text-base font-semibold text-current">Included in this offer</h3>
            <ul className={`mt-5 list-disc space-y-3.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.includes.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-current">Best used when</h3>
            <p className={`mt-3 text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.audience}</p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-current">Not included</h3>
            <ul className={`mt-5 list-disc space-y-3.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.excludes.map((exclusion) => (
                <li key={exclusion}>{exclusion}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-current/10 pt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className={`max-w-md text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.deliveryModel}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <ProCta className={composeClassNames(offerCtaClassNames[pricing.tier], 'w-full sm:w-auto')} checkoutTarget={checkoutTarget} label={product.ctaLabel} />
          <a
            className={composeClassNames(offerSecondaryLinkClassNames[pricing.tier], 'w-full sm:w-auto')}
            href="#tier-differentiation-heading"
          >
            Compare tiers
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ProPage(): JSX.Element {
  const { missingPaymentLinkEnvVarNames, offers } = getProOffersPageData();
  const hasMissingOfferLink = missingPaymentLinkEnvVarNames.length > 0;

  return (
    <PageShell>
      <section className="rounded-[2rem] bg-brand px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="space-y-10 sm:space-y-12">
          <header className="max-w-2xl space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/60">Pro offers</p>
            <h1 className="text-[2rem] font-semibold tracking-tight text-white sm:text-[2.8rem] sm:leading-[1.1]">
              One issue or the full month.<br />Both are one-time purchases.
            </h1>
            <p className="text-base leading-8 text-white/70">
              No subscription. No account. Pay through Stripe once and get the report by email — pick the coverage that fits the week.
            </p>
          </header>
          <div className="grid gap-7 lg:grid-cols-2 lg:items-stretch">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

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
      </section>

      <TierDifferentiation
        description="Free covers what's happening. Weekly Pro adds the decision layer for one week. Monthly Bundle does that for four weeks in a row."
        title="Plan comparison"
      />

      <PageSection aria-labelledby="before-you-buy-heading" className="space-y-6">
        <SectionIntro
          description="Everything is structured to keep checkout and fulfillment clear: Stripe handles payment identity, products are one-time purchases, and the site has no account system."
          id="before-you-buy-heading"
          title="Before you buy"
        />

        <SurfaceCard className="border-white/10 bg-surface p-0">
          <div className="divide-y divide-white/10">
            {FAQ_ITEMS.map((item) => (
              <article className="space-y-3 px-5 py-5 sm:px-6" key={item.question}>
                <h2 className="text-base font-semibold tracking-tight text-paper">{item.question}</h2>
                <p className="text-base leading-8 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
