import Link from 'next/link';

export function Footer(): JSX.Element {
  return (
    <footer className="border-t border-line/80 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Weekly Crypto Pulse</p>
          <p className="max-w-xl text-sm leading-7 text-muted">
            Static-first weekly crypto research with a clear editorial ladder from free orientation to paid decision and continuity products.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted sm:grid-cols-2 md:justify-items-end">
          <Link className="transition hover:text-ink" href="/reports">
            Reports archive
          </Link>
          <Link className="transition hover:text-ink" href="/pro">
            Pro offers
          </Link>
          <Link className="transition hover:text-ink" href="/methodology">
            Methodology
          </Link>
          <Link className="transition hover:text-ink" href="/disclaimer">
            Disclaimer
          </Link>
        </div>
      </div>
    </footer>
  );
}
