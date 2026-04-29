/**
 * Time-lock resolution cron.
 *
 * For every entry_unlock that has matured (DATE in the past, AGE reached,
 * GENERATION condition satisfied), mark the unlock resolved and notify the
 * relevant Thread members. AUTHOR_DEATH and RECIPIENT_EVENT locks require
 * explicit human verification flows and are NOT auto-resolved here — they
 * have their own workflows in the deadman + recipient routes.
 *
 * Runs daily at 09:00 UTC alongside the rest of the adoption-jobs block.
 *
 * Per /THREAD.md, when a lock resolves the entry's encryption key is
 * released to its readers. The encryption envelope is delivered in a
 * separate phase; until that ships, "release" means setting
 * resolved_at + emailing readers that the entry is now visible.
 */

import type { AppEnv } from '../index';
import { sendEmail } from '../utils/email';

interface PendingUnlock {
  id: string;
  entry_id: string;
  thread_id: string;
  thread_name: string | null;
  lock_type: string;
  unlock_date: string | null;
  age_years: number | null;
  target_member_id: string | null;
  target_member_name: string | null;
  target_email: string | null;
  target_user_id: string | null;
  birth_date: string | null;
  target_generation: number | null;
  entry_title: string | null;
  author_member_id: string;
}

function ageOn(birth: string, asOf: Date): number {
  const b = new Date(birth);
  let age = asOf.getUTCFullYear() - b.getUTCFullYear();
  const m = asOf.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export async function resolveTimeLocks(env: AppEnv['Bindings']): Promise<{
  resolvedDate: number;
  resolvedAge: number;
  resolvedGeneration: number;
  notifications: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const now = new Date();
  const nowISO = now.toISOString();
  let notifications = 0;

  // Pull every pending unlock with the context we need to resolve + notify
  // in one query. SQLite/D1 doesn't have a great window-function story, so
  // this stays as straightforward joins.
  const pending = await env.DB.prepare(
    `SELECT
       u.id, u.entry_id, u.lock_type, u.unlock_date, u.age_years,
       u.target_member_id, u.target_generation,
       e.thread_id, e.title as entry_title, e.author_member_id,
       t.name as thread_name,
       tm.display_name as target_member_name,
       tm.email as target_email,
       tm.user_id as target_user_id,
       tm.birth_date as birth_date
     FROM entry_unlocks u
     INNER JOIN thread_entries e ON e.id = u.entry_id
     INNER JOIN threads t ON t.id = e.thread_id
     LEFT JOIN thread_members tm ON tm.id = u.target_member_id
     WHERE u.resolved_at IS NULL
       AND u.lock_type IN ('DATE', 'AGE', 'GENERATION')
     LIMIT 500`,
  ).all<PendingUnlock>();

  let resolvedDate = 0;
  let resolvedAge = 0;
  let resolvedGeneration = 0;

  for (const lock of pending.results ?? []) {
    try {
      let shouldResolve = false;
      let resolutionNote = '';

      if (lock.lock_type === 'DATE' && lock.unlock_date) {
        if (new Date(lock.unlock_date) <= now) {
          shouldResolve = true;
          resolutionNote = `Date reached (${lock.unlock_date.slice(0, 10)})`;
          resolvedDate++;
        }
      } else if (lock.lock_type === 'AGE' && lock.age_years && lock.birth_date) {
        if (ageOn(lock.birth_date, now) >= lock.age_years) {
          shouldResolve = true;
          resolutionNote = `${lock.target_member_name ?? 'Recipient'} reached age ${lock.age_years}`;
          resolvedAge++;
        }
      } else if (lock.lock_type === 'GENERATION' && lock.target_generation != null) {
        const descendant = await env.DB.prepare(
          `SELECT id FROM thread_members
           WHERE thread_id = ? AND revoked_at IS NULL AND generation_offset >= ?
           LIMIT 1`,
        ).bind(lock.thread_id, lock.target_generation).first();
        if (descendant) {
          shouldResolve = true;
          resolutionNote = `Generation ${lock.target_generation} member exists`;
          resolvedGeneration++;
        }
      }

      if (!shouldResolve) continue;

      await env.DB.prepare(
        `UPDATE entry_unlocks
         SET resolved_at = ?, resolution_note = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(nowISO, resolutionNote, nowISO, lock.id).run();

      // Notify the entry's eligible readers. For DATE/GENERATION locks
      // every active member of the thread should be told. For AGE locks
      // the specific target gets the primary email; the rest of the
      // family gets an optional informational note (skipped for now —
      // not all families will want it).
      if (lock.lock_type === 'AGE' && lock.target_email) {
        await sendUnlockNotification(env, {
          to: lock.target_email,
          name: lock.target_member_name ?? 'You',
          threadName: lock.thread_name ?? 'your family thread',
          entryTitle: lock.entry_title,
          threadId: lock.thread_id,
          entryId: lock.entry_id,
          context: resolutionNote,
        });
        notifications++;
      } else {
        // Notify all active readers + authors of the thread.
        const readers = await env.DB.prepare(
          `SELECT DISTINCT email
           FROM thread_members
           WHERE thread_id = ?
             AND revoked_at IS NULL
             AND email IS NOT NULL
             AND email NOT LIKE '%placeholder.heirloom.blue'`,
        ).bind(lock.thread_id).all<{ email: string }>();

        for (const r of readers.results ?? []) {
          await sendUnlockNotification(env, {
            to: r.email,
            name: '',
            threadName: lock.thread_name ?? 'your family thread',
            entryTitle: lock.entry_title,
            threadId: lock.thread_id,
            entryId: lock.entry_id,
            context: resolutionNote,
          });
          notifications++;
        }
      }
    } catch (err: any) {
      errors.push(`unlock ${lock.id}: ${err.message ?? String(err)}`);
    }
  }

  return { resolvedDate, resolvedAge, resolvedGeneration, notifications, errors };
}

interface NotificationInput {
  to: string;
  name: string;
  threadName: string;
  entryTitle: string | null;
  threadId: string;
  entryId: string;
  context: string;
}

async function sendUnlockNotification(env: AppEnv['Bindings'], input: NotificationInput): Promise<void> {
  const titleLine = input.entryTitle ? `"${input.entryTitle}"` : 'A new entry';
  const greeting = input.name ? `Dear ${input.name},` : 'Dear reader,';
  const url = `${env.APP_URL ?? 'https://heirloom.blue'}/threads/${input.threadId}#entry-${input.entryId}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background:#0a0c10; color:#f5f3ee; margin:0; padding:40px;">
  <div style="max-width:600px; margin:0 auto;">
    <div style="text-align:center; padding:24px 0; border-bottom:1px solid rgba(201,169,89,0.25);">
      <span style="font-size:32px; color:#c9a959;">∞</span>
      <h1 style="color:#c9a959; font-weight:300; letter-spacing:3px; margin:6px 0 0;">HEIRLOOM</h1>
    </div>
    <div style="padding:36px 0; line-height:1.7;">
      <p>${greeting}</p>
      <p>An entry in <strong>${escapeHtml(input.threadName)}</strong> just unlocked for you.</p>
      <p style="font-style:italic; color:#c9a959;">${escapeHtml(titleLine)}</p>
      <p style="color:rgba(245,243,238,0.55); font-size:14px;">${escapeHtml(input.context)}</p>
      <div style="text-align:center; margin:32px 0;">
        <a href="${url}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#c9a959,#b8963e); color:#0a0c10; text-decoration:none; border-radius:8px; font-weight:600;">Open the thread</a>
      </div>
      <p style="color:rgba(245,243,238,0.5); font-size:13px;">Some entries in your family's thread are written today and locked for years. This is one of those.</p>
    </div>
    <div style="text-align:center; color:rgba(245,243,238,0.4); font-size:12px; padding:16px 0;">
      Heirloom — the family thread that outlives all of us.
    </div>
  </div>
</body>
</html>`;

  await sendEmail(env, {
    from: 'Heirloom <noreply@heirloom.blue>',
    to: input.to,
    subject: `An entry just unlocked in ${input.threadName}`,
    html,
  }, 'THREAD_ENTRY_UNLOCKED');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
