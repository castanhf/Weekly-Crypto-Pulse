import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { CheckoutTarget } from '@/lib/pro-offers';

vi.mock('next/link', () => ({
  default: ({ href, children, className, onClick, target, rel }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    target?: string;
    rel?: string;
  }) => (
    <a className={className} href={href} onClick={onClick} rel={rel} target={target}>
      {children}
    </a>
  )
}));

vi.mock('@/lib/analytics/events', () => ({ trackEvent: vi.fn() }));

const UNAVAILABLE: CheckoutTarget = { kind: 'checkoutUnavailable', href: '/pro#checkout-unavailable' };

vi.mock('@/lib/pro-offers', () => ({
  getProCheckoutTarget: vi.fn(() => UNAVAILABLE)
}));

import { PaidBlock } from '@/components/conversion/PaidBlock';

describe('PaidBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inline variant (default)', () => {
    test('renders "The Pro Pack" eyebrow', () => {
      render(<PaidBlock />);
      expect(screen.getByText('The Pro Pack')).toBeInTheDocument();
    });

    test('renders the inline heading', () => {
      render(<PaidBlock />);
      expect(screen.getByText('The decision layer on top of the free report.')).toBeInTheDocument();
    });

    test('renders the primary CTA link', () => {
      render(<PaidBlock />);
      expect(screen.getByRole('link', { name: "Buy this week's Pro Pack" })).toBeInTheDocument();
    });

    test('renders "Compare plans" link to /pro', () => {
      render(<PaidBlock />);
      const link = screen.getByRole('link', { name: 'Compare plans' });
      expect(link).toHaveAttribute('href', '/pro');
    });
  });

  describe('standalone variant', () => {
    test('renders "Ready to add Pro?" eyebrow', () => {
      render(<PaidBlock variant="standalone" />);
      expect(screen.getByText('Ready to add Pro?')).toBeInTheDocument();
    });

    test('renders the standalone heading', () => {
      render(<PaidBlock variant="standalone" />);
      expect(screen.getByText('One payment. Pro Pack by email within 24 hours.')).toBeInTheDocument();
    });

    test('renders both Single Issue and Monthly Bundle CTAs', () => {
      render(<PaidBlock variant="standalone" />);
      expect(screen.getByRole('link', { name: 'Buy Single Issue — $29' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Buy Monthly Bundle — $79' })).toBeInTheDocument();
    });
  });
});
