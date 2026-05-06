import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LlmError, LlmRequest, LlmResponse } from '@/lib/llm/types';

vi.mock('@/lib/llm/providers/github-models', () => ({
  callGithubModels: vi.fn()
}));
vi.mock('@/lib/llm/providers/openai', () => ({
  callOpenAI: vi.fn()
}));

import { callGithubModels } from '@/lib/llm/providers/github-models';
import { callOpenAI } from '@/lib/llm/providers/openai';
import { callLlm } from './client';

const MOCK_REQUEST: LlmRequest = {
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Test' }]
};

const makeResponse = (provider: 'github-models' | 'openai'): LlmResponse => ({
  content: 'response content',
  provider,
  model: 'gpt-4o-mini',
  usage: { inputTokens: 5, outputTokens: 3 },
  rawResponse: {}
});

const makeRetryableError = (provider: 'github-models' | 'openai'): LlmError =>
  new LlmError({
    kind: 'rate-limit',
    provider,
    retryable: true,
    underlying: new Error('Rate limited')
  });

const makeAuthError = (provider: 'github-models' | 'openai'): LlmError =>
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
    vi.mocked(callOpenAI).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns primary response when primary succeeds on first attempt', async () => {
    vi.mocked(callGithubModels).mockResolvedValue(makeResponse('github-models'));

    const result = await callLlm(MOCK_REQUEST, { retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('github-models');
    expect(vi.mocked(callOpenAI)).not.toHaveBeenCalled();
  });

  it('retries on retryable error and succeeds on a later attempt', async () => {
    vi.mocked(callGithubModels)
      .mockRejectedValueOnce(makeRetryableError('github-models'))
      .mockRejectedValueOnce(makeRetryableError('github-models'))
      .mockResolvedValue(makeResponse('github-models'));

    const result = await callLlm(MOCK_REQUEST, { retries: 3, retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('github-models');
    expect(vi.mocked(callGithubModels)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(callOpenAI)).not.toHaveBeenCalled();
  });

  it('falls back to secondary when primary exhausts retries', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callOpenAI).mockResolvedValue(makeResponse('openai'));

    const result = await callLlm(MOCK_REQUEST, { retries: 2, retryBackoffMs: SHORT_BACKOFF });

    expect(result.provider).toBe('openai');
    expect(vi.mocked(callOpenAI)).toHaveBeenCalled();
  });

  it('falls back immediately to secondary on non-retryable primary error', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeAuthError('github-models'));
    vi.mocked(callOpenAI).mockResolvedValue(makeResponse('openai'));

    const result = await callLlm(MOCK_REQUEST, { retries: 3, retryBackoffMs: SHORT_BACKOFF });

    expect(vi.mocked(callGithubModels)).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe('openai');
  });

  it('returns secondary response after primary failure', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callOpenAI).mockResolvedValue(makeResponse('openai'));

    const result = await callLlm(MOCK_REQUEST, { retries: 1, retryBackoffMs: SHORT_BACKOFF });

    expect(result.content).toBe('response content');
    expect(result.provider).toBe('openai');
  });

  it('throws combined error when both providers fail', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));
    vi.mocked(callOpenAI).mockRejectedValue(makeRetryableError('openai'));

    await expect(
      callLlm(MOCK_REQUEST, { retries: 1, retryBackoffMs: SHORT_BACKOFF })
    ).rejects.toMatchObject({
      kind: 'rate-limit',
      provider: 'openai'
    });
  });

  it('combined error message references both providers', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeAuthError('github-models'));
    vi.mocked(callOpenAI).mockRejectedValue(makeRetryableError('openai'));

    const err = await callLlm(MOCK_REQUEST, { retries: 0, retryBackoffMs: SHORT_BACKOFF }).catch(
      (e: unknown) => e
    );

    expect(err).toBeInstanceOf(LlmError);
    expect((err as LlmError).message).toContain('github-models');
    expect((err as LlmError).message).toContain('openai');
  });

  it('does not invoke secondary when secondary is null', async () => {
    vi.mocked(callGithubModels).mockRejectedValue(makeRetryableError('github-models'));

    await expect(
      callLlm(MOCK_REQUEST, { secondary: null, retries: 1, retryBackoffMs: SHORT_BACKOFF })
    ).rejects.toBeInstanceOf(LlmError);

    expect(vi.mocked(callOpenAI)).not.toHaveBeenCalled();
  });

  it('uses custom primary provider when specified', async () => {
    vi.mocked(callOpenAI).mockResolvedValue(makeResponse('openai'));

    const result = await callLlm(MOCK_REQUEST, {
      primary: 'openai',
      secondary: null,
      retryBackoffMs: SHORT_BACKOFF
    });

    expect(result.provider).toBe('openai');
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
