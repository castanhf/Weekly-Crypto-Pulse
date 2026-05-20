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

const jsonErrorResponse = (status: number, body: Record<string, unknown>): Partial<Response> => ({
  ok: false,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body))
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

    it('applies daily_digest_opt_in tag via separate tags endpoint when opted in', async () => {
      // WU2: two-step subscribe+tag — subscription body has no tags field.
      const fetcher = vi
        .fn()
        // First call: POST subscribe → returns subscription with ID
        .mockResolvedValueOnce(okResponse({ data: { id: 'sub-2' } }))
        // Second call: POST tags endpoint
        .mockResolvedValueOnce(okResponse({ data: { id: 'sub-2', tags: ['daily_digest_opt_in'] } }));
      vi.stubGlobal('fetch', fetcher);

      await subscribeToList({ email: 'daily@example.com', dailyDigestOptIn: true });

      expect(fetcher).toHaveBeenCalledTimes(2);

      // First call: subscribe without tags
      const [subUrl, subInit] = fetcher.mock.calls[0] as [string, RequestInit];
      expect(subUrl).toContain(`/publications/${PUB_ID}/subscriptions`);
      expect(subUrl).not.toContain('/tags');
      const subBody = JSON.parse(subInit.body as string) as Record<string, unknown>;
      expect(subBody.tags).toBeUndefined();

      // Second call: POST to tags endpoint
      const [tagsUrl, tagsInit] = fetcher.mock.calls[1] as [string, RequestInit];
      expect(tagsUrl).toContain(`/publications/${PUB_ID}/subscriptions/sub-2/tags`);
      const tagsBody = JSON.parse(tagsInit.body as string) as Record<string, unknown>;
      expect(tagsBody.tags).toEqual(['daily_digest_opt_in']);
    });

    it('logs a warning and does not throw when tag application fails', async () => {
      // WU2: tag failure is non-fatal — subscriber gets created, tag application degrades gracefully.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(okResponse({ data: { id: 'sub-3' } }))
        .mockResolvedValueOnce(errorResponse(422, 'tag error'));
      vi.stubGlobal('fetch', fetcher);

      await expect(
        subscribeToList({ email: 'daily2@example.com', dailyDigestOptIn: true })
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('daily_digest_opt_in'));
      warnSpy.mockRestore();
    });

    it('logs a warning when subscription response has no ID and skips tagging', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const fetcher = vi.fn().mockResolvedValueOnce(okResponse({ data: {} }));
      vi.stubGlobal('fetch', fetcher);

      await subscribeToList({ email: 'noid@example.com', dailyDigestOptIn: true });

      expect(fetcher).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      warnSpy.mockRestore();
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
    it('sends broadcast to all subscribers without segment recipients', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: { id: 'bc-1' } }));
      vi.stubGlobal('fetch', fetcher);

      const result = await sendBroadcast({
        subject: 'Weekly Crypto Pulse — BTC rallies',
        htmlBody: '<p>Hello</p>',
        plaintextBody: 'Hello',
        segment: 'all'
      });

      expect(result.broadcastId).toBe('bc-1');
      const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
      // WU1: correct endpoint is /posts
      expect(url).toContain(`/publications/${PUB_ID}/posts`);
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.recipients).toBeUndefined();
    });

    it('uses body_content and confirmed status (not rendered_html/draft)', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: { id: 'bc-x' } }));
      vi.stubGlobal('fetch', fetcher);

      await sendBroadcast({
        subject: 'Test subject',
        htmlBody: '<p>body html</p>',
        plaintextBody: 'body text',
        segment: 'all'
      });

      const [, init] = fetcher.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      // WU1: body_content replaces content.rendered_html
      expect(body.body_content).toBe('<p>body html</p>');
      expect(body.content).toBeUndefined();
      // WU1: status must be 'confirmed' to actually send
      expect(body.status).toBe('confirmed');
      // WU1: title is required by Beehiiv Posts API
      expect(body.title).toBe('Test subject');
    });

    it('resolves segment_id and uses include_segment_ids in recipients when targeting daily_digest_opt_in', async () => {
      // WU1: segment targeting uses recipients.email.include_segment_ids
      const fetcher = vi
        .fn()
        // First call: GET segments list
        .mockResolvedValueOnce(
          okResponse({ data: [{ id: 'seg-daily-123', name: 'daily_digest_opt_in' }] })
        )
        // Second call: POST post
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

      const [postUrl, broadcastInit] = fetcher.mock.calls[1] as [string, RequestInit];
      expect(postUrl).toContain(`/publications/${PUB_ID}/posts`);

      const body = JSON.parse(broadcastInit.body as string) as Record<string, unknown>;
      // WU1: segment_id top-level is gone; segment is in recipients.email.include_segment_ids
      // WU3: recipients.web is required by Beehiiv schema; {} = no web publication
      expect(body.segment_id).toBeUndefined();
      expect(body.recipients).toEqual({ email: { include_segment_ids: ['seg-daily-123'] }, web: {} });
    });

    it('includes recipients.web in broadcast request when targeting a segment', async () => {
      // Beehiiv /posts schema requires both email and web when recipients is provided.
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(okResponse({ data: [{ id: 'seg-web-test', name: 'daily_digest_opt_in' }] }))
        .mockResolvedValueOnce(okResponse({ data: { id: 'bc-web' } }));
      vi.stubGlobal('fetch', fetcher);

      await sendBroadcast({
        subject: 'Web field test',
        htmlBody: '<p>test</p>',
        plaintextBody: 'test',
        segment: 'daily_digest_opt_in'
      });

      const [, broadcastInit] = fetcher.mock.calls[1] as [string, RequestInit];
      const body = JSON.parse(broadcastInit.body as string) as Record<string, unknown>;
      const recipients = body.recipients as Record<string, unknown>;
      expect(recipients).toHaveProperty('web');
      expect(recipients['web']).toEqual({});
    });

    it('throws when daily_digest_opt_in segment is not found', async () => {
      const fetcher = vi.fn().mockResolvedValue(okResponse({ data: [] }));
      vi.stubGlobal('fetch', fetcher);

      await expect(
        sendBroadcast({ subject: 'x', htmlBody: '', plaintextBody: '', segment: 'daily_digest_opt_in' })
      ).rejects.toThrow('daily_digest_opt_in');
    });
  });

  describe('error surfacing (WU3)', () => {
    it('includes JSON message field in client error when API returns JSON error body', async () => {
      mockFetch([jsonErrorResponse(400, { message: 'Invalid publication ID' })]);

      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false }))
        .rejects.toThrow('Invalid publication ID');
    });

    it('includes JSON error field in client error when API returns error key', async () => {
      mockFetch([jsonErrorResponse(422, { error: 'Segment not found' })]);

      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false }))
        .rejects.toThrow('Segment not found');
    });

    it('falls back to raw text when error body is not JSON', async () => {
      mockFetch([errorResponse(400, 'plain text error')]);

      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false }))
        .rejects.toThrow('plain text error');
    });

    it('surfaces (no body) when error response body is empty', async () => {
      mockFetch([errorResponse(404, '')]);

      await expect(subscribeToList({ email: 'x@y.com', dailyDigestOptIn: false }))
        .rejects.toThrow('(no body)');
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
