'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { pageContainerClassName } from '@/components/layout/page-shell';
import { composeClassNames, getCtaClassName } from '@/components/layout/ui-primitives';
import { siteConfig } from '@/lib/site';

type NavItem = Readonly<{
  href: string;
  label: string;
  isEmphasized?: boolean;
  matchPaths?: ReadonlyArray<string>;
  matchPrefixes?: ReadonlyArray<string>;
}>;

const navItems: readonly NavItem[] = [
  { href: '/reports', label: 'Reports', matchPaths: ['/reports'], matchPrefixes: ['/reports/'] },
  { href: '/pro', label: 'Pro', isEmphasized: true, matchPaths: ['/pro'], matchPrefixes: ['/pro/'] },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' }
] as const;

const normalizePathname = (pathname: string): string => {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
};

const isNavItemActive = (item: NavItem, currentPathname: string): boolean => {
  const exactPaths = item.matchPaths ?? [item.href];
  const prefixPaths = item.matchPrefixes ?? [];

  return exactPaths.includes(currentPathname) || prefixPaths.some((prefixPath) => currentPathname.startsWith(prefixPath));
};

const NAV_ITEM_BASE = 'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition';

const getNavItemClassName = (item: NavItem, isActive: boolean): string => {
  if (item.isEmphasized) {
    // Pro is always shown as an accent button — it's a purchase CTA, not just a nav link.
    // Full brightness when active (you're on /pro); dimmed accent border when inactive.
    if (isActive) {
      return getCtaClassName({
        className: 'whitespace-nowrap py-2.5 ring-2 ring-accent/50 ring-offset-1 ring-offset-surface',
        tone: 'primary'
      });
    }
    return composeClassNames(
      NAV_ITEM_BASE,
      'border border-accent/35 font-medium text-accent/75 hover:border-accent/60 hover:text-accent'
    );
  }

  // Regular nav items use a semantic "current page" indicator — a subtle white-glass
  // pill — rather than the orange CTA button style (which signals "buy", not "you are here").
  if (isActive) {
    return composeClassNames(NAV_ITEM_BASE, 'bg-white/[0.08] font-semibold text-paper');
  }

  return composeClassNames(NAV_ITEM_BASE, 'font-medium text-paper/60 hover:bg-white/5 hover:text-paper');
};

export function Header(): JSX.Element {
  const pathname = normalizePathname(usePathname() ?? '/');

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className={`${pageContainerClassName} py-4 sm:py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <Link className="min-w-0 max-w-2xl" href="/">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">Weekly crypto research</p>
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight text-paper sm:text-2xl">{siteConfig.name}</p>
                <p className="max-w-xl text-sm leading-6 text-muted sm:text-[0.95rem]">
                  Public market orientation with paid weekly decision briefs and monthly continuity.
                </p>
              </div>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="w-full lg:w-auto">
            <ul className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-surface p-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.3)] sm:flex-wrap sm:justify-end">
              {navItems.map((item) => {
                const isActive = isNavItemActive(item, pathname);

                return (
                  <li className="shrink-0" key={item.href}>
                    <Link aria-current={isActive ? 'page' : undefined} className={getNavItemClassName(item, isActive)} href={item.href}>
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
