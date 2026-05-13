export type RssSource = {
  readonly name: string;
  readonly feedUrl: string;
  readonly format: 'rss2' | 'atom';
};

export const RSS_SOURCES: ReadonlyArray<RssSource> = [
  {
    name: 'CoinDesk',
    feedUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    format: 'rss2'
  },
  {
    name: 'The Block',
    feedUrl: 'https://www.theblock.co/rss.xml',
    format: 'rss2'
  },
  {
    name: 'Decrypt',
    feedUrl: 'https://decrypt.co/feed',
    format: 'rss2'
  },
  {
    name: 'CoinTelegraph',
    feedUrl: 'https://cointelegraph.com/rss',
    format: 'rss2'
  },
  {
    name: 'Bloomberg Crypto',
    feedUrl: 'https://feeds.bloomberg.com/crypto/news.rss',
    format: 'rss2'
  },
  {
    name: 'Ethereum Foundation Blog',
    feedUrl: 'https://blog.ethereum.org/en/feed.xml',
    format: 'atom'
  }
];
