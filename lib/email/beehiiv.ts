export type BeehiivSubscriber = {
  email: string;
  dailyDigestOptIn: boolean;
  customFields?: Record<string, string>;
};

export type BeehiivBroadcast = {
  subject: string;
  htmlBody: string;
  plaintextBody: string;
  segment: 'all' | 'daily_digest_opt_in';
  scheduledFor?: string;
};

const BEEHIIV_BASE = 'https://api.beehiiv.com/v2';
const BACKOFF_MS = [60_000, 180_000, 540_000] as const;

class BeehiivError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = 'BeehiivError';
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getCredentials = (): { apiKey: string; pubId: string } => {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !pubId) {
    throw new BeehiivError('BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must be set.', 0, false);
  }

  return { apiKey, pubId };
};

const beehiivFetch = async (url: string, init: RequestInit, apiKey: string): Promise<Response> => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  };

  let lastErr: BeehiivError | undefined;

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    const response = await fetch(url, { ...init, headers });

    if (response.ok) return response;

    if (response.status === 429) {
      lastErr = new BeehiivError(`Beehiiv rate limited (429) on ${url}`, 429, true);
      if (attempt < BACKOFF_MS.length) {
        const delay = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
        console.error(`[beehiiv] Rate limited. Retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }
      throw lastErr;
    }

    if (response.status === 401 || response.status === 403) {
      throw new BeehiivError(`Beehiiv auth error (${response.status}) on ${url}`, response.status, false);
    }

    if (response.status >= 500) {
      const text = await response.text().catch(() => '');
      lastErr = new BeehiivError(`Beehiiv server error (${response.status}): ${text}`, response.status, true);
      if (attempt < BACKOFF_MS.length) {
        const delay = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
        console.error(`[beehiiv] Server error. Retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }
      throw lastErr;
    }

    const text = await response.text().catch(() => '');
    throw new BeehiivError(`Beehiiv client error (${response.status}): ${text}`, response.status, false);
  }

  throw lastErr ?? new BeehiivError('Beehiiv fetch failed.', 0, false);
};

// Cached segment ID lookup to avoid repeated API calls per process.
let dailyDigestSegmentId: string | undefined;

/** Exposed for test isolation only — do not call in production code. */
export const _resetSegmentCacheForTesting = (): void => {
  dailyDigestSegmentId = undefined;
};

const resolveDailyDigestSegmentId = async (apiKey: string, pubId: string): Promise<string> => {
  if (dailyDigestSegmentId !== undefined) return dailyDigestSegmentId;

  const url = `${BEEHIIV_BASE}/publications/${pubId}/segments`;
  const response = await beehiivFetch(url, { method: 'GET' }, apiKey);
  const json = (await response.json()) as { data?: Array<{ id: string; name: string }> };
  const segments = json.data ?? [];
  const match = segments.find((s) => s.name === 'daily_digest_opt_in');

  if (!match) {
    throw new BeehiivError(
      'No Beehiiv segment named "daily_digest_opt_in" found. Create it in the Beehiiv dashboard.',
      0,
      false
    );
  }

  dailyDigestSegmentId = match.id;
  return match.id;
};

export const subscribeToList = async (subscriber: BeehiivSubscriber): Promise<void> => {
  const { apiKey, pubId } = getCredentials();

  const tags: string[] = subscriber.dailyDigestOptIn ? ['daily_digest_opt_in'] : [];

  const customFields = subscriber.customFields
    ? Object.entries(subscriber.customFields).map(([name, value]) => ({ name, value }))
    : [];

  const body = {
    email: subscriber.email,
    reactivate_existing: true,
    send_welcome_email: true,
    utm_source: 'crypto-pulse-website',
    custom_fields: customFields,
    ...(tags.length > 0 ? { tags } : {})
  };

  const url = `${BEEHIIV_BASE}/publications/${pubId}/subscriptions`;
  await beehiivFetch(url, { method: 'POST', body: JSON.stringify(body) }, apiKey);
};

export const sendBroadcast = async (broadcast: BeehiivBroadcast): Promise<{ broadcastId: string }> => {
  const { apiKey, pubId } = getCredentials();

  let segmentId: string | undefined;
  if (broadcast.segment === 'daily_digest_opt_in') {
    segmentId = await resolveDailyDigestSegmentId(apiKey, pubId);
  }

  const body: Record<string, unknown> = {
    subject: broadcast.subject,
    content: {
      rendered_html: broadcast.htmlBody,
      plaintext: broadcast.plaintextBody
    },
    status: broadcast.scheduledFor ? 'scheduled' : 'draft',
    ...(broadcast.scheduledFor ? { send_at: broadcast.scheduledFor } : {}),
    ...(segmentId !== undefined ? { segment_id: segmentId } : {})
  };

  const url = `${BEEHIIV_BASE}/publications/${pubId}/broadcasts`;
  const response = await beehiivFetch(url, { method: 'POST', body: JSON.stringify(body) }, apiKey);
  const json = (await response.json()) as { data?: { id?: string } };

  return { broadcastId: json.data?.id ?? 'unknown' };
};

export const listSubscribers = async (
  options: { limit?: number; cursor?: string } = {}
): Promise<{ subscribers: BeehiivSubscriber[]; nextCursor?: string }> => {
  const { apiKey, pubId } = getCredentials();

  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.cursor !== undefined) params.set('cursor', options.cursor);

  const query = params.size > 0 ? `?${params.toString()}` : '';
  const url = `${BEEHIIV_BASE}/publications/${pubId}/subscriptions${query}`;
  const response = await beehiivFetch(url, { method: 'GET' }, apiKey);
  const json = (await response.json()) as {
    data?: Array<{ email?: string; tags?: string[] }>;
    next_cursor?: string;
  };

  const subscribers: BeehiivSubscriber[] = (json.data ?? []).map((s) => ({
    email: s.email ?? '',
    dailyDigestOptIn: (s.tags ?? []).includes('daily_digest_opt_in')
  }));

  return { subscribers, nextCursor: json.next_cursor };
};
