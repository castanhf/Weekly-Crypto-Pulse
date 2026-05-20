import type { EmailSender } from './email-sender';
import type { ReportArtifact } from '../../domain/report';
import type { DailyArtifact } from '../../domain/daily';

const DEFERRAL_MESSAGE = [
  '[pipeline] INFO: Email distribution is disabled (BEEHIIV_BROADCAST_ENABLED=false).',
  '[pipeline]   Reason: Beehiiv Send API requires Enterprise tier; deferred to future release.',
  '[pipeline]   To re-enable: set BEEHIIV_BROADCAST_ENABLED=true and upgrade Beehiiv plan,',
  '[pipeline]                 or migrate to a different ESP per docs/operations/email-distribution.md.',
].join('\n');

/**
 * No-op EmailSender used when email distribution is disabled.
 * Logs a clear deferral message and returns successfully so pipelines
 * continue publishing content without attempting any API call.
 */
export class NoOpEmailSender implements EmailSender {
  async sendDailyDigest(_slug: string, _targetDate: string): Promise<void> {
    console.log(DEFERRAL_MESSAGE);
  }

  async sendWeeklyEmail(_artifact: ReportArtifact): Promise<void> {
    console.log(DEFERRAL_MESSAGE);
  }

  async sendSundayDigest(_weekDailies: ReadonlyArray<DailyArtifact>, _framing: string): Promise<void> {
    console.log(DEFERRAL_MESSAGE);
  }
}
