# Beehiiv Integration — Operations Reference

## Overview

Crypto Pulse uses Beehiiv's v2 API for email distribution:
- **Weekly report**: sent to all subscribers via `segment: 'all'`
- **Daily digest**: sent to opted-in subscribers via `segment: 'daily_digest_opt_in'`
- **Sunday digest**: weekly framing email, sent to all subscribers

The Beehiiv client lives in `lib/email/beehiiv.ts`.

---

## Required environment variables

| Variable | Purpose |
|---|---|
| `BEEHIIV_API_KEY` | API key from Beehiiv → Settings → API |
| `BEEHIIV_PUBLICATION_ID` | Publication ID from Beehiiv → Settings → Publication |

Both must be set in `.env.local` (local dev) or as GitHub Actions secrets (CI).

---

## Smoke test — verify integration health

Before running any real pipeline, validate the integration:

```bash
npm run smoke:beehiiv
```

Expected output when healthy:
```
Beehiiv Smoke Test
==================
✓ API key accepted + publication "Crypto Pulse" found
✓ Segment "daily_digest_opt_in" exists (id: seg_xxxxx)
✓ Posts endpoint reachable (broadcast path validated)
```

If any check fails, the script explains what to fix.

---

## API endpoint reference (Beehiiv v2)

### Subscriptions (signup form)

```
POST /v2/publications/{pubId}/subscriptions
```

Creates or reactivates a subscriber. The `tags` field is **not supported** in the subscription body (as of Beehiiv v2). Tags are applied via a separate call immediately after:

```
POST /v2/publications/{pubId}/subscriptions/{subscriptionId}/tags
{ "tags": ["daily_digest_opt_in"] }
```

If the tag call fails, the subscriber is still created and a `[beehiiv] WARNING` is logged. The subscriber won't receive daily digests until the tag is applied (which Beehiiv dashboard allows manually).

### Broadcasts (sending email)

```
POST /v2/publications/{pubId}/posts
```

**Not** `/broadcasts` — that endpoint does not exist in Beehiiv v2.

Required fields:
- `title` — internal post title (required by Beehiiv Posts API)
- `subject` — email subject line
- `body_content` — HTML content for the email body
- `status: 'confirmed'` — sends immediately (or at `scheduled_at` if provided)

Segment targeting:
```json
{
  "recipients": {
    "email": {
      "include_segment_ids": ["seg_xxxxx"]
    }
  }
}
```

**Not** `segment_id` as a top-level field — that caused production 404 errors.

---

## Segment setup

The `daily_digest_opt_in` segment must be created manually in the Beehiiv dashboard before daily digest emails can be sent.

Steps:
1. Log into Beehiiv → Audience → Segments
2. Create a new segment named exactly `daily_digest_opt_in`
3. Run `npm run smoke:beehiiv` to verify it's found

The segment name is case-sensitive. The code matches on `s.name === 'daily_digest_opt_in'`.

---

## Error patterns and diagnosis

| Error message | Likely cause | Fix |
|---|---|---|
| `BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must be set` | Missing env vars | Set them in `.env.local` or GitHub Actions secrets |
| `No Beehiiv segment named "daily_digest_opt_in" found` | Segment not created | Create segment in Beehiiv dashboard |
| `Beehiiv auth error (401)` | Invalid API key | Regenerate API key in Beehiiv → Settings → API |
| `Beehiiv client error (404): (no body)` | Wrong publication ID or endpoint | Check `BEEHIIV_PUBLICATION_ID`; run `smoke:beehiiv` |
| `Beehiiv client error (422): <message>` | Invalid request field | Check API response message; review API field names |
| `Beehiiv rate limited (429)` | Too many requests | Client retries automatically (3 attempts with backoff) |

---

## Pipeline behavior on email failure

As of WCP-144, email send failures in the daily pipeline are **non-fatal**:
- Steps 1–4 (research, write, review, promote artifact) must succeed — failure = pipeline fails
- Step 5 (email send) failure = `[pipeline] WARNING` logged + `::warning::` GitHub Actions annotation surfaced in workflow UI
- The pipeline still exits with code 0, and the artifact is committed by the subsequent `git commit` step

This means a broken email configuration will not prevent daily content from appearing on the site.

---

## Verifying tag application after deployment

After shipping WCP-144 or any change to the subscription flow:

1. Sign up a fresh test email via the homepage with the "daily digest" checkbox checked
2. In Beehiiv → Audience → Subscribers, find the subscriber
3. Confirm the `daily_digest_opt_in` tag appears on the subscriber record
4. If the tag is missing, check the server logs for `[beehiiv] WARNING: Failed to apply daily_digest_opt_in tag`
