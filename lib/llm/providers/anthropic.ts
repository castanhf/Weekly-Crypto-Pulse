import { LlmError, LlmModel, LlmRequest, LlmResponse } from '../types';

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicResponse = {
  content: AnthropicContentBlock[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
};

const mapHttpStatus = (status: number, underlying: Error): LlmError => {
  if (status === 429) {
    return new LlmError({ kind: 'rate-limit', provider: 'anthropic', retryable: true, underlying });
  }
  if (status === 401 || status === 403) {
    return new LlmError({ kind: 'auth', provider: 'anthropic', retryable: false, underlying });
  }
  if (status >= 500) {
    return new LlmError({ kind: 'transient', provider: 'anthropic', retryable: true, underlying });
  }
  return new LlmError({ kind: 'unknown', provider: 'anthropic', retryable: false, underlying });
};

export const callAnthropic = async (
  request: LlmRequest,
  requestId?: string
): Promise<LlmResponse> => {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new LlmError({
      kind: 'auth',
      provider: 'anthropic',
      retryable: false,
      underlying: new Error('ANTHROPIC_API_KEY environment variable is not set')
    });
  }

  // Anthropic uses a top-level system param, not a system-role message
  const systemMessage = request.messages.find((m) => m.role === 'system');
  const nonSystemMessages = request.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const body: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    messages: nonSystemMessages,
    max_tokens: request.maxTokens ?? 4000,
    temperature: request.temperature ?? 0.3
  };

  if (systemMessage) {
    body['system'] = systemMessage.content;
  }

  // jsonMode is handled via schema instructions in the system prompt (Anthropic has no response_format)

  console.error(
    JSON.stringify({
      requestId,
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      messageCount: request.messages.length,
      jsonMode: request.jsonMode ?? false
    })
  );

  let response: Response;
  try {
    response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    const underlying = err instanceof Error ? err : new Error(String(err));
    throw new LlmError({ kind: 'transient', provider: 'anthropic', retryable: true, underlying });
  }

  if (!response.ok) {
    const underlying = new Error(`Anthropic HTTP ${response.status}: ${response.statusText}`);
    throw mapHttpStatus(response.status, underlying);
  }

  const json = (await response.json()) as AnthropicResponse;
  const textBlock = json.content.find((block) => block.type === 'text');
  const content = textBlock?.text;

  if (!content) {
    throw new LlmError({
      kind: 'transient',
      provider: 'anthropic',
      retryable: true,
      underlying: new Error('Anthropic returned empty content')
    });
  }

  return {
    content,
    provider: 'anthropic',
    model: ANTHROPIC_MODEL as LlmModel,
    usage: {
      inputTokens: json.usage?.input_tokens ?? 0,
      outputTokens: json.usage?.output_tokens ?? 0
    },
    rawResponse: json
  };
};
