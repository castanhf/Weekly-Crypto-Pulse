import type { ReportArtifact } from '../../domain/report';
import type { DailyArtifact } from '../../domain/daily';

/**
 * Minimal interface capturing exactly what the pipeline orchestrators need from
 * an email distribution service. Implementations: BeehiivEmailSender (live sends)
 * and NoOpEmailSender (disabled / deferred).
 */
export interface EmailSender {
  /**
   * Send the daily digest to the daily_digest_opt_in segment.
   * Implementations may skip silently on Sundays (Sunday digest handles that day).
   */
  sendDailyDigest(slug: string, targetDate: string): Promise<void>;

  /**
   * Send the Monday weekly email to all subscribers.
   */
  sendWeeklyEmail(artifact: ReportArtifact): Promise<void>;

  /**
   * Send the Sunday weekly digest framing email to all subscribers.
   */
  sendSundayDigest(weekDailies: ReadonlyArray<DailyArtifact>, framing: string): Promise<void>;
}
