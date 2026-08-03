import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createDisclaimerMetadata } from '@/lib/seo';

export const metadata: Metadata = createDisclaimerMetadata();

const DISCLAIMER_POINTS = [
  'Crypto Pulse is provided for informational and educational purposes only.',
  'Content on this site is not personalized financial advice, investment advice, legal advice, or tax advice.',
  'No material on this site should be treated as a recommendation, solicitation, or offer to buy or sell any asset.',
  'You are responsible for your own research, risk assessment, and decision-making before taking any action.',
  'Digital asset markets are volatile, and past observations do not guarantee future results.'
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
    </PageShell>
  );
}
