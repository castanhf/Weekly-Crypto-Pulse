import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUsePathname = vi.hoisted(() => vi.fn<() => string>());

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className, 'aria-current': ariaCurrent }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'aria-current'?: 'page' | undefined;
  }) => (
    <a aria-current={ariaCurrent} className={className} href={href}>
      {children}
    </a>
  )
}));

import { Header } from '@/components/layout/header';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('regular nav items', () => {
    test('marks Reports as active when on /reports', () => {
      mockUsePathname.mockReturnValue('/reports');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Reports' });
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    test('marks Reports as inactive on homepage', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Reports' });
      expect(link).not.toHaveAttribute('aria-current');
    });

    test('marks Reports as active on a nested /reports/... path', () => {
      mockUsePathname.mockReturnValue('/reports/2025-01-06-some-report');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Reports' });
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Pro nav item (emphasized)', () => {
    test('Pro link receives ring classes when on /pro', () => {
      mockUsePathname.mockReturnValue('/pro');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Pro' });
      expect(link.className).toContain('ring-2');
    });

    test('Pro link does not have ring classes when not on /pro', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Pro' });
      expect(link.className).not.toContain('ring-2');
    });

    test('Pro link has aria-current="page" when on /pro', () => {
      mockUsePathname.mockReturnValue('/pro');
      render(<Header />);
      const link = screen.getByRole('link', { name: 'Pro' });
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  });
});
