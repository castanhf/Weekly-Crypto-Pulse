import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LlmError } from '@/lib/llm/types';
import { callAnthropic } from './anthropic';

const VALID_REQUEST = {
  model: 'gpt-4o-mini' as const,
  messages: [
    { role: 'system' as const, content: 'You are a helpful assistant.' },
    { role: 'user' as const, content: 'Hello' }
  ]
};

const makeOkResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({
    content: [{ type: 'text', text }],
    usage: { input_tokens: 15, output_tokens: 10 },
    model: 'claude-sonnet-4-6-20251001'
  })
});

const makeErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
  json: async () => ({ error: { message: statusText } })
});

describe('callAnthropic', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['ANTHROPIC_API_KEY'];
    mockFetch.mockReset();
  });

  it('returns a successful LlmResponse on 200', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{"result": true}'));

    const result = await callAnthropic(VALID_REQUEST);

    expect(result.content).toBe('{"result": true}');
    expect(result.provider).toBe('anthropic');
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.usage.inputTokens).toBe(15);
    expect(result.usage.outputTokens).toBe(10);
  });

  it('sends x-api-key header with ANTHROPIC_API_KEY', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callAnthropic(VALID_REQUEST);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-ant-test-key');
  });

  it('sends anthropic-version header', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callAnthropic(VALID_REQUEST);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01');
  });

  it('calls the Anthropic messages endpoint', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callAnthropic(VALID_REQUEST);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('api.anthropic.com');
    expect(url).toContain('/messages');
  });

  it('extracts system message to top-level system param', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('ok'));

    await callAnthropic(VALID_REQUEST);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['system']).toBe('You are a helpful assistant.');
    const messages = body['messages'] as Array<{ role: string }>;
    expect(messages.every((m) => m.role !== 'system')).toBe(true);
  });

  it('throws auth LlmError when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env['ANTHROPIC_API_KEY'];

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'anthropic',
      retryable: false
    });
  });

  it('throws rate-limit LlmError on 429', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Too Many Requests'));

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'rate-limit',
      provider: 'anthropic',
      retryable: true
    });
  });

  it('throws auth LlmError on 401', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'anthropic',
      retryable: false
    });
  });

  it('throws auth LlmError on 403', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(403, 'Forbidden'));

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'auth',
      provider: 'anthropic',
      retryable: false
    });
  });

  it('throws transient LlmError on 500', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, 'Internal Server Error'));

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'anthropic',
      retryable: true
    });
  });

  it('throws transient LlmError when fetch itself rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('Network timeout'));

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'anthropic',
      retryable: true
    });
  });

  it('throws transient LlmError when response content is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: [],
        usage: { input_tokens: 5, output_tokens: 0 },
        model: 'claude-sonnet-4-6-20251001'
      })
    });

    await expect(callAnthropic(VALID_REQUEST)).rejects.toMatchObject({
      kind: 'transient',
      provider: 'anthropic',
      retryable: true
    });
  });

  it('throws LlmError as instance of LlmError', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, 'Rate limited'));

    const err = await callAnthropic(VALID_REQUEST).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LlmError);
  });

  it('does not include response_format in body (json mode is prompt-based)', async () => {
    mockFetch.mockResolvedValue(makeOkResponse('{}'));

    await callAnthropic({ ...VALID_REQUEST, jsonMode: true });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['response_format']).toBeUndefined();
  });
});
