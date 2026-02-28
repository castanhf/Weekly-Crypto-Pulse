import Link from 'next/link';

export default function NotFoundPage(): JSX.Element {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Report not found</h1>
      <p className="text-muted">The requested report slug does not exist in this placeholder dataset.</p>
      <Link className="inline-flex border border-ink px-4 py-2 text-sm font-medium" href="/reports">
        Back to reports
      </Link>
    </section>
  );
}
