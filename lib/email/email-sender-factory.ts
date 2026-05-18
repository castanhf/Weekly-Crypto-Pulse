import type { EmailSender } from './email-sender';
import { BeehiivEmailSender } from './beehiiv-email-sender';
import { NoOpEmailSender } from './no-op-email-sender';

/**
 * Returns a live BeehiivEmailSender when BEEHIIV_BROADCAST_ENABLED=true,
 * otherwise the no-op sender (default).
 *
 * Email distribution is disabled by default because Beehiiv's Send API requires
 * the Enterprise tier. See docs/operations/email-distribution.md for details.
 */
export const createEmailSender = (): EmailSender => {
  const enabled = process.env.BEEHIIV_BROADCAST_ENABLED === 'true';
  return enabled ? new BeehiivEmailSender() : new NoOpEmailSender();
};
