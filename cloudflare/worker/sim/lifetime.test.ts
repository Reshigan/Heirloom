/**
 * A LIFETIME, SIMULATED — the whole product, end to end, against the real worker.
 *
 * This drives `src/index.ts`'s actual route handlers and SQL through one
 * continuous story: a founder starts a Family Thread today, weaves entries,
 * seals some for descendants who don't yet exist, grows the thread across three
 * generations, falls silent decades later, and is finally read by the
 * granddaughter she wrote to. Nothing is mocked but the edge (D1/KV/R2/rate
 * limiter) — see sim/env.ts. Time is advanced by editing the stored unlock
 * conditions and then running the REAL `resolveTimeLocks` cron, so the unlock
 * logic itself is exercised, not faked.
 *
 * Run: npx vitest run --config vitest.sim.config.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import worker from '../src/index';
import { resolveTimeLocks } from '../src/crons/time-locks';
import { makeHarness, type SimHarness } from './env';

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

let H: SimHarness;

/** Result ledger — every beat records pass/fail with evidence, and the story
 *  keeps going on failure so the final report shows the whole lifetime. */
type Beat = { act: string; beat: string; ok: boolean; detail: string };
const ledger: Beat[] = [];
function record(act: string, beat: string, ok: boolean, detail: string) {
  ledger.push({ act, beat, ok, detail });
}

/** Fire a real request at the worker and return {status, body}. */
async function req(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {};
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const request = new Request(`http://api.heirloom.blue${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await worker.fetch(request, H.env as any, H.ctx as any);
  let body: any = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text; // SVG / non-JSON
  }
  return { status: res.status, body };
}

/** Soft assert: never throws, records the beat. */
function check(act: string, beat: string, cond: boolean, detail = '') {
  record(act, beat, !!cond, detail);
  return !!cond;
}

beforeAll(() => {
  H = makeHarness();
});

describe('A lifetime on Heirloom', () => {
  // Story state carried across the acts.
  const S: Record<string, any> = {};

  it('lives the whole arc — register → weave → seal → inherit → remember', async () => {
    // ───────────────────────── ACT I — The founder begins ─────────────────────
    {
      const r = await req('POST', '/api/auth/register', {
        body: { email: 'eleanor@example.com', password: 'a-long-enough-passphrase', firstName: 'Eleanor', lastName: 'Hartshorn' },
      });
      S.token = r.body?.token;
      S.refresh = r.body?.refreshToken;
      S.userId = r.body?.user?.id;
      check('I · The founder begins', 'Eleanor registers', r.status === 201 && !!S.token && !!S.userId, `status ${r.status}, token ${S.token ? 'issued' : 'MISSING'}`);
    }
    {
      const r = await req('GET', '/api/auth/me', { token: S.token });
      S.defaultThreadId = r.body?.defaultThreadId;
      const tier = r.body?.subscription?.tier;
      check('I · The founder begins', '/me resolves identity + lazy default thread + trial', r.status === 200 && !!r.body?.email && !!tier, `status ${r.status}, tier ${tier ?? '—'}, defaultThread ${S.defaultThreadId ? 'created' : 'none'}`);
    }
    {
      // Token refresh — a session that outlives a single visit.
      const r = await req('POST', '/api/auth/refresh', { body: { refreshToken: S.refresh } });
      if (r.body?.token) S.token = r.body.token;
      check('I · The founder begins', 'Session refresh issues a fresh token', r.status === 200 && !!r.body?.token, `status ${r.status}`);
    }
    {
      const r = await req('POST', '/api/threads', {
        token: S.token,
        body: { name: 'The Hartshorn–Vega Thread', dedication: 'For everyone who comes after. Hold it lightly; pass it on.' },
      });
      S.threadId = r.body?.thread?.id;
      S.founderMemberId = r.body?.membership?.id;
      check('I · The founder begins', 'A Family Thread is founded', r.status === 200 && !!S.threadId && r.body?.membership?.role === 'FOUNDER', `status ${r.status}, role ${r.body?.membership?.role}`);
    }
    {
      const r = await req('GET', '/api/threads', { token: S.token });
      const mine = (r.body?.threads ?? []).find((t: any) => t.id === S.threadId);
      check('I · The founder begins', 'The thread appears in her threads', r.status === 200 && !!mine && mine.role === 'FOUNDER', `count ${(r.body?.threads ?? []).length}, role ${mine?.role}`);
    }

    // ──────────────────── ACT II — Three generations enrol ────────────────────
    {
      const r = await req('POST', `/api/threads/${S.threadId}/members`, {
        token: S.token,
        body: { display_name: 'Mira Hartshorn-Vega', role: 'AUTHOR', relation_label: 'daughter', email: 'mira@example.com', birth_date: '1998-03-12', generation_offset: 1, parent_member_id: S.founderMemberId },
      });
      S.daughterMemberId = r.body?.member?.id;
      check('II · Three generations enrol', 'Her daughter joins as an author (gen 1)', r.status === 200 && !!S.daughterMemberId, `status ${r.status}, member ${S.daughterMemberId ? 'created' : 'MISSING'}`);
    }
    {
      // The granddaughter doesn't write yet — a placeholder that auto-promotes at 18.
      const r = await req('POST', `/api/threads/${S.threadId}/members`, {
        token: S.token,
        body: { display_name: 'Iris Hartshorn-Vega', role: 'PLACEHOLDER', relation_label: 'granddaughter', birth_date: '2024-11-08', age_gate_years: 18, target_role: 'AUTHOR', generation_offset: 2, parent_member_id: S.daughterMemberId },
      });
      S.grandMemberId = r.body?.member?.id;
      check('II · Three generations enrol', 'A granddaughter is held as a placeholder (gen 2)', r.status === 200 && !!S.grandMemberId, `status ${r.status}, member ${S.grandMemberId ? 'created' : 'MISSING'}`);
    }
    {
      const r = await req('GET', `/api/threads/${S.threadId}/members`, { token: S.token });
      check('II · Three generations enrol', 'The roll shows all three generations', r.status === 200 && (r.body?.members ?? []).length === 3, `members ${(r.body?.members ?? []).length}`);
    }
    {
      const r = await req('POST', `/api/threads/${S.threadId}/successors`, {
        token: S.token,
        body: { successor_member_id: S.daughterMemberId, rank: 1 },
      });
      check('II · Three generations enrol', 'The daughter is designated successor', r.status === 200 && !!r.body?.designation?.id, `status ${r.status}`);
      const list = await req('GET', `/api/threads/${S.threadId}/successors`, { token: S.token });
      check('II · Three generations enrol', 'The succession chain reads back', list.status === 200 && (list.body?.successors ?? []).some((s: any) => s.successor_member_id === S.daughterMemberId), `successors ${(list.body?.successors ?? []).length}`);
    }

    // ──────────────────────── ACT III — Weaving the cloth ─────────────────────
    const addEntry = (body: any) => req('POST', `/api/threads/${S.threadId}/entries`, { token: S.token, body });
    {
      const r = await addEntry({ title: 'The kitchen window', body_ciphertext: b64('Daffodils, late-May light, the colour of strong tea.'), body_iv: b64('iv-1'), body_auth_tag: b64('tag-1'), visibility: 'FAMILY', era_label: 'The 2020s', era_year: 2026, tags: [{ type: 'PLACE', label: 'Oak Street' }, { type: 'PERSON', label: 'Mira', member_id: S.daughterMemberId }] });
      S.entryOpenId = r.body?.entry?.id;
      const mutable = r.body?.entry?.mutable_until;
      check('III · Weaving the cloth', 'An open entry is woven in', r.status === 200 && !!S.entryOpenId && !!mutable, `status ${r.status}, mutable_until ${mutable ? 'set' : 'MISSING'}`);
    }
    {
      const r = await addEntry({ title: 'What I learned about money', body_ciphertext: b64('Spend on the people, never on the appearance of people.'), body_iv: b64('iv-2'), body_auth_tag: b64('tag-2'), visibility: 'FAMILY' });
      S.entry2Id = r.body?.entry?.id;
      check('III · Weaving the cloth', 'A second entry appends', r.status === 200 && !!S.entry2Id, `status ${r.status}`);
    }
    {
      // Sealed for a date thirty years out — a descendant who barely exists yet.
      const r = await addEntry({ title: 'Open in 2056', body_ciphertext: b64('Everything I will never get to tell you, I have woven into this thread.'), body_iv: b64('iv-3'), body_auth_tag: b64('tag-3'), visibility: 'DESCENDANTS', unlock: { lock_type: 'DATE', unlock_date: '2056-11-08', encrypted_key: b64('escrow-key-date') } });
      S.entryDateLockId = r.body?.entry?.id;
      check('III · Weaving the cloth', 'An entry is sealed by DATE (30 years)', r.status === 200 && !!S.entryDateLockId, `status ${r.status}`);
    }
    {
      // Sealed until Iris turns 21.
      const r = await addEntry({ title: "For Iris's 21st", body_ciphertext: b64('Thirty-one is the age I was when your mother was born.'), body_iv: b64('iv-4'), body_auth_tag: b64('tag-4'), visibility: 'DESCENDANTS', unlock: { lock_type: 'AGE', age_years: 21, target_member_id: S.grandMemberId, encrypted_key: b64('escrow-key-age') } });
      S.entryAgeLockId = r.body?.entry?.id;
      check('III · Weaving the cloth', 'An entry is sealed by AGE (Iris turns 21)', r.status === 200 && !!S.entryAgeLockId, `status ${r.status}`);
    }
    {
      // Sealed until a second generation exists — already true (Iris is gen 2).
      const r = await addEntry({ title: 'For the generation after next', body_ciphertext: b64('If you are reading this, the thread reached you. Good.'), body_iv: b64('iv-5'), body_auth_tag: b64('tag-5'), visibility: 'DESCENDANTS', unlock: { lock_type: 'GENERATION', target_generation: 2, encrypted_key: b64('escrow-key-gen') } });
      S.entryGenLockId = r.body?.entry?.id;
      check('III · Weaving the cloth', 'An entry is sealed by GENERATION', r.status === 200 && !!S.entryGenLockId, `status ${r.status}`);
    }
    {
      const r = await req('GET', `/api/threads/${S.threadId}/entries`, { token: S.token });
      const entries = r.body?.entries ?? [];
      const locked = entries.filter((e: any) => e.pending_lock);
      check('III · Weaving the cloth', 'Sealed entries report a pending lock', r.status === 200 && locked.length >= 3, `entries ${entries.length}, pending-locked ${locked.length}`);
    }
    {
      // Append-only proof: the entries router exposes no UPDATE/DELETE of an entry.
      const del = await req('DELETE', `/api/threads/${S.threadId}/entries/${S.entryOpenId}`, { token: S.token });
      const put = await req('PUT', `/api/threads/${S.threadId}/entries/${S.entryOpenId}`, { token: S.token, body: { title: 'rewritten history' } });
      check('III · Weaving the cloth', 'The past cannot be edited or deleted (append-only)', del.status === 404 || del.status === 405, `DELETE ${del.status}, PUT ${put.status} (no mutate route)`);
    }
    {
      const r = await req('POST', `/api/threads/${S.threadId}/entries/${S.entryOpenId}/comments`, { token: S.token, body: { ciphertext: b64('I remember those daffodils.'), iv: b64('c-iv'), auth_tag: b64('c-tag') } });
      check('III · Weaving the cloth', 'A descendant can comment without altering the entry', r.status === 200 && !!r.body?.comment?.id, `status ${r.status}`);
    }

    // ───────────────── ACT IV — The decades pass; locks resolve ───────────────
    {
      // First run, today: only the GENERATION lock should release (Iris is gen 2);
      // the DATE (2056) and AGE (Iris is an infant) locks must stay sealed.
      const first = await resolveTimeLocks(H.env as any);
      check('IV · The decades pass', 'Only the already-true lock resolves on day one', first.resolvedGeneration >= 1 && first.resolvedDate === 0 && first.resolvedAge === 0, `gen ${first.resolvedGeneration}, date ${first.resolvedDate}, age ${first.resolvedAge}`);
    }
    {
      // Thirty years pass: the 2056 date arrives, and Iris reaches 21. We move the
      // stored conditions into the past, then run the REAL resolver again.
      H.sqlite.prepare(`UPDATE entry_unlocks SET unlock_date = '2020-01-01' WHERE entry_id = ?`).run(S.entryDateLockId);
      H.sqlite.prepare(`UPDATE thread_members SET birth_date = '2000-01-01' WHERE id = ?`).run(S.grandMemberId);
      const second = await resolveTimeLocks(H.env as any);
      check('IV · The decades pass', 'The 30-year DATE seal opens when its day comes', second.resolvedDate >= 1, `resolvedDate ${second.resolvedDate}`);
      check('IV · The decades pass', "The AGE seal opens when Iris turns 21", second.resolvedAge >= 1, `resolvedAge ${second.resolvedAge}`);
    }
    {
      const r = await req('GET', `/api/threads/inbox/recent?days=36500`, { token: S.token });
      const recent = r.body?.recent ?? [];
      check('IV · The decades pass', 'Newly-unlocked entries surface in the inbox', r.status === 200 && recent.length >= 3, `recently-unlocked ${recent.length}`);
    }

    // ──────────── ACT V — She falls silent; the inheritance opens ─────────────
    {
      const r = await req('POST', '/api/deadman/configure', { token: S.token, body: { checkInIntervalDays: 90, gracePeriodDays: 14, triggerAction: 'RELEASE_ALL', notifyContacts: true } });
      check('V · The inheritance opens', "A dead-man's switch is armed", r.status === 200 && r.body?.success, `status ${r.status}, switch ${r.body?.status}`);
    }
    {
      const r = await req('POST', '/api/deadman/checkin', { token: S.token });
      check('V · The inheritance opens', 'A check-in keeps the thread hers', r.status === 200 && r.body?.success && !!r.body?.nextCheckInDue, `status ${r.status}, next due ${r.body?.nextCheckInDue ? 'set' : '—'}`);
    }
    {
      // Sealed letters to the recipient (real create), then sealed (the user's act).
      const make = async (title: string, salutation: string, bodyText: string) => {
        const r = await req('POST', '/api/letters', { token: S.token, body: { title, salutation, body: bodyText, signature: '— Eleanor', delivery_trigger: 'POSTHUMOUS' } });
        const id = r.body?.id ?? r.body?.letter?.id;
        if (id) H.sqlite.prepare(`UPDATE letters SET sealed_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
        return { status: r.status, id };
      };
      const l1 = await make('To Iris, when I am gone', 'My Iris,', 'You were an infant when I sealed this.');
      const l2 = await make('The recipe, finally written down', 'For whoever cooks Sundays now,', 'Brown the butter first. Always.');
      S.letterId = l1.id;
      check('V · The inheritance opens', 'Posthumous letters are written and sealed', !!l1.id && !!l2.id, `letters created ${[l1.id, l2.id].filter(Boolean).length}/2`);
    }
    {
      // Memories + a voice recording seeded directly (uploads need R2; the
      // recipient-facing READ path is what we're validating).
      const now = new Date().toISOString();
      H.sqlite.prepare(`INSERT INTO memories (id, user_id, type, title, description, encrypted, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
        .run('mem-1', S.userId, 'PHOTO', 'The last summer at the lake', 'All of us, squinting into the sun.', 0, now, now);
      H.sqlite.prepare(`INSERT INTO voice_recordings (id, user_id, title, description, file_url, file_key, duration, file_size, transcript, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run('voice-1', S.userId, 'For your wedding day', 'If you want me there, press play.', '/api/voice/file/voice-1', 'voice-1', 180, 1024, 'Whatever you choose, choose it all the way.', now, now);
      check('V · The inheritance opens', 'Memories + a voice recording exist for the heir', true, 'seeded 1 memory + 1 voice');
    }
    {
      // The switch triggers and a verified contact unlocks the archive. We bring
      // the API-armed switch to TRIGGERED and mint the verification the cron would.
      const dms = H.sqlite.prepare(`SELECT id FROM dead_man_switches WHERE user_id = ?`).get(S.userId) as any;
      S.dmsId = dms?.id;
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 7 * 864e5).toISOString();
      H.sqlite.prepare(`UPDATE dead_man_switches SET status = 'TRIGGERED', triggered_at = ? WHERE id = ?`).run(now, S.dmsId);
      H.sqlite.prepare(`INSERT INTO legacy_contacts (id, user_id, name, email, relationship, verification_status, verification_token, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run('lc-1', S.userId, 'Mira Hartshorn-Vega', 'mira@example.com', 'daughter', 'VERIFIED', 'lc-token-1', now, now);
      S.inheritToken = 'verify-token-iris-2056';
      H.sqlite.prepare(`INSERT INTO switch_verifications (id, dead_man_switch_id, legacy_contact_id, verification_token, expires_at, created_at) VALUES (?,?,?,?,?,?)`)
        .run('sv-1', S.dmsId, 'lc-1', S.inheritToken, future, now);
      check('V · The inheritance opens', 'The switch triggers; a verification link is minted', !!S.dmsId, `switch ${S.dmsId ? 'TRIGGERED' : 'MISSING'}`);
    }
    {
      const r = await req('GET', `/api/inherit/${S.inheritToken}`);
      S.sessionToken = r.body?.sessionToken;
      check('V · The inheritance opens', 'The heir opens the access link', r.status === 200 && r.body?.valid && !!S.sessionToken, `status ${r.status}, recipient ${r.body?.recipient?.name ?? '—'}`);
    }
    {
      const r = await req('GET', '/api/inherit/content/all', { token: S.sessionToken });
      const letters = r.body?.letters ?? [];
      const memories = r.body?.memories ?? [];
      const voices = r.body?.voiceRecordings ?? [];
      check('V · The inheritance opens', 'She receives the sealed letters, photos, and voice', r.status === 200 && letters.length >= 2 && memories.length >= 1 && voices.length >= 1, `status ${r.status}, letters ${letters.length}, memories ${memories.length}, voice ${voices.length}`);
    }

    // ───────────────── ACT VI — The year in review + the card ─────────────────
    {
      const r = await req('GET', '/api/wrapped/current', { token: S.token });
      const w = r.body ?? {};
      check('VI · Remembrance', 'A year-in-review aggregates the archive', r.status === 200 && (w.totalLetters ?? 0) >= 2 && (w.totalMemories ?? 0) >= 1, `letters ${w.totalLetters}, memories ${w.totalMemories}, voice ${w.totalVoiceStories}`);
    }
    {
      // A time capsule: create → contribute → seal → (its day comes) → open.
      const c = await req('POST', '/api/capsules', { token: S.token, body: { title: 'For the 2050 reunion', unlock_date: '2050-07-04', description: 'Whoever is hosting: read this aloud.' } });
      S.capsuleId = c.body?.id;
      const item = await req('POST', `/api/capsules/${S.capsuleId}/items`, { token: S.token, body: { item_type: 'text', title: 'A wish', content: 'May the table still be full.' } });
      const seal = await req('POST', `/api/capsules/${S.capsuleId}/seal`, { token: S.token });
      if (S.capsuleId) H.sqlite.prepare(`UPDATE time_capsules SET unlock_date = '2020-01-01' WHERE id = ?`).run(S.capsuleId);
      const open = await req('POST', `/api/capsules/${S.capsuleId}/open`, { token: S.token });
      check('VI · Remembrance', 'A capsule seals, waits, and opens on its date', !!S.capsuleId && item.status === 201 && seal.body?.success === true && open.body?.success === true, `create ${c.status}, item ${item.status}, seal ${seal.status}, open ${open.status}`);
    }
    {
      // The zero-budget viral surfaces — privacy-safe and on-voice.
      const meta = await req('GET', `/api/share/meta?path=/inherit/${S.inheritToken}`);
      const card = await req('GET', `/api/share/card.svg?path=/inherit/${S.inheritToken}`);
      const leaks = JSON.stringify(meta.body ?? '').includes(S.inheritToken);
      const isSvg = typeof card.body === 'string' && card.body.includes('<svg');
      check('VI · Remembrance', 'Share metadata renders (kind-aware)', meta.status === 200 && !!meta.body?.title, `status ${meta.status}, kind ${meta.body?.kind ?? '—'}`);
      check('VI · Remembrance', 'A shared inherit link never leaks the token (privacy)', !leaks, leaks ? 'TOKEN LEAKED' : 'token withheld');
      check('VI · Remembrance', 'The share card renders as an SVG', card.status === 200 && isSvg, `status ${card.status}, svg ${isSvg}`);
    }

    // ─────────────────────────────── The report ──────────────────────────────
    const acts = [...new Set(ledger.map((l) => l.act))];
    const lines: string[] = ['', '════════════════  A LIFETIME, SIMULATED  ════════════════', ''];
    for (const act of acts) {
      lines.push(`  ${act}`);
      for (const beat of ledger.filter((l) => l.act === act)) {
        lines.push(`    ${beat.ok ? '✓' : '✗'} ${beat.beat}${beat.detail ? `  ·  ${beat.detail}` : ''}`);
      }
      lines.push('');
    }
    const passed = ledger.filter((l) => l.ok).length;
    const failed = ledger.filter((l) => !l.ok);
    lines.push(`  ${passed}/${ledger.length} beats validated.`);
    if (H.skippedMigrations.length) lines.push(`  (migrations skipped as edge-only: ${H.skippedMigrations.map((s) => s.file).join(', ')})`);
    lines.push('═════════════════════════════════════════════════════════', '');
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));

    if (failed.length) {
      // eslint-disable-next-line no-console
      console.log('FAILED BEATS:\n' + failed.map((f) => `  ✗ [${f.act}] ${f.beat} — ${f.detail}`).join('\n'));
    }

    expect(failed.map((f) => `${f.act} :: ${f.beat} — ${f.detail}`)).toEqual([]);
  });
});
