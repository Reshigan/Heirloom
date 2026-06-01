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

// On-brand image attached to every post. Instagram and Pinterest REQUIRE an
// image URL (text-only can't publish there), and a photo post lifts reach on
// Facebook too. Defaults to the live, brand-correct OG card already served on
// the site; override with SOCIAL_IMAGE_URL to point at a per-post card later
// without touching code. Must be a publicly fetchable raster (PNG/JPEG) —
// platform servers fetch it directly, so SVG won't do.
const SOCIAL_IMAGE_URL =
  process.env.SOCIAL_IMAGE_URL || "https://heirloom.blue/og-image.png";

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

  // Bluesky thread: body + CTA as replies to the hook post, last gets link card
  const blueskyThread = today
    ? [today.body.slice(0, 280), today.cta.slice(0, 200)]
    : undefined;

  console.log(`[post] dispatching ${variants.length} posts… (image: ${SOCIAL_IMAGE_URL})`);
  const results = await Promise.all(
    variants.map((v) =>
      post({
        variant: v,
        imageUrl: SOCIAL_IMAGE_URL,
        ...(v.platform === "bluesky" && blueskyThread ? { blueskyThread } : {}),
      }),
    ),
  );

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

// Commands that drive Claude for generation/variants. If the one hard
// requirement (ANTHROPIC_API_KEY) is absent, the engine is simply dormant —
// exit cleanly rather than red-failing the daily cron. Platform creds are
// already optional (post() routes to the queue when tokens are missing), so a
// dormant key is the only thing that should ever stop a run, and it stops it
// quietly. Add the secret in repo settings to wake the engine.
const NEEDS_CLAUDE = new Set(["generate", "daily", "preview", "post"]);
if (NEEDS_CLAUDE.has(cmd) && !process.env.ANTHROPIC_API_KEY) {
  console.log(
    "[dormant] ANTHROPIC_API_KEY not set — marketing engine is idle. " +
      "Add ANTHROPIC_API_KEY (and any platform secrets) to wake it. Nothing posted.",
  );
  process.exit(0);
}

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
