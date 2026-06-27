/**
 * Silent-delivery regression guard.
 *
 * sendEmail returns { success: false } (never throws) when the provider rejects
 * a send. The bug: delivery paths marked letter_deliveries DELIVERED and stamped
 * letters.delivered_at on no-exception alone, so a rejected send was recorded as
 * delivered and never retried. In the test runtime there are no email creds, so
 * every send naturally returns success:false — exactly the failure case.
 *
 * The fix: a failed send must leave the delivery row PENDING and the letter's
 * delivered_at NULL, so the next cron pass (delivered_at IS NULL) retries it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applyMigrations, seedUser } from './helpers/migrate';
import { processScheduledLetters } from '../index';

const PAST = '2020-01-01T00:00:00.000Z';

beforeEach(async () => {
  await applyMigrations(env.DB);
});

describe('processScheduledLetters — failed send is not marked delivered', () => {
  it('leaves the delivery PENDING and the letter unstamped when the send fails', async () => {
    const userId = await seedUser(env.DB, { id: 'u-sl', email: 'author@heirloom.blue' });

    await env.DB.prepare(
      `INSERT INTO letters (id, user_id, title, salutation, body, signature, delivery_trigger, scheduled_date, sealed_at, delivered_at)
       VALUES ('l-1', ?, 't', 'Dear', 'body', 'sig', 'SCHEDULED', ?, ?, NULL)`,
    ).bind(userId, PAST, PAST).run();
    await env.DB.prepare(
      `INSERT INTO family_members (id, user_id, name, email) VALUES ('fm-1', ?, 'Kid', 'kid@example.com')`,
    ).bind(userId).run();
    await env.DB.prepare(
      `INSERT INTO letter_recipients (id, letter_id, family_member_id) VALUES ('lr-1', 'l-1', 'fm-1')`,
    ).run();
    await env.DB.prepare(
      `INSERT INTO letter_deliveries (id, letter_id, recipient_email, status) VALUES ('ld-1', 'l-1', 'kid@example.com', 'PENDING')`,
    ).run();

    const res = await processScheduledLetters(env);
    expect(res.errors).toBe(1); // the rejected send is counted, not swallowed

    const row = await env.DB.prepare(`SELECT status, delivered_at FROM letter_deliveries WHERE id = 'ld-1'`).first<any>();
    expect(row.status).toBe('PENDING');      // NOT DELIVERED
    expect(row.delivered_at).toBeNull();

    const letter = await env.DB.prepare(`SELECT delivered_at FROM letters WHERE id = 'l-1'`).first<any>();
    expect(letter.delivered_at).toBeNull();  // re-picked by the next cron pass
  });
});
