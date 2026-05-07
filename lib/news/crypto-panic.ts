/**
 * CryptoPanic API access — shared news source module.
 * Used by both the daily researcher (hoursBack: 24) and the weekly Market
 * Researcher (hoursBack: 168).
 *
 * Editorial constraint: fetch a controlled volume (default 20 items max), let
 * the LLM curate to 3-5 for the daily / 4-6 for the weekly. The point of
 * Crypto Pulse is curation; CryptoPanic provides raw input, not finished output.
 *
 * Env var: CRYPTOPANIC_API_KEY. If absent, returns [] with a console warning
 * rather than throwing — the pipeline degrades gracefully without news.
 *
 * DRIFT TRACKING: This module is the canonical news implementation for both
 * pipelines. Changes to importance scoring, caching, or filtering apply here.
 */

import { getCached } from '../cache/file-cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NewsItem = {
  headline: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
  importance: 'high' | 'medium' | 'low';
};

type CryptoPanicVotes = {
  positive: number;
  negative: number;
  important: number;
  liked: number;
  saved: number;
  comments: number;
  toxic: number;
  lol: number;
};

type CryptoPanicPost = {
  id: number;
  title: string;
  published_at: string;
  url: string;
  source: {
    title: string;
    region: string;
    domain: string;
  };
  votes: CryptoPanicVotes;
};

type CryptoPanicResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CryptoPanicPost[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRYPTOPANIC_BASE_URL = 'https://cryptopanic.com/api/v1/posts/';
const CACHE_KEY = 'cryptopanic-news';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const deriveImportance = (votes: CryptoPanicVotes): 'high' | 'medium' | 'low' => {
  if (votes.positive > 50) return 'high';
  if (votes.positive > 10) return 'medium';
  return 'low';
};

const fetchFromApi = async (
  apiKey: string,
  filterKind: 'news' | 'media' | 'all'
): Promise<NewsItem[]> => {
  const kindParam = filterKind === 'all' ? '' : `&kind=${filterKind}`;
  const url = `${CRYPTOPANIC_BASE_URL}?auth_token=${apiKey}&public=true${kindParam}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'crypto-pulse/1.0' }
  });
  if (!response.ok) throw new Error(`CryptoPanic API: HTTP ${response.status}`);
  const data = (await response.json()) as CryptoPanicResponse;

  return data.results.map((post) => ({
    headline: post.title,
    url: post.url,
    source: post.source.title,
    publishedAt: post.published_at,
    importance: deriveImportance(post.votes)
  }));
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Fetches recent news from CryptoPanic, filtered by time window.
 * Uses file-system cache (30-min TTL, stale fallback).
 *
 * On missing API key: returns [] with a console warning.
 * On API failure with stale cache: returns stale data (via getCached semantics).
 * On API failure without cache: throws — use fetchNewsWithFallback if you need
 * the empty-array-on-total-failure behaviour.
 */
export async function fetchRecentNews(options?: {
  hoursBack?: number;
  maxItems?: number;
  filterKind?: 'news' | 'media' | 'all';
}): Promise<NewsItem[]> {
  const hoursBack = options?.hoursBack ?? 24;
  const maxItems = options?.maxItems ?? 20;
  const filterKind = options?.filterKind ?? 'news';

  const apiKey = process.env['CRYPTOPANIC_API_KEY'];
  if (!apiKey) {
    console.warn('[crypto-panic] CRYPTOPANIC_API_KEY not set — returning empty news array');
    return [];
  }

  const allItems = await getCached<NewsItem[]>(
    CACHE_KEY,
    CACHE_TTL_MS,
    () => fetchFromApi(apiKey, filterKind)
  );

  const cutoffMs = Date.now() - hoursBack * 60 * 60 * 1000;
  const filtered = allItems.filter((item) => new Date(item.publishedAt).getTime() >= cutoffMs);

  const importanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return filtered.sort((a, b) => importanceOrder[a.importance]! - importanceOrder[b.importance]!).slice(0, maxItems);
}

/**
 * Same as fetchRecentNews but returns [] on total failure (no cache + API down)
 * instead of throwing. This is the safe variant for pipeline use — better to
 * have no news section than a pipeline crash.
 */
export async function fetchNewsWithFallback(options?: {
  hoursBack?: number;
  maxItems?: number;
  filterKind?: 'news' | 'media' | 'all';
}): Promise<NewsItem[]> {
  try {
    return await fetchRecentNews(options);
  } catch (err) {
    console.error(
      `[crypto-panic] Fetch failed, returning empty news array: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}
