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
}>;

const navItems: readonly NavItem[] = [
  { href: '/reports', label: 'Reports' },
  { href: '/pro', label: 'Pro', isEmphasized: true },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' }
] as const;

const normalizePathname = (pathname: string): string => {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
};

const isReportsPath = (pathname: string): boolean => pathname === '/reports' || pathname.startsWith('/reports/');

const isProPath = (pathname: string): boolean => pathname === '/pro' || pathname.startsWith('/pro/');

const isNavItemActive = (itemHref: string, currentPathname: string): boolean => {
  if (itemHref === '/reports') {
    return isReportsPath(currentPathname);
  }

  if (itemHref === '/pro') {
    return isProPath(currentPathname);
  }

  return currentPathname === itemHref || currentPathname.startsWith(`${itemHref}/`);
};

const getNavItemClassName = (item: NavItem, isActive: boolean): string => {
  if (item.isEmphasized) {
    return getCtaClassName({
      className: composeClassNames(
        'whitespace-nowrap py-2.5',
        isActive ? 'shadow-[0_6px_20px_rgba(16,24,40,0.15)]' : 'border-line/80 bg-white hover:border-ink/30 hover:bg-paper'
      ),
      tone: isActive ? 'primary' : 'secondary'
    });
  }

  return composeClassNames(
    'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition',
    isActive ? 'bg-paper text-ink' : 'hover:bg-paper hover:text-ink'
  );
};

export function Header(): JSX.Element {
  const pathname = normalizePathname(usePathname() ?? '/');

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
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
                const isActive = isNavItemActive(item.href, pathname);

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
