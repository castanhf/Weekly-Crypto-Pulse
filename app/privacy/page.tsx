import type { Metadata } from 'next';

import { PageHeader, PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { createPrivacyMetadata } from '@/lib/seo';

export const metadata: Metadata = createPrivacyMetadata();

// OPERATOR NOTE: This page contains boilerplate placeholder text that must be
// reviewed and updated by a qualified legal professional before going live.
// Do not treat this content as legally sound or jurisdiction-compliant.

export default function PrivacyPage(): JSX.Element {
  return (
    <PageShell>
      <PageHeader
        className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-surface via-surface to-canvas/50 px-5 py-7 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:px-8 sm:py-9"
        description="How Crypto Pulse collects, uses, and protects your information."
        eyebrow="Privacy policy"
        title="Your data, handled plainly."
      />

      <PageSection>
        <SurfaceCard className="space-y-4 border-l-4 border-accent/60 bg-accent/5">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Operator note</p>
          <p className="text-sm leading-7 text-muted">
            This privacy policy is boilerplate placeholder text. It has not been reviewed by a lawyer and does not
            constitute legal advice. A qualified legal professional must review and update this page before it is
            treated as binding or jurisdiction-compliant.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">What we collect</h2>
          <p className="text-base leading-8 text-muted">
            When you subscribe to our newsletter or purchase a paid report, we collect your email address and, where
            required for payment processing, billing details. Payment details are handled by Stripe and are not stored
            on our servers.
          </p>
          <p className="text-base leading-8 text-muted">
            We may collect anonymised usage analytics (page views, referrer information) to understand how the site is
            used. No personally identifiable information is included in analytics.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">How we use your information</h2>
          <ul className="space-y-3.5 text-base leading-8 text-muted">
            <li className="border-l-2 border-line pl-4">To deliver reports and newsletters you have subscribed to or purchased.</li>
            <li className="border-l-2 border-line pl-4">To process payments and send order confirmations.</li>
            <li className="border-l-2 border-line pl-4">To send occasional product updates or announcements directly related to Crypto Pulse (you can unsubscribe at any time).</li>
            <li className="border-l-2 border-line pl-4">To improve the site using aggregate, anonymised analytics.</li>
          </ul>
          <p className="text-base leading-8 text-muted">
            We do not sell or rent your personal information to third parties.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Third-party services</h2>
          <p className="text-base leading-8 text-muted">
            We use the following third-party services which may process your data under their own privacy policies:
          </p>
          <ul className="space-y-3.5 text-base leading-8 text-muted">
            <li className="border-l-2 border-line pl-4"><strong className="text-paper">Stripe</strong> — payment processing</li>
            <li className="border-l-2 border-line pl-4"><strong className="text-paper">beehiiv</strong> — newsletter delivery</li>
            <li className="border-l-2 border-line pl-4"><strong className="text-paper">Vercel</strong> — site hosting and edge network</li>
          </ul>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Your rights</h2>
          <p className="text-base leading-8 text-muted">
            You may request access to, correction of, or deletion of any personal data we hold about you. To make a
            request, or to unsubscribe from communications, contact us at the email address on this site. We aim to
            respond within 30 days.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Cookies</h2>
          <p className="text-base leading-8 text-muted">
            This site may use cookies or local storage for session management and analytics. No third-party advertising
            cookies are used. You can disable cookies in your browser settings, though some site functionality may be
            affected.
          </p>
        </SurfaceCard>
      </PageSection>

      <PageSection>
        <SurfaceCard className="space-y-5">
          <h2 className="text-[1.45rem] font-semibold tracking-tight">Changes to this policy</h2>
          <p className="text-base leading-8 text-muted">
            We may update this policy from time to time. Material changes will be noted at the top of this page with
            a revision date. Continued use of the site after changes constitutes acceptance of the updated policy.
          </p>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
