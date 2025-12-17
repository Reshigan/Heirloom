import prisma from '../config/database';
import { cache } from '../config/redis';
import { logger } from '../utils/logger';
import { emailService } from './email.service';
import { encryptionService } from './encryption.service';
import { v4 as uuid } from 'uuid';

/**
 * Dead Man's Switch Service
 * 
 * How it works:
 * 1. User sets up check-in interval (e.g., every 30 days)
 * 2. System sends periodic check-in reminders via email/SMS
 * 3. If user doesn't check in within grace period, contacts are notified
 * 4. Multiple legacy contacts must verify before content is released
 * 5. Upon verification, encrypted content keys are released to beneficiaries
 * 
 * Safety measures:
 * - Multiple verification steps to prevent accidental triggers
 * - Grace periods with escalating notifications
 * - Require 2+ legacy contacts to confirm
 * - Cool-down period before final release
 */

export type CheckInInterval = 7 | 14 | 30 | 60 | 90; // days
export type SwitchStatus = 'ACTIVE' | 'WARNING' | 'TRIGGERED' | 'VERIFIED' | 'RELEASED' | 'CANCELLED';

export interface DeadManSwitchConfig {
  userId: string;
  checkInIntervalDays: CheckInInterval;
  gracePeriodDays: number;
  requiredVerifications: number;
  enabled: boolean;
}

export const deadManSwitchService = {
  /**
   * Configure dead man's switch for user
   */
  async configure(
    userId: string,
    intervalDays: CheckInInterval,
    gracePeriodDays: number = 7
  ): Promise<void> {
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + intervalDays);

    await prisma.deadManSwitch.upsert({
      where: { userId },
      update: {
        checkInIntervalDays: intervalDays,
        gracePeriodDays,
        nextCheckInDue: nextCheckIn,
        status: 'ACTIVE',
        enabled: true,
      },
      create: {
        userId,
        checkInIntervalDays: intervalDays,
        gracePeriodDays,
        nextCheckInDue: nextCheckIn,
        status: 'ACTIVE',
        enabled: true,
        requiredVerifications: 2,
      },
    });

    // Schedule check-in reminder
    await this.scheduleReminders(userId, nextCheckIn);

    logger.info(`Dead man's switch configured for user ${userId}: ${intervalDays} day interval`);
  },

  /**
   * User checks in - proves they're alive
   */
  async checkIn(userId: string): Promise<{ nextCheckInDue: Date }> {
    const dms = await prisma.deadManSwitch.findUnique({ where: { userId } });
    if (!dms || !dms.enabled) {
      throw new Error('Dead man\'s switch not configured');
    }

    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + dms.checkInIntervalDays);

    await prisma.deadManSwitch.update({
      where: { userId },
      data: {
        lastCheckIn: new Date(),
        nextCheckInDue: nextCheckIn,
        status: 'ACTIVE',
        missedCheckIns: 0,
      },
    });

    // Record check-in history
    await prisma.checkInHistory.create({
      data: {
        userId,
        checkedInAt: new Date(),
        method: 'MANUAL',
      },
    });

    // Clear any triggered status
    await cache.del(`dms:triggered:${userId}`);

    // Reschedule reminders
    await this.scheduleReminders(userId, nextCheckIn);

    logger.info(`User ${userId} checked in, next due: ${nextCheckIn}`);

    return { nextCheckInDue: nextCheckIn };
  },

  /**
   * Schedule check-in reminders
   */
  async scheduleReminders(userId: string, dueDate: Date): Promise<void> {
    // Clear existing reminders
    await cache.delPattern(`dms:reminder:*:${userId}`);

    // Schedule reminders at 7, 3, 1 days before, and on due date
    const reminderDays = [7, 3, 1, 0];
    
    for (const days of reminderDays) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      const ttl = Math.max(0, Math.floor((reminderDate.getTime() - Date.now()) / 1000));
      
      if (ttl > 0) {
        await cache.set(
          `dms:reminder:${days}:${userId}`,
          { userId, daysUntilDue: days },
          ttl
        );
      }
    }
  },

  /**
   * Process check-in reminders (run via cron)
   */
  async processReminders(): Promise<void> {
    const overdueSwitches = await prisma.deadManSwitch.findMany({
      where: {
        enabled: true,
        status: { in: ['ACTIVE', 'WARNING'] },
        nextCheckInDue: { lte: new Date() },
      },
      include: { user: true },
    });

    for (const dms of overdueSwitches) {
      await this.handleMissedCheckIn(dms.userId);
    }

    // Send upcoming reminders
    const upcomingSwitches = await prisma.deadManSwitch.findMany({
      where: {
        enabled: true,
        status: 'ACTIVE',
        nextCheckInDue: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Within 7 days
        },
      },
      include: { user: true },
    });

    for (const dms of upcomingSwitches) {
      if (!dms.nextCheckInDue) continue;
      const daysUntil = Math.ceil(
        (dms.nextCheckInDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      // Send reminder at 7, 3, 1 days
      if ([7, 3, 1].includes(daysUntil)) {
        await emailService.sendCheckInReminder(
          dms.user.email,
          dms.user.firstName,
          daysUntil
        );
      }
    }

    logger.info(`Processed ${overdueSwitches.length} overdue, ${upcomingSwitches.length} upcoming switches`);
  },

  /**
   * Handle missed check-in
   */
  async handleMissedCheckIn(userId: string): Promise<void> {
    const dms = await prisma.deadManSwitch.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!dms || !dms.enabled) return;

    const missedCount = dms.missedCheckIns + 1;

    // Update status based on missed count
    if (missedCount === 1) {
      // First miss - send warning
      await prisma.deadManSwitch.update({
        where: { userId },
        data: {
          status: 'WARNING',
          missedCheckIns: missedCount,
        },
      });

      await emailService.sendUrgentCheckInReminder(
        dms.user.email,
        dms.user.firstName,
        dms.gracePeriodDays
      );

      logger.warn(`User ${userId} missed first check-in, in warning period`);
    } else if (missedCount >= 2) {
      // Multiple misses - trigger switch
      await this.triggerSwitch(userId);
    }
  },

  /**
   * Trigger the dead man's switch
   */
  async triggerSwitch(userId: string): Promise<void> {
    const dms = await prisma.deadManSwitch.findUnique({
      where: { userId },
      include: { 
        user: true,
      },
    });

    if (!dms || dms.status === 'TRIGGERED') return;

    // Get legacy contacts
    const legacyContacts = await prisma.legacyContact.findMany({
      where: { 
        userId,
        verificationStatus: 'VERIFIED',
      },
    });

    if (legacyContacts.length < dms.requiredVerifications) {
      logger.error(`User ${userId} doesn't have enough verified legacy contacts`);
      return;
    }

    // Update status
    await prisma.deadManSwitch.update({
      where: { userId },
      data: {
        status: 'TRIGGERED',
        triggeredAt: new Date(),
      },
    });

    // Generate verification tokens for each legacy contact
    for (const contact of legacyContacts) {
      const token = uuid();
      
      await prisma.switchVerification.create({
        data: {
          deadManSwitchId: dms.id,
          legacyContactId: contact.id,
          verificationToken: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Notify legacy contact
      await emailService.sendDeathVerificationRequest(
        contact.email,
        contact.name,
        dms.user.firstName + ' ' + dms.user.lastName,
        token
      );
    }

    // Also try to reach user one last time
    await emailService.sendFinalCheckInWarning(
      dms.user.email,
      dms.user.firstName
    );

    logger.warn(`Dead man's switch triggered for user ${userId}`);
  },

  /**
   * Legacy contact verifies user's passing
   */
  async verifyPassing(token: string): Promise<{ success: boolean; message: string }> {
    const verification = await prisma.switchVerification.findUnique({
      where: { verificationToken: token },
      include: {
        deadManSwitch: {
          include: { user: true },
        },
        legacyContact: true,
      },
    });

    if (!verification) {
      return { success: false, message: 'Invalid verification token' };
    }

    if (verification.expiresAt < new Date()) {
      return { success: false, message: 'Verification token expired' };
    }

    if (verification.verified) {
      return { success: false, message: 'Already verified' };
    }

    // Mark as verified
    await prisma.switchVerification.update({
      where: { id: verification.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Check if enough verifications received
    const verificationCount = await prisma.switchVerification.count({
      where: {
        deadManSwitchId: verification.deadManSwitchId,
        verified: true,
      },
    });

    const dms = verification.deadManSwitch;

    if (verificationCount >= dms.requiredVerifications) {
      // All verifications received - mark as verified
      await prisma.deadManSwitch.update({
        where: { id: dms.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });

      // Start 48-hour cool-down before release
      await cache.set(
        `dms:cooldown:${dms.userId}`,
        { userId: dms.userId, releaseAt: Date.now() + 48 * 60 * 60 * 1000 },
        48 * 60 * 60 // 48 hours
      );

      // Send notification to user's email (last chance)
      await emailService.sendPassingVerified(
        dms.user.email,
        dms.user.firstName
      );

      logger.info(`Passing verified for user ${dms.userId}, 48h cool-down started`);
    }

    return { 
      success: true, 
      message: `Verification recorded (${verificationCount}/${dms.requiredVerifications})` 
    };
  },

  /**
   * Process verified switches and release content (run via cron)
   */
  async processVerifiedSwitches(): Promise<void> {
    const verifiedSwitches = await prisma.deadManSwitch.findMany({
      where: {
        status: 'VERIFIED',
        verifiedAt: {
          lte: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        },
      },
      include: { user: true },
    });

    for (const dms of verifiedSwitches) {
      await this.releaseContent(dms.userId);
    }
  },

  /**
   * Release encrypted content to beneficiaries
   */
  async releaseContent(userId: string): Promise<void> {
    const dms = await prisma.deadManSwitch.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!dms || dms.status !== 'VERIFIED') return;

    // Release encryption keys to beneficiaries
    await encryptionService.releaseEscrowedKeys(userId);

    // Deliver posthumous letters
    const posthumousLetters = await prisma.letter.findMany({
      where: {
        userId,
        deliveryTrigger: 'POSTHUMOUS',
        sealedAt: { not: null },
      },
      include: {
        recipients: {
          include: { familyMember: true },
        },
      },
    });

    for (const letter of posthumousLetters) {
      for (const recipient of letter.recipients) {
        if (recipient.familyMember.email) {
          await emailService.sendLetterDelivery(
            recipient.familyMember.email,
            recipient.familyMember.name,
            dms.user.firstName + ' ' + dms.user.lastName,
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

    // Update status
    await prisma.deadManSwitch.update({
      where: { userId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    logger.info(`Content released for user ${userId}`);
  },

  /**
   * User cancels triggered switch (proves they're alive)
   */
  async cancelTrigger(userId: string, password: string): Promise<boolean> {
    const { authService } = await import('./auth.service');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return false;

    // Verify password
    const valid = await authService.verifyPassword(password, user.passwordHash);
    if (!valid) return false;

    const dms = await prisma.deadManSwitch.findUnique({ where: { userId } });
    if (!dms || !['TRIGGERED', 'WARNING'].includes(dms.status)) return false;

    // Reset switch
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + dms.checkInIntervalDays);

    await prisma.deadManSwitch.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        missedCheckIns: 0,
        lastCheckIn: new Date(),
        nextCheckInDue: nextCheckIn,
        triggeredAt: null,
      },
    });

    // Delete pending verifications
    await prisma.switchVerification.deleteMany({
      where: { deadManSwitchId: dms.id },
    });

    // Notify legacy contacts of cancellation
    const contacts = await prisma.legacyContact.findMany({
      where: { userId, verificationStatus: 'VERIFIED' },
    });

    for (const contact of contacts) {
      await emailService.sendSwitchCancelled(
        contact.email,
        contact.name,
        user.firstName + ' ' + user.lastName
      );
    }

    logger.info(`Dead man's switch cancelled by user ${userId}`);
    return true;
  },

  /**
   * Get switch status for user
   */
  async getStatus(userId: string) {
    const dms = await prisma.deadManSwitch.findUnique({
      where: { userId },
    });

    if (!dms) return null;

    const verifications = await prisma.switchVerification.count({
      where: { deadManSwitchId: dms.id, verified: true },
    });

    return {
      enabled: dms.enabled,
      status: dms.status,
      checkInIntervalDays: dms.checkInIntervalDays,
      gracePeriodDays: dms.gracePeriodDays,
      lastCheckIn: dms.lastCheckIn,
      nextCheckInDue: dms.nextCheckInDue,
      missedCheckIns: dms.missedCheckIns,
      requiredVerifications: dms.requiredVerifications,
      currentVerifications: verifications,
    };
  },
};
