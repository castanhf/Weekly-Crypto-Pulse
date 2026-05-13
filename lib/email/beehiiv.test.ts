import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _resetSegmentCacheForTesting, listSubscribers, sendBroadcast, subscribeToList } from '@/lib/email/beehiiv';

const API_KEY = 'test-api-key';
const PUB_ID = 'pub-test-123';

const setEnv = (): void => {
  process.env.BEEHIIV_API_KEY = API_KEY;
  process.env.BEEHIIV_PUBLICATION_ID = PUB_ID;
};

const clearEnv = (): void => {
  delete process.env.BEEHIIV_API_KEY;
  delete process.env.BEEHIIV_PUBLICATION_ID;
};

const mockFetch = (responses: Array<Partial<Response>>): void => {
  let index = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      const response = responses[index++] ?? responses[responses.length - 1];
      return Promise.resolve(response);
    })
  );
};

const okResponse = (body: unknown): Partial<Response> => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body))
});

const errorResponse = (status: number, body = ''): Partial<Response> => ({
  ok: false,
  status,
  json: () => Promise.reject(new Error('not json')),
  text: () => Promise.resolve(body)
});

describe('Beehiiv client', () => {
  beforeEach(() => {
    setEnv();
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearEnv();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    _resetSegmentCacheForTesting();
  });

  describe('subscribeToList', () => {
    it('posts to subscriptions endpoint without daily opt-in tag', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: { id: 'sub-1' } }));
      vi.stubGlobal('fetch', fetcher);

      await subscribeToList({ email: 'user@example.com', dailyDigestOptIn: false });

      expect(fetcher).toHaveBeenCalledOnce();
      const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`/publications/${PUB_ID}/subscriptions`);
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.email).toBe('user@example.com');
      expect(body.tags).toBeUndefined();
    });

    it('includes daily_digest_opt_in tag when opted in', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: { id: 'sub-2' } }));
      vi.stubGlobal('fetch', fetcher);

      await subscribeToList({ email: 'daily@example.com', dailyDigestOptIn: true });

      const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.tags).toEqual(['daily_digest_opt_in']);
    });

    it('throws on missing credentials', async () => {
      clearEnv();
      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false })).rejects.toThrow(
        'BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must be set'
      );
    });

    it('throws non-retryable on 401', async () => {
      mockFetch([errorResponse(401, 'Unauthorized')]);
      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false })).rejects.toThrow('401');
    });
  });

  describe('sendBroadcast', () => {
    it('sends broadcast to all subscribers without segment_id', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: { id: 'bc-1' } }));
      vi.stubGlobal('fetch', fetcher);

      const result = await sendBroadcast({
        subject: 'Weekly Crypto Pulse — BTC rallies',
        htmlBody: '<p>Hello</p>',
        plaintextBody: 'Hello',
        segment: 'all'
      });

      expect(result.broadcastId).toBe('bc-1');
      const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.segment_id).toBeUndefined();
    });

    it('resolves segment_id when targeting daily_digest_opt_in', async () => {
      const fetcher = vi
        .fn()
        // First call: GET segments list
        .mockResolvedValueOnce(
          okResponse({ data: [{ id: 'seg-daily-123', name: 'daily_digest_opt_in' }] })
        )
        // Second call: POST broadcast
        .mockResolvedValueOnce(okResponse({ data: { id: 'bc-2' } }));

      vi.stubGlobal('fetch', fetcher);

      const result = await sendBroadcast({
        subject: 'Daily update',
        htmlBody: '<p>Today in crypto</p>',
        plaintextBody: 'Today in crypto',
        segment: 'daily_digest_opt_in'
      });

      expect(result.broadcastId).toBe('bc-2');
      expect(fetcher).toHaveBeenCalledTimes(2);
      const [, broadcastInit] = fetcher.mock.calls[1] as [string, RequestInit];
      const body = JSON.parse(broadcastInit.body as string) as Record<string, unknown>;
      expect(body.segment_id).toBe('seg-daily-123');
    });

    it('throws when daily_digest_opt_in segment is not found', async () => {
      // segments endpoint returns empty list
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: [] }));
      vi.stubGlobal('fetch', fetcher);

      await expect(
        sendBroadcast({ subject: 'x', htmlBody: '', plaintextBody: '', segment: 'daily_digest_opt_in' })
      ).rejects.toThrow('daily_digest_opt_in');
    });
  });

  describe('listSubscribers', () => {
    it('returns subscribers and maps dailyDigestOptIn from tags', async () => {
      mockFetch([
        okResponse({
          data: [
            { email: 'a@b.com', tags: ['daily_digest_opt_in'] },
            { email: 'c@d.com', tags: [] }
          ],
          next_cursor: 'cursor-xyz'
        })
      ]);

      const result = await listSubscribers({ limit: 10 });

      expect(result.subscribers).toHaveLength(2);
      expect(result.subscribers[0]?.dailyDigestOptIn).toBe(true);
      expect(result.subscribers[1]?.dailyDigestOptIn).toBe(false);
      expect(result.nextCursor).toBe('cursor-xyz');
    });

    it('passes limit and cursor as query params', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: [] }));
      vi.stubGlobal('fetch', fetcher);

      await listSubscribers({ limit: 5, cursor: 'abc' });

      const [url] = fetcher.mock.calls[0] as [string];
      expect(url).toContain('limit=5');
      expect(url).toContain('cursor=abc');
    });
  });

  describe('retry on 429', () => {
    it('retries once on 429 then succeeds', async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(errorResponse(429))
        .mockResolvedValueOnce(okResponse({ data: { id: 'sub-ok' } }));

      vi.stubGlobal('fetch', fetcher);

      const promise = subscribeToList({ email: 'retry@example.com', dailyDigestOptIn: false });
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toBeUndefined();
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
