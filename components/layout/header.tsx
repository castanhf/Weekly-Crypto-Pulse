'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { pageContainerClassName } from '@/components/layout/page-shell';
import { siteConfig } from '@/lib/site';

type NavItem = Readonly<{
  href: string;
  label: string;
  matchMode?: 'exact' | 'prefix';
}>;

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/reports', label: 'Reports', matchMode: 'prefix' },
  { href: '/pro', label: 'Pro', matchMode: 'prefix' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' }
] as const;

const getNavItemIsActive = (pathname: string, item: NavItem): boolean => {
  if (item.href === '/') {
    return pathname === '/';
  }

  if (item.matchMode === 'prefix') {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
};

export function Header(): JSX.Element {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur-xl">
      <div className={`${pageContainerClassName} py-4 sm:py-5`}>
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-line/60 bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(16,24,40,0.06)] sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-6">
          <Link className="group min-w-0 flex-1" href="/">
            <div className="space-y-1">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted transition group-hover:text-ink">
                Weekly crypto research
              </p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">{siteConfig.name}</span>
                <span className="text-sm text-muted">Free orientation. Paid decision briefs.</span>
              </div>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="w-full lg:w-auto">
            <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {NAV_ITEMS.map((item) => {
                const isActive = getNavItemIsActive(pathname, item);

                return (
                  <li className="sm:flex-none" key={item.href}>
                    <Link
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                        isActive
                          ? 'border-ink bg-ink text-paper shadow-[0_10px_24px_rgba(16,24,40,0.14)]'
                          : 'border-line/80 bg-paper text-muted hover:border-ink/30 hover:bg-white hover:text-ink'
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
