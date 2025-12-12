import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; background: #050505; color: #f8f5ef; margin: 0; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { text-align: center; padding: 40px 0; border-bottom: 1px solid rgba(201,169,89,0.2); }
    .logo { font-size: 32px; color: #c9a959; letter-spacing: 2px; }
    .content { padding: 40px 0; line-height: 1.8; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #c9a959, #8b7355); color: #050505; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 40px 0; border-top: 1px solid rgba(201,169,89,0.2); color: rgba(248,245,239,0.5); font-size: 14px; }
    .gold { color: #c9a959; }
    .urgent { border-left: 4px solid #8b2942; padding-left: 20px; background: rgba(139,41,66,0.1); padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">∞ HEIRLOOM</div>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Heirloom. Preserving what matters.</p>
      <p>This email was sent from a notification-only address.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailService = {
  async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"Heirloom" <${env.EMAIL_FROM}>`,
        to,
        subject,
        html: baseTemplate(html),
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  },

  // Auth emails
  async sendWelcome(email: string, name: string): Promise<void> {
    await this.send(email, 'Welcome to Heirloom', `
      <h2>Welcome, ${name}</h2>
      <p>Thank you for joining Heirloom. You've taken the first step in preserving your most precious memories for generations to come.</p>
      <p>Your <span class="gold">14-day free trial</span> has begun. During this time, you'll have access to all features.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Upload photos and videos with stories</li>
        <li>Record your voice with guided prompts</li>
        <li>Write letters to loved ones</li>
        <li>Set up posthumous delivery</li>
      </ul>
      <a href="${env.FRONTEND_URL}/dashboard" class="button">Enter Your Vault</a>
    `);
  },

  async sendVerification(email: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.send(email, 'Verify Your Email', `
      <h2>Verify your email, ${name}</h2>
      <p>Please click the button below to verify your email address.</p>
      <a href="${url}" class="button">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `);
  },

  async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.send(email, 'Reset Your Password', `
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <a href="${url}" class="button">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    `);
  },

  // Trial emails
  async sendTrialWarning(email: string, name: string, daysLeft: number): Promise<void> {
    await this.send(email, `Your trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`, `
      <h2>Your trial is ending soon</h2>
      <p>Hi ${name},</p>
      <p>Your Heirloom free trial expires in <span class="gold">${daysLeft} day${daysLeft > 1 ? 's' : ''}</span>.</p>
      <div class="urgent">
        <strong>Important:</strong> When your trial ends, all your content (photos, recordings, letters) will be permanently deleted.
      </div>
      <p>Upgrade now to keep your memories safe forever.</p>
      <a href="${env.FRONTEND_URL}/settings?tab=subscription" class="button">Upgrade Now</a>
    `);
  },

  async sendTrialExpired(email: string, name: string): Promise<void> {
    await this.send(email, 'Your trial has ended', `
      <h2>Your free trial has ended</h2>
      <p>Hi ${name},</p>
      <p>Your Heirloom free trial has expired, and your content has been removed from our servers.</p>
      <p>You can still subscribe anytime to start preserving your memories again.</p>
      <a href="${env.FRONTEND_URL}/settings?tab=subscription" class="button">Subscribe Now</a>
    `);
  },

  // Subscription emails
  async sendSubscriptionConfirmation(email: string, name: string, tier: string): Promise<void> {
    await this.send(email, 'Subscription Confirmed', `
      <h2>Welcome to Heirloom ${tier}</h2>
      <p>Hi ${name},</p>
      <p>Your subscription to the <span class="gold">${tier}</span> plan is now active.</p>
      <p>Your memories are now protected and will be preserved for generations.</p>
      <a href="${env.FRONTEND_URL}/dashboard" class="button">Continue to Vault</a>
    `);
  },

  async sendPaymentFailed(email: string, name: string): Promise<void> {
    await this.send(email, 'Payment Failed - Action Required', `
      <h2>Payment Failed</h2>
      <p>Hi ${name},</p>
      <div class="urgent">
        Your recent payment for Heirloom could not be processed. Please update your payment method to continue protecting your memories.
      </div>
      <a href="${env.FRONTEND_URL}/settings?tab=subscription" class="button">Update Payment Method</a>
    `);
  },

  async sendPaymentSucceeded(email: string, name: string): Promise<void> {
    await this.send(email, 'Payment Successful', `
      <h2>Payment Received</h2>
      <p>Hi ${name},</p>
      <p>Your payment has been successfully processed. Your subscription is now active again.</p>
    `);
  },

  // Letter delivery
  async sendLetterDelivery(
    email: string,
    recipientName: string,
    senderName: string,
    letter: { salutation: string; body: string; signature: string }
  ): Promise<void> {
    await this.send(email, `A letter from ${senderName}`, `
      <h2>You've received a letter</h2>
      <p>Dear ${recipientName},</p>
      <p>${senderName} has left you a message through Heirloom.</p>
      <div style="background: rgba(248,245,239,0.05); padding: 30px; margin: 30px 0; border-left: 3px solid #c9a959; font-style: italic;">
        <p style="color: #c9a959; margin-bottom: 20px;">${letter.salutation}</p>
        <p style="white-space: pre-wrap;">${letter.body}</p>
        <p style="text-align: right; margin-top: 30px; color: #c9a959;">${letter.signature}</p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <div style="width: 60px; height: 60px; background: #8b2942; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
          <span style="color: #f8f5ef; font-size: 24px;">∞</span>
        </div>
        <p style="color: rgba(248,245,239,0.5); font-size: 12px; margin-top: 10px;">Sealed with love</p>
      </div>
    `);
  },

  // Dead Man's Switch emails
  async sendCheckInReminder(email: string, name: string, daysUntil: number): Promise<void> {
    await this.send(email, `Check-in reminder - ${daysUntil} day${daysUntil > 1 ? 's' : ''} left`, `
      <h2>Time to check in</h2>
      <p>Hi ${name},</p>
      <p>Your Heirloom check-in is due in <span class="gold">${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>.</p>
      <p>This ensures your legacy contacts aren't notified unnecessarily.</p>
      <a href="${env.FRONTEND_URL}/settings?tab=deadman" class="button">Check In Now</a>
    `);
  },

  async sendUrgentCheckInReminder(email: string, name: string, gracePeriodDays: number): Promise<void> {
    await this.send(email, 'URGENT: Check-in required', `
      <h2>Urgent: Check-in Required</h2>
      <p>Hi ${name},</p>
      <div class="urgent">
        You've missed your scheduled check-in. You have <strong>${gracePeriodDays} days</strong> to check in before your legacy contacts are notified.
      </div>
      <a href="${env.FRONTEND_URL}/settings?tab=deadman" class="button">Check In Now</a>
      <p>If you're unable to check in, your trusted contacts will be asked to verify your status.</p>
    `);
  },

  async sendFinalCheckInWarning(email: string, name: string): Promise<void> {
    await this.send(email, 'FINAL WARNING: Legacy contacts being notified', `
      <h2>Final Warning</h2>
      <p>Hi ${name},</p>
      <div class="urgent">
        Your legacy contacts are being notified to verify your status. If you're reading this and are well, please check in immediately to cancel this process.
      </div>
      <a href="${env.FRONTEND_URL}/settings?tab=deadman" class="button">Cancel & Check In</a>
    `);
  },

  async sendDeathVerificationRequest(
    email: string,
    contactName: string,
    userName: string,
    token: string
  ): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-passing?token=${token}`;
    await this.send(email, `Verification needed for ${userName}'s Heirloom account`, `
      <h2>Verification Request</h2>
      <p>Dear ${contactName},</p>
      <p>You were designated as a legacy contact by <span class="gold">${userName}</span> on Heirloom.</p>
      <p>We haven't been able to reach ${userName} for their scheduled check-in. As their trusted contact, we need your help to verify their status.</p>
      <div class="urgent">
        <strong>Important:</strong> Only click the button below if you can confirm that ${userName} has passed away. This action cannot be easily undone.
      </div>
      <a href="${url}" class="button">Verify Status</a>
      <p>If ${userName} is still alive, please encourage them to check in to their Heirloom account.</p>
    `);
  },

  async sendPassingVerified(email: string, name: string): Promise<void> {
    await this.send(email, 'Account status verified', `
      <h2>Account Status Update</h2>
      <p>The required number of legacy contacts have verified your account status.</p>
      <p>If you are ${name} and are reading this, you have <strong>48 hours</strong> to cancel this process by logging in and checking in.</p>
      <a href="${env.FRONTEND_URL}/settings?tab=deadman" class="button">Cancel Process</a>
      <p>After 48 hours, your encrypted content will be released to your designated beneficiaries.</p>
    `);
  },

  async sendSwitchCancelled(email: string, contactName: string, userName: string): Promise<void> {
    await this.send(email, `${userName} has checked in`, `
      <h2>All Clear</h2>
      <p>Dear ${contactName},</p>
      <p>Good news! <span class="gold">${userName}</span> has checked in to their Heirloom account. The verification process has been cancelled.</p>
      <p>No action is needed from you at this time.</p>
    `);
  },

  async sendEscrowKeyRelease(
    email: string,
    beneficiaryName: string,
    userName: string,
    encryptedKey: string
  ): Promise<void> {
    await this.send(email, `${userName} has left you something precious`, `
      <h2>A Gift From Beyond</h2>
      <p>Dear ${beneficiaryName},</p>
      <p><span class="gold">${userName}</span> designated you as a beneficiary of their Heirloom vault.</p>
      <p>Their encrypted memories, voice recordings, and letters are now available for you.</p>
      <p>To access their content, you'll need the decryption key below:</p>
      <div style="background: rgba(248,245,239,0.05); padding: 20px; font-family: monospace; word-break: break-all; margin: 20px 0;">
        ${encryptedKey}
      </div>
      <a href="${env.FRONTEND_URL}/legacy-access" class="button">Access Memories</a>
      <p>Please keep this key safe. It's the only way to decrypt ${userName}'s content.</p>
    `);
  },

  // Legacy contact verification
  async sendLegacyContactVerification(
    email: string,
    contactName: string,
    userName: string,
    token: string
  ): Promise<void> {
    const url = `${env.FRONTEND_URL}/verify-legacy-contact?token=${token}`;
    await this.send(email, `${userName} added you as a legacy contact`, `
      <h2>You've Been Trusted</h2>
      <p>Dear ${contactName},</p>
      <p><span class="gold">${userName}</span> has added you as a legacy contact on Heirloom.</p>
      <p>As a legacy contact, you may be asked to verify their status in the future. This helps ensure their memories reach their loved ones when the time comes.</p>
      <a href="${url}" class="button">Accept This Role</a>
      <p>If you don't wish to be a legacy contact, simply ignore this email.</p>
    `);
  },
};
