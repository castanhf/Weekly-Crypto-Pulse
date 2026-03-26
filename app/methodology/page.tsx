import type { Metadata } from 'next';

import { ContentWidth, PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createMethodologyMetadata } from '@/lib/seo';

export const metadata: Metadata = createMethodologyMetadata();

const METHODOLOGY_SECTIONS = [
  {
    title: 'What we measure',
    points: [
      'Market structure indicators such as total crypto market capitalization, Bitcoin dominance, and broad risk sentiment.',
      'Positioning and participation signals that help identify whether leadership is concentrated or broadening across major assets.',
      'Weekly performance and momentum context for large-cap tokens to track relative strength and short-term trend shifts.'
    ]
  },
  {
    title: 'What data we use',
    points: [
      'Public market data from major spot exchanges and established index aggregators for prices, market cap, and dominance.',
      'Publicly available ETF flow disclosures and related institutional flow summaries where relevant to the weekly narrative.',
      'A consistent internal report schema so each edition can be compared against prior weeks without changing definitions.'
    ]
  },
  {
    title: 'Cadence',
    points: [
      'The report is published weekly and uses a fixed snapshot process for each issue.',
      'Metrics are reviewed in the same order every week to keep interpretation consistent and reduce process drift.',
      'When a data source is delayed, the report notes the timing and carries forward the most recent confirmed figure.'
    ]
  },
  {
    title: 'Limits of the analysis',
    points: [
      'This is a high-level market brief, not a complete model of all on-chain, macroeconomic, or project-specific risk factors.',
      'Data quality depends on third-party sources, which may revise values after publication.',
      'The analysis is descriptive and process-driven; it does not guarantee outcomes or eliminate uncertainty.'
    ]
  }
] as const;

export default function MethodologyPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-line/80 bg-gradient-to-br from-white via-white to-paper/70 px-5 py-7 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:px-8 sm:py-9"
        description="Weekly Crypto Pulse follows a repeatable process so readers can compare each issue on like-for-like terms."
        eyebrow="Methodology"
        title="A consistent framework for reading each week."
      />

      <PageSection>
        <ContentWidth className="mx-auto" size="feature">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
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
