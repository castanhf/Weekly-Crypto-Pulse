/**
 * smoke-llm.ts
 *
 * Validates both LLM providers are reachable and accepting requests.
 * Makes one minimal API call to each provider (no retries, no fallback)
 * and reports the results. Exits non-zero if EITHER provider fails.
 *
 * Run: npm run smoke:llm
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { callLlm } from '../lib/llm/client';
import type { LlmRequest } from '../lib/llm/types';

type CheckResult = { label: string; ok: boolean; detail?: string };

const check = (label: string, ok: boolean, detail?: string): CheckResult => ({ label, ok, detail });

const PING_REQUEST: LlmRequest = {
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Reply with the single word PONG.' }],
  maxTokens: 10,
  temperature: 0
};

const runSmoke = async (): Promise<void> => {
  const results: CheckResult[] = [];

  // 1. Credentials present
  const githubToken = process.env['GITHUB_TOKEN'] ?? '';
  const anthropicKey = process.env['ANTHROPIC_API_KEY'] ?? '';

  if (!githubToken) {
    console.log('\nLLM Smoke Test');
    console.log('==============');
    console.log('✗ GITHUB_TOKEN must be set (required for the github-models primary provider).');
    console.log('  → Set GITHUB_TOKEN in .env.local (locally) or repo secrets (CI)');
    process.exitCode = 1;
    return;
  }

  if (!anthropicKey) {
    console.log('\nLLM Smoke Test');
    console.log('==============');
    console.log('✗ ANTHROPIC_API_KEY must be set (required for the Anthropic fallback provider).');
    console.log('  → Set ANTHROPIC_API_KEY in .env.local (locally) or repo secrets (CI)');
    process.exitCode = 1;
    return;
  }

  results.push(check('GITHUB_TOKEN present', true));
  results.push(check('ANTHROPIC_API_KEY present', true));

  // 2. GitHub Models — single attempt, no fallback
  try {
    const response = await callLlm(PING_REQUEST, {
      primary: 'github-models',
      secondary: null,
      retries: 0
    });
    const content = response.content.trim();
    results.push(
      check(
        `github-models (gpt-4o-mini) responded (${response.usage.inputTokens}in / ${response.usage.outputTokens}out tokens): "${content}"`,
        true
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push(check('github-models (gpt-4o-mini) responded', false, message));
  }

  // 3. Anthropic — single attempt, no fallback; model field is advisory (provider uses claude-sonnet-4-6)
  try {
    const response = await callLlm(PING_REQUEST, {
      primary: 'anthropic',
      secondary: null,
      retries: 0
    });
    const content = response.content.trim();
    results.push(
      check(
        `anthropic (claude-sonnet-4-6) responded (${response.usage.inputTokens}in / ${response.usage.outputTokens}out tokens): "${content}"`,
        true
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push(check('anthropic (claude-sonnet-4-6) responded', false, message));
  }

  // Print results
  console.log('\nLLM Smoke Test');
  console.log('==============');
  let allPassed = true;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.label}`);
    if (!r.ok && r.detail) console.log(`  ${r.detail}`);
    if (!r.ok) allPassed = false;
  }
  console.log('');

  if (!allPassed) {
    process.exitCode = 1;
  }
};

runSmoke().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n[smoke-llm] FATAL: ${message}`);
  process.exitCode = 1;
});
