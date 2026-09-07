import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createDisclaimerMetadata } from '@/lib/seo';

export const metadata: Metadata = createDisclaimerMetadata();

const DISCLAIMER_POINTS = [
  'Crypto Pulse is provided for informational and educational purposes only.',
  'Content on this site is not personalized financial advice, investment advice, legal advice, or tax advice.',
  'No material on this site should be treated as a recommendation, solicitation, or offer to buy or sell any asset.',
  'You are responsible for your own research, risk assessment, and decision-making before taking any action.',
  'Digital asset markets are volatile, and past observations do not guarantee future results.',
  'Market data, prices, and analytics are sourced from third-party providers and may be delayed, incomplete, or inaccurate. Crypto Pulse does not guarantee the accuracy or timeliness of any data.',
  'References to specific assets or market conditions are for context and illustration only, not endorsement.',
  'Use of this site does not create any advisory, fiduciary, or professional relationship between you and Crypto Pulse.'
] as const;

export default function DisclaimerPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Crypto Pulse is informational only. We describe what's happening in the market. What you do with that information is your decision."
        eyebrow="Disclaimer"
        title="We explain the market. You decide what to do."
      />

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Important notice</h2>
          <p className="text-base leading-8 text-muted">
            We are not financial advisers. We do not give personalized advice. We share what we observe in the market
            and explain what that might mean. What you do with that information is entirely your decision.
          </p>
          <ul className="space-y-3.5 text-base leading-8 text-muted">
            {DISCLAIMER_POINTS.map((point) => (
              <li className="border-l-2 border-line pl-4" key={point}>
                {point}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Affiliate and commercial disclosures</h2>
          <p className="text-base leading-8 text-muted">
            Crypto Pulse may earn revenue through paid report tiers and product sales. We do not accept sponsored content
            or paid placements that would influence editorial coverage. Our analysis is independent of any commercial
            relationship.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Limitation of liability</h2>
          <p className="text-base leading-8 text-muted">
            To the maximum extent permitted by law, Crypto Pulse and its operators disclaim all liability for any losses,
            damages, or costs arising from reliance on content published on this site. You use this site at your own risk.
          </p>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
