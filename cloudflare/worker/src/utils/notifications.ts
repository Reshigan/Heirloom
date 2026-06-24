import type { Env } from '../index';

// One in-app notification row. Best-effort: a notification must never block or
// fail the action that triggered it (a join, a first memory). The type must be
// one of the user_notifications CHECK values (migration 0025).
export type NotificationType =
  | 'streak_reminder' | 'streak_broken' | 'streak_milestone'
  | 'challenge_new' | 'challenge_ending' | 'challenge_featured'
  | 'referral_accepted' | 'referral_reward'
  | 'gift_received' | 'gift_redeemed'
  | 'memorial_view' | 'memorial_tribute'
  | 'milestone_upcoming' | 'milestone_today';

export async function createNotification(
  env: Env,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string | null,
): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO user_notifications (id, user_id, notification_type, title, message, action_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), userId, type, title, message, actionUrl ?? null, new Date().toISOString()).run();
  } catch {
    /* in-app notification is best-effort — never block the triggering action */
  }
}

// Reciprocity email to the inviter when their kin arrives — `action` reads as a
// clause after the joiner's name ("joined your thread" / "wrote their first
// memory"). Same house style as the invite email (Georgia/Courier, ink ground,
// copper accent). Push/VAPID is dormant, so email is the only out-of-app pull.
export function kinJoinedEmail(inviterName: string, joinerName: string, action: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${joinerName} ${action}</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0c;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px 64px;">
    <div style="margin-bottom:48px;">
      <span style="font-family:Georgia,serif;font-size:13px;font-weight:normal;letter-spacing:0.28em;text-transform:uppercase;color:#b07a4a;">heirloom</span>
    </div>
    <div style="height:1px;background:#2a2a28;margin-bottom:40px;"></div>
    <p style="margin:0 0 14px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#6b6b68;">
      the thread grows
    </p>
    <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:normal;line-height:1.25;letter-spacing:-0.01em;color:#f4ecd8;">
      ${joinerName} ${action}.
    </h1>
    <p style="margin:0 0 40px;font-size:16px;line-height:1.7;color:#b8b0a0;font-weight:normal;">
      ${inviterName}, a thread is never woven by one hand alone. There is more here now than there was.
    </p>
    <div style="margin-bottom:48px;">
      <a href="${url}"
         style="display:inline-block;background:#b07a4a;color:#0e0e0c;text-decoration:none;padding:14px 32px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:normal;">
        open the thread →
      </a>
    </div>
    <div style="height:1px;background:#2a2a28;margin-bottom:28px;"></div>
    <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;line-height:1.8;color:#4a4a48;letter-spacing:0.06em;">
      heirloom.blue
    </p>
  </div>
</body>
</html>`;
}
