import type { Metadata } from 'next';

import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { getProOffersPageData, type ProOfferCard } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

type HeroNote = Readonly<{
  title: string;
  description: string;
}>;

const HERO_NOTES: ReadonlyArray<HeroNote> = [
  {
    title: 'Single Issue',
    description: 'The entry offer when one week needs a decision now.'
  },
  {
    title: 'Monthly Bundle',
    description: 'The best-value option when decisions need continuity across the month.'
  }
] as const;

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


const offerAccentClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line/80 bg-white text-ink',
  bestValueOffer: 'border-ink bg-ink text-paper shadow-[0_20px_45px_rgba(16,24,40,0.16)]'
};

const offerPanelClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line/80 bg-paper text-muted',
  bestValueOffer: 'border-white/10 bg-white/5 text-paper/80'
};

const offerListClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'text-ink marker:text-muted',
  bestValueOffer: 'text-paper/85 marker:text-paper/50'
};

const offerCtaClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border border-ink bg-ink text-paper hover:bg-ink/90',
  bestValueOffer: 'border border-white bg-white text-ink hover:bg-paper'
};

const offerSecondaryLinkClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line text-ink hover:border-ink',
  bestValueOffer: 'border-white/15 text-paper hover:border-white/40 hover:bg-white/5'
};

function OfferCard({ offer }: Readonly<{ offer: ProOfferCard }>): JSX.Element {
  const { pricing, product, checkoutTarget } = offer;

  return (
    <article className={`flex h-full flex-col rounded-[1.75rem] border p-6 sm:p-8 ${offerAccentClassNames[pricing.tier]}`}>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                pricing.tier === 'bestValueOffer' ? 'bg-white/10 text-paper' : 'bg-paper text-ink'
              }`}
            >
              {pricing.valueLabel}
            </p>
            <div
              className={`rounded-2xl border px-4 py-3 text-right text-sm ${offerPanelClassNames[pricing.tier]}`}
            >
              <p className="font-semibold text-current">{pricing.displayPrice}</p>
              <p className="mt-1 leading-6">{pricing.displayPeriodLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{product.name}</h2>
            <p className={`text-sm leading-7 ${pricing.tier === 'bestValueOffer' ? 'text-paper/80' : 'text-muted'}`}>
              {product.shortDescription}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border px-4 py-4 ${offerPanelClassNames[pricing.tier]}`}>
          <p className="text-sm font-semibold text-current">Best used when</p>
          <p className="mt-2 text-sm leading-7">{product.audience}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={`rounded-2xl border px-4 py-4 ${offerPanelClassNames[pricing.tier]}`}>
            <h3 className="text-sm font-semibold text-current">Includes</h3>
            <ul className={`mt-3 list-disc space-y-2 pl-5 text-sm leading-7 ${offerListClassNames[pricing.tier]}`}>
              {product.includes.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </div>

          <div className={`rounded-2xl border px-4 py-4 ${offerPanelClassNames[pricing.tier]}`}>
            <h3 className="text-sm font-semibold text-current">Why it exists</h3>
            <p className="mt-3 text-sm leading-7 text-current">{pricing.comparisonHint}</p>
            <p className="mt-3 text-sm leading-7 text-current">{product.deliveryModel}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ProCta
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${offerCtaClassNames[pricing.tier]}`}
          checkoutTarget={checkoutTarget}
          label={product.ctaLabel}
        />
        <a
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${offerSecondaryLinkClassNames[pricing.tier]}`}
          href="#tier-differentiation-heading"
        >
          Compare tiers
        </a>
      </div>
    </article>
  );
}

export default function ProPage(): JSX.Element {
  const { missingPaymentLinkEnvVarNames, offers } = getProOffersPageData();
  const hasMissingOfferLink = missingPaymentLinkEnvVarNames.length > 0;

  return (
    <PageShell>
      <section className="rounded-[2rem] border border-line/80 bg-gradient-to-br from-white via-white to-paper/70 p-5 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start">
          <div className="space-y-6 xl:sticky xl:top-24">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Pro offers</p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                  Choose the paid scope that matches the job this week.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  Weekly Crypto Pulse keeps the buying decision simple: one issue when you need a single decision memo,
                  or the Monthly Bundle when you want the thesis to stay connected across the month.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {HERO_NOTES.map((note) => (
                <div className="rounded-2xl border border-line/80 bg-white px-5 py-5" key={note.title}>
                  <p className="text-base font-semibold tracking-tight text-ink">{note.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{note.description}</p>
                </div>
              ))}
            </div>

            <dl className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Purchase model</dt>
                <dd className="mt-2 text-sm font-medium text-ink">One-time Stripe checkout</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Buyer identity</dt>
                <dd className="mt-2 text-sm font-medium text-ink">Stripe payment details</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Site model</dt>
                <dd className="mt-2 text-sm font-medium text-ink">Static-first, no accounts</dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-line/80 bg-white px-5 py-5">
              <p className="text-sm font-semibold text-ink">Editorial hierarchy</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Free remains the orientation layer. Pro exists for action: Single Issue for one decision cycle and
                Monthly Bundle for continuity plus a month-end synthesis.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        {hasMissingOfferLink ? (
          <SurfaceCard className="mt-4 space-y-3 border-amber-300 bg-amber-50" id="checkout-unavailable">
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
      </section>

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description="The paid products stay intentionally simple. Both use Stripe Payment Links, both are one-time purchases, and the real choice is whether you need one weekly decision or continuity across the month."
          id="offers-heading"
          title="Before you buy"
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <SurfaceCard className="space-y-4 bg-white">
            <h2 className="text-lg font-semibold tracking-tight">Decision guide</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-sm font-semibold">Choose Single Issue</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  You want a focused brief for the current setup and do not need the thesis carried through the rest of the month.
                </p>
              </div>
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-sm font-semibold">Choose Monthly Bundle</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  You want each weekly decision to build on the last one, with continuity across the month and a closing synthesis.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4">
            {FAQ_ITEMS.map((item) => (
              <SurfaceCard className="space-y-3 bg-paper" key={item.question}>
                <h2 className="text-base font-semibold tracking-tight">{item.question}</h2>
                <p className="text-sm leading-7 text-muted">{item.answer}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </PageSection>

      <TierDifferentiation
        description="Each tier answers a different reader need: public orientation, a single-week decision memo, or a continuity workflow that ties the month together."
        title="Editorial hierarchy by function"
      />
    </PageShell>
  );
}
