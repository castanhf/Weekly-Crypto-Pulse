/**
 * smoke-beehiiv.ts
 *
 * Validates Beehiiv integration health without sending any real emails or
 * creating any real subscribers. Checks:
 *   1. API key is accepted (auth)
 *   2. Publication ID exists and is accessible
 *   3. The "daily_digest_opt_in" segment exists
 *   4. The posts endpoint is reachable (dry-run probe via GET, not POST)
 *
 * Run: npm run smoke:beehiiv
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BEEHIIV_BASE = 'https://api.beehiiv.com/v2';

type CheckResult = { label: string; ok: boolean; detail?: string };

const check = (label: string, ok: boolean, detail?: string): CheckResult => ({ label, ok, detail });

const apiGet = async (url: string, apiKey: string): Promise<{ ok: boolean; status: number; body: unknown }> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => null);
  }

  return { ok: response.ok, status: response.status, body };
};

const runSmoke = async (): Promise<void> => {
  const results: CheckResult[] = [];

  // 1. Credentials present
  const apiKey = process.env.BEEHIIV_API_KEY ?? '';
  const pubId = process.env.BEEHIIV_PUBLICATION_ID ?? '';

  if (!apiKey || !pubId) {
    console.log('\nBeehiiv Smoke Test');
    console.log('==================');
    console.log('✗ BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must both be set.');
    process.exitCode = 1;
    return;
  }

  // 2. Publication accessible (implicitly validates API key)
  const pubResult = await apiGet(`${BEEHIIV_BASE}/publications/${pubId}`, apiKey);
  if (pubResult.ok) {
    const pubName = (pubResult.body as { data?: { name?: string } })?.data?.name ?? pubId;
    results.push(check(`API key accepted + publication "${pubName}" found`, true));
  } else if (pubResult.status === 401 || pubResult.status === 403) {
    results.push(check('API key accepted', false, `Auth error (${pubResult.status}) — check BEEHIIV_API_KEY`));
  } else if (pubResult.status === 404) {
    results.push(check('Publication found', false, `404 — check BEEHIIV_PUBLICATION_ID`));
  } else {
    results.push(check('Publication accessible', false, `Unexpected status ${pubResult.status}`));
  }

  // 3. daily_digest_opt_in segment exists
  if (pubResult.ok) {
    const segResult = await apiGet(`${BEEHIIV_BASE}/publications/${pubId}/segments`, apiKey);
    if (segResult.ok) {
      const segments = ((segResult.body as { data?: Array<{ name: string; id: string }> })?.data ?? []);
      const match = segments.find((s) => s.name === 'daily_digest_opt_in');
      if (match) {
        results.push(check(`Segment "daily_digest_opt_in" exists (id: ${match.id})`, true));
      } else {
        results.push(check('Segment "daily_digest_opt_in" exists', false, '→ Create the segment in Beehiiv dashboard'));
      }
    } else {
      results.push(check('Segments endpoint reachable', false, `Status ${segResult.status}`));
    }
  }

  // 4. Posts endpoint reachable (GET list — validates endpoint path without creating anything)
  if (pubResult.ok) {
    const postsResult = await apiGet(`${BEEHIIV_BASE}/publications/${pubId}/posts?limit=1`, apiKey);
    if (postsResult.ok) {
      results.push(check('Posts endpoint reachable (broadcast path validated)', true));
    } else {
      results.push(check('Posts endpoint reachable', false, `Status ${postsResult.status} — broadcast sends may fail`));
    }
  }

  // Print results
  console.log('\nBeehiiv Smoke Test');
  console.log('==================');
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
  console.error(`\n[smoke-beehiiv] FATAL: ${message}`);
  process.exitCode = 1;
});
