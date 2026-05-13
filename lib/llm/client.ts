import { callAnthropic } from './providers/anthropic';
import { callGithubModels } from './providers/github-models';
import { LlmCallOptions, LlmError, LlmProvider, LlmRequest, LlmResponse } from './types';

const DEFAULT_PRIMARY: LlmProvider = 'github-models';
const DEFAULT_SECONDARY: LlmProvider = 'anthropic';
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF_MS = [60_000, 180_000, 540_000] as const;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const callProvider = (provider: LlmProvider, request: LlmRequest, requestId?: string): Promise<LlmResponse> => {
  if (provider === 'github-models') return callGithubModels(request, requestId);
  return callAnthropic(request, requestId);
};

const callWithRetry = async (
  provider: LlmProvider,
  request: LlmRequest,
  retries: number,
  backoffs: ReadonlyArray<number>,
  requestId: string | undefined
): Promise<LlmResponse> => {
  let lastError: LlmError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callProvider(provider, request, requestId);
    } catch (err) {
      if (!(err instanceof LlmError)) throw err;

      lastError = err;

      if (!err.retryable || attempt === retries) throw err;

      const delayMs = backoffs[attempt] ?? backoffs[backoffs.length - 1] ?? 0;
      console.error(
        JSON.stringify({
          requestId,
          provider,
          event: 'retry',
          attempt: attempt + 1,
          delayMs,
          kind: err.kind,
          message: err.message
        })
      );
      await sleep(delayMs);
    }
  }

  throw lastError!;
};

export const callLlm = async (request: LlmRequest, options?: LlmCallOptions): Promise<LlmResponse> => {
  const primary = options?.primary ?? DEFAULT_PRIMARY;
  const secondary = options?.secondary !== undefined ? options.secondary : DEFAULT_SECONDARY;
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const backoffs = options?.retryBackoffMs ?? DEFAULT_BACKOFF_MS;
  const requestId = options?.requestId;

  try {
    return await callWithRetry(primary, request, retries, backoffs, requestId);
  } catch (primaryErr) {
    if (secondary === null) throw primaryErr;

    const primaryLlmErr = primaryErr instanceof LlmError ? primaryErr : null;
    console.error(
      JSON.stringify({
        requestId,
        event: 'provider-fallback',
        from: primary,
        to: secondary,
        reason: primaryLlmErr?.kind ?? 'unknown',
        message: primaryLlmErr?.message ?? String(primaryErr)
      })
    );

    try {
      return await callWithRetry(secondary, request, retries, backoffs, requestId);
    } catch (secondaryErr) {
      const underlying = primaryErr instanceof Error ? primaryErr : new Error(String(primaryErr));
      if (secondaryErr instanceof LlmError) {
        throw new LlmError({
          kind: secondaryErr.kind,
          provider: secondaryErr.provider,
          retryable: false,
          underlying,
          message: `Both providers failed. Primary (${primary}): ${underlying.message}. Secondary (${secondary}): ${secondaryErr.message}`
        });
      }
      throw secondaryErr;
    }
  }
};
