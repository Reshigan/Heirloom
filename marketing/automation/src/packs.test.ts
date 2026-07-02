// Runnable check for the packs track — `npx tsx src/packs.test.ts`.
import assert from "node:assert";
import { PACK_LIBRARY, packForSlot, previewSchedule } from "./packs.js";

// Every generated SourcePost must satisfy the generate.ts schema bounds, or the
// variant/post pipeline rejects it at runtime.
const bound = (s: string, lo: number, hi: number) => s.length >= lo && s.length <= hi;
for (const pack of Object.values(PACK_LIBRARY)) {
  assert.ok(pack.sayings.length >= 10, `${pack.needState}: want a deep library`);
  assert.ok(new Set(pack.sayings).size === pack.sayings.length, `${pack.needState}: duplicate saying`);
  for (const saying of pack.sayings) {
    assert.ok(bound(saying, 8, 160), `saying out of bounds: "${saying}" (${saying.length})`);
  }
}

// Determinism: same date+slot → identical pack.
const d = new Date(Date.UTC(2026, 6, 1, 0, 0, 0));
assert.deepStrictEqual(packForSlot(d, 13), packForSlot(d, 13));

// A SourcePost from the rotation satisfies every schema bound.
const s = packForSlot(d, 13).source;
assert.ok(bound(s.hook, 5, 200) && bound(s.body, 40, 800) && bound(s.cta, 5, 200), "source field bounds");
assert.ok(bound(s.saying, 8, 160) && bound(s.imagePrompt, 20, 600) && s.hashtags.length <= 12, "source field bounds 2");

// Over a 90-day run all four need-states appear and a single day's two slots are
// different audiences (variety, not the same pack twice in a day).
const sched = previewSchedule(d, 90);
const states = new Set(sched.map((x) => x.needState));
assert.strictEqual(states.size, 4, "all four need-states must appear over the quarter");
// Within a day: the two always-on slots never share an audience, and no saying
// repeats (the seasonal 17:00 slot MAY repeat the season's audience — that is
// the peak push — but never a saying).
const byDate = new Map<string, { slot: number; needState: string; saying: string }[]>();
for (const x of sched) byDate.set(x.date, [...(byDate.get(x.date) ?? []), x]);
for (const [date, rows] of byDate) {
  const alwaysOn = rows.filter((r) => r.slot !== 17).map((r) => r.needState);
  assert.strictEqual(new Set(alwaysOn).size, alwaysOn.length, `day ${date}: always-on slots repeat audience`);
  const sayings = rows.map((r) => r.saying);
  assert.strictEqual(new Set(sayings).size, sayings.length, `day ${date}: repeated saying`);
}

// A saying should not repeat within ~3 weeks across the ALWAYS-ON rotation.
// (The seasonal 17:00 push reuses its 14-saying library more densely by design,
// so it's excluded here; same-day uniqueness above still covers it.)
const seen = new Map<string, number>();
let minGap = Infinity;
sched.filter((x) => x.slot !== 17).forEach((x, i) => {
  const key = `${x.needState}:${x.saying}`;
  if (seen.has(key)) minGap = Math.min(minGap, i - seen.get(key)!);
  seen.set(key, i);
});
assert.ok(minGap === Infinity || minGap >= 14, `saying repeat too soon: gap ${minGap} posts`);

console.log("packs.test.ts: all assertions passed");
console.log(`library size: ${Object.values(PACK_LIBRARY).reduce((n, p) => n + p.sayings.length, 0)} sayings across 4 need-states`);
