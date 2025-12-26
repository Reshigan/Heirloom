/**
 * Email utility for sending emails via Microsoft Graph API (primary) or Resend API (fallback)
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
  provider?: 'microsoft' | 'resend';
}

// Token cache for Microsoft Graph API (module-level for Worker isolate reuse)
let msGraphToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Microsoft Graph API access token using client credentials flow
 */
async function getMsGraphToken(env: Env): Promise<string | null> {
  if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    return null;
  }

  // Check if cached token is still valid (with 5 minute buffer)
  if (msGraphToken && msGraphToken.expiresAt > Date.now() + 300000) {
    return msGraphToken.token;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.MS_CLIENT_ID,
        client_secret: env.MS_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get MS Graph token:', errorText);
      return null;
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    
    // Cache the token
    msGraphToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return data.access_token;
  } catch (error) {
    console.error('Error getting MS Graph token:', error);
    return null;
  }
}

/**
 * Send email via Microsoft Graph API
 */
async function sendViaMsGraph(
  env: Env,
  payload: EmailPayload,
  token: string
): Promise<SendEmailResult> {
  const { to, subject, html, replyTo } = payload;
  
  // Always use a known-good sender mailbox that exists in O365
  // Don't derive from payload.from as it may reference non-existent mailboxes like noreply@
  const senderEmail = env.MS_DEFAULT_SENDER || 'admin@heirloom.blue';

  // Build the message payload
  const message: Record<string, unknown> = {
    subject,
    body: {
      contentType: 'HTML',
      content: html,
    },
    toRecipients: (Array.isArray(to) ? to : [to]).map(email => ({
      emailAddress: { address: email },
    })),
  };

  // Add reply-to if specified
  if (replyTo) {
    message.replyTo = [{ emailAddress: { address: replyTo } }];
  }

  try {
    // Send email via Graph API
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`;
    
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        saveToSentItems: true, // Save to Sent Items for tracking
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        return { 
          success: false, 
          error: `Rate limited. Retry after ${retryAfter} seconds`,
          provider: 'microsoft',
        };
      }
      
      return { 
        success: false, 
        error: `MS Graph error: ${errorText}`,
        provider: 'microsoft',
      };
    }

    // Graph API returns 202 Accepted for successful send
    return { 
      success: true, 
      messageId: `msgraph-${Date.now()}`,
      provider: 'microsoft',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      success: false, 
      error: `MS Graph exception: ${errorMessage}`,
      provider: 'microsoft',
    };
  }
}

/**
 * Send email via Resend API (fallback)
 */
async function sendViaResend(
  env: Env,
  payload: EmailPayload
): Promise<SendEmailResult> {
  const { from, to, subject, html, replyTo } = payload;

  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured', provider: 'resend' };
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
    let responseData: { id?: string; message?: string } = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Response might not be JSON
    }

    if (!response.ok) {
      const errorMessage = responseData.message || responseText || `HTTP ${response.status}`;
      return { success: false, error: errorMessage, provider: 'resend' };
    }

    return { success: true, messageId: responseData.id, provider: 'resend' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage, provider: 'resend' };
  }
}

/**
 * Send an email via Microsoft Graph API (primary) or Resend API (fallback)
 * Logs all emails to the database
 */
export async function sendEmail(
  env: Env,
  payload: EmailPayload,
  emailType?: string
): Promise<SendEmailResult> {
  const { to, subject, html } = payload;
  const toEmail = Array.isArray(to) ? to[0] : to;
  const now = new Date().toISOString();
  const logId = crypto.randomUUID();

  let result: SendEmailResult;

  // Try Microsoft Graph API first (if configured)
  const msToken = await getMsGraphToken(env);
  if (msToken) {
    result = await sendViaMsGraph(env, payload, msToken);
    
    // If MS Graph fails, fall back to Resend
    // This includes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (mailbox not found), 5xx (server errors)
    if (!result.success) {
      console.warn(`MS Graph failed (${result.error}), falling back to Resend`);
      result = await sendViaResend(env, payload);
    }
  } else {
    // Fall back to Resend if MS Graph not configured
    result = await sendViaResend(env, payload);
  }

  // Log the email result to database
  // Note: email_type column doesn't exist in production DB yet, so we omit it
  // The emailType parameter is kept for future use when the column is added
  void emailType; // Suppress unused variable warning
  try {
    if (result.success) {
      await env.DB.prepare(`
        INSERT INTO email_logs (id, to_email, subject, body, status, sent_at, created_at)
        VALUES (?, ?, ?, ?, 'SENT', ?, ?)
      `).bind(logId, toEmail, subject, html?.substring(0, 50000), now, now).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO email_logs (id, to_email, subject, body, status, error_message, created_at)
        VALUES (?, ?, ?, ?, 'FAILED', ?, ?)
      `).bind(logId, toEmail, subject, html?.substring(0, 50000), result.error, now).run();
    }
  } catch (dbError) {
    console.error('Failed to log email:', dbError);
  }

  return result;
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
    
    // Add small delay between emails to avoid rate limiting
    if (emails.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { sent, failed };
}
