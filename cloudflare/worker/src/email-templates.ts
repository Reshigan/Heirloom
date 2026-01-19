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

// ============================================
// UPCOMING CHECK-IN REMINDER
// ============================================

export const upcomingCheckInReminderEmail = (name: string, hoursUntil: number) => ({
  subject: `Check-in due in ${hoursUntil} hours`,
  html: baseTemplate(`
    <h2>Check-in Reminder</h2>
    <p>Hi ${name},</p>
    <p>Your Heirloom check-in is due in <span class="gold">${hoursUntil} hours</span>.</p>
    <p>Taking a moment to check in ensures your legacy contacts won't be notified unnecessarily.</p>
    <a href="${APP_URL}/settings?tab=deadman" class="button">CHECK IN NOW</a>
    <p>Thank you for keeping your legacy secure.</p>
  `),
});

// ============================================
// ADMIN NOTIFICATION EMAILS
// ============================================

export const adminNewUserNotificationEmail = (
  newUserEmail: string,
  newUserName: string,
  signupDate: string
) => ({
  subject: `New User Signup: ${newUserName}`,
  html: baseTemplate(`
    <h2>New User Registration</h2>
    <p>A new user has registered on Heirloom.</p>
    <div class="info-box">
      <p><strong>Name:</strong> <span class="gold">${newUserName}</span></p>
      <p><strong>Email:</strong> ${newUserEmail}</p>
      <p><strong>Signup Date:</strong> ${signupDate}</p>
    </div>
    <a href="${APP_URL}/admin" class="button">VIEW ADMIN DASHBOARD</a>
  `),
});

export const adminLetterSentNotificationEmail = (
  senderName: string,
  senderEmail: string,
  recipientEmail: string,
  letterSubject: string
) => ({
  subject: `Letter Sent: ${senderName} to ${recipientEmail}`,
  html: baseTemplate(`
    <h2>Letter Delivery Notification</h2>
    <p>A letter has been sent through Heirloom.</p>
    <div class="info-box">
      <p><strong>From:</strong> <span class="gold">${senderName}</span> (${senderEmail})</p>
      <p><strong>To:</strong> ${recipientEmail}</p>
      <p><strong>Subject:</strong> ${letterSubject}</p>
    </div>
    <a href="${APP_URL}/admin" class="button">VIEW ADMIN DASHBOARD</a>
  `),
});

// ============================================
// GIFT VOUCHER EMAILS
// ============================================

export const giftVoucherPurchaseEmail = (
  purchaserName: string,
  voucherCode: string,
  tier: string,
  durationMonths: number
) => ({
  subject: 'Your Heirloom Gift Voucher',
  html: baseTemplate(`
    <h2>Thank You for Your Gift</h2>
    <p>Dear ${purchaserName},</p>
    <p>Your Heirloom gift voucher has been created successfully.</p>
    <div class="info-box">
      <p><strong>Voucher Code:</strong></p>
      <p style="font-size: 24px; font-family: monospace; color: #c9a959; letter-spacing: 2px;">${voucherCode}</p>
      <p><strong>Plan:</strong> ${tier}</p>
      <p><strong>Duration:</strong> ${durationMonths} month${durationMonths > 1 ? 's' : ''}</p>
    </div>
    <p>You can send this code to your recipient, or use the link below to send it directly:</p>
    <a href="${APP_URL}/gift/send?code=${voucherCode}" class="button">SEND TO RECIPIENT</a>
    <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">This voucher expires in 1 year if not redeemed.</p>
  `),
});

export const giftVoucherReceivedEmail = (
  recipientName: string,
  senderName: string,
  voucherCode: string,
  tier: string,
  durationMonths: number,
  personalMessage: string | null
) => ({
  subject: `${senderName} sent you a gift!`,
  html: baseTemplate(`
    <h2>You've Received a Gift</h2>
    <p>Dear ${recipientName},</p>
    <p><span class="gold">${senderName}</span> has gifted you a Heirloom subscription!</p>
    ${personalMessage ? `
    <div class="letter-box">
      <p style="white-space: pre-wrap;">${personalMessage}</p>
      <p class="signature">— ${senderName}</p>
    </div>
    ` : ''}
    <div class="info-box">
      <p><strong>Your Gift:</strong> ${tier} Plan</p>
      <p><strong>Duration:</strong> ${durationMonths} month${durationMonths > 1 ? 's' : ''}</p>
      <p><strong>Voucher Code:</strong></p>
      <p style="font-size: 20px; font-family: monospace; color: #c9a959; letter-spacing: 2px;">${voucherCode}</p>
    </div>
    <p>Heirloom is a sanctuary for preserving your most precious memories—photos, voice recordings, and letters—for generations to come.</p>
    <a href="${APP_URL}/gift/redeem?code=${voucherCode}" class="button">REDEEM YOUR GIFT</a>
    <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">This voucher expires in 1 year if not redeemed.</p>
  `),
});

export const giftVoucherRedeemedEmail = (
  userName: string,
  tier: string,
  durationMonths: number
) => ({
  subject: 'Gift Voucher Redeemed Successfully',
  html: baseTemplate(`
    <h2>Welcome to Heirloom</h2>
    <p>Dear ${userName},</p>
    <p>Your gift voucher has been redeemed successfully!</p>
    <div class="info-box">
      <p><strong>Plan:</strong> <span class="gold">${tier}</span></p>
      <p><strong>Duration:</strong> ${durationMonths} month${durationMonths > 1 ? 's' : ''}</p>
    </div>
    <p>Your sanctuary is ready. Start preserving your most precious memories today.</p>
    <a href="${APP_URL}/dashboard" class="button">ENTER YOUR VAULT</a>
  `),
});

// ============================================
// POST REMINDER EMAILS - Engagement Nudges
// ============================================

// Prompts for different content types
const memoryPrompts = [
  "What's a photo that always makes you smile?",
  "Share a moment from your childhood that shaped who you are today.",
  "What's a family tradition you want to preserve for future generations?",
  "Capture a recent moment that brought you joy.",
  "What place holds special memories for you?",
];

const voicePrompts = [
  "Record a message sharing your favorite family recipe and the story behind it.",
  "What advice would you give to your younger self?",
  "Share a story about someone who influenced your life.",
  "Record a message for a loved one on their next birthday.",
  "What's a lesson life has taught you that you want to pass on?",
];

const letterPrompts = [
  "Write a letter to your future self, to be opened in 5 years.",
  "Pen a note of gratitude to someone who made a difference in your life.",
  "Write a letter to a loved one for a future milestone.",
  "Share your hopes and dreams for the next generation.",
  "Write about a moment you never want to forget.",
];

const getRandomPrompt = (prompts: string[]) => prompts[Math.floor(Math.random() * prompts.length)];

export const postReminderMemoryEmail = (
  userName: string,
  memoriesCount: number,
  daysSinceLastPost: number | null
) => {
  const prompt = getRandomPrompt(memoryPrompts);
  const hasPosted = memoriesCount > 0;
  
  return {
    subject: hasPosted 
      ? `${userName}, your memories are waiting` 
      : `${userName}, start your legacy today`,
    html: baseTemplate(`
      <h2>${hasPosted ? 'Continue Your Story' : 'Begin Your Legacy'}</h2>
      <p>Dear ${userName},</p>
      ${hasPosted 
        ? `<p>You've preserved <span class="gold">${memoriesCount} ${memoriesCount === 1 ? 'memory' : 'memories'}</span> so far—each one a treasure for future generations.${daysSinceLastPost ? ` It's been ${daysSinceLastPost} days since your last upload.` : ''}</p>`
        : `<p>Your vault is ready and waiting. Every photo, every moment you capture becomes a gift to those who come after you.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #c9a959;">"${prompt}"</p>
      </div>
      <p>Take a moment today to preserve something meaningful. It only takes a few seconds to upload a photo or share a story.</p>
      <a href="${APP_URL}/memories" class="button">ADD A MEMORY</a>
      <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">Your memories are encrypted and protected. Only you and those you choose can access them.</p>
    `),
  };
};

export const postReminderVoiceEmail = (
  userName: string,
  recordingsCount: number,
  totalMinutes: number
) => {
  const prompt = getRandomPrompt(voicePrompts);
  const hasRecorded = recordingsCount > 0;
  
  return {
    subject: hasRecorded 
      ? `${userName}, your voice matters` 
      : `${userName}, let them hear your voice`,
    html: baseTemplate(`
      <h2>${hasRecorded ? 'Your Voice Lives On' : 'Capture Your Voice'}</h2>
      <p>Dear ${userName},</p>
      ${hasRecorded 
        ? `<p>You've recorded <span class="gold">${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}</span> of voice messages—your laugh, your wisdom, your love, preserved forever.</p>`
        : `<p>There's something irreplaceable about hearing a loved one's voice. Your voice carries warmth, emotion, and personality that words on a page simply can't capture.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #c9a959;">"${prompt}"</p>
      </div>
      <p>Recording takes just a few minutes, but the impact lasts generations. Share a story, offer advice, or simply say "I love you."</p>
      <a href="${APP_URL}/record" class="button">RECORD A MESSAGE</a>
      <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">Your recordings are securely stored and can be shared with specific family members.</p>
    `),
  };
};

export const postReminderLetterEmail = (
  userName: string,
  lettersCount: number,
  hasSealedLetters: boolean
) => {
  const prompt = getRandomPrompt(letterPrompts);
  const hasWritten = lettersCount > 0;
  
  return {
    subject: hasWritten 
      ? `${userName}, words that transcend time` 
      : `${userName}, write a letter to the future`,
    html: baseTemplate(`
      <h2>${hasWritten ? 'Continue Writing' : 'Letters That Last Forever'}</h2>
      <p>Dear ${userName},</p>
      ${hasWritten 
        ? `<p>You've written <span class="gold">${lettersCount} ${lettersCount === 1 ? 'letter' : 'letters'}</span>${hasSealedLetters ? ', some sealed for future delivery' : ''}. Each one is a gift waiting to be opened.</p>`
        : `<p>Imagine the joy of receiving a letter from someone you love—on a birthday, a wedding day, or a moment when they need it most. You can give that gift.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #c9a959;">"${prompt}"</p>
      </div>
      <p>Write from the heart. Your words will be treasured long after they're read.</p>
      <a href="${APP_URL}/compose" class="button">WRITE A LETTER</a>
      <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">Letters can be scheduled for future delivery or sealed until a specific date.</p>
    `),
  };
};

export const postReminderWeeklyDigestEmail = (
  userName: string,
  stats: {
    memoriesCount: number;
    voiceMinutes: number;
    lettersCount: number;
    familyCount: number;
  },
  suggestedAction: 'memory' | 'voice' | 'letter' | 'family'
) => {
  const actionMap = {
    memory: { text: 'Upload a Memory', url: `${APP_URL}/memories`, prompt: getRandomPrompt(memoryPrompts) },
    voice: { text: 'Record a Message', url: `${APP_URL}/record`, prompt: getRandomPrompt(voicePrompts) },
    letter: { text: 'Write a Letter', url: `${APP_URL}/compose`, prompt: getRandomPrompt(letterPrompts) },
    family: { text: 'Add Family Member', url: `${APP_URL}/family`, prompt: 'Connect with someone you want to share your legacy with.' },
  };
  
  const action = actionMap[suggestedAction];
  
  return {
    subject: `${userName}, your weekly Heirloom update`,
    html: baseTemplate(`
      <h2>Your Legacy This Week</h2>
      <p>Dear ${userName},</p>
      <p>Here's a snapshot of your Heirloom sanctuary:</p>
      <div class="info-box">
        <p><strong>Memories:</strong> <span class="gold">${stats.memoriesCount}</span> preserved</p>
        <p><strong>Voice:</strong> <span class="gold">${stats.voiceMinutes}</span> minutes recorded</p>
        <p><strong>Letters:</strong> <span class="gold">${stats.lettersCount}</span> written</p>
        <p><strong>Family:</strong> <span class="gold">${stats.familyCount}</span> connected</p>
      </div>
      <p>This week's inspiration:</p>
      <div class="letter-box">
        <p style="font-style: italic; color: #c9a959;">"${action.prompt}"</p>
      </div>
      <a href="${action.url}" class="button">${action.text.toUpperCase()}</a>
      <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">Every moment you preserve is a gift to future generations.</p>
    `),
  };
};

// ============================================
// ADMIN DAILY SUMMARY EMAIL
// ============================================

export const adminDailySummaryEmail = (
  stats: {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    activeSubscriptions: number;
    trialingUsers: number;
    totalMemories: number;
    totalLetters: number;
    totalVoiceMinutes: number;
    openTickets: number;
    newTicketsToday: number;
  },
  date: string
) => ({
  subject: `Heirloom Daily Summary - ${date}`,
  html: baseTemplate(`
    <h2>Daily Admin Summary</h2>
    <p>Here's your Heirloom platform overview for <span class="gold">${date}</span>:</p>
    
    <div class="info-box">
      <p style="font-size: 18px; margin-bottom: 12px;"><strong>Users</strong></p>
      <p><strong>Total Users:</strong> <span class="gold">${stats.totalUsers}</span></p>
      <p><strong>New Today:</strong> <span class="gold">${stats.newUsersToday}</span></p>
      <p><strong>New This Week:</strong> <span class="gold">${stats.newUsersWeek}</span></p>
    </div>
    
    <div class="info-box">
      <p style="font-size: 18px; margin-bottom: 12px;"><strong>Subscriptions</strong></p>
      <p><strong>Active Subscriptions:</strong> <span class="gold">${stats.activeSubscriptions}</span></p>
      <p><strong>Trialing Users:</strong> <span class="gold">${stats.trialingUsers}</span></p>
    </div>
    
    <div class="info-box">
      <p style="font-size: 18px; margin-bottom: 12px;"><strong>Content</strong></p>
      <p><strong>Total Memories:</strong> <span class="gold">${stats.totalMemories}</span></p>
      <p><strong>Total Letters:</strong> <span class="gold">${stats.totalLetters}</span></p>
      <p><strong>Voice Minutes:</strong> <span class="gold">${stats.totalVoiceMinutes}</span></p>
    </div>
    
    <div class="info-box">
      <p style="font-size: 18px; margin-bottom: 12px;"><strong>Support</strong></p>
      <p><strong>Open Tickets:</strong> <span class="gold">${stats.openTickets}</span></p>
      <p><strong>New Today:</strong> <span class="gold">${stats.newTicketsToday}</span></p>
    </div>
    
    <a href="${APP_URL}/admin" class="button">VIEW ADMIN DASHBOARD</a>
  `),
});

// ============================================
// SUPPORT TICKET USER EMAILS
// ============================================

export const supportTicketReplyEmail = (
  userName: string,
  ticketNumber: string,
  ticketSubject: string,
  replyContent: string,
  adminName: string
) => ({
  subject: `[${ticketNumber}] Reply to your support request`,
  html: baseTemplate(`
    <h2>We've responded to your request</h2>
    <p>Hi ${userName},</p>
    <p>Our support team has replied to your ticket <span class="gold">${ticketNumber}</span>.</p>
    
    <div class="info-box">
      <p><strong>Subject:</strong> ${ticketSubject}</p>
    </div>
    
    <div class="letter-box">
      <p class="salutation">Response from ${adminName}:</p>
      <p style="white-space: pre-wrap;">${replyContent}</p>
    </div>
    
    <p>If you have any follow-up questions, simply reply to this email or submit a new support request.</p>
    
    <a href="${APP_URL}/dashboard" class="button">GO TO DASHBOARD</a>
  `),
});

export const supportTicketResolvedEmail = (
  userName: string,
  ticketNumber: string,
  ticketSubject: string,
  resolutionNote?: string
) => ({
  subject: `[${ticketNumber}] Your support request has been resolved`,
  html: baseTemplate(`
    <h2>Your request has been resolved</h2>
    <p>Hi ${userName},</p>
    <p>Your support ticket <span class="gold">${ticketNumber}</span> has been marked as resolved.</p>
    
    <div class="info-box">
      <p><strong>Subject:</strong> ${ticketSubject}</p>
      <p><strong>Status:</strong> <span class="gold">Resolved</span></p>
    </div>
    
    ${resolutionNote ? `
    <div class="letter-box">
      <p class="salutation">Resolution note:</p>
      <p style="white-space: pre-wrap;">${resolutionNote}</p>
    </div>
    ` : ''}
    
    <p>If you feel this issue hasn't been fully addressed or you have additional questions, please don't hesitate to open a new support request.</p>
    
    <p>Thank you for using Heirloom.</p>
    
    <a href="${APP_URL}/dashboard" class="button">GO TO DASHBOARD</a>
  `),
});

// ============================================
// NEW FEATURES ANNOUNCEMENT EMAIL
// ============================================

// ============================================
// INFLUENCER & PARTNER PROGRAM EMAILS
// ============================================

export const influencerApplicationReceivedEmail = (name: string) => ({
  subject: 'Application Received - Heirloom Influencer Program',
  html: baseTemplate(`
    <h2>Application Received</h2>
    <p>Hi ${name},</p>
    <p>Thank you for applying to the <span class="gold">Heirloom Influencer Program</span>!</p>
    <p>We've received your application and our team will review it within <strong>48 hours</strong>.</p>
    <div class="info-box">
      <p><strong>What happens next?</strong></p>
      <p>Once approved, you'll receive:</p>
      <ul>
        <li>Your personalized discount code</li>
        <li>Access to your influencer dashboard</li>
        <li>Marketing materials and guidelines</li>
      </ul>
    </div>
    <p>We'll be in touch soon!</p>
  `),
});

export const influencerApprovedEmail = (name: string, discountCode: string, tier: string, discountPercent: number) => ({
  subject: 'Welcome to the Heirloom Influencer Program!',
  html: baseTemplate(`
    <h2>You're Approved!</h2>
    <p>Hi ${name},</p>
    <p>Congratulations! Your application to the <span class="gold">Heirloom Influencer Program</span> has been approved.</p>
    <div class="info-box">
      <p><strong>Your Influencer Details:</strong></p>
      <p>Tier: <span class="gold">${tier}</span></p>
      <p>Your Discount Code: <span class="gold">${discountCode}</span></p>
      <p>Discount for your audience: <span class="gold">${discountPercent}% off</span></p>
    </div>
    <p>Share your code with your audience and earn <strong>20% commission</strong> on every subscription!</p>
    <a href="${APP_URL}/influencer" class="button">VIEW YOUR DASHBOARD</a>
    <p style="margin-top: 20px;">Need marketing materials or have questions? Reply to this email and we'll help you get started.</p>
  `),
});

export const influencerRejectedEmail = (name: string, reason?: string) => ({
  subject: 'Heirloom Influencer Program - Application Update',
  html: baseTemplate(`
    <h2>Application Update</h2>
    <p>Hi ${name},</p>
    <p>Thank you for your interest in the Heirloom Influencer Program.</p>
    <p>After careful review, we're unable to approve your application at this time.${reason ? ` ${reason}` : ''}</p>
    <p>This doesn't mean the door is closed! You're welcome to reapply in the future as your platform grows.</p>
    <p>In the meantime, you can still earn rewards through our <a href="${APP_URL}/referral" style="color: #c9a959;">referral program</a>.</p>
  `),
});

export const partnerApplicationReceivedEmail = (contactName: string, businessName: string) => ({
  subject: 'Application Received - Heirloom Partner Program',
  html: baseTemplate(`
    <h2>Application Received</h2>
    <p>Hi ${contactName},</p>
    <p>Thank you for applying to become a <span class="gold">Heirloom Partner</span> on behalf of ${businessName}!</p>
    <p>We've received your application and our team will review it within <strong>48-72 hours</strong>.</p>
    <div class="info-box">
      <p><strong>What happens next?</strong></p>
      <p>Once approved, you'll receive:</p>
      <ul>
        <li>Your unique partner code and QR code</li>
        <li>Access to wholesale voucher ordering (30% off retail)</li>
        <li>Partner dashboard with referral tracking</li>
        <li>Marketing materials for your location</li>
      </ul>
    </div>
    <p>We'll be in touch soon!</p>
  `),
});

export const partnerApprovedEmail = (contactName: string, businessName: string, partnerCode: string) => ({
  subject: 'Welcome to the Heirloom Partner Program!',
  html: baseTemplate(`
    <h2>You're Approved!</h2>
    <p>Hi ${contactName},</p>
    <p>Congratulations! <span class="gold">${businessName}</span> has been approved as a Heirloom Partner.</p>
    <div class="info-box">
      <p><strong>Your Partner Details:</strong></p>
      <p>Partner Code: <span class="gold">${partnerCode}</span></p>
      <p>Wholesale Discount: <span class="gold">30% off retail</span></p>
      <p>Referral Commission: <span class="gold">15% on conversions</span></p>
    </div>
    <p>You can now:</p>
    <ul>
      <li>Order wholesale vouchers to resell or gift to clients</li>
      <li>Track referrals from your unique QR code</li>
      <li>Earn commission on referral conversions</li>
    </ul>
    <a href="${APP_URL}/partner" class="button">ACCESS PARTNER PORTAL</a>
    <p style="margin-top: 20px;">Need marketing materials or have questions? Reply to this email and we'll help you get started.</p>
  `),
});

export const partnerRejectedEmail = (contactName: string, businessName: string, reason?: string) => ({
  subject: 'Heirloom Partner Program - Application Update',
  html: baseTemplate(`
    <h2>Application Update</h2>
    <p>Hi ${contactName},</p>
    <p>Thank you for ${businessName}'s interest in the Heirloom Partner Program.</p>
    <p>After careful review, we're unable to approve your application at this time.${reason ? ` ${reason}` : ''}</p>
    <p>If you believe this was in error or have additional information to share, please reply to this email.</p>
  `),
});

export const wholesaleOrderConfirmationEmail = (contactName: string, orderId: string, tier: string, quantity: number, totalAmount: number) => ({
  subject: 'Wholesale Order Confirmed - Heirloom',
  html: baseTemplate(`
    <h2>Order Confirmed</h2>
    <p>Hi ${contactName},</p>
    <p>Your wholesale voucher order has been confirmed!</p>
    <div class="info-box">
      <p><strong>Order Details:</strong></p>
      <p>Order ID: ${orderId}</p>
      <p>Vouchers: ${quantity}x ${tier}</p>
      <p>Total: $${(totalAmount / 100).toFixed(2)}</p>
    </div>
    <p>Your vouchers are now available in your partner dashboard. You can assign them to recipients or distribute the codes directly.</p>
    <a href="${APP_URL}/partner?tab=vouchers" class="button">VIEW YOUR VOUCHERS</a>
  `),
});

export const adminInfluencerApplicationEmail = (influencerName: string, platform: string, handle: string, followerCount: number) => ({
  subject: `New Influencer Application: ${influencerName}`,
  html: baseTemplate(`
    <h2>New Influencer Application</h2>
    <p>A new influencer has applied to the program:</p>
    <div class="info-box">
      <p><strong>Name:</strong> ${influencerName}</p>
      <p><strong>Platform:</strong> ${platform}</p>
      <p><strong>Handle:</strong> ${handle}</p>
      <p><strong>Followers:</strong> ${followerCount.toLocaleString()}</p>
    </div>
    <a href="${APP_URL}/admin/influencers" class="button">REVIEW APPLICATION</a>
  `),
});

export const adminPartnerApplicationEmail = (businessName: string, businessType: string, contactName: string, contactEmail: string) => ({
  subject: `New Partner Application: ${businessName}`,
  html: baseTemplate(`
    <h2>New Partner Application</h2>
    <p>A new business has applied to become a partner:</p>
    <div class="info-box">
      <p><strong>Business:</strong> ${businessName}</p>
      <p><strong>Type:</strong> ${businessType}</p>
      <p><strong>Contact:</strong> ${contactName}</p>
      <p><strong>Email:</strong> ${contactEmail}</p>
    </div>
    <a href="${APP_URL}/admin/partners" class="button">REVIEW APPLICATION</a>
  `),
});

export const newFeaturesAnnouncementEmail = (userName: string) => ({
  subject: 'New Features: Legacy Playbook, Story Artifacts & More',
  html: baseTemplate(`
    <h2>Exciting New Features Are Here!</h2>
    <p>Hi ${userName},</p>
    <p>We've been working hard to make Heirloom even more powerful for preserving your legacy. Here's what's new:</p>
    
    <div class="divider"></div>
    
    <h3 style="color: #c9a959; margin-top: 24px;">Legacy Playbook</h3>
    <p>A guided checklist organized into five categories—People, Stories, Gratitude, Practical, and Wisdom—to help you build a complete legacy. Track your progress and share it with family.</p>
    
    <h3 style="color: #c9a959; margin-top: 24px;">Recipient Experience</h3>
    <p>Control how and when your loved ones receive your legacy with staged releases. Plus, create a Family Memory Room where recipients can contribute their own memories.</p>
    
    <h3 style="color: #c9a959; margin-top: 24px;">Story Artifacts</h3>
    <p>Transform your memories into beautiful 60-120 second micro-documentaries. Combine photos, voice recordings, and music into shareable video stories.</p>
    
    <h3 style="color: #c9a959; margin-top: 24px;">Life Event Triggers</h3>
    <p>Schedule content delivery for life's milestones—graduations, weddings, first child, and more. Your words arrive exactly when they're needed most.</p>
    
    <div class="divider"></div>
    
    <p>Log in to explore these new features and take the platform tour to learn more!</p>
    
    <a href="${APP_URL}/dashboard" class="button">EXPLORE NEW FEATURES</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">
      <a href="${APP_URL}/settings?tab=notifications" style="color: #c9a959;">Manage your email preferences</a>
    </p>
  `),
});
