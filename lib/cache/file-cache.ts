import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');

const toCacheKey = (key: string): string => key.toLowerCase().replace(/[^a-z0-9-]/g, '-');

/**
 * File-system cache with TTL. On fetcher failure, returns stale cached data
 * if available — this is the "fall back to cached data" behaviour from the
 * daily pipeline failure spec (failure handling section 4c).
 */
export const getCached = async <T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> => {
  const cacheFile = path.join(CACHE_DIR, `${toCacheKey(key)}.json`);

  let staleFallback: T | undefined;

  try {
    const stats = await stat(cacheFile);
    const ageMs = Date.now() - stats.mtimeMs;

    if (ageMs <= ttlMs) {
      const raw = await readFile(cacheFile, 'utf-8');
      return JSON.parse(raw) as T;
    }

    // File exists but is stale — keep as fallback
    const raw = await readFile(cacheFile, 'utf-8');
    staleFallback = JSON.parse(raw) as T;
  } catch {
    // Cache miss or read failure — continue to fetcher
  }

  try {
    const result = await fetcher();
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cacheFile, `${JSON.stringify(result)}\n`, 'utf-8');
    return result;
  } catch (fetchError) {
    if (staleFallback !== undefined) {
      console.error(
        `[file-cache] fetcher failed for key "${key}", using stale cache: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      );
      return staleFallback;
    }
    throw fetchError;
  }
};
