/**
 * "On this day" resurfacing — the push half.
 *
 * GET /api/on-this-day only answers when someone thinks to ask, which means the
 * anniversary of a memory passes unnoticed by everyone who didn't open the app
 * that morning. Once a day we look for people who wrote something on this
 * month/day in a previous year and tell them.
 *
 * Push only — a registered device token IS the consent. Email would need its own
 * preference + unsubscribe path (see engagement.ts), and nobody asked for a new
 * mailing.
 *
 * Runs at 09:00 UTC in the daily-jobs block. Month/day come from UTC, same as
 * the route, so someone far east or west may get their anniversary nudge on the
 * shoulder of the day. Resurfacing is a gift, not a seal — unlike time-locks.ts,
 * being a few hours off costs nothing.
 */

import type { AppEnv } from '../index';
import { sendPushToUser } from '../routes/push-notifications';

interface Anniversary {
  user_id: string;
  n: number;
  oldest_years: number;
}

export async function pushOnThisDay(env: AppEnv['Bindings']): Promise<{
  candidates: number;
  pushed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const today = new Date();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');

  // One pass over the three content kinds, narrowed to users who actually have a
  // device to push to. Anyone else would be counted and then skipped anyway.
  const anniversaries = await env.DB.prepare(
    `WITH items AS (
       SELECT user_id, created_at FROM memories
       WHERE deleted_at IS NULL
       UNION ALL
       SELECT user_id, created_at FROM letters
       WHERE deleted_at IS NULL
       UNION ALL
       SELECT user_id, created_at FROM voice_recordings
       WHERE deleted_at IS NULL
     )
     SELECT i.user_id,
            COUNT(*) AS n,
            MAX(CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', i.created_at) AS INTEGER)) AS oldest_years
     FROM items i
     WHERE strftime('%m', i.created_at) = ?
       AND strftime('%d', i.created_at) = ?
       AND strftime('%Y', i.created_at) < strftime('%Y', 'now')
       AND EXISTS (SELECT 1 FROM device_tokens d WHERE d.user_id = i.user_id AND d.is_active = 1)
     GROUP BY i.user_id
     LIMIT 1000`,
  ).bind(mm, dd).all<Anniversary>();

  const candidates = anniversaries.results ?? [];
  let pushed = 0;

  for (const a of candidates) {
    try {
      const years = a.oldest_years === 1 ? 'a year ago today' : `${a.oldest_years} years ago today`;
      const result = await sendPushToUser(env, a.user_id, {
        title: 'On this day',
        body: a.n === 1
          ? `You lowered something into the Deep ${years}.`
          : `${a.n} things settled into the Deep on this day — the oldest ${years}.`,
        data: { url: '/on-this-day' },
      });
      if (result.success) pushed++;
    } catch (err: any) {
      errors.push(`user ${a.user_id}: ${err?.message ?? String(err)}`);
    }
  }

  return { candidates: candidates.length, pushed, errors };
}
