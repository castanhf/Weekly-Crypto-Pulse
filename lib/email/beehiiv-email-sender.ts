import type { EmailSender } from './email-sender';
import { sendBroadcast } from './beehiiv';
import { composeDailyDigest } from './compose-daily-digest';
import { composeWeeklyEmail } from './compose-weekly-email';
import { composeSundayDigest } from './compose-sunday-digest';
import { loadDailyBySlug } from '../reports/daily-repository';
import type { ReportArtifact } from '../../domain/report';
import type { DailyArtifact } from '../../domain/daily';

const isSundayDate = (isoDate: string): boolean => new Date(isoDate).getDay() === 0;

/**
 * Live EmailSender implementation backed by the Beehiiv API.
 * Requires Beehiiv Enterprise tier for Send API access.
 * See docs/operations/email-distribution.md for re-enabling instructions.
 */
export class BeehiivEmailSender implements EmailSender {
  async sendDailyDigest(slug: string, targetDate: string): Promise<void> {
    if (isSundayDate(targetDate)) {
      console.log('[pipeline] Sunday — skipping daily digest (Sunday digest handles this day).');
      return;
    }

    const record = loadDailyBySlug(slug);
    if (!record) {
      console.warn(`[pipeline] Could not find promoted artifact for slug "${slug}" — skipping email.`);
      return;
    }

    const { subject, htmlBody, plaintextBody } = composeDailyDigest(record.daily);
    const { broadcastId } = await sendBroadcast({
      subject,
      htmlBody,
      plaintextBody,
      segment: 'daily_digest_opt_in'
    });

    console.log(`[pipeline] Daily digest sent: ${broadcastId}`);
    console.log(`[pipeline] Subject: ${subject}`);
  }

  async sendWeeklyEmail(artifact: ReportArtifact): Promise<void> {
    const { subject, htmlBody, plaintextBody } = composeWeeklyEmail(artifact.report);
    const { broadcastId } = await sendBroadcast({ subject, htmlBody, plaintextBody, segment: 'all' });
    console.log(`[pipeline] Weekly email sent: ${broadcastId}`);
    console.log(`[pipeline] Subject: ${subject}`);
  }

  async sendSundayDigest(weekDailies: ReadonlyArray<DailyArtifact>, framing: string): Promise<void> {
    const { subject, htmlBody, plaintextBody } = composeSundayDigest({ weekDailies, framing });
    const { broadcastId } = await sendBroadcast({ subject, htmlBody, plaintextBody, segment: 'all' });
    console.log(`[sunday-digest] Broadcast sent: ${broadcastId}`);
    console.log(`[sunday-digest] Subject: ${subject}`);
  }
}
