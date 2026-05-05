import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LlmError } from '@/lib/llm/types';
import { callGithubModels } from './github-models';

const VALID_REQUEST = {
  model: 'gpt-4o-mini' as const,
  messages: [{ role: 'user' as const, content: 'Hello' }]
};

const makeOkResponse = (content: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    choices: [{ message: { content, role: 'assistant' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
    model: 'gpt-4o-mini'
  })
});

const makeErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
  json: async () => ({ error: { message: statusText } })
});

describe('callGithubModels', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    process.env['GITHUB_TOKEN'] = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['GITHUB_TOKEN'];
    mockFetch.mockReset();
  });

  it('returns a successful LlmResponse on 200', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{"hello": "world"}'));

    const result = await callGithubModels(VALID_REQUEST);

    expect(result.content).toBe('{"hello": "world"}');
    expect(result.provider).toBe('github-models');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(5);
  });

  it('sends Authorization header with GITHUB_TOKEN', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callGithubModels(VALID_REQUEST);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
  });

  it('throws auth LlmError when GITHUB_TOKEN is missing', async () => {
    delete process.env['GITHUB_TOKEN'];

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'github-models',
      retryable: false
    });
  });

  it('throws rate-limit LlmError on 429', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Too Many Requests'));

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'rate-limit',
      provider: 'github-models',
      retryable: true
    });
  });

  it('throws auth LlmError on 401', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'github-models',
      retryable: false
    });
  });

  it('throws auth LlmError on 403', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(403, 'Forbidden'));

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'github-models',
      retryable: false
    });
  });

  it('throws transient LlmError on 500', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, 'Internal Server Error'));

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'github-models',
      retryable: true
    });
  });

  it('throws transient LlmError when fetch itself rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    await expect(callGithubModels(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'github-models',
      retryable: true
    });
  });

  it('includes response_format json_object in body when jsonMode is true', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{}'));

    await callGithubModels({ ...VALID_REQUEST, jsonMode: true });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['response_format']).toEqual({ type: 'json_object' });
  });

  it('does not include response_format when jsonMode is false', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('hello'));

    await callGithubModels({ ...VALID_REQUEST, jsonMode: false });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['response_format']).toBeUndefined();
  });

  it('throws LlmError as instance of LlmError', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Rate limited'));

    const err = await callGithubModels(VALID_REQUEST).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LlmError);
  });
});
