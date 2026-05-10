import { describe, expect, it } from 'vitest';
import { RSS_SOURCES } from './sources';

describe('RSS_SOURCES', () => {
  it('has at least 4 sources', () => {
    expect(RSS_SOURCES.length).toBeGreaterThanOrEqual(4);
  });

  it('every source has a non-empty name', () => {
    for (const source of RSS_SOURCES) {
      expect(source.name.length).toBeGreaterThan(0);
    }
  });

  it('every source has a feedUrl starting with https://', () => {
    for (const source of RSS_SOURCES) {
      expect(source.feedUrl).toMatch(/^https:\/\//);
    }
  });

  it('every source has a valid format (rss2 or atom)', () => {
    const validFormats = new Set(['rss2', 'atom']);
    for (const source of RSS_SOURCES) {
      expect(validFormats.has(source.format)).toBe(true);
    }
  });

  it('source names are unique', () => {
    const names = RSS_SOURCES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('feedUrls are unique', () => {
    const urls = RSS_SOURCES.map((s) => s.feedUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('includes CoinDesk', () => {
    expect(RSS_SOURCES.some((s) => s.name === 'CoinDesk')).toBe(true);
  });

  it('includes at least one atom feed', () => {
    expect(RSS_SOURCES.some((s) => s.format === 'atom')).toBe(true);
  });

  it('includes at least one rss2 feed', () => {
    expect(RSS_SOURCES.some((s) => s.format === 'rss2')).toBe(true);
  });
});
