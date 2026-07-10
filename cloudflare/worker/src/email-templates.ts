/**
 * Email Templates for Heirloom — the Deep design system.
 * Bone #f2e6d0 / ink #070d14 / warm #a86220 (deep copper, AA on cream). Source Serif 4. 0px radius. 1px hairlines.
 */

// Escape user-controlled strings before interpolation into HTML to prevent HTML injection / phishing.
const esc = (s: string | null | undefined = ''): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Only allow https:// URLs in email CTAs — block javascript: and data: schemes.
const safeUrl = (url: string, fallback = 'https://heirloom.blue'): string =>
  /^https:\/\//i.test(url) ? url : fallback;

const APP_URL = 'https://heirloom.blue';
const TAPESTRY_ICON_URL = 'https://heirloom.blue/icons/icon-192.png';

export const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,200;8..60,300;8..60,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
      margin: 0; padding: 0;
      line-height: 1.72;
      background-color: #f2e6d0;
      color: #070d14;
    }
    .outer {
      background-color: #f2e6d0;
      padding: 52px 20px 40px;
    }
    .wrapper { max-width: 600px; margin: 0 auto; }

    /* ── Header ── */
    .header {
      padding-bottom: 20px;
      border-bottom: 1px solid #070d14;
      display: table; width: 100%;
    }
    .header-left  { display: table-cell; vertical-align: bottom; }
    .header-right { display: table-cell; vertical-align: bottom; text-align: right; }
    .logo-icon {
      width: 36px; height: 36px;
      border: none; display: inline-block; vertical-align: bottom;
    }
    .logo-mark {
      font-size: 32px; font-weight: 300; color: #a86220;
      line-height: 1; display: inline-block; vertical-align: bottom;
      margin-right: 10px;
    }
    .wordmark {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px; letter-spacing: 0.28em;
      text-transform: uppercase; color: rgba(7,13,20,0.7);
      display: inline-block; vertical-align: bottom; padding-bottom: 3px;
    }
    .url-line {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px; letter-spacing: 0.1em;
      color: rgba(7,13,20,0.38);
    }

    /* ── Card ── */
    .card {
      border: 1px solid rgba(7,13,20,0.18);
      padding: 36px 40px;
      margin: 0;
      background: #f2e6d0;
    }
    .content { color: #070d14; }
    .content h2 {
      font-size: 28px; font-weight: 300;
      margin: 0 0 22px 0; line-height: 1.18;
      letter-spacing: -0.018em; color: #070d14;
    }
    .content p {
      margin: 14px 0; font-size: 16px;
      color: rgba(7,13,20,0.82);
    }

    /* ── Button ── */
    .button {
      display: inline-block;
      padding: 13px 28px;
      background: #070d14;
      color: #f2e6d0 !important;
      text-decoration: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin: 24px 0 8px 0;
      border: 1px solid #070d14;
    }
    .button-warm {
      display: inline-block;
      padding: 13px 28px;
      background: #a86220;
      color: #f2e6d0 !important;
      text-decoration: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin: 24px 0 8px 0;
      border: 1px solid #a86220;
    }

    /* ── Utility ── */
    .warm   { color: #a86220; }
    .gold   { color: #a86220; }
    .muted  { color: rgba(7,13,20,0.46); }
    .divider {
      height: 1px; background: rgba(7,13,20,0.14);
      margin: 28px 0; border: none;
    }
    .urgent {
      border-left: 2px solid #9f3a2a;
      padding: 14px 20px; margin: 20px 0;
    }
    .urgent strong { color: #9f3a2a; }
    .info-box {
      border-left: 2px solid #a86220;
      padding: 14px 20px; margin: 20px 0;
      background: rgba(168,98,32,0.06);
    }
    .info-box p { margin: 5px 0; font-size: 15px; }
    .letter-box {
      border-left: 2px solid #a86220;
      padding: 24px 28px; margin: 24px 0;
      font-style: italic;
    }
    .letter-box .salutation {
      color: #070d14; margin-bottom: 16px; font-style: normal;
      font-weight: 400;
    }
    .letter-box .signature {
      text-align: right; margin-top: 24px; color: #a86220; font-style: normal;
    }
    .seal {
      text-align: center; margin: 32px 0 8px 0;
    }
    .seal-icon {
      font-size: 36px; color: #a86220; display: block;
      margin-bottom: 8px; line-height: 1;
    }
    .seal-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px; letter-spacing: 0.22em;
      text-transform: uppercase; color: rgba(7,13,20,0.4);
    }
    ul { padding-left: 20px; margin: 18px 0; }
    li  { margin: 8px 0; color: rgba(7,13,20,0.82); }
    .code-box {
      background: rgba(7,13,20,0.05);
      border: 1px solid rgba(7,13,20,0.14);
      padding: 14px 18px;
      font-family: 'Courier New', Courier, monospace;
      word-break: break-all; margin: 18px 0;
      font-size: 13px; color: #070d14;
    }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid rgba(7,13,20,0.14);
      padding: 20px 0 0 0;
      text-align: left;
    }
    .footer-row {
      display: table; width: 100%;
    }
    .footer-left  { display: table-cell; }
    .footer-right { display: table-cell; text-align: right; }
    .footer p { margin: 4px 0; }
    .footer a {
      color: rgba(7,13,20,0.55); text-decoration: none;
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px; letter-spacing: 0.12em;
    }
    .footer-copy {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10px; letter-spacing: 0.12em;
      color: rgba(7,13,20,0.38);
    }
  </style>
</head>
<body>
  <div class="outer">
    <div class="wrapper">
      <div class="header">
        <div class="header-left">
          <img src="${TAPESTRY_ICON_URL}" alt="Heirloom" class="logo-icon" width="36" height="36">
          <span class="logo-mark">&#8734;</span>
          <span class="wordmark">Heirloom</span>
        </div>
        <div class="header-right">
          <span class="url-line">heirloom.blue</span>
        </div>
      </div>
      <div class="card">
        <div class="content">${content}</div>
      </div>
      <div class="footer">
        <div class="footer-row">
          <div class="footer-left">
            <p class="footer-copy">&copy; ${new Date().getFullYear()} Heirloom</p>
            <p><a href="${APP_URL}/privacy">Privacy</a> &nbsp; <a href="${APP_URL}/unsubscribe">Unsubscribe</a></p>
          </div>
          <div class="footer-right">
            <p class="footer-copy">Some things<br>only get deeper.</p>
          </div>
        </div>
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
    <h2>Welcome, ${esc(name)}</h2>
    <p>Thank you for joining Heirloom. You've taken the first step in preserving your most precious memories for generations to come.</p>
    <p>Your <span class="gold">30-day free trial</span> has begun. During this time, you'll have access to all features.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>Let photos and videos settle, with the story attached</li>
      <li>Record your voice with guided prompts</li>
      <li>Write letters to loved ones</li>
      <li>Set up posthumous delivery</li>
    </ul>
    <a href="${APP_URL}/dashboard" class="button">ENTER THE DEEP</a>
  `),
});

export const verificationEmail = (name: string, token: string) => ({
  subject: 'Verify Your Email',
  html: baseTemplate(`
    <h2>Verify your email, ${esc(name)}</h2>
    <p>Please click the button below to verify your email address.</p>
    <a href="${APP_URL}/verify-email?token=${token}" class="button">VERIFY EMAIL</a>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `),
});

export const passwordResetEmail = (name: string, token: string) => ({
  subject: 'Reset Your Password',
  html: baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi ${esc(name)}, we received a request to reset your password.</p>
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
    <p>Hi ${esc(name)},</p>
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
    <p>Hi ${esc(name)},</p>
    <p>Your Heirloom free trial has expired, and your content has been removed from our servers.</p>
    <p>You can still subscribe anytime to start preserving your memories again.</p>
    <a href="${APP_URL}/settings?tab=subscription" class="button">SUBSCRIBE NOW</a>
  `),
});

export const subscriptionConfirmationEmail = (name: string, tier: string) => ({
  subject: 'Subscription Confirmed',
  html: baseTemplate(`
    <h2>Welcome to Heirloom ${esc(tier)}</h2>
    <p>Hi ${esc(name)},</p>
    <p>Your subscription to the <span class="gold">${esc(tier)}</span> plan is now active.</p>
    <p>Your memories are now protected and will be preserved for generations.</p>
    <a href="${APP_URL}/dashboard" class="button">CONTINUE TO THE DEEP</a>
  `),
});

export const paymentFailedEmail = (name: string) => ({
  subject: 'Payment Failed - Action Required',
  html: baseTemplate(`
    <h2>Payment Failed</h2>
    <p>Hi ${esc(name)},</p>
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
    <p>Hi ${esc(name)},</p>
    <p>Your Heirloom check-in is due in <span class="gold">${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>.</p>
    <p>This ensures your legacy contacts aren't notified unnecessarily.</p>
    <a href="${APP_URL}/settings?tab=deadman" class="button">CHECK IN NOW</a>
  `),
});

export const urgentCheckInEmail = (name: string, missedCount: number) => ({
  subject: `URGENT: Check-in Required - ${missedCount} missed`,
  html: baseTemplate(`
    <h2>Urgent: Check-in Required</h2>
    <p>Hi ${esc(name)},</p>
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
    <p>Hi ${esc(name)},</p>
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
    <p>Dear ${esc(contactName)},</p>
    <p><span class="gold">${esc(userName)}</span> has added you as a legacy contact on Heirloom.</p>
    <p>As a legacy contact, you may be asked to verify their status in the future. This helps ensure their memories reach their loved ones when the time comes.</p>
    <a href="${APP_URL}/verify-legacy-contact?token=${token}" class="button">ACCEPT THIS ROLE</a>
    <p>If you don't wish to be a legacy contact, simply ignore this email.</p>
  `),
});

// Sent when someone is named a legacy contact. Links straight to the public API
// verify-contact endpoint (a plain POST form, no client JS), so confirming the
// role sets verification_status='VERIFIED' — the gate sendTriggerNotifications
// reads. Quiet, archival voice: a custodianship, not a transaction.
export const verifyContactEmail = (contactName: string, ownerName: string, verifyUrl: string): string =>
  baseTemplate(`
    <h2>You've been entrusted.</h2>
    <p>Dear ${esc(contactName)},</p>
    <p><span class="warm">${esc(ownerName)}</span> has named you a legacy contact on Heirloom &mdash;
    a family Deep meant to outlast all of us.</p>
    <p>Should the day ever come that ${esc(ownerName)} can no longer tend their Deep, you may be
    asked to confirm it. Until then, nothing is required of you but this: to accept that you will
    safeguard what has been left in your care.</p>
    <a href="${safeUrl(verifyUrl)}" class="button-warm">Confirm &mdash; I will safeguard this</a>
    <p class="muted" style="font-size: 14px; margin-top: 28px;">If you weren't expecting this, you
    can safely ignore this email. Nothing happens without your confirmation.</p>
  `);

export const deathVerificationRequestEmail = (contactName: string, userName: string, token: string) => ({
  subject: `Verification needed for ${userName}'s Heirloom account`,
  html: baseTemplate(`
    <h2>Verification Request</h2>
    <p>Dear ${esc(contactName)},</p>
    <p>You were designated as a legacy contact by <span class="gold">${esc(userName)}</span> on Heirloom.</p>
    <p>We haven't been able to reach ${esc(userName)} for their scheduled check-in. As their trusted contact, we need your help to verify their status.</p>
    <div class="urgent">
      <strong>Important:</strong> Only click the button below if you can confirm that ${esc(userName)} has passed away. This action cannot be easily undone.
    </div>
    <a href="https://api.heirloom.blue/api/deadman/verify-passing/${token}" class="button">VERIFY STATUS</a>
    <p>If ${esc(userName)} is still alive, please encourage them to check in to their Heirloom account.</p>
  `),
});

export const switchCancelledEmail = (contactName: string, userName: string) => ({
  subject: `${userName} has checked in`,
  html: baseTemplate(`
    <h2>All Clear</h2>
    <p>Dear ${esc(contactName)},</p>
    <p>Good news! <span class="gold">${esc(userName)}</span> has checked in to their Heirloom account. The verification process has been cancelled.</p>
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
    <p>Dear ${esc(recipientName)},</p>
    <p>${esc(senderName)} has left you a message through Heirloom.</p>
    <div class="letter-box">
      <p class="salutation">${esc(letter.salutation)}</p>
      <p style="white-space: pre-wrap;">${esc(letter.body)}</p>
      <p class="signature">${esc(letter.signature)}</p>
    </div>
    <div class="seal">
      <div class="seal-icon">&#8734;</div>
      <p class="seal-text">Sealed with love</p>
    </div>
  `),
});

// Sent to the AUTHOR when one or more of their letter's recipients could not be
// reached (the email provider rejected the send). The letter stays unsent for
// those addresses so it can be retried; this tells the author to re-aim while
// they still can.
export const letterDeliveryFailedEmail = (
  authorName: string,
  failedEmails: string[]
) => ({
  subject: `A letter didn't reach ${failedEmails.length === 1 ? 'its recipient' : 'everyone'}`,
  html: baseTemplate(`
    <h2>A letter couldn't be delivered</h2>
    <p>Dear ${esc(authorName)},</p>
    <p>We couldn't deliver your letter to the following ${failedEmails.length === 1 ? 'address' : 'addresses'}:</p>
    <div class="letter-box">
      <p style="white-space: pre-wrap;">${esc(failedEmails.join('\n'))}</p>
    </div>
    <p>The letter has <strong>not</strong> been marked delivered for ${failedEmails.length === 1 ? 'this recipient' : 'these recipients'}.
       Check the address is right and that the person still has it on their record, then release or re-send when you're ready.</p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="${APP_URL}" class="button-warm">Open your letters</a>
    </div>
  `),
});

// Milestone teaser — sent the moment a milestone letter is sealed, to a
// recipient who may not yet be on Heirloom. The content stays sealed; this only
// tells them something is waiting for a named moment ("your wedding day"). It is
// deliberately evocative — the anticipation is the hook that brings people in.
export const letterMilestoneTeaserEmail = (
  recipientName: string,
  senderName: string,
  milestoneLabel: string
) => ({
  subject: `${senderName} left you a letter — to be opened on ${milestoneLabel}`,
  html: baseTemplate(`
    <h2>A letter is waiting for you</h2>
    <p>Dear ${esc(recipientName)},</p>
    <p>${esc(senderName)} has written you a letter through Heirloom and sealed it
       for a single moment yet to come:</p>
    <div class="letter-box">
      <p class="salutation" style="text-align:center; font-style:italic;">to be opened on ${esc(milestoneLabel)}</p>
    </div>
    <p>It stays sealed until then. When the day arrives, your family will release it —
       or, if you keep your own Deep on Heirloom, you'll be able to open it yourself
       and let it settle into your family's Deep.</p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="${APP_URL}" class="button-warm">Begin your own Deep</a>
    </div>
    <div class="seal">
      <div class="seal-icon">&#8734;</div>
      <p class="seal-text">Sealed with love</p>
    </div>
  `),
});

// Sent to the letter's author when a recipient opens what they left — the
// quiet confirmation that the words arrived and were read.
export const letterOpenedNotificationEmail = (
  authorName: string,
  recipientName: string,
  milestoneLabel: string | null
) => ({
  subject: `${recipientName} opened your letter`,
  html: baseTemplate(`
    <h2>Your letter was opened</h2>
    <p>Dear ${esc(authorName)},</p>
    <p>${esc(recipientName)} has just opened the letter you left them${milestoneLabel ? ` for ${esc(milestoneLabel)}` : ''}.
       Your words have been read, and the letter has now settled into their family's Deep too.</p>
    <div class="seal">
      <div class="seal-icon">&#8734;</div>
      <p class="seal-text">Some things only get deeper</p>
    </div>
  `),
});

// Reaches a beneficiary in the days after a death. It carries the only copy of a
// decryption key, so the mechanics stay plain and unmissable — but the voice is
// verifyContactEmail's, not a product announcement. No "vault", no shouted CTA.
export const escrowKeyReleaseEmail = (
  beneficiaryName: string,
  userName: string,
  encryptedKey: string
) => ({
  subject: `${userName} left their Deep open to you`,
  html: baseTemplate(`
    <h2>It was left to you.</h2>
    <p>Dear ${esc(beneficiaryName)},</p>
    <p><span class="warm">${esc(userName)}</span> asked that when they were gone, what they wrote,
    spoke and kept should pass to you. That day has come, and it now has.</p>
    <p>There is no hurry. It will keep. When you are ready, the key below opens it.</p>
    <div class="code-box">${encryptedKey}</div>
    <a href="${APP_URL}/legacy-access" class="button-warm">Open what was left to you</a>
    <p class="muted" style="font-size: 14px; margin-top: 28px;">Keep this key somewhere safe and
    private. It is the only key that will ever open ${esc(userName)}'s Deep &mdash; we hold no copy,
    and it cannot be reissued. Anyone who has it can read everything.</p>
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
    <p>Hi ${esc(name)},</p>
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
      <p><strong>Name:</strong> <span class="gold">${esc(newUserName)}</span></p>
      <p><strong>Email:</strong> ${esc(newUserEmail)}</p>
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
      <p><strong>From:</strong> <span class="gold">${esc(senderName)}</span> (${esc(senderEmail)})</p>
      <p><strong>To:</strong> ${esc(recipientEmail)}</p>
      <p><strong>Subject:</strong> ${esc(letterSubject)}</p>
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
    <p>Dear ${esc(purchaserName)},</p>
    <p>Your Heirloom gift voucher has been created successfully.</p>
    <div class="info-box">
      <p><strong>Voucher Code:</strong></p>
      <p style="font-size: 24px; font-family: monospace; color: #a86220; letter-spacing: 2px;">${voucherCode}</p>
      <p><strong>Plan:</strong> ${esc(tier)}</p>
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
    <p>Dear ${esc(recipientName)},</p>
    <p><span class="gold">${esc(senderName)}</span> has gifted you a Heirloom subscription!</p>
    ${personalMessage ? `
    <div class="letter-box">
      <p style="white-space: pre-wrap;">${esc(personalMessage)}</p>
      <p class="signature">— ${esc(senderName)}</p>
    </div>
    ` : ''}
    <div class="info-box">
      <p><strong>Your Gift:</strong> ${esc(tier)} Plan</p>
      <p><strong>Duration:</strong> ${durationMonths} month${durationMonths > 1 ? 's' : ''}</p>
      <p><strong>Voucher Code:</strong></p>
      <p style="font-size: 20px; font-family: monospace; color: #a86220; letter-spacing: 2px;">${voucherCode}</p>
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
    <p>Dear ${esc(userName)},</p>
    <p>Your gift voucher has been redeemed successfully!</p>
    <div class="info-box">
      <p><strong>Plan:</strong> <span class="gold">${esc(tier)}</span></p>
      <p><strong>Duration:</strong> ${durationMonths} month${durationMonths > 1 ? 's' : ''}</p>
    </div>
    <p>The water is still. Let the first thing settle today.</p>
    <a href="${APP_URL}/dashboard" class="button">ENTER THE DEEP</a>
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
      <p>Dear ${esc(userName)},</p>
      ${hasPosted 
        ? `<p>You've preserved <span class="gold">${memoriesCount} ${memoriesCount === 1 ? 'memory' : 'memories'}</span> so far—each one a treasure for future generations.${daysSinceLastPost ? ` It's been ${daysSinceLastPost} days since anything last settled.` : ''}</p>`
        : `<p>The Deep is still, and waiting. Every photo, every moment you capture becomes a gift to those who come after you.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #a86220;">"${prompt}"</p>
      </div>
      <p>Take a moment today to preserve something meaningful. It takes a few seconds to let a photo or a story settle.</p>
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
      <p>Dear ${esc(userName)},</p>
      ${hasRecorded 
        ? `<p>You've recorded <span class="gold">${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}</span> of voice messages—your laugh, your wisdom, your love, preserved forever.</p>`
        : `<p>There's something irreplaceable about hearing a loved one's voice. Your voice carries warmth, emotion, and personality that words on a page simply can't capture.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #a86220;">"${prompt}"</p>
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
      <p>Dear ${esc(userName)},</p>
      ${hasWritten 
        ? `<p>You've written <span class="gold">${lettersCount} ${lettersCount === 1 ? 'letter' : 'letters'}</span>${hasSealedLetters ? ', some sealed for future delivery' : ''}. Each one is a gift waiting to be opened.</p>`
        : `<p>Imagine the joy of receiving a letter from someone you love—on a birthday, a wedding day, or a moment when they need it most. You can give that gift.</p>`
      }
      <div class="letter-box">
        <p style="font-style: italic; color: #a86220;">"${prompt}"</p>
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
    memory: { text: 'Let One Settle', url: `${APP_URL}/memories`, prompt: getRandomPrompt(memoryPrompts) },
    voice: { text: 'Record a Message', url: `${APP_URL}/record`, prompt: getRandomPrompt(voicePrompts) },
    letter: { text: 'Write a Letter', url: `${APP_URL}/compose`, prompt: getRandomPrompt(letterPrompts) },
    family: { text: 'Add Family Member', url: `${APP_URL}/family`, prompt: 'Connect with someone you want to share your legacy with.' },
  };
  
  const action = actionMap[suggestedAction];
  
  return {
    subject: `${userName}, your weekly Heirloom update`,
    html: baseTemplate(`
      <h2>Your Legacy This Week</h2>
      <p>Dear ${esc(userName)},</p>
      <p>Here's a snapshot of your Heirloom sanctuary:</p>
      <div class="info-box">
        <p><strong>Memories:</strong> <span class="gold">${stats.memoriesCount}</span> preserved</p>
        <p><strong>Voice:</strong> <span class="gold">${stats.voiceMinutes}</span> minutes recorded</p>
        <p><strong>Letters:</strong> <span class="gold">${stats.lettersCount}</span> written</p>
        <p><strong>Family:</strong> <span class="gold">${stats.familyCount}</span> connected</p>
      </div>
      <p>This week's inspiration:</p>
      <div class="letter-box">
        <p style="font-style: italic; color: #a86220;">"${action.prompt}"</p>
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
    <p>Hi ${esc(userName)},</p>
    <p>Our support team has replied to your ticket <span class="gold">${ticketNumber}</span>.</p>

    <div class="info-box">
      <p><strong>Subject:</strong> ${esc(ticketSubject)}</p>
    </div>

    <div class="letter-box">
      <p class="salutation">Response from ${esc(adminName)}:</p>
      <p style="white-space: pre-wrap;">${esc(replyContent)}</p>
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
    <p>Hi ${esc(userName)},</p>
    <p>Your support ticket <span class="gold">${ticketNumber}</span> has been marked as resolved.</p>

    <div class="info-box">
      <p><strong>Subject:</strong> ${esc(ticketSubject)}</p>
      <p><strong>Status:</strong> <span class="gold">Resolved</span></p>
    </div>

    ${resolutionNote ? `
    <div class="letter-box">
      <p class="salutation">Resolution note:</p>
      <p style="white-space: pre-wrap;">${esc(resolutionNote)}</p>
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
    <p>Hi ${esc(name)},</p>
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
    <p>Hi ${esc(name)},</p>
    <p>Congratulations! Your application to the <span class="gold">Heirloom Influencer Program</span> has been approved.</p>
    <div class="info-box">
      <p><strong>Your Influencer Details:</strong></p>
      <p>Tier: <span class="gold">${esc(tier)}</span></p>
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
    <p>Hi ${esc(name)},</p>
    <p>Thank you for your interest in the Heirloom Influencer Program.</p>
    <p>After careful review, we're unable to approve your application at this time.${reason ? ` ${esc(reason)}` : ''}</p>
    <p>This doesn't mean the door is closed! You're welcome to reapply in the future as your platform grows.</p>
    <p>In the meantime, you can still earn rewards through our <a href="${APP_URL}/referral" style="color: #a86220;">referral program</a>.</p>
  `),
});

export const partnerApplicationReceivedEmail = (contactName: string, businessName: string) => ({
  subject: 'Application Received - Heirloom Partner Program',
  html: baseTemplate(`
    <h2>Application Received</h2>
    <p>Hi ${esc(contactName)},</p>
    <p>Thank you for applying to become a <span class="gold">Heirloom Partner</span> on behalf of ${esc(businessName)}!</p>
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
    <p>Hi ${esc(contactName)},</p>
    <p>Congratulations! <span class="gold">${esc(businessName)}</span> has been approved as a Heirloom Partner.</p>
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
    <p>Hi ${esc(contactName)},</p>
    <p>Thank you for ${esc(businessName)}'s interest in the Heirloom Partner Program.</p>
    <p>After careful review, we're unable to approve your application at this time.${reason ? ` ${esc(reason)}` : ''}</p>
    <p>If you believe this was in error or have additional information to share, please reply to this email.</p>
  `),
});

export const wholesaleOrderConfirmationEmail = (contactName: string, orderId: string, tier: string, quantity: number, totalAmount: number) => ({
  subject: 'Wholesale Order Confirmed - Heirloom',
  html: baseTemplate(`
    <h2>Order Confirmed</h2>
    <p>Hi ${esc(contactName)},</p>
    <p>Your wholesale voucher order has been confirmed!</p>
    <div class="info-box">
      <p><strong>Order Details:</strong></p>
      <p>Order ID: ${orderId}</p>
      <p>Vouchers: ${quantity}x ${esc(tier)}</p>
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
      <p><strong>Name:</strong> ${esc(influencerName)}</p>
      <p><strong>Platform:</strong> ${esc(platform)}</p>
      <p><strong>Handle:</strong> ${esc(handle)}</p>
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
      <p><strong>Business:</strong> ${esc(businessName)}</p>
      <p><strong>Type:</strong> ${esc(businessType)}</p>
      <p><strong>Contact:</strong> ${esc(contactName)}</p>
      <p><strong>Email:</strong> ${esc(contactEmail)}</p>
    </div>
    <a href="${APP_URL}/admin/partners" class="button">REVIEW APPLICATION</a>
  `),
});

// ============================================
// THREAD INVITATION EMAIL
// ============================================

export const threadInvitationEmail = (
  inviteeName: string,
  inviterName: string,
  threadName: string,
  role: string,
  acceptUrl: string,
) => ({
  subject: `${inviterName} included you in the ${threadName} thread`,
  html: baseTemplate(`
    <h2>You've Been Included</h2>
    <p>Dear ${esc(inviteeName)},</p>
    <p><span class="warm">${esc(inviterName)}</span> has included you in the
    <span class="warm">${esc(threadName)}</span> family Deep on Heirloom.</p>
    <div class="info-box">
      <p><strong>Your role:</strong> <span class="warm">${esc(role)}</span></p>
    </div>
    <p>Heirloom is a family story archive — the Deep your family keeps. Every photo, voice
    recording, and written memory lowered into your family's Deep becomes an heirloom passed down
    through generations, owned by your bloodline, not a platform.</p>
    <p>Accept your invitation to begin reading and contributing to the
    <span class="warm">${esc(threadName)}</span> Deep.</p>
    <a href="${safeUrl(acceptUrl)}" class="button-warm">ACCEPT INVITATION</a>
    <p class="muted" style="font-size: 14px; margin-top: 28px;">If you weren't expecting
    this invitation, you can safely ignore this email. No account will be created without
    your action.</p>
  `),
});

export const newFeaturesAnnouncementEmail = (userName: string) => ({
  subject: 'New Features: Legacy Playbook, Story Artifacts & More',
  html: baseTemplate(`
    <h2>Exciting New Features Are Here!</h2>
    <p>Hi ${esc(userName)},</p>
    <p>We've been working hard to make Heirloom even more powerful for preserving your legacy. Here's what's new:</p>
    
    <div class="divider"></div>
    
    <h3 style="color: #a86220; margin-top: 24px;">Legacy Playbook</h3>
    <p>A guided checklist organized into five categories—People, Stories, Gratitude, Practical, and Wisdom—to help you build a complete legacy. Track your progress and share it with family.</p>
    
    <h3 style="color: #a86220; margin-top: 24px;">Recipient Experience</h3>
    <p>Control how and when your loved ones receive your legacy with staged releases. Plus, create a Family Memory Room where recipients can contribute their own memories.</p>
    
    <h3 style="color: #a86220; margin-top: 24px;">Story Artifacts</h3>
    <p>Transform your memories into beautiful 60-120 second micro-documentaries. Combine photos, voice recordings, and music into shareable video stories.</p>
    
    <h3 style="color: #a86220; margin-top: 24px;">Life Event Triggers</h3>
    <p>Schedule content delivery for life's milestones—graduations, weddings, first child, and more. Your words arrive exactly when they're needed most.</p>
    
    <div class="divider"></div>
    
    <p>Log in to explore these new features and take the platform tour to learn more!</p>
    
    <a href="${APP_URL}/dashboard" class="button">EXPLORE NEW FEATURES</a>
    
    <p style="margin-top: 24px; font-size: 14px; color: rgba(245,243,238,0.6);">
      <a href="${APP_URL}/settings?tab=notifications" style="color: #a86220;">Manage your email preferences</a>
    </p>
  `),
});

// ============================================
// GIFT SUBSCRIPTION EMAILS
// ============================================

export const giftSubscriptionPurchaseEmail = (
  purchaserName: string,
  recipientName: string,
  recipientEmail: string,
  tierName: string,
  giftPrice: number,
  billingPeriod: 'monthly' | 'annual',
  giftCode: string,
  personalMessage?: string,
  scheduledDate?: string,
) => ({
  subject: `Your gift subscription for ${recipientName} is confirmed`,
  html: baseTemplate(`
    <h2>Gift confirmed</h2>
    <p>Dear ${esc(purchaserName)},</p>
    <p>Your gift subscription for <span class="warm">${esc(recipientName)}</span> has been confirmed. Here is your receipt.</p>
    <div class="info-box">
      <p><strong>Recipient:</strong> ${esc(recipientName)} (${esc(recipientEmail)})</p>
      <p><strong>Plan:</strong> ${esc(tierName)} &mdash; ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'}</p>
      <p><strong>Amount paid:</strong> $${giftPrice.toFixed(2)} USD</p>
      <p><strong>Gift code:</strong></p>
      <div class="code-box">${giftCode}</div>
      ${scheduledDate
        ? `<p><strong>Scheduled delivery:</strong> ${esc(scheduledDate)}</p>`
        : `<p><strong>Delivery:</strong> <span class="warm">Sent immediately</span></p>`
      }
    </div>
    ${personalMessage ? `
    <div class="letter-box">
      <p class="salutation">Your personal message:</p>
      <p style="white-space: pre-wrap;">${esc(personalMessage)}</p>
      <p class="signature">&mdash; ${esc(purchaserName)}</p>
    </div>
    ` : ''}
    <hr class="divider">
    <p>If you need to make any changes, reply to this email within 24 hours of purchase.</p>
    <a href="${APP_URL}/gift" class="button">VIEW YOUR GIFT</a>
  `),
});

export const giftSubscriptionReceivedEmail = (
  recipientName: string,
  senderName: string,
  tierName: string,
  billingPeriod: 'monthly' | 'annual',
  giftCode: string,
  redeemUrl: string,
  personalMessage?: string,
) => ({
  subject: `${senderName} gave you a Heirloom ${tierName} subscription`,
  html: baseTemplate(`
    <h2>You've received a gift</h2>
    <p>Dear ${esc(recipientName)},</p>
    <p><span class="warm">${esc(senderName)}</span> has given you a Heirloom subscription &mdash; a place to preserve your family's story for generations to come.</p>
    ${personalMessage ? `
    <div class="letter-box">
      <p class="salutation">A note from ${esc(senderName)}:</p>
      <p style="white-space: pre-wrap;">${esc(personalMessage)}</p>
      <p class="signature">&mdash; ${esc(senderName)}</p>
    </div>
    ` : ''}
    <div class="info-box">
      <p><strong>Your gift:</strong> ${esc(tierName)} plan &mdash; ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'}</p>
      <p><strong>Gift code:</strong></p>
      <div class="code-box">${giftCode}</div>
    </div>
    <p>Heirloom is a family Deep &mdash; an append-only, multi-generational archive owned by your bloodline, not a platform. Your voice, your letters, your memories: settled in, never erased.</p>
    <a href="${safeUrl(redeemUrl)}" class="button-warm">REDEEM YOUR GIFT</a>
    <p style="margin-top: 24px; font-size: 14px; color: rgba(7,13,20,0.46);">
      Or visit <span style="font-family: 'Courier New', monospace; font-size: 12px;">${esc(redeemUrl)}</span>
    </p>
  `),
});

// ============================================
// FAMILY REFERRAL INVITE EMAIL
// ============================================

export const familyReferralInviteEmail = (
  referrerName: string,
  relationship: string,
  inviteUrl: string,
) => ({
  subject: `${referrerName} included you in their family Deep`,
  html: baseTemplate(`
    <h2>You've been included in ${esc(referrerName)}'s Deep.</h2>
    <p><strong>${esc(referrerName)}</strong> has begun a permanent family record on Heirloom and included you as <em>${esc(relationship) || 'a family member'}</em>.</p>
    <p>Add your voice, or simply read what has been written. Every entry is append-only — nothing is deleted, nothing rewrites the past.</p>
    <a href="${safeUrl(inviteUrl)}" class="button-warm">Enter the water →</a>
    <p class="muted" style="font-size: 14px; margin-top: 28px;">If you weren't expecting this, you can safely ignore this email.</p>
  `),
});

// ============================================
// GIFT SUBSCRIPTION REDEEMED EMAIL
// ============================================

export const giftSubscriptionRedeemedEmail = (
  _recipientName: string,
  tierName: string,
  durationMonths: number,
  expiresAt: string,
) => ({
  subject: `Your Heirloom ${tierName} subscription is active`,
  html: baseTemplate(`
    <div class="section">
      <p class="section-label">gift redeemed</p>
      <h2>Your subscription is now active.</h2>
      <p>Your <strong>${esc(tierName)}</strong> plan is active for ${durationMonths === 1 ? '1 month' : `${durationMonths} months`}, expiring on ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      <a href="https://heirloom.blue/loom/today" class="button-warm">Open your Deep</a>
    </div>
  `),
});
