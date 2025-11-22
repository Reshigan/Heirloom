"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const resend_1 = require("resend");
const index_1 = require("../index");
class NotificationService {
    resend;
    constructor() {
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY || 'test-key');
    }
    async sendCheckInReminder(email, nextCheckIn) {
        const checkInUrl = `${process.env.FRONTEND_URL}/check-in`;
        try {
            await this.resend.emails.send({
                from: 'Constellation Vault <noreply@loom.vantax.co.za>',
                to: email,
                subject: 'Time for Your Constellation Vault Check-In',
                html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #f5f5dc;">
            <h1 style="color: #d4af37; font-size: 32px; margin-bottom: 20px;">Your Vault Awaits</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              It's time for your regular check-in to keep your Constellation Vault secure and private.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your next check-in is due by <strong style="color: #d4af37;">${nextCheckIn.toLocaleDateString()}</strong>.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${checkInUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Check In Now
              </a>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
              If you don't check in, your trusted contacts will be notified after the grace period to ensure your vault is protected.
            </p>

            <p style="font-size: 14px; color: #b8b8b8; margin-top: 20px;">
              Your memories are stars in the constellation of your legacy.
            </p>
          </div>
        `
            });
            console.log(`✉️ Check-in reminder sent to ${email}`);
        }
        catch (error) {
            console.error(`❌ Failed to send check-in reminder to ${email}:`, error);
        }
    }
    async sendMissedCheckInAlert(email, missedCount) {
        const checkInUrl = `${process.env.FRONTEND_URL}/check-in`;
        try {
            await this.resend.emails.send({
                from: 'Constellation Vault <noreply@loom.vantax.co.za>',
                to: email,
                subject: `⚠️ Missed Check-In Alert #${missedCount}`,
                html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #1a0a0a 0%, #2a1a1e 100%); color: #f5f5dc;">
            <h1 style="color: #ff6b6b; font-size: 32px; margin-bottom: 20px;">⚠️ Missed Check-In Alert</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              You've missed check-in #${missedCount}. This is an important security measure for your Constellation Vault.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #ff6b6b;">
              ${missedCount === 1 ? 'Please check in within the next 30 days to avoid escalation.' : 'This is your final reminder before trusted contact notification.'}
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${checkInUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Check In Immediately
              </a>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
              If you're unable to check in, your trusted contacts will be notified to verify your status.
            </p>
          </div>
        `
            });
            console.log(`⚠️ Missed check-in alert #${missedCount} sent to ${email}`);
        }
        catch (error) {
            console.error(`❌ Failed to send missed check-in alert to ${email}:`, error);
        }
    }
    async sendEscalationAlert(email) {
        try {
            await this.resend.emails.send({
                from: 'Constellation Vault <noreply@loom.vantax.co.za>',
                to: email,
                subject: '🚨 URGENT: Vault Escalation - Trusted Contacts Notified',
                html: `
          <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #2a0a0a 0%, #3a1a1e 100%); color: #f5f5dc;">
            <h1 style="color: #ff4444; font-size: 32px; margin-bottom: 20px;">🚨 URGENT: Escalation</h1>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              You've missed multiple check-ins. Your trusted contacts have been notified to verify your status.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #ff6b6b;">
              You have a 30-day grace period to check in before your vault begins the unlock process.
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/check-in" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ff4444 0%, #ff6666 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Check In Now
              </a>
            </div>

            <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
              If this is a mistake, please check in immediately to cancel the escalation.
            </p>
          </div>
        `
            });
            console.log(`🚨 Escalation alert sent to ${email}`);
        }
        catch (error) {
            console.error(`❌ Failed to send escalation alert to ${email}:`, error);
        }
    }
    async notifyTrustedContacts(userId) {
        const contacts = await index_1.prisma.trustedContact.findMany({
            where: {
                userId,
                verificationStatus: 'verified'
            }
        });
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user)
            return;
        for (const contact of contacts) {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-status/${contact.verificationToken}`;
            try {
                await this.resend.emails.send({
                    from: 'Constellation Vault <noreply@loom.vantax.co.za>',
                    to: contact.email,
                    subject: `Verification Needed: ${user.email}'s Constellation Vault`,
                    html: `
            <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #f5f5dc;">
              <h1 style="color: #d4af37; font-size: 32px; margin-bottom: 20px;">Verification Needed</h1>
              
              <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                You've been listed as a trusted contact for ${user.email}'s Constellation Vault.
              </p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                They have missed multiple check-ins. We need you to verify their status to ensure their vault is handled appropriately.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                  Verify Status
                </a>
              </div>

              <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
                This is a sensitive matter. Please respond within 30 days.
              </p>
            </div>
          `
                });
                console.log(`📧 Trusted contact notification sent to ${contact.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to notify trusted contact ${contact.email}:`, error);
            }
        }
    }
    async notifyRecipients(vaultId) {
        const recipients = await index_1.prisma.recipient.findMany({
            where: { vaultId }
        });
        const vault = await index_1.prisma.vault.findUnique({
            where: { id: vaultId },
            include: { user: true }
        });
        if (!vault)
            return;
        for (const recipient of recipients) {
            const accessUrl = `${process.env.FRONTEND_URL}/access/${recipient.accessToken}`;
            try {
                await this.resend.emails.send({
                    from: 'Constellation Vault <noreply@loom.vantax.co.za>',
                    to: recipient.email,
                    subject: `A Message From Beyond: ${vault.user.email}'s Constellation Vault`,
                    html: `
            <div style="font-family: 'Bodoni Moda', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: #f5f5dc;">
              <h1 style="color: #d4af37; font-size: 32px; margin-bottom: 20px;">A Message From Beyond</h1>
              
              <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                ${vault.user.email} has left something special for you in their Constellation Vault.
              </p>

              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Their memories, wisdom, and final messages are now available for you to access.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${accessUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%); color: #0a0a0a; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                  Access Their Vault
                </a>
              </div>

              <p style="font-size: 14px; color: #b8b8b8; line-height: 1.6; margin-top: 40px;">
                These memories are stars in the constellation of their legacy, preserved forever for you.
              </p>
            </div>
          `
                });
                await index_1.prisma.recipient.update({
                    where: { id: recipient.id },
                    data: { notificationSent: true }
                });
                console.log(`💌 Recipient notification sent to ${recipient.email}`);
            }
            catch (error) {
                console.error(`❌ Failed to notify recipient ${recipient.email}:`, error);
            }
        }
    }
}
exports.NotificationService = NotificationService;
