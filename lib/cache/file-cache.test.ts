// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn(),
    stat: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined)
  };
});

import { getCached } from './file-cache';

const mockedStat = vi.mocked(fs.stat);
const mockedReadFile = vi.mocked(fs.readFile);
const mockedWriteFile = vi.mocked(fs.writeFile);

const CACHE_KEY = 'test-key';
const TTL_MS = 30 * 60 * 1000;
const FRESH_PAYLOAD = { value: 'fresh' };
const STALE_PAYLOAD = { value: 'stale' };

const makeStatResult = (ageMs: number) => ({
  mtimeMs: Date.now() - ageMs
});

describe('getCached', () => {
  beforeEach(() => {
    vi.mocked(fs.stat).mockReset();
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.writeFile).mockReset();
    vi.mocked(fs.mkdir).mockReset();
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetcher and caches result on cache miss', async () => {
    mockedStat.mockRejectedValue({ code: 'ENOENT' });
    const fetcher = vi.fn().mockResolvedValue(FRESH_PAYLOAD);

    const result = await getCached(CACHE_KEY, TTL_MS, fetcher);

    expect(result).toEqual(FRESH_PAYLOAD);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockedWriteFile).toHaveBeenCalledTimes(1);
  });

  it('returns cached result when cache is fresh', async () => {
    mockedStat.mockResolvedValue(makeStatResult(60_000) as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
    mockedReadFile.mockResolvedValue(JSON.stringify(FRESH_PAYLOAD) as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never);
    const fetcher = vi.fn().mockResolvedValue({ value: 'should-not-be-called' });

    const result = await getCached(CACHE_KEY, TTL_MS, fetcher);

    expect(result).toEqual(FRESH_PAYLOAD);
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });

  it('calls fetcher and overwrites when cache is stale', async () => {
    mockedStat.mockResolvedValue(makeStatResult(TTL_MS + 1000) as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
    mockedReadFile.mockResolvedValue(JSON.stringify(STALE_PAYLOAD) as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never);
    const fetcher = vi.fn().mockResolvedValue(FRESH_PAYLOAD);

    const result = await getCached(CACHE_KEY, TTL_MS, fetcher);

    expect(result).toEqual(FRESH_PAYLOAD);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockedWriteFile).toHaveBeenCalledTimes(1);
  });

  it('returns stale cache when fetcher fails and stale data exists', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedStat.mockResolvedValue(makeStatResult(TTL_MS + 1000) as ReturnType<typeof fs.stat> extends Promise<infer T> ? T : never);
    mockedReadFile.mockResolvedValue(JSON.stringify(STALE_PAYLOAD) as ReturnType<typeof fs.readFile> extends Promise<infer T> ? T : never);
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await getCached(CACHE_KEY, TTL_MS, fetcher);

    expect(result).toEqual(STALE_PAYLOAD);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('stale cache'));
    consoleErrorSpy.mockRestore();
  });

  it('throws when fetcher fails and no cache exists', async () => {
    mockedStat.mockRejectedValue({ code: 'ENOENT' });
    const networkError = new Error('Network error');
    const fetcher = vi.fn().mockRejectedValue(networkError);

    await expect(getCached(CACHE_KEY, TTL_MS, fetcher)).rejects.toThrow('Network error');
  });
});