# Email Distribution

## Current State

Email distribution is **deferred** as of R2.1.1.

### Reason

Beehiiv's API has two surfaces:

1. **API access** — subscriber management, publication info, segments, reading data. Available on all plans (including the free Launch tier).
2. **Send API** — programmatic triggering of broadcast sends. **Available only on Enterprise tier (custom pricing).**

The Crypto Pulse pipeline is designed to autonomously send daily and weekly emails via the Send API. Beehiiv's pricing structure makes this prohibitive at pre-revenue scale: Enterprise tier requires custom pricing typically in the hundreds of dollars per month range.

The 403 error on `POST /publications/{pubId}/posts` is structurally expected — the operator's Beehiiv account has API access but not Send API access. This was surfaced in production during R2.1.1 validation.

---

## Architectural response

- The Beehiiv integration code is **preserved** in `lib/email/beehiiv.ts` and `lib/email/beehiiv-email-sender.ts` for future reuse.
- Pipeline orchestrators are decoupled from Beehiiv specifically via the `EmailSender` interface (`lib/email/email-sender.ts`).
- A `NoOpEmailSender` is the default implementation when `BEEHIIV_BROADCAST_ENABLED` is unset or `false`.
- Pipelines run cleanly with email disabled — content publishing is unaffected.

### Interface methods

```typescript
interface EmailSender {
  sendDailyDigest(slug: string, targetDate: string): Promise<void>;
  sendWeeklyEmail(artifact: ReportArtifact): Promise<void>;
  sendSundayDigest(weekDailies: ReadonlyArray<DailyArtifact>, framing: string): Promise<void>;
}
```

The interface is intentionally minimal — it reflects exactly what the pipeline orchestrators need, nothing more.

---

## Re-enabling email distribution

When subscriber count or revenue justifies revisiting, choose one of the following paths.

### Option A — Upgrade Beehiiv to Enterprise

1. Contact Beehiiv sales for Enterprise pricing
2. Verify the upgraded API key has Send API access by checking that `POST /publications/{pubId}/posts` returns 200 (not 403):
   ```bash
   npm run smoke:beehiiv
   # Smoke test validates read-side only. To verify send access, run a test pipeline
   # against the staging environment or a non-subscriber test email.
   ```
3. Set `BEEHIIV_BROADCAST_ENABLED=true` in:
   - `.env.local` (local dev)
   - Vercel environment variables (production)
   - GitHub Actions repository secrets (CI pipeline)
4. Pipelines automatically resume using `BeehiivEmailSender`

### Option B — Migrate to a different ESP

1. Choose an alternative (Resend, Buttondown, Mailgun, or similar) that includes Send API on affordable plans
2. Create a new implementation of the `EmailSender` interface:
   ```
   lib/email/resend-email-sender.ts   (example)
   ```
3. Update `createEmailSender()` in `lib/email/email-sender-factory.ts` to return the new implementation
4. Add the new ESP's credentials to `.env.example` and `.env.local`
5. Update this document and `docs/operations/beehiiv-integration.md`
6. The pipeline orchestrators (`run-daily-pipeline.ts`, `run-sunday-digest-pipeline.ts`, `generate-local-report.ts`) do not change — they only know about the interface

The `EmailSender` interface is designed minimally to match what the pipelines need now. If a new ESP requires different composition or delivery semantics, extend the interface at that point rather than speculatively.

---

## Smoke testing

`npm run smoke:beehiiv` validates the Beehiiv integration's read-side connectivity (auth, publication, segment lookup). With email distribution disabled, this is informational — it verifies Beehiiv account configuration but does not affect pipeline operation.

When email is re-enabled (Option A), expand smoke tests to validate actual send access:
- Verify `POST /publications/{pubId}/posts` returns 200 (not 403) with the upgraded key
- Send a test broadcast to a single-subscriber test segment before enabling on production

---

## Runtime behavior when disabled

Each pipeline logs:

```
[pipeline] INFO: Email distribution is disabled (BEEHIIV_BROADCAST_ENABLED=false).
[pipeline]   Reason: Beehiiv Send API requires Enterprise tier; deferred to future release.
[pipeline]   To re-enable: set BEEHIIV_BROADCAST_ENABLED=true and upgrade Beehiiv plan,
[pipeline]                 or migrate to a different ESP per docs/operations/email-distribution.md.
```

The pipeline exits 0 and the artifact is committed normally.

---

## Email template considerations

The HTML email templates (`lib/email/compose-*.ts`) produce complete HTML documents, not partial fragments. Each template follows these conventions:

### What's in place

- **Inline styles only** — no external CSS. Required for broad email client compatibility.
- **Preheader text** — a hidden `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">` immediately after `<body>` open, populated from the content summary (first 140 chars). Controls the preview snippet shown in most inbox clients.
- **Apple message-reformatting guard** — `<meta name="x-apple-disable-message-reformatting">` prevents Apple Mail from resizing or recoloring text.
- **HTML escaping** — all user-supplied strings are run through `escapeHtml()` before interpolation.

### Known limitations (deferred)

- **No `<table>` layout** — templates use `<div>`/`<main>` with `max-width`. Outlook 2016 and earlier requires table-based layout for reliable rendering. Given the current platform (Beehiiv handles final delivery), Beehiiv may apply its own wrapper. If direct SMTP delivery is added, evaluate converting to a table skeleton at that point.
- **No dark-mode `@media` query** — templates hard-code the dark canvas background. Apple Mail and a few other clients support `@media (prefers-color-scheme)` in `<style>` tags, but this is speculative optimization. Deferred.
- **No unsubscribe link in template** — the unsubscribe mechanism is Beehiiv-managed. If a different ESP is adopted, add a one-click unsubscribe header and footer link to comply with CAN-SPAM / GDPR requirements at that time.
