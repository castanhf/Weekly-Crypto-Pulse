import { XMLParser } from 'fast-xml-parser';
import { getCached } from '../cache/file-cache';
import { RSS_SOURCES } from './sources';
import type { RssSource } from './sources';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type NewsItem = {
  readonly headline: string;
  readonly url: string;
  readonly source: string;
  readonly publishedAt: string;
  readonly importance: 'high' | 'medium' | 'low';
};

export type FetchOptions = {
  readonly hoursBack?: number;
  readonly maxTotalItems?: number;
  readonly perSourceCap?: number;
};

// ---------------------------------------------------------------------------
// Internal RSS/Atom raw types
// ---------------------------------------------------------------------------

type Rss2Item = {
  title?: string;
  link?: string;
  pubDate?: string;
  'dc:date'?: string;
};

type AtomEntry = {
  title?: string | { '#text'?: string };
  id?: string;
  link?: { '@_href'?: string } | Array<{ '@_href'?: string; '@_rel'?: string }>;
  published?: string;
  updated?: string;
};

type Rss2Feed = {
  rss?: { channel?: { item?: Rss2Item | Rss2Item[] } };
};

type AtomFeed = {
  feed?: { entry?: AtomEntry | AtomEntry[] };
};

// ---------------------------------------------------------------------------
// XML parser (shared instance)
// ---------------------------------------------------------------------------

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tagName) => tagName === 'item' || tagName === 'entry'
});

// ---------------------------------------------------------------------------
// Feed parsing
// ---------------------------------------------------------------------------

const parseTitle = (raw: string | { '#text'?: string } | undefined): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  return (raw['#text'] ?? '').trim();
};

const parseAtomLink = (
  raw: { '@_href'?: string } | Array<{ '@_href'?: string; '@_rel'?: string }> | undefined
): string => {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    const alternate = raw.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate');
    return (alternate?.['@_href'] ?? raw[0]?.['@_href'] ?? '').trim();
  }
  return (raw['@_href'] ?? '').trim();
};

const itemsFromRss2 = (xml: Rss2Feed, source: string): RawItem[] => {
  const items = xml.rss?.channel?.item;
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item) => ({
    headline: (item.title ?? '').trim(),
    url: (item.link ?? '').trim(),
    publishedAt: item.pubDate ?? item['dc:date'] ?? '',
    source
  }));
};

const itemsFromAtom = (xml: AtomFeed, source: string): RawItem[] => {
  const entries = xml.feed?.entry;
  if (!entries) return [];
  const arr = Array.isArray(entries) ? entries : [entries];
  return arr.map((entry) => ({
    headline: parseTitle(entry.title),
    url: parseAtomLink(entry.link) || (typeof entry.id === 'string' ? entry.id : ''),
    publishedAt: entry.published ?? entry.updated ?? '',
    source
  }));
};

type RawItem = { headline: string; url: string; publishedAt: string; source: string };

const parseFeed = (xml: string, feed: RssSource): RawItem[] => {
  const parsed = PARSER.parse(xml) as Rss2Feed & AtomFeed;
  if (feed.format === 'atom') return itemsFromAtom(parsed, feed.name);
  return itemsFromRss2(parsed, feed.name);
};

// ---------------------------------------------------------------------------
// Jaccard deduplication with cross-source tracking
// ---------------------------------------------------------------------------

const tokenize = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
};

const DEDUP_THRESHOLD = 0.6;

type ClusteredItem = RawItem & { sourcesCount: number };

// Dedup by Jaccard similarity on headline tokens.
// When a near-duplicate is found, the cluster tracks all contributing sources
// so cross-source coverage score is preserved after dedup.
const dedupWithSourceCount = (items: RawItem[]): ClusteredItem[] => {
  const clusters: Array<{ tokens: Set<string>; item: RawItem; sources: Set<string> }> = [];

  for (const item of items) {
    const tokens = tokenize(item.headline);
    const match = clusters.find(({ tokens: s }) => jaccard(s, tokens) >= DEDUP_THRESHOLD);
    if (match) {
      match.sources.add(item.source);
    } else {
      clusters.push({ tokens, item, sources: new Set([item.source]) });
    }
  }

  return clusters.map(({ item, sources }) => ({ ...item, sourcesCount: sources.size }));
};

// ---------------------------------------------------------------------------
// Importance scoring from source coverage breadth
// ---------------------------------------------------------------------------

const toNewsItem = (item: ClusteredItem): NewsItem => {
  const importance: 'high' | 'medium' | 'low' =
    item.sourcesCount >= 3 ? 'high' : item.sourcesCount >= 2 ? 'medium' : 'low';
  return {
    headline: item.headline,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    importance
  };
};

// ---------------------------------------------------------------------------
// Per-feed fetch
// ---------------------------------------------------------------------------

const fetchFeed = async (feed: RssSource): Promise<RawItem[]> => {
  const response = await fetch(feed.feedUrl, {
    headers: { Accept: 'application/rss+xml, application/atom+xml, text/xml, */*', 'User-Agent': 'crypto-pulse/1.0' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${feed.feedUrl}`);
  const xml = await response.text();
  return parseFeed(xml, feed);
};

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000;

export const fetchRecentNews = async (options: FetchOptions = {}): Promise<NewsItem[]> => {
  const { hoursBack = 24, maxTotalItems = 20, perSourceCap = 10 } = options;
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

  const rawBySource = await getCached<RawItem[][]>('rss-news-feeds', CACHE_TTL_MS, async () => {
    const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed));
    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.warn(`[rss-aggregator] Feed "${RSS_SOURCES[i]!.name}" failed: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
      return [];
    });
  });

  const allItems: RawItem[] = rawBySource.flatMap((items, i) => {
    const source = RSS_SOURCES[i]!.name;
    return items
      .filter((item) => {
        if (!item.headline || !item.publishedAt) return false;
        const ts = Date.parse(item.publishedAt);
        return !Number.isNaN(ts) && ts >= cutoff;
      })
      .slice(0, perSourceCap)
      .map((item) => ({ ...item, source }));
  });

  const clustered = dedupWithSourceCount(allItems);

  return clustered
    .map(toNewsItem)
    .sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    })
    .slice(0, maxTotalItems);
};

export const fetchRecentNewsWithFallback = async (options: FetchOptions = {}): Promise<NewsItem[]> => {
  try {
    return await fetchRecentNews(options);
  } catch (err) {
    console.error(`[rss-aggregator] fetchRecentNews failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
};
