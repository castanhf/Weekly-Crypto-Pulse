import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { WinnersAndLosers } from '@/components/reports/winners-losers';
import type { Mover } from '@/domain/report';

const mover = (overrides: Partial<Mover> = {}): Mover => ({
  name: 'Bitcoin',
  symbol: 'BTC',
  changePct7d: 5.5,
  catalyst: 'ETF inflows',
  ...overrides
});

describe('WinnersAndLosers', () => {
  test('renders section heading', () => {
    render(<WinnersAndLosers movers={[]} />);
    expect(screen.getByText('Top movers (7D)')).toBeInTheDocument();
  });

  test('renders a winner with its symbol and catalyst', () => {
    render(<WinnersAndLosers movers={[mover({ name: 'Ethereum', symbol: 'ETH', changePct7d: 8 })]} />);
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('(ETH)')).toBeInTheDocument();
    expect(screen.getByText('ETF inflows')).toBeInTheDocument();
  });

  test('applies provided sectionLabels', () => {
    render(
      <WinnersAndLosers
        movers={[mover({ changePct7d: -2 })]}
        sectionLabels={{ winners: 'Top Gainers', losers: 'Top Losers' }}
      />
    );
    expect(screen.getByText('Top Gainers')).toBeInTheDocument();
    expect(screen.getByText('Top Losers')).toBeInTheDocument();
  });

  test('derives "Smallest losses" label when all movers are negative', () => {
    const movers = [
      mover({ symbol: 'BTC', changePct7d: -3 }),
      mover({ name: 'Ethereum', symbol: 'ETH', changePct7d: -7 }),
    ];
    render(<WinnersAndLosers movers={movers} />);
    expect(screen.getByText('Smallest losses')).toBeInTheDocument();
  });

  test('shows empty state when there are no winners', () => {
    render(<WinnersAndLosers movers={[mover({ changePct7d: -5 })]} />);
    expect(screen.getByText('None for this period.')).toBeInTheDocument();
  });

  test('shows empty state when there are no losers', () => {
    render(<WinnersAndLosers movers={[mover({ changePct7d: 5 })]} />);
    expect(screen.getByText('None for this period.')).toBeInTheDocument();
  });
});
