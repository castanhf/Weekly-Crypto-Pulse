import type { Report } from '@/domain/report';

export const sampleWeeklyReport: Report = {
  metadata: {
    title: 'Weekly Crypto Pulse: ETF Flows Steady, Altcoins Pause',
    slug: '2026-02-23-etf-flows-steady-altcoins-pause',
    publishedAt: '2026-02-23',
    weekLabel: 'Week of Feb 23, 2026',
    summary:
      'Bitcoin held above key support as ETF inflows remained positive, while majors rotated and high-beta altcoins cooled after a two-week rally.',
    tags: ['bitcoin', 'etf', 'market-structure', 'altcoins']
  },
  regime: 'range-bound',
  marketSnapshot: {
    totalMarketCapUsd: 2730000000000,
    btcDominancePct: 55.4,
    ethDominancePct: 16.7,
    fearGreedIndex: 62
  },
  movers: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      changePct7d: 3.2,
      catalyst: 'Consistent spot ETF net inflows and resilient bid near support.'
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      changePct7d: -4.8,
      catalyst: 'Profit-taking after strong momentum run and softer on-chain activity.'
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      changePct7d: 6.1,
      catalyst: 'New enterprise integration announcements improved sentiment.'
    }
  ],
  sections: [
    {
      id: 'market-overview',
      heading: 'Market Overview',
      body: 'Price action was constructive but selective, with liquidity concentrated in BTC and large-cap pairs.',
      highlights: [
        'BTC closed the week above its 20-day moving average.',
        'Funding rates normalized after mid-week leverage reset.'
      ]
    },
    {
      id: 'positioning',
      heading: 'Positioning & Flows',
      body: 'Institutional flows remained constructive, while retail participation flattened compared with the prior week.',
      highlights: [
        'US spot BTC ETFs logged a fifth consecutive week of net inflows.',
        'Perpetual open interest rose modestly but stayed below January highs.'
      ]
    }
  ]
};
