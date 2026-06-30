// Monthly content planner.
//
// Once a month a cron builds the WHOLE next month of posts up front, biased by
// what families are actually doing on the system right now (signals.ts), and
// writes them to a committed plan file. The daily autopost run then prefers the
// planned post for today's exact date+hour, falling back to live generation when
// no plan entry exists — so the engine degrades gracefully if the monthly job
// never ran.
//
// "Adjusting by what is happening on the system" = each month's plan reflects
// that month's signal snapshot; next month's run re-reads signals and shifts.

import fs from "node:fs/promises";
import path from "node:path";
import { themeForDate, evergreenThemeForDate, seasonForDate } from "./themes.js";
import { generateSourcePost, SourcePost } from "./generate.js";
import { fetchSignals, signalHint } from "./signals.js";
import { resolveSlotHour } from "./slot.js";

// Slots per day, UTC hours — must match ALWAYS_ON_HOURS + the seasonal slot in
// run.ts and the crons in social-autopost.yml.
const ALWAYS_ON = [13, 23];
const SEASONAL = 17;

export interface PlannedPost {
  date: string; // YYYY-MM-DD (UTC)
  hour: number; // UTC hour of the slot
  themeId: string;
  source: SourcePost;
}

// Key a plan entry by date+hour so the daily run looks up exactly its slot.
export function planKey(dateKey: string, hour: number): string {
  return `${dateKey}-${String(hour).padStart(2, "0")}`;
}

export function planFileForMonth(year: number, month: number): string {
  return `output/plan/${year}-${String(month).padStart(2, "0")}.json`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function planMonth(year: number, month: number): Promise<Record<string, PlannedPost>> {
  const signals = await fetchSignals();
  const hint = signalHint(signals);
  console.log(
    `[plan] ${year}-${String(month).padStart(2, "0")} signals=${
      signals
        ? `users:${signals.users} mem:${signals.memories} let:${signals.letters} voice:${signals.voiceRecordings} (as of ${signals.asOf})`
        : "unavailable (planning signal-blind)"
    }`,
  );
  if (hint) console.log(`[plan] steer: ${hint}`);

  const plan: Record<string, PlannedPost> = {};
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Running avoid-list so the month doesn't repeat its own angles/openings.
  const recent: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateKey = date.toISOString().slice(0, 10);
    const season = seasonForDate(date);
    const hours = season ? [...ALWAYS_ON, SEASONAL].sort((a, b) => a - b) : ALWAYS_ON;

    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i];
      // First slot of a seasonal day carries the season; later slots pull an
      // evergreen theme, mirroring run.ts so a peak window isn't one occasion
      // on loop.
      const theme = season && i > 0 ? evergreenThemeForDate(date, i) : themeForDate(date);
      const slotDate = new Date(Date.UTC(year, month - 1, day, hour));
      try {
        const source = await generateSourcePost({
          theme,
          date: slotDate,
          recentHooks: recent.slice(-30),
          slotSeed: hour,
          signalHint: hint,
        });
        plan[planKey(dateKey, hour)] = { date: dateKey, hour, themeId: theme.id, source };
        recent.push(source.hook, source.saying);
        console.log(`[plan] ${dateKey} ${String(hour).padStart(2, "0")}:00 ${theme.id} ✓`);
        await sleep(1200); // polite rate-limit between generations
      } catch (err) {
        console.error(
          `[plan] ${dateKey} ${String(hour).padStart(2, "0")}:00 FAIL: ${(err as Error).message}`,
        );
      }
    }
  }

  const file = planFileForMonth(year, month);
  const abs = path.resolve(process.cwd(), file);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, JSON.stringify(plan, null, 2), "utf-8");
  console.log(`[plan] wrote ${Object.keys(plan).length} posts → ${file}`);
  return plan;
}

// The planned post for a given date+hour, or null if none — the daily run's
// preferred source, with live generation as the fallback.
export async function plannedPostFor(date: Date): Promise<SourcePost | null> {
  const file = planFileForMonth(date.getUTCFullYear(), date.getUTCMonth() + 1);
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), file), "utf-8");
    const plan = JSON.parse(raw) as Record<string, PlannedPost>;
    const entry = plan[planKey(date.toISOString().slice(0, 10), resolveSlotHour(date))];
    return entry?.source ?? null;
  } catch {
    return null;
  }
}
