import Link from 'next/link';

import { getCtaClassName } from '@/components/layout/ui-primitives';

export default function ReportNotFoundPage(): JSX.Element {
  return (
    <section className="space-y-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Report not found</h1>
      <p className="text-muted">This report doesn&apos;t exist or may have been removed.</p>
      <Link className={getCtaClassName({ tone: 'secondary' })} href="/reports">
        Browse all reports
      </Link>
    </section>
  );
}
