/**
 * Email utility for sending emails via Resend API with logging
 * All emails sent through this utility are logged to the email_logs table
 */

import type { Env } from '../index';

interface EmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend API and log it to the database
 */
export async function sendEmail(
  env: Env,
  payload: EmailPayload,
  emailType?: string
): Promise<SendEmailResult> {
  const { from, to, subject, html, replyTo } = payload;
  const toEmail = Array.isArray(to) ? to[0] : to;
  const now = new Date().toISOString();
  const logId = crypto.randomUUID();

  // Check if RESEND_API_KEY is configured
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    
    // Log the failed attempt
    try {
      await env.DB.prepare(`
        INSERT INTO email_logs (id, to_email, subject, body, status, error_message, created_at)
        VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
      `).bind(logId, toEmail, subject, html?.substring(0, 1000), 'RESEND_API_KEY not configured', now).run();
    } catch (dbError) {
      console.error('Failed to log email error:', dbError);
    }
    
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo && { reply_to: replyTo }),
      }),
    });

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Response might not be JSON
    }

    if (!response.ok) {
      const errorMessage = responseData.message || responseText || `HTTP ${response.status}`;
      console.error(`Failed to send email to ${toEmail}: ${errorMessage}`);
      
      // Log the failed email
      try {
        await env.DB.prepare(`
          INSERT INTO email_logs (id, to_email, subject, body, status, error_message, created_at)
          VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
        `).bind(logId, toEmail, subject, html?.substring(0, 1000), errorMessage, now).run();
      } catch (dbError) {
        console.error('Failed to log email error:', dbError);
      }
      
      return { success: false, error: errorMessage };
    }

    // Log the successful email
    try {
      await env.DB.prepare(`
        INSERT INTO email_logs (id, to_email, subject, body, status, sent_at, created_at)
        VALUES (?, ?, ?, ?, 'SENT', ?, ?)
      `).bind(logId, toEmail, subject, html?.substring(0, 1000), now, now).run();
    } catch (dbError) {
      console.error('Failed to log sent email:', dbError);
    }

    return { success: true, messageId: responseData.id };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`Failed to send email to ${toEmail}: ${errorMessage}`);
    
    // Log the failed email
    try {
      await env.DB.prepare(`
        INSERT INTO email_logs (id, to_email, subject, body, status, error_message, created_at)
        VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
      `).bind(logId, toEmail, subject, html?.substring(0, 1000), errorMessage, now).run();
    } catch (dbError) {
      console.error('Failed to log email error:', dbError);
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Send multiple emails (for batch operations)
 */
export async function sendBulkEmails(
  env: Env,
  emails: EmailPayload[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(env, email);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
