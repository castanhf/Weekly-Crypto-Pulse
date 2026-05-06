import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LlmError } from '@/lib/llm/types';
import { callOpenAI } from './openai';

const VALID_REQUEST = {
  model: 'gpt-4o-mini' as const,
  messages: [{ role: 'user' as const, content: 'Hello' }]
};

const makeOkResponse = (content: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    choices: [{ message: { content, role: 'assistant' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 20, completion_tokens: 8 },
    model: 'gpt-4o-mini'
  })
});

const makeErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
  json: async () => ({ error: { message: statusText } })
});

describe('callOpenAI', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['OPENAI_API_KEY'];
    mockFetch.mockReset();
  });

  it('returns a successful LlmResponse on 200', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{"result": true}'));

    const result = await callOpenAI(VALID_REQUEST);

    expect(result.content).toBe('{"result": true}');
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.usage.inputTokens).toBe(20);
    expect(result.usage.outputTokens).toBe(8);
  });

  it('sends Authorization header with OPENAI_API_KEY', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callOpenAI(VALID_REQUEST);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk-test-key');
  });

  it('calls the OpenAI endpoint', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callOpenAI(VALID_REQUEST);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('api.openai.com');
  });

  it('throws auth LlmError when OPENAI_API_KEY is missing', async () => {
    delete process.env['OPENAI_API_KEY'];

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'openai',
      retryable: false
    });
  });

  it('throws rate-limit LlmError on 429', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Too Many Requests'));

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'rate-limit',
      provider: 'openai',
      retryable: true
    });
  });

  it('throws auth LlmError on 401', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'openai',
      retryable: false
    });
  });

  it('throws auth LlmError on 403', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(403, 'Forbidden'));

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'openai',
      retryable: false
    });
  });

  it('throws transient LlmError on 500', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, 'Internal Server Error'));

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'openai',
      retryable: true
    });
  });

  it('throws transient LlmError when fetch itself rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('Network timeout'));

    await expect(callOpenAI(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'openai',
      retryable: true
    });
  });

  it('includes response_format json_object when jsonMode is true', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{}'));

    await callOpenAI({ ...VALID_REQUEST, jsonMode: true });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['response_format']).toEqual({ type: 'json_object' });
  });

  it('throws LlmError as instance of LlmError', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Rate limited'));

    const err = await callOpenAI(VALID_REQUEST).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LlmError);
  });
});
