import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/cache/file-cache', () => ({
  getCached: vi.fn()
}));

import { getCached } from '../../lib/cache/file-cache';
import type { NewsItem } from './crypto-panic';
import { fetchNewsWithFallback, fetchRecentNews } from './crypto-panic';

const mockGetCached = vi.mocked(getCached);

const NOW_ISO = '2026-05-07T12:00:00.000Z';
const ONE_HOUR_AGO = '2026-05-07T11:00:00.000Z';
const TWO_DAYS_AGO = '2026-05-05T12:00:00.000Z';
const TEN_DAYS_AGO = '2026-04-27T12:00:00.000Z';

const makeNewsItem = (
  headline: string,
  importance: 'high' | 'medium' | 'low',
  publishedAt: string,
  source = 'CoinDesk'
): NewsItem => ({
  headline,
  url: `https://example.com/${headline.toLowerCase().replace(/\s+/g, '-')}`,
  source,
  publishedAt,
  importance
});

describe('fetchRecentNews', () => {
  beforeEach(() => {
    mockGetCached.mockReset();
    vi.stubEnv('CRYPTOPANIC_API_KEY', 'test-key-123');
    vi.setSystemTime(new Date(NOW_ISO));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('calls getCached with the correct key and TTL', async () => {
    mockGetCached.mockResolvedValue([]);
    await fetchRecentNews();
    expect(mockGetCached).toHaveBeenCalledWith('cryptopanic-news', 30 * 60 * 1000, expect.any(Function));
  });

  it('returns empty array and logs warning when API key is absent', async () => {
    vi.stubEnv('CRYPTOPANIC_API_KEY', '');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await fetchRecentNews();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not call getCached when API key is absent', async () => {
    vi.stubEnv('CRYPTOPANIC_API_KEY', '');
    await fetchRecentNews();
    expect(mockGetCached).not.toHaveBeenCalled();
  });

  it('returns processed NewsItem array from getCached', async () => {
    const items = [makeNewsItem('Bitcoin surges', 'high', ONE_HOUR_AGO)];
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews({ hoursBack: 24, maxItems: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('Bitcoin surges');
    expect(result[0].source).toBe('CoinDesk');
    expect(result[0].importance).toBe('high');
  });

  it('passes "high" importance through for items with high importance', async () => {
    mockGetCached.mockResolvedValue([makeNewsItem('High item', 'high', ONE_HOUR_AGO)]);
    const result = await fetchRecentNews();
    expect(result[0].importance).toBe('high');
  });

  it('passes "medium" importance through', async () => {
    mockGetCached.mockResolvedValue([makeNewsItem('Medium item', 'medium', ONE_HOUR_AGO)]);
    const result = await fetchRecentNews();
    expect(result[0].importance).toBe('medium');
  });

  it('passes "low" importance through', async () => {
    mockGetCached.mockResolvedValue([makeNewsItem('Low item', 'low', ONE_HOUR_AGO)]);
    const result = await fetchRecentNews();
    expect(result[0].importance).toBe('low');
  });

  it('filters out items older than hoursBack', async () => {
    const items = [
      makeNewsItem('Recent item', 'medium', ONE_HOUR_AGO),
      makeNewsItem('Old item', 'medium', TEN_DAYS_AGO)
    ];
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews({ hoursBack: 24 });
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('Recent item');
  });

  it('includes items within hoursBack window', async () => {
    const items = [
      makeNewsItem('Item within 48h', 'medium', TWO_DAYS_AGO),
      makeNewsItem('Old item', 'medium', TEN_DAYS_AGO)
    ];
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews({ hoursBack: 72 });
    expect(result).toHaveLength(1);
    expect(result[0].headline).toBe('Item within 48h');
  });

  it('respects maxItems cap', async () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeNewsItem(`Item ${i}`, 'low', ONE_HOUR_AGO)
    );
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews({ maxItems: 3 });
    expect(result).toHaveLength(3);
  });

  it('sorts by importance descending (high before medium before low)', async () => {
    const items = [
      makeNewsItem('Low item', 'low', ONE_HOUR_AGO),
      makeNewsItem('High item', 'high', ONE_HOUR_AGO),
      makeNewsItem('Medium item', 'medium', ONE_HOUR_AGO)
    ];
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews({ maxItems: 10 });
    expect(result[0].importance).toBe('high');
    expect(result[1].importance).toBe('medium');
    expect(result[2].importance).toBe('low');
  });

  it('handles empty results array', async () => {
    mockGetCached.mockResolvedValue([]);
    const result = await fetchRecentNews();
    expect(result).toEqual([]);
  });

  it('uses default hoursBack of 24 when not specified', async () => {
    const items = [
      makeNewsItem('Recent', 'low', ONE_HOUR_AGO),
      makeNewsItem('Old', 'low', TEN_DAYS_AGO)
    ];
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews();
    expect(result).toHaveLength(1);
  });

  it('uses default maxItems of 20 when not specified', async () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      makeNewsItem(`Item ${i}`, 'low', ONE_HOUR_AGO)
    );
    mockGetCached.mockResolvedValue(items);
    const result = await fetchRecentNews();
    expect(result).toHaveLength(20);
  });
});

describe('fetchNewsWithFallback', () => {
  beforeEach(() => {
    mockGetCached.mockReset();
    vi.stubEnv('CRYPTOPANIC_API_KEY', 'test-key-123');
    vi.setSystemTime(new Date(NOW_ISO));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('returns news items on success', async () => {
    mockGetCached.mockResolvedValue([makeNewsItem('Good news', 'medium', ONE_HOUR_AGO)]);
    const result = await fetchNewsWithFallback({ hoursBack: 24, maxItems: 10 });
    expect(result).toHaveLength(1);
  });

  it('returns empty array on total failure (no cache, API down)', async () => {
    mockGetCached.mockRejectedValue(new Error('Network failure'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await fetchNewsWithFallback();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('does not throw on total failure', async () => {
    mockGetCached.mockRejectedValue(new Error('total failure'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(fetchNewsWithFallback()).resolves.toEqual([]);
    consoleSpy.mockRestore();
  });

  it('returns empty array when API key is absent (without throwing)', async () => {
    vi.stubEnv('CRYPTOPANIC_API_KEY', '');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await fetchNewsWithFallback();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('passes options through to fetchRecentNews', async () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeNewsItem(`Item ${i}`, 'low', ONE_HOUR_AGO)
    );
    mockGetCached.mockResolvedValue(items);
    const result = await fetchNewsWithFallback({ maxItems: 2 });
    expect(result).toHaveLength(2);
  });
});
