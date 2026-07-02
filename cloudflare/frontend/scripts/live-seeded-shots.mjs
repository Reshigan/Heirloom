import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '/private/tmp/heirloom-shots/live-authed';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://heirloom.blue';

export const USER = {
  id: 'u_demo', email: 'ada@heirloom.test', firstName: 'Ada', lastName: 'Vance',
  avatarUrl: null, emailVerified: true, twoFactorEnabled: false,
  preferredCurrency: 'USD', defaultThreadId: 't_demo',
};

const iso = (y, m = 6, d = 15) => new Date(Date.UTC(y, m - 1, d)).toISOString();

/* ── Seed payloads (shapes verified against pages + normalizers) ──────────── */

// memories → { data: [...] } ; metadata.entryDate is the lived date, metadata.dye the colour
const MEMORIES = [
  { id: 'm1', userId: 'u_demo', type: 'memory', title: 'The Old Oak Tree',
    description: 'Grandpa planted it the spring we moved to the farm. We measured our heights against its bark every birthday, and it outgrew all of us. Its shade is where the whole family learned to be still.\n\nIt still stands at the bend in the lane.',
    fileUrl: null, createdAt: iso(2026, 1, 4), metadata: { entryDate: iso(1971, 4, 12), dye: 'walnut' } },
  { id: 'm2', userId: 'u_demo', type: 'memory', title: "Grandma's Recipe",
    description: 'The bread she never wrote down. Flour by feel, a pinch of patience, and always one extra loaf for whoever knocked. I wrote it down at last so it would not be lost with her.',
    fileUrl: null, createdAt: iso(2026, 2, 2), metadata: { entryDate: iso(1985, 11, 3), dye: 'madder' } },
  { id: 'm3', userId: 'u_demo', type: 'memory', title: 'A Forgotten Song',
    description: 'Mum hummed it doing the dishes. I never knew the words, only the tune. It came back to me whole one night, thirty years on, and I cried in the kitchen.',
    fileUrl: null, createdAt: iso(2026, 3, 9), metadata: { entryDate: iso(1996, 7, 21), dye: 'saffron' } },
  { id: 'm4', userId: 'u_demo', type: 'memory', title: 'The Long Drive Home',
    description: 'Two days, one tape, every roadside diner between here and the coast. Dad let me steer on the empty stretches. We did not talk much. We did not need to.',
    fileUrl: null, createdAt: iso(2026, 4, 1), metadata: { entryDate: iso(2003, 9, 14), dye: 'woad' } },
  { id: 'm5', userId: 'u_demo', type: 'memory', title: 'First Snow on the Hill',
    description: 'The children woke us before dawn. We watched the whole valley go white from the upstairs window, all of us crowded under one blanket.',
    fileUrl: null, createdAt: iso(2026, 5, 6), metadata: { entryDate: iso(2014, 12, 24), dye: 'iron' } },
];

// letters → { data: [...] }
const LETTERS = [
  { id: 'l1', title: 'For Your Eighteenth', salutation: 'My dearest Mara',
    body: 'If you are reading this, you are grown, and I am so proud I can hardly write it. Here is everything I never managed to say across the breakfast table.\n\nBe brave. Be kind. Come home often.',
    sealedAt: iso(2026, 1, 20), createdAt: iso(2026, 1, 20), unlock_date: iso(2032, 5, 1),
    recipients: [{ name: 'Mara Vance' }], metadata: { dye: 'kermes' } },
  { id: 'l2', title: 'On Your Wedding Day', salutation: 'To my son',
    body: 'Whoever you have chosen, choose them again tomorrow, and the day after. That is the whole secret. Your grandmother told me the same, and she was right about most things.',
    sealedAt: iso(2026, 2, 11), createdAt: iso(2026, 2, 11), unlock_date: iso(2030, 8, 9),
    recipients: [{ name: 'Tom Vance' }], metadata: { dye: 'indigo' } },
  { id: 'l3', title: 'A Letter for No Reason', salutation: 'To whoever finds this',
    body: 'Some letters do not wait for an occasion. I simply wanted you to know the kitchen smelled of bread the day I wrote this, and I was happy.',
    sealedAt: null, createdAt: iso(2025, 12, 2), unlock_date: null,
    recipients: [{ name: 'The family' }], metadata: { dye: 'oakgall' } },
];

// voice → { data: [...] }
const VOICE = [
  { id: 'v1', title: 'How We Met', description: 'the story of the dance hall', fileUrl: null,
    duration: 222, transcript: 'It was raining, and the band kept playing past midnight. Your grandmother was the only one still dancing. I crossed the whole floor just to ask her name, and she pretended she had not noticed me watching all night.',
    createdAt: iso(2026, 1, 15), metadata: { dye: 'cochineal' } },
  { id: 'v2', title: 'The Farm at Dawn', description: 'morning chores', fileUrl: null,
    duration: 95, transcript: 'You could hear the whole valley wake up. The cattle first, then the kettle, then your great-aunt singing flat in the next room. I would not trade one of those mornings.',
    createdAt: iso(2026, 3, 22), metadata: { dye: 'weld' } },
];

// family → flat array; Constellation reads born / died
const FAMILY = [
  { id: 'f1', name: 'Eleanor Vance', relationship: 'grandmother', born: 1934, died: 2019, dye: 'madder' },
  { id: 'f2', name: 'Walter Vance', relationship: 'grandfather', born: 1931, died: 2008, dye: 'walnut' },
  { id: 'u_demo', name: 'Ada Vance', relationship: 'self', born: 1962, died: null, dye: 'saffron' },
  { id: 'f4', name: 'Mara Vance', relationship: 'daughter', born: 1989, died: null, dye: 'kermes' },
];

// thread members → { members: [...] } ; Weft century reads name/born_year etc.
const MEMBERS = [
  { id: 'f1', display_name: 'Eleanor Vance', name: 'Eleanor Vance', role: 'AUTHOR', born_year: 1934, died_year: 2019, generation_offset: -2 },
  { id: 'f2', display_name: 'Walter Vance', name: 'Walter Vance', role: 'AUTHOR', born_year: 1931, died_year: 2008, generation_offset: -2 },
  { id: 'u_demo', display_name: 'Ada Vance', name: 'Ada Vance', role: 'FOUNDER', born_year: 1962, died_year: null, generation_offset: 0, user_id: 'u_demo' },
  { id: 'f4', display_name: 'Mara Vance', name: 'Mara Vance', role: 'SUCCESSOR', born_year: 1989, died_year: null, generation_offset: 1 },
];

// thread entries → { entries: [...] } ; Constellation uses author_member_id + era_year for resonances
const ENTRIES = MEMORIES.map((m, i) => ({
  id: m.id, thread_id: 't_demo', author_member_id: MEMBERS[i % MEMBERS.length].id,
  title: m.title, era_year: new Date(m.metadata.entryDate).getFullYear(),
  created_at: m.createdAt, visibility: 'FAMILY',
}));

// inbox upcoming → { upcoming: [...] } (2 sealed, future)
const UPCOMING = [
  { unlock_id: 'up1', lock_type: 'DATE', unlock_date: iso(2032, 5, 1), age_years: null,
    target_member_id: 'f4', entry_id: 'l1', entry_title: 'For Your Eighteenth', thread_id: 't_demo',
    thread_name: 'The Vance Thread', target_name: 'Mara', target_birth_date: iso(1989, 5, 1),
    caller_role: 'FOUNDER', caller_generation: 0 },
  { unlock_id: 'up2', lock_type: 'AGE', unlock_date: null, age_years: 21,
    target_member_id: 'f4', entry_id: 'l2', entry_title: 'On Your Wedding Day', thread_id: 't_demo',
    thread_name: 'The Vance Thread', target_name: 'Tom', target_birth_date: iso(2009, 8, 9),
    caller_role: 'FOUNDER', caller_generation: 0 },
];

// inbox recent → { recent: [...] } (2 arrived)
const RECENT = [
  { unlock_id: 'rc1', lock_type: 'DATE', resolved_at: iso(2026, 5, 30), resolution_note: 'the date arrived',
    entry_id: 'm1', entry_title: 'The Old Oak Tree', thread_id: 't_demo', entry_created_at: iso(1971, 4, 12),
    thread_name: 'The Vance Thread', dye: 'walnut' },
  { unlock_id: 'rc2', lock_type: 'RECIPIENT_EVENT', resolved_at: iso(2026, 6, 8), resolution_note: 'a graduation',
    entry_id: 'm3', entry_title: 'A Forgotten Song', thread_id: 't_demo', entry_created_at: iso(1996, 7, 21),
    thread_name: 'The Vance Thread', dye: 'saffron' },
];

// memories received → { received: [...] } (2 for you)
const RECEIVED = [
  { id: 'm2', title: "Grandma's Recipe", type: 'memory', createdAt: iso(2026, 6, 1), from: 'Eleanor Vance', metadata: { dye: 'madder' } },
  { id: 'v1', title: 'How We Met', type: 'voice', createdAt: iso(2026, 5, 18), from: 'Walter Vance', metadata: { dye: 'cochineal' } },
];

// search → { results: [...], total }  (q=oak)
const SEARCH = {
  total: 4,
  results: [
    { id: 'm1', type: 'memory', title: 'The Old Oak Tree', snippet: 'Grandpa planted it the spring we moved to the farm. We measured our heights against its bark…', created_at: iso(1971, 4, 12), score: 0.98 },
    { id: 'm4', type: 'memory', title: 'The Long Drive Home', snippet: 'Two days, one tape, every roadside diner — past the oak groves on the coast road…', created_at: iso(2003, 9, 14), score: 0.62 },
    { id: 'l3', type: 'letter', title: 'A Letter for No Reason', snippet: 'the oak by the gate had just turned, and I was happy…', created_at: iso(2025, 12, 2), score: 0.55 },
    { id: 'v2', type: 'voice', title: 'The Farm at Dawn', snippet: 'the oak shade over the milking shed, the kettle, the singing…', created_at: iso(2026, 3, 22), score: 0.41 },
  ],
};

const PROFILE = {
  id: 'u_demo', email: 'ada@heirloom.test', firstName: 'Ada', lastName: 'Vance',
  birthDate: '1962-03-04', gender: 'woman', preferredCurrency: 'USD',
};
const NOTIFS = { preferences: { weeklyDigest: true, reminderEmails: true, pushNotifications: true, emailNotifications: true, marketingEmails: false } };
const STATS = { total: MEMORIES.length, memories: MEMORIES.length, letters: LETTERS.length, voice: VOICE.length };

/* ── Route resolver ───────────────────────────────────────────────────────── */
export function resolve(path, search) {
  // order matters — most specific first
  if (/\/auth\/me/.test(path)) return USER;
  if (/\/auth\/refresh/.test(path)) return { token: 'faketoken', refreshToken: 'fakeref' };

  if (/\/memories\/search/.test(path)) return SEARCH;
  if (/\/memories\/stats/.test(path)) return STATS;
  if (/\/memories\/received/.test(path)) return { received: RECEIVED, data: RECEIVED };
  if (/\/memories\/map/.test(path)) return { data: [], memories: [] };
  if (/\/memories\/[^/]+\/revisions/.test(path)) return { revisions: [] };
  if (/\/memories\/?$/.test(path)) return { data: MEMORIES, memories: MEMORIES, items: MEMORIES };

  if (/\/letters\/awaiting-me/.test(path)) return { data: [], awaiting: [] };
  if (/\/letters\/received/.test(path)) return { data: [], received: [] };
  if (/\/letters\/[^/]+\/revisions/.test(path)) return { revisions: [] };
  if (/\/letters\/?$/.test(path)) return { data: LETTERS, letters: LETTERS, items: LETTERS };

  if (/\/voice\/prompts/.test(path)) return { prompts: [], data: [] };
  if (/\/voice\/stats/.test(path)) return { total: VOICE.length };
  if (/\/voice\/[^/]+\/revisions/.test(path)) return { revisions: [] };
  if (/\/voice\/?$/.test(path)) return { data: VOICE, voice: VOICE, items: VOICE };

  if (/\/threads\/inbox\/upcoming/.test(path)) return { upcoming: UPCOMING, days: 365 };
  if (/\/threads\/inbox\/recent/.test(path)) return { recent: RECENT, days: 180 };
  if (/\/threads\/starter-prompts/.test(path)) return { prompts: [] };
  if (/\/threads\/[^/]+\/members/.test(path)) return { members: MEMBERS };
  if (/\/threads\/[^/]+\/entries/.test(path)) return { entries: ENTRIES };
  if (/\/threads\/[^/]+\/successors/.test(path)) return { successors: [] };
  if (/\/threads\/[^/]+$/.test(path)) return { thread: { id: 't_demo', name: 'The Vance Thread' }, membership: MEMBERS[2] };
  if (/\/threads\/?$/.test(path)) return { threads: [{ id: 't_demo', name: 'The Vance Thread', dedication: 'For those who come after.', plan: 'FAMILY', status: 'ACTIVE', default_visibility: 'FAMILY', role: 'FOUNDER', generation_offset: 0, entry_count: ENTRIES.length, member_count: MEMBERS.length, created_at: iso(2025, 12, 1) }] };

  if (/\/family\/[^/]+/.test(path)) return FAMILY[0];
  if (/\/family\/?$/.test(path)) return FAMILY;

  if (/\/settings\/profile/.test(path)) return PROFILE;
  if (/\/settings\/notifications/.test(path)) return NOTIFS;
  if (/\/settings\/inbox/.test(path)) return { data: [], messages: [] };
  if (/\/settings\/legacy-contacts/.test(path)) return { data: [] };

  if (/\/deadman\/status/.test(path)) return { status: 'active', nextCheckInDue: iso(2026, 9, 1), lastCheckIn: iso(2026, 6, 1) };
  if (/\/billing\/(subscription|limits)/.test(path)) return { tier: 'FAMILY', status: 'active' };
  if (/\/notifications/.test(path)) return { data: [], notifications: [] };
  if (/\/engagement|\/streaks|\/challenges|\/referrals|\/milestones/.test(path)) return { data: [] };
  if (/\/encryption\/(status|params|salt)/.test(path)) return { enabled: true };

  // generic safe fallback — satisfies array & envelope consumers
  return { data: [], items: [], results: [], total: 0, memories: [], letters: [], voice: [], members: [], entries: [], upcoming: [], recent: [], received: [], threads: [] };
}

/* ── Run ──────────────────────────────────────────────────────────────────── */
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, serviceWorkers: 'block',
});

await ctx.addInitScript(([u]) => {
  localStorage.setItem('token', 'faketoken');
  localStorage.setItem('refreshToken', 'fakeref');
  localStorage.setItem('heirloom-auth', JSON.stringify({ state: { user: u, isAuthenticated: true, _hasHydrated: true }, version: 0 }));
}, [USER]);

await ctx.route(/api\.heirloom\.blue/, async (route) => {
  const url = new URL(route.request().url());
  const body = resolve(url.pathname, url.search);
  await route.fulfill({
    status: 200, contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
});

const routes = [
  ['pwa', '/loom/pwa'], ['weft', '/loom/weft'], ['kin', '/loom/kin'],
  ['voice', '/loom/voice'], ['read', '/loom/read'], ['settings', '/settings'],
  ['compose', '/compose'], ['inbox', '/inbox'], ['search', '/search?q=oak'],
];

const summary = [];
for (const [name, r] of routes) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  p.on('pageerror', (e) => errs.push('PAGEERR ' + String(e.message).slice(0, 120)));
  await p.goto(BASE + r, { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => errs.push('NAV ' + e.message.slice(0, 80)));

  // Search has no ?q wiring — type into the field so results render.
  if (name === 'search') {
    const field = p.locator('input[aria-label="search"]');
    await field.fill('oak').catch(() => {});
    await p.waitForTimeout(700); // debounce 300ms + fetch
  }
  // Settings: open the Account row so populated fields show.
  if (name === 'settings') {
    await p.getByRole('button', { name: /Account/i }).first().click().catch(() => {});
    await p.waitForTimeout(400);
  }

  await p.waitForTimeout(2400);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

  const h = await p.evaluate(() => {
    const el = document.querySelector('h1, h2');
    return el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  });
  // crude populated heuristic — count list/entry rows + prose words
  const populated = await p.evaluate(() => {
    const txt = document.body.innerText || '';
    return txt.length > 400;
  });
  const line = `${name.padEnd(9)} url=${p.url().replace(BASE, '')} h="${h}" errs=${errs.length} populated=${populated ? 'YES' : 'no'}`;
  console.log(line);
  if (errs.length) errs.slice(0, 4).forEach((e) => console.log('   · ' + e));
  summary.push({ name, h, errs: errs.length, populated });
  await p.close();
}
await b.close();
console.log('\n→ shots in', OUT);
}
