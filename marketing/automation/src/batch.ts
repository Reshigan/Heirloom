// Batch content generation for a range of ISO weeks.
//
// Generates source posts + all-platform variants for each week in the range
// and writes them to output/batch/YYYY-WW/ so they can be reviewed and
// scheduled before the daily cron picks them up.
//
// Usage:
//   tsx src/batch.ts [startWeek] [endWeek] [year]
//   tsx src/batch.ts          # current week → week 48, current year
//   tsx src/batch.ts 22 48    # weeks 22-48 of current year
//   tsx src/batch.ts 22 48 2026

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { themeForDate } from "./themes.js";
import { generateSourcePost } from "./generate.js";
import { generateVariants } from "./variants.js";
import { PlatformKey } from "./voice.js";

const PLATFORMS: PlatformKey[] = [
  "instagram",
  "tiktok",
  "pinterest",
  "facebook",
  "linkedin",
  "x",
];

// ISO week → Monday date (UTC).
function mondayOfISOWeek(week: number, year: number): Date {
  // January 4th is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));
  const target = new Date(week1Monday);
  target.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return target;
}

function isoWeekLabel(date: Date): string {
  // e.g. "2026-W22"
  const year = date.getUTCFullYear();
  const week = (themeForDate(date) as any)._week; // we recompute below
  const tmp = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const isoWeek = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${year}-W${String(isoWeek).padStart(2, "0")}`;
}

async function writeJson(rel: string, data: unknown): Promise<void> {
  const file = path.resolve(process.cwd(), rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const nowYear = new Date().getUTCFullYear();

  // Current ISO week
  const today = new Date();
  const tmp = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const currentWeek = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  const startWeek = args[0] ? parseInt(args[0], 10) : currentWeek;
  const endWeek = args[1] ? parseInt(args[1], 10) : 48;
  const year = args[2] ? parseInt(args[2], 10) : nowYear;

  if (isNaN(startWeek) || isNaN(endWeek) || startWeek > endWeek) {
    console.error(
      `Usage: tsx src/batch.ts [startWeek] [endWeek] [year]\n  Example: tsx src/batch.ts 22 48 2026`
    );
    process.exit(1);
  }

  const totalWeeks = endWeek - startWeek + 1;
  console.log(
    `[batch] generating ${totalWeeks} weeks (${year} W${startWeek}–W${endWeek})…`
  );
  console.log(`[batch] platforms: ${PLATFORMS.join(", ")}`);
  console.log(`[batch] output → output/batch/\n`);

  let succeeded = 0;
  let failed = 0;

  for (let week = startWeek; week <= endWeek; week++) {
    const monday = mondayOfISOWeek(week, year);
    const weekLabel = isoWeekLabel(monday);
    const theme = themeForDate(monday);
    const outDir = `output/batch/${weekLabel}`;

    // Skip if already generated (idempotent re-runs).
    try {
      await fs.access(path.resolve(process.cwd(), `${outDir}/source.json`));
      console.log(`[batch] ${weekLabel} — skip (already exists)`);
      succeeded++;
      continue;
    } catch {
      // not cached, generate
    }

    try {
      process.stdout.write(
        `[batch] ${weekLabel} (${monday.toISOString().slice(0, 10)}) theme="${theme.id}"… `
      );

      const source = await generateSourcePost({
        theme,
        date: monday,
      });

      const variants = await generateVariants({ source, platforms: PLATFORMS });

      await writeJson(`${outDir}/source.json`, { week: weekLabel, date: monday.toISOString().slice(0, 10), theme, source });
      await writeJson(`${outDir}/variants.json`, variants);

      console.log(`ok`);
      succeeded++;

      // Polite rate limiting — 1.5s between Claude calls to avoid throttling.
      if (week < endWeek) await sleep(1500);
    } catch (err) {
      console.error(`FAIL: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(
    `\n[batch] done — ${succeeded} generated, ${failed} failed. See output/batch/`
  );
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "[batch] ANTHROPIC_API_KEY not set. Add it to your .env file or environment."
  );
  process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
