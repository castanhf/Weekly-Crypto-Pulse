import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Beehiiv client so no real HTTP calls are made.
vi.mock('@/lib/email/beehiiv', () => ({
  subscribeToList: vi.fn().mockResolvedValue(undefined)
}));

import { POST } from './route';
import { subscribeToList } from '@/lib/email/beehiiv';

const makeRequest = (body: unknown): Request =>
  new Request('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 and calls subscribeToList for a valid email without daily opt-in', async () => {
    const response = await POST(makeRequest({ email: 'user@example.com', dailyDigestOptIn: false }));
    expect(response.status).toBe(200);
    const json = await response.json() as Record<string, unknown>;
    expect(json.success).toBe(true);
    expect(subscribeToList).toHaveBeenCalledWith({ email: 'user@example.com', dailyDigestOptIn: false });
  });

  it('passes dailyDigestOptIn: true when set', async () => {
    await POST(makeRequest({ email: 'daily@example.com', dailyDigestOptIn: true }));
    expect(subscribeToList).toHaveBeenCalledWith({ email: 'daily@example.com', dailyDigestOptIn: true });
  });

  it('returns 400 for an invalid email address', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email', dailyDigestOptIn: false }));
    expect(response.status).toBe(400);
    const json = await response.json() as Record<string, unknown>;
    expect(json.error).toBeTruthy();
  });

  it('returns 400 for missing email field', async () => {
    const response = await POST(makeRequest({ dailyDigestOptIn: false }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for malformed JSON body', async () => {
    const request = new Request('http://localhost/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json'
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 500 when Beehiiv throws', async () => {
    vi.mocked(subscribeToList).mockRejectedValueOnce(new Error('Beehiiv is down'));
    const response = await POST(makeRequest({ email: 'ok@example.com', dailyDigestOptIn: false }));
    expect(response.status).toBe(500);
    const json = await response.json() as Record<string, unknown>;
    // Generic error — must not leak Beehiiv internals
    expect(json.error).toBeTruthy();
    expect(String(json.error)).not.toContain('Beehiiv');
  });
});
