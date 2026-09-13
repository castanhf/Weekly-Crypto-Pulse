#!/usr/bin/env node
/**
 * Dependabot PR triage.
 *
 * Reads PR_NUMBER from env, classifies the update, applies labels,
 * obtains an AI risk-research summary, and then either auto-approves
 * (patch/minor) or holds (major/unknown) the PR.
 *
 * Fail-closed: if risk research fails for any reason the PR is held and
 * the operator is notified by email. A PR is never auto-approved without
 * a successful risk assessment.
 *
 * Requires: GITHUB_TOKEN (via GH_TOKEN), gh CLI, nodemailer (installed
 * via the workflow's "Install triage dependencies" step).
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyUpdate } from './dependabot-classify.mjs';

const PR_NUMBER = process.env.PR_NUMBER;
if (!PR_NUMBER) {
  console.error('[triage] PR_NUMBER env var is required');
  process.exit(1);
}

// Derived from GITHUB_REPOSITORY (auto-set in Actions) or gh CLI fallback.
const REPO = process.env.GITHUB_REPOSITORY ?? run('gh repo view --json nameWithOwner --jq .nameWithOwner');
const [REPO_OWNER, REPO_NAME] = REPO.split('/');

/** @param {string} cmd */
function run(cmd) { return execSync(cmd, { encoding: 'utf8' }).trim(); }

/** @param {string} cmd @returns {unknown} */
function runJson(cmd) { return JSON.parse(run(cmd)); }

/**
 * Write JSON payload to a temp file and pipe it to a gh api call.
 * Used to avoid shell-escaping issues with multiline comment bodies.
 *
 * @param {string} method
 * @param {string} endpoint
 * @param {Record<string, unknown>} payload
 */
function ghApiJson(method, endpoint, payload) {
  const file = join(tmpdir(), `triage-${PR_NUMBER}-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(payload));
  return run(`gh api --method ${method} ${endpoint} --input ${file}`);
}

/**
 * Post a new comment or update the existing triage comment in-place.
 * Idempotent: on repeated triage runs (synchronize / check_suite re-trigger)
 * the comment is edited rather than a new one appended.
 *
 * @param {{ databaseId: number } | undefined} existingComment
 * @param {string} body
 */
function postOrUpdateTriageComment(existingComment, body) {
  if (existingComment) {
    ghApiJson(
      'PATCH',
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${existingComment.databaseId}`,
      { body }
    );
    console.log('[triage] Updated existing triage comment.');
  } else {
    ghApiJson(
      'POST',
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues/${PR_NUMBER}/comments`,
      { body }
    );
    console.log('[triage] Posted new triage comment.');
  }
}

/**
 * Build a human-readable description of what packages are being updated.
 *
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
function buildPackageContext(title, body) {
  const lines = [...body.matchAll(/Updates?\s+`([^`]+)`\s+from\s+(\S+)\s+to\s+(\S+)/g)]
    .map((m) => `- ${m[1]}: ${m[2]} → ${m[3]}`);
  return lines.length > 0 ? lines.join('\n') : title;
}

/**
 * Call the Anthropic Messages API for a risk assessment.
 * Returns assessment text on success, null on any failure.
 * Tries web_search_20250305 beta first; falls back to plain training knowledge.
 *
 * @param {string} packageContext
 * @param {string} updateType
 * @returns {Promise<string|null>}
 */
async function researchRisk(packageContext, updateType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[triage] ANTHROPIC_API_KEY not set.');
    return null;
  }

  const prompt = [
    'You are a dependency risk analyst for a Next.js crypto news website (no user auth, no database, Stripe payments, Vercel deployment).',
    '',
    `Update type: **${updateType}**`,
    'Packages being updated:',
    packageContext,
    '',
    'Provide a risk assessment in exactly two sentences:',
    '1. **Technical:** what changed (breaking changes, new APIs, security fixes, deprecations)',
    '2. **Plain-English:** what this means for the operator (safe to merge, needs smoke testing, watch out for X)',
    '',
    'Be specific. Do not pad with generic statements.',
  ].join('\n');

  for (const useBeta of [true, false]) {
    try {
      /** @type {Record<string, string>} */
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      if (useBeta) headers['anthropic-beta'] = 'web-search-2025-03-05';

      /** @type {Record<string, unknown>} */
      const requestBody = {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      };
      if (useBeta) requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (useBeta && (response.status === 400 || response.status === 422)) {
          console.log('[triage] web_search beta unavailable, retrying without it.');
          continue;
        }
        console.warn(`[triage] Risk API ${response.status}: ${errorText.slice(0, 200)}`);
        return null;
      }

      /** @type {{ content: Array<{type: string; text?: string}> }} */
      const data = await response.json();
      const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
      return text ?? null;
    } catch (err) {
      console.warn(`[triage] Risk API error: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  return null;
}

/**
 * Send an email notification to the operator via Gmail SMTP.
 *
 * @param {string} subject
 * @param {string} text
 * @returns {Promise<void>}
 */
async function sendOperatorEmail(subject, text) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.OPERATOR_EMAIL;

  if (!gmailUser || !gmailPass || !to) {
    console.warn('[triage] Email credentials incomplete — notification skipped.');
    return;
  }

  try {
    // nodemailer is installed by the workflow step before this script runs.
    const { default: nodemailer } = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    });
    await transporter.sendMail({ from: gmailUser, to, subject, text });
    console.log('[triage] Operator email sent.');
  } catch (err) {
    console.warn(`[triage] Email send failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  const pr = /** @type {{
    title: string;
    headRefName: string;
    body: string;
    comments: Array<{body: string; databaseId: number}>;
  }} */ (runJson(`gh pr view ${PR_NUMBER} --json title,headRefName,body,comments`));

  const { title, body: prBody, comments } = pr;
  console.log(`[triage] PR #${PR_NUMBER}: "${title}"`);

  const updateType = classifyUpdate(title, prBody);
  console.log(`[triage] Detected update type: ${updateType}`);

  // Find an existing triage comment so we can update it rather than append.
  const existingTriageComment = comments?.find(
    (c) => typeof c.body === 'string' && c.body.includes('**Dependabot triage:**')
  );

  // Labels.
  const LABEL_CONFIGS = {
    patch: { name: 'dependabot-patch', color: '0e8a16', description: 'Patch-level dependency bump' },
    minor: { name: 'dependabot-minor', color: 'fbca04', description: 'Minor-level dependency bump' },
    major: { name: 'dependabot-major', color: 'b60205', description: 'Major-level dependency bump — manual review required' },
    unknown: { name: 'dependabot-review-needed', color: 'e4e669', description: 'Dependabot update type could not be determined' },
  };

  const applyLabel = (/** @type {keyof typeof LABEL_CONFIGS} */ key) => {
    const { name, color, description } = LABEL_CONFIGS[key];
    try { run(`gh label create "${name}" --color "${color}" --description "${description}" 2>/dev/null || true`); } catch { /* already exists */ }
    try {
      run(`gh pr edit ${PR_NUMBER} --add-label "${name}"`);
      console.log(`[triage] Applied label: ${name}`);
    } catch (err) {
      console.warn(`[triage] Could not apply label: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  applyLabel(updateType);

  // Risk research (fail-closed).
  const packageContext = buildPackageContext(title, prBody);
  console.log('[triage] Fetching risk research...');
  const riskSummary = await researchRisk(packageContext, updateType);

  if (riskSummary === null) {
    // Research failed — hold regardless of update type and notify the operator.
    console.log('[triage] Risk research failed — applying fail-closed hold.');
    applyLabel('unknown'); // Overwrite to review-needed if not already set.

    const reason = process.env.ANTHROPIC_API_KEY
      ? 'Risk research API call failed or returned an unusable response.'
      : 'ANTHROPIC_API_KEY is not configured in repository secrets.';

    const holdBody = [
      `⚠️ **Dependabot triage:** PR #${PR_NUMBER} held — risk research unavailable.`,
      '',
      `**Reason:** ${reason}`,
      '',
      'Manual review required before merging. The operator has been notified by email.',
    ].join('\n');

    postOrUpdateTriageComment(existingTriageComment, holdBody);

    await sendOperatorEmail(
      `[WCP] Dependabot PR #${PR_NUMBER} held — risk research failed`,
      [
        `Dependabot PR #${PR_NUMBER} could not be auto-triaged because risk research failed.`,
        '',
        `PR title: ${title}`,
        `Reason: ${reason}`,
        '',
        `Review and approve or close the PR manually:`,
        `https://github.com/${REPO_OWNER}/${REPO_NAME}/pull/${PR_NUMBER}`,
      ].join('\n')
    );

    console.log('[triage] Done (held — research failed).');
    return;
  }

  console.log('[triage] Risk research obtained.');
  const riskSection = `\n\n---\n**Risk research (AI):** ${riskSummary}`;

  // Auto-approve patch and minor; hold major / unknown for manual review.
  if (updateType === 'patch' || updateType === 'minor') {
    const approvalBody = `Auto-approved by dependabot-triage: **${updateType}** update. Safe to merge.${riskSection}`;
    run(`gh pr review ${PR_NUMBER} --approve --body "${approvalBody.replace(/"/g, '\\"')}"`);
    console.log(`[triage] Approved (${updateType}).`);

    if (updateType === 'patch') {
      try {
        run(`gh pr merge ${PR_NUMBER} --auto --merge`);
        console.log('[triage] Auto-merge enabled.');
      } catch (err) {
        console.warn(`[triage] Could not enable auto-merge: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else {
    const article = updateType === 'unknown' ? 'an' : 'a';
    const emoji = updateType === 'major' ? '🔴' : '⚠️';
    const holdBody = `${emoji} **Dependabot triage:** This is ${article} **${updateType}** update. Manual review is required before merging.${riskSection}`;
    postOrUpdateTriageComment(existingTriageComment, holdBody);
    console.log(`[triage] Manual-review comment posted/updated (${updateType}).`);
  }

  console.log('[triage] Done.');
}

main().catch((err) => {
  console.error('[triage] Fatal:', err);
  process.exit(1);
});
