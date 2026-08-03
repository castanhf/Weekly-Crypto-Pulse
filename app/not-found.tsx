import Link from 'next/link';

import { getCtaClassName } from '@/components/layout/ui-primitives';

export default function NotFoundPage(): JSX.Element {
  return (
    <section className="space-y-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link className={getCtaClassName({ tone: 'secondary' })} href="/">
        Back to home
      </Link>
    </section>
  );
}
