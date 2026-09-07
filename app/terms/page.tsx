import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createTermsMetadata } from '@/lib/seo';

export const metadata: Metadata = createTermsMetadata();

// OPERATOR NOTE: This page contains boilerplate placeholder text that must be
// reviewed and updated by a qualified legal professional before going live.
// Do not treat this content as legally sound or jurisdiction-compliant.

export default function TermsPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="Terms and conditions for using Crypto Pulse."
        eyebrow="Terms of use"
        title="Using this site."
      />

      <PageSection>
        <SurfaceCard className="space-y-4 border-l-4 border-accent/60 bg-accent/5">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Operator note</p>
          <p className="text-sm leading-7 text-muted">
            These terms of use are boilerplate placeholder text. They have not been reviewed by a lawyer and do not
            constitute legal advice. A qualified legal professional must review and update this page before it is
            treated as binding or jurisdiction-compliant.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Acceptance of terms</h2>
          <p className="text-base leading-8 text-muted">
            By accessing or using Crypto Pulse you agree to be bound by these terms. If you do not agree, please do
            not use the site.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Permitted use</h2>
          <p className="text-base leading-8 text-muted">
            You may access and use the site for personal, non-commercial informational purposes. You may not:
          </p>
          <ul className="space-y-3.5 text-base leading-8 text-muted">
            <li className="border-l-2 border-line pl-4">Reproduce, redistribute, or resell any paid content without written permission.</li>
            <li className="border-l-2 border-line pl-4">Scrape, crawl, or programmatically extract content in a way that burdens site infrastructure.</li>
            <li className="border-l-2 border-line pl-4">Use the site or its content to provide investment advice to third parties on a commercial basis.</li>
            <li className="border-l-2 border-line pl-4">Misrepresent Crypto Pulse content as your own original work.</li>
          </ul>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Purchases and refunds</h2>
          <p className="text-base leading-8 text-muted">
            Paid reports are delivered digitally. Because content is delivered immediately upon purchase, all sales are
            final unless we are unable to deliver the purchased content. If you believe there has been an error with
            your order, contact us within 7 days of purchase.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Intellectual property</h2>
          <p className="text-base leading-8 text-muted">
            All content on this site — including reports, analysis, design, and code — is the property of Crypto Pulse
            and its operators unless otherwise stated. Nothing on this site grants you a licence to use our trademarks
            or intellectual property.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Disclaimer of warranties</h2>
          <p className="text-base leading-8 text-muted">
            The site and its content are provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do
            not warrant that the site will be error-free, uninterrupted, or free of viruses or other harmful components.
          </p>
          <p className="text-base leading-8 text-muted">
            Content on this site is not financial advice. See our <a className="underline underline-offset-4 hover:text-paper" href="/disclaimer">Disclaimer</a> for full details.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Limitation of liability</h2>
          <p className="text-base leading-8 text-muted">
            To the maximum extent permitted by applicable law, Crypto Pulse and its operators shall not be liable for
            any indirect, incidental, special, or consequential damages arising from your use of, or inability to use,
            the site or its content.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Changes to these terms</h2>
          <p className="text-base leading-8 text-muted">
            We may revise these terms at any time. Changes take effect when posted. Your continued use of the site
            constitutes acceptance of the revised terms.
          </p>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
