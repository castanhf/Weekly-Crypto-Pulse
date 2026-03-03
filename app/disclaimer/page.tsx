import type { Metadata } from 'next';

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
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Disclaimer</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Please read this page before using any information published on Weekly Crypto Pulse.
        </p>
      </header>

      <article className="space-y-4 border border-line bg-white p-6">
        <h2 className="text-xl font-semibold tracking-tight">Important notice</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-muted">
          {DISCLAIMER_POINTS.map((point) => (
            <li className="border-l-2 border-line pl-3" key={point}>
              {point}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
