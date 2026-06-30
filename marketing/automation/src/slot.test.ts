// Runnable check for resolveSlotHour — `npx tsx src/slot.test.ts`.
// The whole point of the helper is that GitHub's drifted fire time must NOT
// decide the slot; SLOT_HOUR (the intended cron hour) must win, with wall-clock
// as the only fallback. These asserts fail loudly if that inverts.
import assert from "node:assert";
import { resolveSlotHour } from "./slot.js";

// A fixed "drifted" clock: a 13:00 cron that actually fired at 15:42.
const drifted = new Date(Date.UTC(2026, 5, 30, 15, 42, 0));

function withEnv(value: string | undefined, fn: () => void): void {
  const prev = process.env.SLOT_HOUR;
  if (value === undefined) delete process.env.SLOT_HOUR;
  else process.env.SLOT_HOUR = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.SLOT_HOUR;
    else process.env.SLOT_HOUR = prev;
  }
}

// Intended hour wins over the drifted wall-clock — the core fix.
withEnv("13", () => assert.strictEqual(resolveSlotHour(drifted), 13));
withEnv("23", () => assert.strictEqual(resolveSlotHour(drifted), 23));
withEnv("0", () => assert.strictEqual(resolveSlotHour(drifted), 0));

// No / blank / invalid / out-of-range env → fall back to wall-clock hour.
withEnv(undefined, () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("", () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("  ", () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("nope", () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("24", () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("-1", () => assert.strictEqual(resolveSlotHour(drifted), 15));
withEnv("13.5", () => assert.strictEqual(resolveSlotHour(drifted), 15));

console.log("slot.test.ts: all assertions passed");
