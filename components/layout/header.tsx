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

const getNavItemClassName = (item: NavItem, isActive: boolean): string => {
  if (item.isEmphasized) {
    if (isActive) {
      return getCtaClassName({
        className: 'whitespace-nowrap py-2.5 shadow-[0_6px_20px_rgba(16,24,40,0.15)]',
        tone: 'primary'
      });
    }

    return composeClassNames(
      'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-ink/60 transition',
      'hover:text-ink hover:bg-paper'
    );
  }

  return composeClassNames(
    'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition',
    isActive ? 'bg-line/50 text-ink font-semibold' : 'hover:bg-paper hover:text-ink'
  );
};

export function Header(): JSX.Element {
  const pathname = normalizePathname(usePathname() ?? '/');

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className={`${pageContainerClassName} py-4 sm:py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <Link className="min-w-0 max-w-2xl" href="/">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">Weekly crypto research</p>
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight text-ink sm:text-2xl">{siteConfig.name}</p>
                <p className="max-w-xl text-sm leading-6 text-muted sm:text-[0.95rem]">
                  Public market orientation with paid weekly decision briefs and monthly continuity.
                </p>
              </div>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="w-full lg:w-auto">
            <ul className="flex w-full gap-2 overflow-x-auto rounded-2xl border border-line/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-wrap sm:justify-end">
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
