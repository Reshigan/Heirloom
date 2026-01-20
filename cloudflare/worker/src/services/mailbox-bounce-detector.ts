/**
 * Mailbox Bounce Detector Service
 * Uses Microsoft Graph API to read mailbox and detect bounced/non-delivery emails
 * Automatically removes failed email addresses from influencer prospect list
 */

import type { Env } from '../index';

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GraphMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  body: {
    contentType: string;
    content: string;
  };
  receivedDateTime: string;
  isRead: boolean;
}

interface GraphMessagesResponse {
  value: GraphMessage[];
  '@odata.nextLink'?: string;
}

interface BounceInfo {
  originalRecipient: string;
  bounceType: 'hard' | 'soft' | 'unknown';
  reason: string;
  messageId: string;
}

// Azure AD configuration
const AZURE_CONFIG = {
  clientId: '0a0bcbd9-afcb-44b9-b0ad-16e1da612f98',
  tenantId: '998b123c-e559-479d-bbb9-cf3330469a73',
  clientSecret: '1nv8Q~DtSwrmFDmZuJLATAQ9EzV4hg73RfT0AbIw',
};

// Patterns that indicate bounce/non-delivery emails
const BOUNCE_INDICATORS = {
  senders: [
    'mailer-daemon',
    'postmaster',
    'mail-daemon',
    'mailerdaemon',
    'noreply',
    'no-reply',
    'bounce',
    'returned',
  ],
  subjects: [
    'undeliverable',
    'delivery status notification',
    'mail delivery failed',
    'returned mail',
    'delivery failure',
    'undelivered mail',
    'message not delivered',
    'delivery has failed',
    'could not be delivered',
    'failed to deliver',
    'permanent failure',
    'address rejected',
    'user unknown',
    'mailbox not found',
    'recipient rejected',
  ],
};

/**
 * Get OAuth2 access token from Azure AD using client credentials flow
 */
async function getGraphAccessToken(): Promise<string> {
  const tokenEndpoint = `https://login.microsoftonline.com/${AZURE_CONFIG.tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: AZURE_CONFIG.clientId,
    client_secret: AZURE_CONFIG.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as GraphTokenResponse;
  return data.access_token;
}

/**
 * Fetch messages from the mailbox using Microsoft Graph API
 */
async function fetchMailboxMessages(
  accessToken: string,
  userEmail: string,
  filter?: string,
  top: number = 50
): Promise<GraphMessage[]> {
  let url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages?$top=${top}&$select=id,subject,from,body,receivedDateTime,isRead`;
  
  if (filter) {
    url += `&$filter=${encodeURIComponent(filter)}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch messages: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as GraphMessagesResponse;
  return data.value;
}

/**
 * Check if a message is a bounce/non-delivery notification
 */
function isBounceMessage(message: GraphMessage): boolean {
  const senderAddress = message.from?.emailAddress?.address?.toLowerCase() || '';
  const senderName = message.from?.emailAddress?.name?.toLowerCase() || '';
  const subject = message.subject?.toLowerCase() || '';

  // Check sender patterns
  const isBounceFromSender = BOUNCE_INDICATORS.senders.some(
    pattern => senderAddress.includes(pattern) || senderName.includes(pattern)
  );

  // Check subject patterns
  const isBounceFromSubject = BOUNCE_INDICATORS.subjects.some(
    pattern => subject.includes(pattern)
  );

  return isBounceFromSender || isBounceFromSubject;
}

/**
 * Extract the original recipient email from a bounce message
 */
function extractBouncedEmail(message: GraphMessage): BounceInfo | null {
  const body = message.body?.content || '';
  const subject = message.subject || '';
  
  // Common patterns for extracting the failed recipient email
  const emailPatterns = [
    // Standard email pattern in various contexts
    /(?:original recipient|failed recipient|recipient|to|address)[:\s]*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    // Email in angle brackets
    /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/,
    // Email after "The following address" or similar
    /(?:following address|this address|address)[^@]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    // Email after "delivery to"
    /delivery to[:\s]*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    // Email in subject line
    /(?:undeliverable|failed)[:\s]*.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ];

  // Try to extract email from body first, then subject
  const textToSearch = body + ' ' + subject;
  
  for (const pattern of emailPatterns) {
    const match = textToSearch.match(pattern);
    if (match && match[1]) {
      const email = match[1].toLowerCase();
      
      // Skip common system emails
      if (BOUNCE_INDICATORS.senders.some(s => email.includes(s))) {
        continue;
      }
      
      // Determine bounce type
      let bounceType: 'hard' | 'soft' | 'unknown' = 'unknown';
      const lowerBody = body.toLowerCase();
      
      if (
        lowerBody.includes('permanent') ||
        lowerBody.includes('user unknown') ||
        lowerBody.includes('mailbox not found') ||
        lowerBody.includes('does not exist') ||
        lowerBody.includes('invalid address') ||
        lowerBody.includes('no such user')
      ) {
        bounceType = 'hard';
      } else if (
        lowerBody.includes('temporary') ||
        lowerBody.includes('try again') ||
        lowerBody.includes('mailbox full') ||
        lowerBody.includes('quota exceeded')
      ) {
        bounceType = 'soft';
      }

      // Extract reason
      let reason = 'Unknown delivery failure';
      const reasonPatterns = [
        /reason[:\s]*([^\n\r]+)/i,
        /error[:\s]*([^\n\r]+)/i,
        /diagnostic[:\s]*([^\n\r]+)/i,
      ];
      
      for (const rp of reasonPatterns) {
        const reasonMatch = body.match(rp);
        if (reasonMatch && reasonMatch[1]) {
          reason = reasonMatch[1].trim().substring(0, 200);
          break;
        }
      }

      return {
        originalRecipient: email,
        bounceType,
        reason,
        messageId: message.id,
      };
    }
  }

  return null;
}

/**
 * Mark a message as read in the mailbox
 */
async function markMessageAsRead(
  accessToken: string,
  userEmail: string,
  messageId: string
): Promise<void> {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isRead: true }),
  });
}

/**
 * Update influencer prospect status to BOUNCED in the database
 */
async function markProspectAsBounced(
  db: D1Database,
  email: string,
  reason: string
): Promise<boolean> {
  try {
    // Update influencer_prospects table
    const result = await db.prepare(`
      UPDATE influencer_prospects 
      SET status = 'BOUNCED', 
          notes = COALESCE(notes, '') || ' | Bounce detected: ' || ?
      WHERE LOWER(email) = LOWER(?)
    `).bind(reason, email).run();

    // Also update influencers table if they exist there
    await db.prepare(`
      UPDATE influencers 
      SET status = 'REJECTED',
          notes = COALESCE(notes, '') || ' | Email bounced: ' || ?
      WHERE LOWER(email) = LOWER(?)
    `).bind(reason, email).run();

    return (result.meta?.changes || 0) > 0;
  } catch (error) {
    console.error(`Failed to mark prospect as bounced: ${email}`, error);
    return false;
  }
}

/**
 * Main function to process mailbox and detect bounces
 */
export async function processMailboxBounces(
  env: Env,
  mailboxEmail: string
): Promise<{ processed: number; bounced: number; emails: string[] }> {
  const results = {
    processed: 0,
    bounced: 0,
    emails: [] as string[],
  };

  try {
    // Get access token
    const accessToken = await getGraphAccessToken();
    
    // Fetch unread messages (or recent messages)
    const messages = await fetchMailboxMessages(
      accessToken,
      mailboxEmail,
      "isRead eq false", // Only unread messages
      100
    );

    console.log(`Found ${messages.length} unread messages to process`);

    for (const message of messages) {
      results.processed++;

      if (isBounceMessage(message)) {
        const bounceInfo = extractBouncedEmail(message);
        
        if (bounceInfo) {
          console.log(`Detected bounce for: ${bounceInfo.originalRecipient} (${bounceInfo.bounceType})`);
          
          // Mark prospect as bounced in database
          const updated = await markProspectAsBounced(
            env.DB,
            bounceInfo.originalRecipient,
            bounceInfo.reason
          );

          if (updated) {
            results.bounced++;
            results.emails.push(bounceInfo.originalRecipient);
          }

          // Mark message as read
          await markMessageAsRead(accessToken, mailboxEmail, message.id);
        }
      }
    }

    console.log(`Bounce detection complete: ${results.bounced} bounces detected out of ${results.processed} messages`);
    
  } catch (error) {
    console.error('Error processing mailbox bounces:', error);
    throw error;
  }

  return results;
}

/**
 * Get list of all bounced emails from the database
 */
export async function getBouncedEmails(db: D1Database): Promise<string[]> {
  const result = await db.prepare(`
    SELECT email FROM influencer_prospects WHERE status = 'BOUNCED'
    UNION
    SELECT email FROM influencers WHERE status = 'REJECTED' AND notes LIKE '%bounced%'
  `).all<{ email: string }>();

  return result.results.map((r) => r.email);
}

/**
 * Check if an email has previously bounced
 */
export async function hasEmailBounced(db: D1Database, email: string): Promise<boolean> {
  const result = await db.prepare(`
    SELECT 1 FROM influencer_prospects WHERE LOWER(email) = LOWER(?) AND status = 'BOUNCED'
    UNION
    SELECT 1 FROM influencers WHERE LOWER(email) = LOWER(?) AND status = 'REJECTED' AND notes LIKE '%bounced%'
    LIMIT 1
  `).bind(email, email).first();

  return result !== null;
}
