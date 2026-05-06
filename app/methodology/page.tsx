import type { Metadata } from 'next';

import { ContentWidth, PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createMethodologyMetadata } from '@/lib/seo';

export const metadata: Metadata = createMethodologyMetadata();

const METHODOLOGY_SECTIONS = [
  {
    title: 'What we measure',
    points: [
      'Total crypto market capitalization — how big the market is overall and which direction it is moving.',
      "Bitcoin's share of that total (Bitcoin dominance) — whether money is concentrating in the safest crypto asset or spreading into others.",
      'A fear and greed score from 0 to 100 — a sentiment reading that combines price volatility, trading volume, and social signals.',
      'Weekly performance for Bitcoin, Ethereum, and Solana — which assets led and which fell behind.'
    ]
  },
  {
    title: 'Where the data comes from',
    points: [
      'Prices, market cap, and dominance from CoinGecko — a publicly available market data source.',
      'The Fear & Greed Index from Alternative.me — updated daily, based on volatility, volume, social media, and surveys.',
      'ETF flow data from public institutional disclosures where available — to gauge whether large investors are adding or reducing positions.',
      'News and macro context from reputable public sources; no single outlet is treated as a sole source.'
    ]
  },
  {
    title: 'How we describe market conditions',
    points: [
      'Each week we put the market into one of four states: risk-on, risk-off, range-bound, or in transition.',
      'Risk-on: money is moving into riskier assets. Prices tend to rise broadly.',
      'Risk-off: investors are pulling back toward safer assets. Prices tend to fall or flatten.',
      'Range-bound: no strong move in either direction. In transition: the state is shifting and it is not yet clear which way.'
    ]
  },
  {
    title: 'How reports are written',
    points: [
      'Published weekly, covering the previous seven days.',
      'The same data sequence is used for every issue so you can compare them directly.',
      'Analysis is AI-assisted: a language model drafts the sections, which are then reviewed and structured against the source data.',
      'When a data source is delayed or unavailable, we note it and use the most recent confirmed figure.'
    ]
  },
  {
    title: 'What this is and is not',
    points: [
      'We explain what is happening in the market. We do not tell you what to do about it. That is your decision.',
      'This is a summary read — on-chain data, macroeconomic factors, and project-specific risk are not fully covered.',
      'Third-party data sources can revise their numbers after we publish; we update when corrections are material.',
      'Nothing here is personalized financial advice. Read the disclaimer for the full statement.'
    ]
  }
] as const;

export default function MethodologyPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Every report follows the same process. That keeps each issue comparable to the one before it."
        eyebrow="Methodology"
        title="How we read the market each week."
      />

      <PageSection>
        <ContentWidth className="mx-auto" size="content">
          <div className="grid gap-5 xl:grid-cols-2 xl:gap-7">
            {METHODOLOGY_SECTIONS.map((section) => (
              <SurfaceCard className="space-y-5" key={section.title}>
                <h2 className="text-[1.45rem] font-semibold tracking-tight">{section.title}</h2>
                <ul className="space-y-3.5 text-base leading-8 text-muted">
                  {section.points.map((point) => (
                    <li className="border-l-2 border-line pl-4" key={point}>
                      {point}
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            ))}
          </div>
        </ContentWidth>
      </PageSection>
    </PageShell>
  );
}
