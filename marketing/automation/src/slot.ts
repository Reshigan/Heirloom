// Resolve the INTENDED posting-slot hour (UTC, 0–23).
//
// GitHub's scheduled workflows drift off the cron minute — a `0 13 * * *` job
// routinely fires at 13:40, and much later under load — so `new Date()` at run
// time is an unreliable slot identity. When the wall-clock hour drifts out of
// ALWAYS_ON_HOURS the day's posts get silently skipped (the real cause of the
// "seasonal-only slot, nothing posted" no-ops). The autopost workflow passes the
// intended slot hour from `github.event.schedule` via SLOT_HOUR; trust it. Fall
// back to wall-clock only for manual `workflow_dispatch` / local runs where it
// is unset.
export function resolveSlotHour(now: Date = new Date()): number {
  const env = process.env.SLOT_HOUR;
  if (env && env.trim() !== "") {
    const n = Number(env);
    if (Number.isInteger(n) && n >= 0 && n <= 23) return n;
  }
  return now.getUTCHours();
}
