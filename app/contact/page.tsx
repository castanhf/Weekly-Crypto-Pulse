import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createContactMetadata } from '@/lib/seo';

export const metadata: Metadata = createContactMetadata();

export default function ContactPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Questions, feedback, or data requests — we read everything."
        eyebrow="Contact"
        title="Get in touch."
      />

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Email</h2>
          <p className="text-base leading-8 text-muted">
            For all enquiries — editorial questions, data requests, privacy rights, or general feedback — email us at:
          </p>
          <p className="text-base font-medium text-paper">
            <a className="underline underline-offset-4 hover:text-accent" href="mailto:hello@weekly-crypto-pulse.com">
              hello@weekly-crypto-pulse.com
            </a>
          </p>
          <p className="text-sm leading-7 text-muted">We aim to respond within two business days.</p>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
