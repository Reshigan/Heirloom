// Daily entrypoint for the autonomous content engine.
//
// Subcommands:
//   tsx src/run.ts daily       — generate + variants + post for today's theme
//   tsx src/run.ts generate    — generate-only, write source post to disk
//   tsx src/run.ts preview     — dry-run, prints to stdout, no API calls except Claude
//   tsx src/run.ts post        — post pre-generated source post (from output/source.json)
//   tsx src/run.ts metrics     — pull metrics back for known post IDs
//
// Designed to be called by GitHub Actions on a daily cron. See
// .github/workflows/social-autopost.yml.

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { themeForDate } from "./themes.js";
import { generateSourcePost, SourcePost } from "./generate.js";
import { generateVariants } from "./variants.js";
import { post } from "./post.js";
import { pullMetrics, topHooks } from "./metrics.js";
import { PlatformKey } from "./voice.js";

const DEFAULT_PLATFORMS: PlatformKey[] = [
  "instagram",
  "tiktok",
  "pinterest",
  "facebook",
  "linkedin",
  "x",
];

function parsePlatforms(): PlatformKey[] {
  const env = process.env.PLATFORMS;
  if (!env) return DEFAULT_PLATFORMS;
  return env.split(",").map((p) => p.trim()) as PlatformKey[];
}

async function writeJson(rel: string, data: unknown): Promise<void> {
  const file = path.resolve(process.cwd(), rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

async function readJson<T>(rel: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), rel), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function generate(): Promise<SourcePost> {
  const date = new Date();
  const theme = themeForDate(date);
  const recent = await topHooks(20);

  console.log(`[generate] date=${date.toISOString().slice(0, 10)} theme=${theme.id}`);
  const source = await generateSourcePost({ theme, date, recentHooks: recent });

  const dateKey = date.toISOString().slice(0, 10);
  await writeJson(`output/${dateKey}/source.json`, { theme, source });
  await writeJson(`output/source.json`, { theme, source });

  console.log(`[generate] hook="${source.hook}"`);
  return source;
}

async function postAll(source?: SourcePost): Promise<void> {
  const today = source ?? (await readJson<{ source: SourcePost }>("output/source.json"))?.source;
  if (!today) {
    throw new Error("No source post found. Run `generate` first or check output/source.json.");
  }

  const platforms = parsePlatforms();
  console.log(`[variants] generating ${platforms.length} platform variants…`);
  const variants = await generateVariants({ source: today, platforms });

  const dateKey = new Date().toISOString().slice(0, 10);
  await writeJson(`output/${dateKey}/variants.json`, variants);

  console.log(`[post] dispatching ${variants.length} posts…`);
  const results = await Promise.all(variants.map((v) => post({ variant: v })));

  for (const r of results) {
    const tag = r.mode === "queue" ? "QUEUE" : r.ok ? "OK" : "FAIL";
    console.log(`[post] ${tag} ${r.platform}${r.error ? ` — ${r.error}` : ""}`);
  }

  await writeJson(`output/${dateKey}/results.json`, results);
}

async function preview(): Promise<void> {
  // Force queue-mode by clearing platform credentials. post() already routes
  // to queue when tokens are missing; this just makes it explicit for the
  // local preview command.
  delete process.env.META_PAGE_ACCESS_TOKEN;
  delete process.env.LINKEDIN_ACCESS_TOKEN;
  delete process.env.PINTEREST_ACCESS_TOKEN;
  delete process.env.BLUESKY_HANDLE;
  const source = await generate();
  await postAll(source);
  console.log(`\n[preview] complete — see output/${new Date().toISOString().slice(0, 10)}/`);
}

async function metrics(): Promise<void> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const results = (await readJson<{ id?: string; ok: boolean }[]>(
    `output/${dateKey}/results.json`,
  )) ?? [];
  const ids = results.filter((r) => r.ok && r.id).map((r) => r.id!);
  if (ids.length === 0) {
    console.log("[metrics] no post IDs to pull");
    return;
  }
  const m = await pullMetrics(ids);
  console.log(`[metrics] pulled ${m.length} datapoints`);
}

async function daily(): Promise<void> {
  const source = await generate();
  await postAll(source);
}

const cmd = process.argv[2] ?? "preview";
const handlers: Record<string, () => Promise<void>> = {
  generate: async () => {
    await generate();
  },
  post: async () => {
    await postAll();
  },
  preview,
  daily,
  metrics,
};

const handler = handlers[cmd];
if (!handler) {
  console.error(`Unknown command: ${cmd}. Try: ${Object.keys(handlers).join(", ")}`);
  process.exit(1);
}

handler().catch((err) => {
  console.error(err);
  process.exit(1);
});
