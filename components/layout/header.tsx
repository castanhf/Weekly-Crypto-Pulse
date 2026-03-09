import Link from 'next/link';

import { siteConfig } from '@/lib/site';

const NAV_ITEMS = [
  { href: '/reports', label: 'Reports' },
  { href: '/pro', label: 'Pricing' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' }
] as const;

export function Header(): JSX.Element {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-6 text-sm text-muted">
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
