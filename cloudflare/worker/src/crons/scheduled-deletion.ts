/**
 * Scheduled Account Deletion — GDPR Art. 17 / POPIA §23
 *
 * Runs daily. Finds users with status=ARCHIVED and delete_after <= now,
 * then performs the same full purge as DELETE /api/settings/account:
 * DB rows + R2 binary objects + Stripe customer deletion.
 */

import type { Env } from '../index';

export async function processScheduledDeletions(env: Env): Promise<{ deleted: number; errors: number }> {
  const now = new Date().toISOString();

  // Find up to 50 accounts due for deletion in this run
  const due = await env.DB.prepare(
    `SELECT id FROM users WHERE status = 'ARCHIVED' AND delete_after IS NOT NULL AND delete_after <= ? LIMIT 50`
  ).bind(now).all();

  let deleted = 0;
  let errors = 0;

  for (const row of due.results as { id: string }[]) {
    const userId = row.id;
    try {
      // Collect R2 keys and KV session IDs before purging DB rows
      const [memFiles, voiceFiles, activeSessions] = await Promise.all([
        env.DB.prepare(`SELECT file_key FROM memories WHERE user_id = ? AND file_key IS NOT NULL`).bind(userId).all(),
        env.DB.prepare(`SELECT file_key FROM voice_recordings WHERE user_id = ? AND file_key IS NOT NULL`).bind(userId).all(),
        env.DB.prepare(`SELECT id FROM sessions WHERE user_id = ?`).bind(userId).all(),
      ]);

      // Delete Stripe customer (GDPR Art. 17 — data must leave processor)
      const sub = await env.DB.prepare(`SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?`).bind(userId).first();
      const stripeCustomerId = (sub as any)?.stripe_customer_id as string | null;
      if (stripeCustomerId && env.STRIPE_SECRET_KEY) {
        try {
          await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}` },
          });
        } catch {
          console.error(`Stripe purge failed for user ${userId} customer ${stripeCustomerId}`);
        }
      }

      // Purge all DB rows — explicit because D1 does not enforce FK cascades
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM thread_members WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM threads WHERE founder_user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM device_tokens WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM password_resets WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM shamir_shares WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM notifications WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM legacy_contacts WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM recipient_messages WHERE creator_user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM dead_man_switches WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM post_reminder_emails WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM wrapped_data WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM support_tickets WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM audit_logs WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM voice_recordings WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM letters WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM memories WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM family_members WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM subscriptions WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId),
      ]);

      // Invalidate KV sessions
      await Promise.allSettled(
        (activeSessions.results as any[]).map((s: any) => env.KV.delete(`session:${s.id}`))
      );

      // Delete R2 binary objects (memories + voice + avatars)
      const fileKeys = [
        ...(memFiles.results as any[]).map((r) => r.file_key as string),
        ...(voiceFiles.results as any[]).map((r) => r.file_key as string),
      ];
      try {
        const listed = await env.STORAGE.list({ prefix: `avatars/${userId}/` });
        for (const obj of listed.objects) fileKeys.push(obj.key);
      } catch { /* list not critical */ }
      await Promise.allSettled(fileKeys.map((key) => env.STORAGE.delete(key)));

      deleted++;
      // PII / GDPR: never log the erased user's email at the moment of erasure. Log the id only.
      console.log(`Scheduled deletion complete: user ${userId}, ${fileKeys.length} R2 files purged`);
    } catch (err) {
      errors++;
      console.error(`Scheduled deletion failed for user ${userId}:`, err);
    }
  }

  return { deleted, errors };
}
