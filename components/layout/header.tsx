import Link from 'next/link';

import { pageContainerClassName } from '@/components/layout/page-shell';
import { siteConfig } from '@/lib/site';

const NAV_ITEMS = [
  { href: '/reports', label: 'Reports' },
  { href: '/pro', label: 'Pro' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' }
] as const;

export function Header(): JSX.Element {
  return (
    <header className="border-b border-line/80 bg-white/95 backdrop-blur">
      <div className={`${pageContainerClassName} flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between`}>
        <Link className="max-w-xs text-lg font-semibold tracking-tight text-ink transition hover:text-muted" href="/">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary navigation">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted sm:gap-x-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link className="transition hover:text-ink" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
