import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LlmError, LlmRequest, LlmResponse } from '@/lib/llm/types';

vi.mock('@/lib/llm/providers/github-models', () => ({
  callGithubModels: vi.fn()
}));
vi.mock('@/lib/llm/providers/anthropic', () => ({
  callAnthropic: vi.fn()
}));

import { callGithubModels } from '@/lib/llm/providers/github-models';
import { callAnthropic } from '@/lib/llm/providers/anthropic';
import { callLlm } from './client';

const MOCK_REQUEST: LlmRequest = {
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Test' }]
};

const makeResponse = (provider: 'github-models' | 'anthropic'): LlmResponse => ({
  content: 'response content',
  provider,
  model: provider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o-mini',
  usage: { inputTokens: 5, outputTokens: 3 },
  rawResponse: {}
});

const makeRetryableError = (provider: 'github-models' | 'anthropic'): LlmError =>
  new LlmError({
    kind: 'rate-limit',
    provider,
    retryable: true,
    underlying: new Error('Rate limited')
  });

const makeAuthError = (provider: 'github-models' | 'anthropic'): LlmError =>
  new LlmError({
    kind: 'auth',
    provider,
    retryable: false,
    underlying: new Error('Unauthorized')
  });

const SHORT_BACKOFF = [0, 0, 0];

describe('callLlm', () => {
  beforeEach(() => {
    vi.mocked(callGithubModels).mockReset();
    vi.mocked(callAnthropic).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns primary response when primary succeeds on first attempt', async () => {
    vi.mocked(callGithubModels).mockResolvedValue(makeResponse('github-models'));

    const result = await callLlm(MOCK_REQUEST, { retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('github-models');
    expect(vi.mocked(callAnthropic)).not.toHaveBeenCalled();
  });

  it('retries on retryable error and succeeds on a later attempt', async () => {
    vi.mocked(callGithubModels)
      .mockRejectedValueOnce(makeRetryableError('github-models'))
      .mockRejectedValueOnce(makeRetryableError('github-models'))
      .mockResolvedValue(makeResponse('github-models'));

    const result = await callLlm(MOCK_REQUEST, { retries: 3, retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('github-models');
    expect(vi.mocked(callGithubModels)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(callAnthropic)).not.toHaveBeenCalled();
  });

  it('falls back to secondary when primary exhausts retries', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callAnthropic).mockResolvedValue(makeResponse('anthropic'));

    const result = await callLlm(MOCK_REQUEST, { retries: 2, retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('anthropic');
    expect(vi.mocked(callAnthropic)).toHaveBeenCalled();
  });

  it('falls back immediately to secondary on non-retryable primary error', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeAuthError('github-models'));
    vi.mocked(callAnthropic).mockResolvedValue(makeResponse('anthropic'));

    const result = await callLlm(MOCK_REQUEST, { retries: 3, retryBackoffMs: SHORT_BACKOFF });

    expect(vi.mocked(callGithubModels)).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe('anthropic');
  });

  it('returns secondary response after primary failure', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callAnthropic).mockResolvedValue(makeResponse('anthropic'));

    const result = await callLlm(MOCK_REQUEST, { retries: 1, retryBackoffMs: SHORT_BACKOFF });

    expect(result.content).toBe('response content');
    expect(result.provider).toBe('anthropic');
  });

  it('throws combined error when both providers fail', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callAnthropic).mockRejectedValue(makeRetryableError('anthropic'));

    await expect(
      callLlm(MOCK_REQUEST, { retries: 1, retryBackoffMs: SHORT_BACKOFF })
    ).rejects.toMatchObject({
      kind: 'rate-limit',
      provider: 'anthropic'
    });
  });

  it('combined error message references both providers', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeAuthError('github-models'));
    vi.mocked(callAnthropic).mockRejectedValue(makeRetryableError('anthropic'));

    const err = await callLlm(MOCK_REQUEST, { retries: 0, retryBackoffMs: SHORT_BACKOFF }).catch(
      (e: unknown) => e
    );

    expect(err).toBeInstanceOf(LlmError);
    expect((err as LlmError).message).toContain('github-models');
    expect((err as LlmError).message).toContain('anthropic');
  });

  it('does not invoke secondary when secondary is null', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));

    await expect(
      callLlm(MOCK_REQUEST, { secondary: null, retries: 1, retryBackoffMs: SHORT_BACKOFF })
    ).rejects.toBeInstanceOf(LlmError);

    expect(vi.mocked(callAnthropic)).not.toHaveBeenCalled();
  });

  it('uses custom primary provider when specified', async () => {
    vi.mocked(callAnthropic).mockResolvedValue(makeResponse('anthropic'));

    const result = await callLlm(MOCK_REQUEST, {
      primary: 'anthropic',
      secondary: null,
      retryBackoffMs: SHORT_BACKOFF
    });

    expect(result.provider).toBe('anthropic');
    expect(vi.mocked(callGithubModels)).not.toHaveBeenCalled();
  });

  it('respects backoff delays between retries', async () => {
    vi.useFakeTimers();
    const resolveAfterRetry = vi.fn();

    vi.mocked(callGithubModels)
      .mockRejectedValueOnce(makeRetryableError('github-models'))
      .mockImplementation(async () => {
        resolveAfterRetry();
        return makeResponse('github-models');
      });

    const callPromise = callLlm(MOCK_REQUEST, {
      secondary: null,
      retries: 1,
      retryBackoffMs: [500]
    });

    expect(resolveAfterRetry).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    await callPromise;

    expect(resolveAfterRetry).toHaveBeenCalledTimes(1);
  });
});
