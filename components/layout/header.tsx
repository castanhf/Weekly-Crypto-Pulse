import Link from 'next/link';

import { pageContainerClassName } from '@/components/layout/page-shell';
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

const getNavItemClassName = (item: NavItem): string => {
  if (item.isEmphasized) {
    return 'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90';
  }

  return 'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-paper hover:text-ink';
};

export function Header(): JSX.Element {
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
            <ul className="flex gap-2 overflow-x-auto rounded-2xl border border-line/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex-wrap sm:justify-end">
              {navItems.map((item) => (
                <li className="shrink-0" key={item.href}>
                  <Link className={getNavItemClassName(item)} href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
