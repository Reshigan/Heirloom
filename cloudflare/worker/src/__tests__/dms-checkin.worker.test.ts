/**
 * Dead-man's-switch missed-check-in sweep tests.
 *
 * Guards the go-live fix to checkMissedCheckIns():
 *  - the sweep selects ACTIVE *and* WARNING rows (a WARNING row that misses
 *    another window must keep advancing — before the fix it was dropped after
 *    the first miss because the query filtered status = 'ACTIVE' only)
 *  - each non-triggering miss pushes next_check_in_due out by the grace period
 *    (so the row can't re-fire on the same cron tick and rocket to TRIGGERED)
 *  - the third miss flips the switch to TRIGGERED
 *  - rows that are CANCELLED, disabled, or not yet due are left untouched
 *
 * Runs in the real Workers runtime so the SQL executes against D1.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applyMigrations, seedUser } from './helpers/migrate';
import { checkMissedCheckIns } from '../index';

const PAST = '2020-01-01T00:00:00.000Z';
const FUTURE = '2999-01-01T00:00:00.000Z';

beforeEach(async () => {
  await applyMigrations(env.DB);
});

async function seedSwitch(userId: string, overrides: Record<string, unknown> = {}) {
  const id = `dms-${userId}`;
  const row = {
    enabled: 1,
    status: 'ACTIVE',
    grace_period_days: 7,
    missed_check_ins: 0,
    next_check_in_due: PAST,
    ...overrides,
  };
  await env.DB.prepare(
    `INSERT INTO dead_man_switches (id, user_id, enabled, status, grace_period_days, missed_check_ins, next_check_in_due)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      userId,
      row.enabled,
      row.status,
      row.grace_period_days,
      row.missed_check_ins,
      row.next_check_in_due,
    )
    .run();
  return id;
}

function readSwitch(id: string) {
  return env.DB.prepare('SELECT * FROM dead_man_switches WHERE id = ?').bind(id).first<any>();
}

/** Force the row back into the "due" window so the next sweep re-evaluates it. */
function forceDue(id: string) {
  return env.DB.prepare('UPDATE dead_man_switches SET next_check_in_due = ? WHERE id = ?')
    .bind(PAST, id)
    .run();
}

describe('checkMissedCheckIns — ACTIVE → WARNING → WARNING → TRIGGERED', () => {
  it('escalates across three missed windows and advances the due date each time', async () => {
    const userId = await seedUser(env.DB, { id: 'u-progress', email: 'progress@heirloom.blue' });
    const id = await seedSwitch(userId, { grace_period_days: 1 });

    // Sweep 1: first miss → WARNING, due date pushed into the future.
    await checkMissedCheckIns(env);
    let row = await readSwitch(id);
    expect(row.status).toBe('WARNING');
    expect(row.missed_check_ins).toBe(1);
    expect(new Date(row.next_check_in_due).getTime()).toBeGreaterThan(Date.now());
    expect(row.triggered_at).toBeNull();

    // A WARNING row that is NOT yet due again must be ignored by the sweep.
    await checkMissedCheckIns(env);
    row = await readSwitch(id);
    expect(row.missed_check_ins).toBe(1);

    // Sweep 2: another window elapsed → still WARNING, count climbs to 2.
    await forceDue(id);
    await checkMissedCheckIns(env);
    row = await readSwitch(id);
    expect(row.status).toBe('WARNING');
    expect(row.missed_check_ins).toBe(2);
    expect(row.triggered_at).toBeNull();

    // Sweep 3: third miss → TRIGGERED.
    await forceDue(id);
    await checkMissedCheckIns(env);
    row = await readSwitch(id);
    expect(row.status).toBe('TRIGGERED');
    expect(row.missed_check_ins).toBe(3);
    expect(row.triggered_at).not.toBeNull();
  });
});

describe('checkMissedCheckIns — leaves rows it should not touch', () => {
  it('ignores cancelled, disabled, and not-yet-due switches', async () => {
    const cancelledUser = await seedUser(env.DB, { id: 'u-cancel', email: 'cancel@heirloom.blue' });
    const disabledUser = await seedUser(env.DB, { id: 'u-disabled', email: 'disabled@heirloom.blue' });
    const futureUser = await seedUser(env.DB, { id: 'u-future', email: 'future@heirloom.blue' });

    const cancelled = await seedSwitch(cancelledUser, { status: 'CANCELLED' });
    const disabled = await seedSwitch(disabledUser, { enabled: 0 });
    const future = await seedSwitch(futureUser, { next_check_in_due: FUTURE });

    await checkMissedCheckIns(env);

    const c = await readSwitch(cancelled);
    expect(c.status).toBe('CANCELLED');
    expect(c.missed_check_ins).toBe(0);

    const d = await readSwitch(disabled);
    expect(d.status).toBe('ACTIVE');
    expect(d.missed_check_ins).toBe(0);

    const f = await readSwitch(future);
    expect(f.status).toBe('ACTIVE');
    expect(f.missed_check_ins).toBe(0);
  });
});
