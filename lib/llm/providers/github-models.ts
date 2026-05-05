import { LlmError, LlmModel, LlmRequest, LlmResponse } from '../types';

const GITHUB_MODELS_BASE_URL = 'https://models.inference.ai.azure.com';

type OpenAiChatResponse = {
  choices: Array<{
    message: { content: string | null; role: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
};

const mapHttpStatus = (status: number, provider: 'github-models', underlying: Error): LlmError => {
  if (status === 429) {
    return new LlmError({ kind: 'rate-limit', provider, retryable: true, underlying });
  }
  if (status === 401 || status === 403) {
    return new LlmError({ kind: 'auth', provider, retryable: false, underlying });
  }
  if (status >= 500) {
    return new LlmError({ kind: 'transient', provider, retryable: true, underlying });
  }
  return new LlmError({ kind: 'unknown', provider, retryable: false, underlying });
};

export const callGithubModels = async (
  request: LlmRequest,
  requestId?: string
): Promise<LlmResponse> => {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) {
    throw new LlmError({
      kind: 'auth',
      provider: 'github-models',
      retryable: false,
      underlying: new Error('GITHUB_TOKEN environment variable is not set')
    });
  }

  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    max_tokens: request.maxTokens ?? 4000,
    temperature: request.temperature ?? 0.3
  };

  if (request.jsonMode) {
    body['response_format'] = { type: 'json_object' };
  }

  console.error(
    JSON.stringify({
      requestId,
      provider: 'github-models',
      model: request.model,
      messageCount: request.messages.length,
      jsonMode: request.jsonMode ?? false
    })
  );

  let response: Response;
  try {
    response = await fetch(`${GITHUB_MODELS_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    const underlying = err instanceof Error ? err : new Error(String(err));
    throw new LlmError({ kind: 'transient', provider: 'github-models', retryable: true, underlying });
  }

  if (!response.ok) {
    const underlying = new Error(`GitHub Models HTTP ${response.status}: ${response.statusText}`);
    throw mapHttpStatus(response.status, 'github-models', underlying);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const content = json.choices[0]?.message?.content;

  if (content === null || content === undefined) {
    throw new LlmError({
      kind: 'transient',
      provider: 'github-models',
      retryable: true,
      underlying: new Error('GitHub Models returned empty content')
    });
  }

  return {
    content,
    provider: 'github-models',
    model: request.model as LlmModel,
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0
    },
    rawResponse: json
  };
};
