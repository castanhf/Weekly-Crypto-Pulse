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

// WU3: try JSON body first so error messages are human-readable, not raw JSON strings.
const extractErrorBody = (text: string): string => {
  if (!text) return '(no body)';
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.message === 'string') return parsed.message;
    if (typeof parsed.error === 'string') return parsed.error;
    return text;
  } catch {
    return text;
  }
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
      lastErr = new BeehiivError(`Beehiiv server error (${response.status}): ${extractErrorBody(text)}`, response.status, true);
      if (attempt < BACKOFF_MS.length) {
        const delay = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
        console.error(`[beehiiv] Server error. Retrying in ${delay / 1000}s…`);
        await sleep(delay);
        continue;
      }
      throw lastErr;
    }

    // WU3: include response body in all client errors so future debugging isn't blind.
    const text = await response.text().catch(() => '');
    throw new BeehiivError(`Beehiiv client error (${response.status}): ${extractErrorBody(text)}`, response.status, false);
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

  const customFields = subscriber.customFields
    ? Object.entries(subscriber.customFields).map(([name, value]) => ({ name, value }))
    : [];

  const body = {
    email: subscriber.email,
    reactivate_existing: true,
    send_welcome_email: true,
    utm_source: 'crypto-pulse-website',
    custom_fields: customFields
    // WU2: Beehiiv v2 subscriptions endpoint does not accept a `tags` field.
    // Tags are applied via a separate POST /subscriptions/{id}/tags call below.
  };

  const url = `${BEEHIIV_BASE}/publications/${pubId}/subscriptions`;
  const subResponse = await beehiivFetch(url, { method: 'POST', body: JSON.stringify(body) }, apiKey);

  if (!subscriber.dailyDigestOptIn) return;

  // WU2: apply tag via dedicated tags endpoint (two-step subscribe+tag).
  const subJson = (await subResponse.json()) as { data?: { id?: string } };
  const subId = subJson.data?.id;

  if (!subId) {
    console.warn('[beehiiv] WARNING: Subscription response did not include an ID — cannot apply daily_digest_opt_in tag.');
    return;
  }

  try {
    const tagsUrl = `${BEEHIIV_BASE}/publications/${pubId}/subscriptions/${subId}/tags`;
    await beehiivFetch(tagsUrl, { method: 'POST', body: JSON.stringify({ tags: ['daily_digest_opt_in'] }) }, apiKey);
  } catch (err) {
    // Tagging failure is non-fatal: subscriber is created, but won't receive daily digests.
    console.warn(
      `[beehiiv] WARNING: Failed to apply daily_digest_opt_in tag to subscription ${subId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

export const sendBroadcast = async (broadcast: BeehiivBroadcast): Promise<{ broadcastId: string }> => {
  const { apiKey, pubId } = getCredentials();

  // WU1: resolve segment ID only when targeting daily_digest_opt_in.
  let includeSegmentIds: string[] = [];
  if (broadcast.segment === 'daily_digest_opt_in') {
    const segmentId = await resolveDailyDigestSegmentId(apiKey, pubId);
    includeSegmentIds = [segmentId];
  }

  const body: Record<string, unknown> = {
    // WU1: title is required by Beehiiv Posts API; use the email subject.
    title: broadcast.subject,
    subject: broadcast.subject,
    // WU1: body_content replaces content.rendered_html (Beehiiv Posts API structure).
    body_content: broadcast.htmlBody,
    // WU1: 'confirmed' sends immediately; 'draft' saves without sending.
    status: 'confirmed',
    ...(broadcast.scheduledFor ? { scheduled_at: broadcast.scheduledFor } : {}),
    // WU1: segment targeting uses recipients.email.include_segment_ids, not top-level segment_id.
    ...(includeSegmentIds.length > 0 ? { recipients: { email: { include_segment_ids: includeSegmentIds } } } : {})
  };

  // WU1: correct endpoint is /posts, not /broadcasts (which does not exist in Beehiiv v2).
  const url = `${BEEHIIV_BASE}/publications/${pubId}/posts`;
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
