export type LlmProvider = 'github-models' | 'anthropic';

export type LlmModel = 'gpt-4o-mini' | 'claude-sonnet-4-6';

export type LlmMessage = Readonly<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}>;

export type LlmRequest = Readonly<{
  model: LlmModel;
  messages: ReadonlyArray<LlmMessage>;
  jsonMode?: boolean;
  jsonSchema?: object;
  maxTokens?: number;
  temperature?: number;
}>;

export type LlmResponse = Readonly<{
  content: string;
  provider: LlmProvider;
  model: LlmModel;
  usage: Readonly<{
    inputTokens: number;
    outputTokens: number;
  }>;
  rawResponse: unknown;
}>;

export type LlmCallOptions = Readonly<{
  primary?: LlmProvider;
  secondary?: LlmProvider | null;
  retries?: number;
  retryBackoffMs?: ReadonlyArray<number>;
  requestId?: string;
}>;

export class LlmError extends Error {
  readonly kind: 'rate-limit' | 'auth' | 'transient' | 'schema-validation' | 'unknown';
  readonly provider: LlmProvider;
  readonly retryable: boolean;
  readonly underlying: Error;

  constructor(params: {
    kind: 'rate-limit' | 'auth' | 'transient' | 'schema-validation' | 'unknown';
    provider: LlmProvider;
    retryable: boolean;
    underlying: Error;
    message?: string;
  }) {
    super(params.message ?? params.underlying.message);
    this.name = 'LlmError';
    this.kind = params.kind;
    this.provider = params.provider;
    this.retryable = params.retryable;
    this.underlying = params.underlying;
  }
}
