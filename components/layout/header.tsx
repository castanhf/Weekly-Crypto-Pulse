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
    return 'inline-flex min-h-11 items-center justify-center rounded-xl border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90';
  }

  return 'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-paper hover:text-ink';
};

export function Header(): JSX.Element {
  return (
    <header className="border-b border-line/80 bg-white">
      <div className={`${pageContainerClassName} py-5 sm:py-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <Link className="min-w-0 max-w-2xl" href="/">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">Weekly crypto research</p>
              <div className="space-y-1">
                <p className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{siteConfig.name}</p>
                <p className="text-sm leading-6 text-muted sm:text-[0.95rem]">
                  Public market orientation with paid weekly decision briefs and monthly continuity.
                </p>
              </div>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="w-full lg:w-auto">
            <ul className="grid grid-cols-2 gap-2 rounded-2xl border border-line/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:flex sm:flex-wrap sm:items-center sm:justify-end">
              {navItems.map((item) => (
                <li className="sm:flex-none" key={item.href}>
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
