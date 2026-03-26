import type { Metadata } from 'next';

import { ContentWidth, PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createDisclaimerMetadata } from '@/lib/seo';

export const metadata: Metadata = createDisclaimerMetadata();

const DISCLAIMER_POINTS = [
  'Weekly Crypto Pulse is provided for informational and educational purposes only.',
  'Content on this site is not personalized financial advice, investment advice, legal advice, or tax advice.',
  'No material on this site should be treated as a recommendation, solicitation, or offer to buy or sell any asset.',
  'You are responsible for your own research, risk assessment, and decision-making before taking any action.',
  'Digital asset markets are volatile, and past observations do not guarantee future results.'
] as const;

export default function DisclaimerPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        description="Please read this page before using any information published on Weekly Crypto Pulse."
        eyebrow="Disclaimer"
        title="Important context before acting on the research."
      />

      <PageSection>
        <ContentWidth>
          <SurfaceCard className="space-y-5">
            <h2 className="text-[1.45rem] font-semibold tracking-tight">Important notice</h2>
            <ul className="space-y-3.5 text-base leading-8 text-muted">
              {DISCLAIMER_POINTS.map((point) => (
                <li className="border-l-2 border-line pl-4" key={point}>
                  {point}
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </ContentWidth>
      </PageSection>
    </PageShell>
  );
}
