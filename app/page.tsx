import Link from 'next/link';

export default function HomePage(): JSX.Element {
  return (
    <section className="space-y-6">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Weekly briefing</p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">Weekly Crypto Pulse</h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted">
        Placeholder homepage for a static-first editorial crypto publication.
      </p>
      <Link className="inline-flex border border-ink px-4 py-2 text-sm font-medium" href="/reports">
        Browse reports
      </Link>
    </section>
  );
}
