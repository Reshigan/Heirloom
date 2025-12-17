/**
 * Email Templates for Heirloom
 * Matches the Dashboard Home Screen - sanctuary gradient with stars
 */

const APP_URL = 'https://heirloom.blue';
const BG_IMAGE_URL = 'https://heirloom.blue/email-assets/sanctuary-bg.png';

// Base template wrapper with Heirloom branding - Sanctuary background with stars
export const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: Georgia, 'Times New Roman', serif; 
      margin: 0; 
      padding: 0;
      line-height: 1.7;
      background-color: #050608;
    }
    .outer-wrapper {
      background-color: #050608;
      background-image: url('${BG_IMAGE_URL}');
      background-repeat: no-repeat;
      background-position: center top;
      background-size: cover;
      padding: 40px 20px;
      min-height: 100%;
    }
    .wrapper {
      max-width: 640px;
      margin: 0 auto;
    }
    .header { 
      text-align: center; 
      padding: 30px 20px 24px 20px;
    }
    .logo { 
      font-size: 14px; 
      color: #f5f3ee;
      letter-spacing: 0.15em;
      font-weight: normal;
      opacity: 0.8;
    }
    .logo-symbol {
      display: block;
      font-size: 40px;
      color: #c9a959;
      margin-bottom: 12px;
      line-height: 1;
    }
    .tagline {
      color: rgba(245,243,238,0.5);
      font-size: 13px;
      margin-top: 8px;
      font-style: italic;
    }
    .glass-card {
      background: rgba(18,21,28,0.85);
      border: 1px solid rgba(201,169,89,0.2);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    }
    .content { 
      color: #f5f3ee;
    }
    .content h2 {
      color: #f5f3ee;
      font-size: 26px;
      margin: 0 0 20px 0;
      font-weight: normal;
      letter-spacing: -0.01em;
    }
    .content p {
      margin: 14px 0;
      color: rgba(245,243,238,0.85);
      font-size: 16px;
    }
    .button { 
      display: inline-block; 
      padding: 14px 28px; 
      background: linear-gradient(135deg, #c9a959 0%, #8b7355 100%); 
      color: #0a0c10 !important; 
      text-decoration: none; 
      font-weight: bold; 
      margin: 24px 0 8px 0;
      border-radius: 6px;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: 0 4px 20px rgba(201,169,89,0.25);
    }
    .gold { 
      color: #c9a959;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201,169,89,0.3), transparent);
      margin: 28px 0;
    }
    .urgent { 
      border-left: 3px solid #8b2942; 
      padding: 16px 20px;
      margin: 20px 0;
      background: rgba(139,41,66,0.15);
      border-radius: 0 8px 8px 0;
    }
    .urgent strong {
      color: #c9a959;
    }
    .info-box {
      background: rgba(201,169,89,0.1);
      padding: 18px 22px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 3px solid #c9a959;
    }
    .info-box p {
      margin: 6px 0;
    }
    .letter-box {
      background: rgba(245,243,238,0.05);
      padding: 28px;
      margin: 24px 0;
      border-left: 3px solid #c9a959;
      font-style: italic;
      border-radius: 0 8px 8px 0;
    }
    .letter-box .salutation {
      color: #c9a959;
      margin-bottom: 16px;
      font-style: normal;
    }
    .letter-box .signature {
      text-align: right;
      margin-top: 24px;
      color: #c9a959;
      font-style: normal;
    }
    .seal {
      text-align: center;
      margin: 32px 0 8px 0;
    }
    .seal-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #8b2942, #6b1f32);
      border-radius: 50%;
      margin: 0 auto 10px auto;
      line-height: 52px;
      font-size: 20px;
      color: #f5f3ee;
    }
    .seal-text {
      color: rgba(245,243,238,0.5);
      font-size: 12px;
      letter-spacing: 0.05em;
    }
    ul {
      padding-left: 20px;
      margin: 18px 0;
    }
    li {
      margin: 8px 0;
      color: rgba(245,243,238,0.85);
    }
    .code-box {
      background: rgba(245,243,238,0.08);
      padding: 16px 20px;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      word-break: break-all;
      margin: 18px 0;
      border-radius: 6px;
      font-size: 13px;
      color: #f5f3ee;
      border: 1px solid rgba(201,169,89,0.1);
    }
    .footer { 
      text-align: center; 
      padding: 28px 20px 12px 20px;
      color: rgba(245,243,238,0.4);
      font-size: 12px;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #c9a959;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="outer-wrapper">
    <div class="wrapper">
      <div class="header">
        <span class="logo-symbol">&#8734;</span>
        <div class="logo">HEIRLOOM</div>
        <div class="tagline">Your sanctuary awaits</div>
      </div>
      <div class="glass-card">
        <div class="content">${content}</div>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Heirloom. Preserving what matters.</p>
        <p><a href="${APP_URL}">heirloom.blue</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ============================================
// AUTH EMAILS
// ============================================

export const welcomeEmail = (name: string) => ({
  subject: 'Welcome to Heirloom',
  html: baseTemplate(`
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
    <a href="${APP_URL}/dashboard" class="button">ENTER YOUR VAULT</a>
  `),
});

export const verificationEmail = (name: string, token: string) => ({
  subject: 'Verify Your Email',
  html: baseTemplate(`
    <h2>Verify your email, ${name}</h2>
    <p>Please click the button below to verify your email address.</p>
    <a href="${APP_URL}/verify-email?token=${token}" class="button">VERIFY EMAIL</a>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `),
});

export const passwordResetEmail = (name: string, token: string) => ({
  subject: 'Reset Your Password',
  html: baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <a href="${APP_URL}/reset-password?token=${token}" class="button">RESET PASSWORD</a>
    <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
  `),
});

// ============================================
// TRIAL & SUBSCRIPTION EMAILS
// ============================================

export const trialWarningEmail = (name: string, daysLeft: number) => ({
  subject: `Your trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
  html: baseTemplate(`
    <h2>Your trial is ending soon</h2>
    <p>Hi ${name},</p>
    <p>Your Heirloom free trial expires in <span class="gold">${daysLeft} day${daysLeft > 1 ? 's' : ''}</span>.</p>
    <div class="urgent">
      <strong>Important:</strong> When your trial ends, all your content (photos, recordings, letters) will be permanently deleted.
    </div>
    <p>Upgrade now to keep your memories safe forever.</p>
    <a href="${APP_URL}/settings?tab=subscription" class="button">UPGRADE NOW</a>
  `),
});

export const trialExpiredEmail = (name: string) => ({
  subject: 'Your trial has ended',
  html: baseTemplate(`
    <h2>Your free trial has ended</h2>
    <p>Hi ${name},</p>
    <p>Your Heirloom free trial has expired, and your content has been removed from our servers.</p>
    <p>You can still subscribe anytime to start preserving your memories again.</p>
    <a href="${APP_URL}/settings?tab=subscription" class="button">SUBSCRIBE NOW</a>
  `),
});

export const subscriptionConfirmationEmail = (name: string, tier: string) => ({
  subject: 'Subscription Confirmed',
  html: baseTemplate(`
    <h2>Welcome to Heirloom ${tier}</h2>
    <p>Hi ${name},</p>
    <p>Your subscription to the <span class="gold">${tier}</span> plan is now active.</p>
    <p>Your memories are now protected and will be preserved for generations.</p>
    <a href="${APP_URL}/dashboard" class="button">CONTINUE TO VAULT</a>
  `),
});

export const paymentFailedEmail = (name: string) => ({
  subject: 'Payment Failed - Action Required',
  html: baseTemplate(`
    <h2>Payment Failed</h2>
    <p>Hi ${name},</p>
    <div class="urgent">
      Your recent payment for Heirloom could not be processed. Please update your payment method to continue protecting your memories.
    </div>
    <a href="${APP_URL}/settings?tab=subscription" class="button">UPDATE PAYMENT METHOD</a>
  `),
});

// ============================================
// CHECK-IN & DEAD MAN'S SWITCH EMAILS
// ============================================

export const checkInReminderEmail = (name: string, daysUntil: number) => ({
  subject: `Check-in reminder - ${daysUntil} day${daysUntil > 1 ? 's' : ''} left`,
  html: baseTemplate(`
    <h2>Time to check in</h2>
    <p>Hi ${name},</p>
    <p>Your Heirloom check-in is due in <span class="gold">${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>.</p>
    <p>This ensures your legacy contacts aren't notified unnecessarily.</p>
    <a href="${APP_URL}/settings?tab=deadman" class="button">CHECK IN NOW</a>
  `),
});

export const urgentCheckInEmail = (name: string, missedCount: number) => ({
  subject: `URGENT: Check-in Required - ${missedCount} missed`,
  html: baseTemplate(`
    <h2>Urgent: Check-in Required</h2>
    <p>Hi ${name},</p>
    <div class="urgent">
      You've missed <strong>${missedCount} check-in(s)</strong> on Heirloom. Please check in soon to confirm you're well.
    </div>
    <a href="${APP_URL}/dashboard" class="button">CHECK IN NOW</a>
    <p>If you're unable to check in, your trusted contacts will be asked to verify your status.</p>
  `),
});

export const finalCheckInWarningEmail = (name: string) => ({
  subject: 'FINAL WARNING: Legacy contacts being notified',
  html: baseTemplate(`
    <h2>Final Warning</h2>
    <p>Hi ${name},</p>
    <div class="urgent">
      Your legacy contacts are being notified to verify your status. If you're reading this and are well, please check in immediately to cancel this process.
    </div>
    <a href="${APP_URL}/settings?tab=deadman" class="button">CANCEL & CHECK IN</a>
  `),
});

// ============================================
// LEGACY CONTACT EMAILS
// ============================================

export const legacyContactVerificationEmail = (contactName: string, userName: string, token: string) => ({
  subject: `${userName} added you as a legacy contact`,
  html: baseTemplate(`
    <h2>You've Been Trusted</h2>
    <p>Dear ${contactName},</p>
    <p><span class="gold">${userName}</span> has added you as a legacy contact on Heirloom.</p>
    <p>As a legacy contact, you may be asked to verify their status in the future. This helps ensure their memories reach their loved ones when the time comes.</p>
    <a href="${APP_URL}/verify-legacy-contact?token=${token}" class="button">ACCEPT THIS ROLE</a>
    <p>If you don't wish to be a legacy contact, simply ignore this email.</p>
  `),
});

export const deathVerificationRequestEmail = (contactName: string, userName: string, token: string) => ({
  subject: `Verification needed for ${userName}'s Heirloom account`,
  html: baseTemplate(`
    <h2>Verification Request</h2>
    <p>Dear ${contactName},</p>
    <p>You were designated as a legacy contact by <span class="gold">${userName}</span> on Heirloom.</p>
    <p>We haven't been able to reach ${userName} for their scheduled check-in. As their trusted contact, we need your help to verify their status.</p>
    <div class="urgent">
      <strong>Important:</strong> Only click the button below if you can confirm that ${userName} has passed away. This action cannot be easily undone.
    </div>
    <a href="${APP_URL}/verify-passing?token=${token}" class="button">VERIFY STATUS</a>
    <p>If ${userName} is still alive, please encourage them to check in to their Heirloom account.</p>
  `),
});

export const switchCancelledEmail = (contactName: string, userName: string) => ({
  subject: `${userName} has checked in`,
  html: baseTemplate(`
    <h2>All Clear</h2>
    <p>Dear ${contactName},</p>
    <p>Good news! <span class="gold">${userName}</span> has checked in to their Heirloom account. The verification process has been cancelled.</p>
    <p>No action is needed from you at this time.</p>
  `),
});

// ============================================
// LETTER DELIVERY EMAILS
// ============================================

export const letterDeliveryEmail = (
  recipientName: string,
  senderName: string,
  letter: { salutation: string; body: string; signature: string }
) => ({
  subject: `A letter from ${senderName}`,
  html: baseTemplate(`
    <h2>You've received a letter</h2>
    <p>Dear ${recipientName},</p>
    <p>${senderName} has left you a message through Heirloom.</p>
    <div class="letter-box">
      <p class="salutation">${letter.salutation}</p>
      <p style="white-space: pre-wrap;">${letter.body}</p>
      <p class="signature">${letter.signature}</p>
    </div>
    <div class="seal">
      <div class="seal-icon">&#8734;</div>
      <p class="seal-text">Sealed with love</p>
    </div>
  `),
});

export const escrowKeyReleaseEmail = (
  beneficiaryName: string,
  userName: string,
  encryptedKey: string
) => ({
  subject: `${userName} has left you something precious`,
  html: baseTemplate(`
    <h2>A Gift From Beyond</h2>
    <p>Dear ${beneficiaryName},</p>
    <p><span class="gold">${userName}</span> designated you as a beneficiary of their Heirloom vault.</p>
    <p>Their encrypted memories, voice recordings, and letters are now available for you.</p>
    <p>To access their content, you'll need the decryption key below:</p>
    <div class="code-box">${encryptedKey}</div>
    <a href="${APP_URL}/legacy-access" class="button">ACCESS MEMORIES</a>
    <p>Please keep this key safe. It's the only way to decrypt ${userName}'s content.</p>
  `),
});

// ============================================
// TEST EMAIL
// ============================================

export const testEmail = () => ({
  subject: 'Test Email from Heirloom',
  html: baseTemplate(`
    <h2>Email System Test</h2>
    <p>This is a test email to verify that the Heirloom email system is working correctly.</p>
    <div class="info-box">
      <p><strong>Status:</strong> <span class="gold">Connected</span></p>
      <p>Your email configuration is working properly. You can now receive notifications from Heirloom.</p>
    </div>
    <a href="${APP_URL}/dashboard" class="button">VISIT HEIRLOOM</a>
    <p>If you received this email, your notification settings are configured correctly.</p>
  `),
});
