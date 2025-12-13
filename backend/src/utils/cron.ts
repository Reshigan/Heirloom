import cron from 'node-cron';
import { billingService } from '../services/billing.service';
import { deadManSwitchService } from '../services/deadman.service';
import { logger } from './logger';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs(): void {
  logger.info('Initializing scheduled jobs...');

  // Process trial expirations - every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running trial expiration check...');
    try {
      await billingService.processTrialExpirations();
    } catch (error) {
      logger.error('Trial expiration check failed:', error);
    }
  });

  // Process dead man's switch reminders - every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running dead man\'s switch reminder check...');
    try {
      await deadManSwitchService.processReminders();
    } catch (error) {
      logger.error('Dead man\'s switch reminder check failed:', error);
    }
  });

  // Process verified switches (release content) - every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running verified switch processing...');
    try {
      await deadManSwitchService.processVerifiedSwitches();
    } catch (error) {
      logger.error('Verified switch processing failed:', error);
    }
  });

  // Send scheduled letters - every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Processing scheduled letter deliveries...');
    try {
      const prisma = (await import('../config/database')).default;
      const { emailService } = await import('../services/email.service');

      const dueLetters = await prisma.letter.findMany({
        where: {
          deliveryTrigger: 'SCHEDULED',
          scheduledDate: { lte: new Date() },
          sealedAt: { not: null },
          deliveries: { none: {} },
        },
        include: {
          user: true,
          recipients: {
            include: { familyMember: true },
          },
        },
      });

      for (const letter of dueLetters) {
        for (const recipient of letter.recipients) {
          if (recipient.familyMember.email) {
            await emailService.sendLetterDelivery(
              recipient.familyMember.email,
              recipient.familyMember.name,
              letter.user.firstName + ' ' + letter.user.lastName,
              {
                salutation: letter.salutation || '',
                body: letter.body,
                signature: letter.signature || '',
              }
            );

            await prisma.letterDelivery.create({
              data: {
                letterId: letter.id,
                recipientEmail: recipient.familyMember.email,
                status: 'DELIVERED',
                sentAt: new Date(),
                deliveredAt: new Date(),
              },
            });
          }
        }
      }

      if (dueLetters.length > 0) {
        logger.info(`Delivered ${dueLetters.length} scheduled letters`);
      }
    } catch (error) {
      logger.error('Scheduled letter delivery failed:', error);
    }
  });

  logger.info('All scheduled jobs initialized');
}
