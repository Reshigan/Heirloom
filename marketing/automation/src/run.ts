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
import { themeForDate, evergreenThemeForDate, seasonForDate, seasonalHashtagsForDate } from "./themes.js";
import { generateSourcePost, SourcePost, hasGenProvider, activeProvider } from "./generate.js";
import { generateVariants } from "./variants.js";
import { post } from "./post.js";
import { pullMetrics, topHooks } from "./metrics.js";
import { PlatformKey } from "./voice.js";
import { renderWeave, uploadWeave } from "./image.js";
import type { Variant } from "./variants.js";

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

// One line per post already published today, so when the day fires several runs
// each new generation can be told exactly what to avoid. Survives across the
// day's separate CI jobs because output/ is committed back by the workflow.
interface LedgerEntry {
  hour: number;
  hook: string;
  saying: string;
}

async function readDayLedger(dateKey: string): Promise<LedgerEntry[]> {
  return (await readJson<LedgerEntry[]>(`output/${dateKey}/ledger.json`)) ?? [];
}

async function generate(): Promise<SourcePost> {
  const date = new Date();
  const dateKey = date.toISOString().slice(0, 10);
  const hour = date.getUTCHours();

  // Avoid-list = anything already posted today (same-day distinctness — the whole
  // point of multiple daily slots) plus any top historical hooks.
  const ledger = await readDayLedger(dateKey);

  // In-season variety: the day's first slot carries the seasonal theme; later
  // slots pull an evergreen theme so a peak window doesn't turn the feed into
  // one occasion on loop.
  const theme =
    seasonForDate(date) && ledger.length > 0
      ? evergreenThemeForDate(date, ledger.length)
      : themeForDate(date);
  const recent = [
    ...ledger.map((e) => e.hook),
    ...ledger.map((e) => e.saying),
    ...(await topHooks(20)),
  ];

  console.log(
    `[generate] date=${dateKey} hour=${hour} theme=${theme.id} avoid=${ledger.length} prior post(s) today`,
  );
  const source = await generateSourcePost({ theme, date, recentHooks: recent, slotSeed: hour });

  await writeJson(`output/${dateKey}/source.json`, { theme, source });
  await writeJson(`output/source.json`, { theme, source });

  // Record this run so the day's later slots avoid it.
  await writeJson(`output/${dateKey}/ledger.json`, [
    ...ledger,
    { hour, hook: source.hook, saying: source.saying },
  ]);

  console.log(`[generate] hook="${source.hook}"`);
  return source;
}

// Platform-specific tapestry images — each format is the brand cloth at the
// native aspect ratio for that platform. Override any via env var.
const BASE = process.env.SOCIAL_IMAGE_BASE_URL || "https://heirloom.blue";
const IMAGES: Record<string, string> = {
  // Square tapestry cloth — Instagram feed, TikTok thumbnail
  instagram: process.env.SOCIAL_IMAGE_SQUARE || `${BASE}/social-square.png`,
  tiktok:    process.env.SOCIAL_IMAGE_SQUARE || `${BASE}/social-square.png`,
  // Vertical tapestry cloth — Pinterest pin (2:3)
  pinterest: process.env.SOCIAL_IMAGE_VERTICAL || `${BASE}/social-vertical.png`,
  // Landscape OG card (1200×630) — Bluesky, Twitter/X, LinkedIn, Facebook
  bluesky:   process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
  twitter:   process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
  linkedin:  process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
  facebook:  process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
  threads:   process.env.SOCIAL_IMAGE_SQUARE || `${BASE}/social-square.png`,
};
const DEFAULT_IMAGE = process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`;

function imageForPlatform(platform: string): string {
  return IMAGES[platform.toLowerCase()] ?? DEFAULT_IMAGE;
}

// Render a distinct woven-cloth + saying image for one variant, write it to the
// run's output dir for inspection, upload it to R2, and return its public URL.
// Falls back to the static platform image if rendering or upload fails (e.g. no
// admin token in a dry-run) so a post never goes out image-less.
interface RenderedImage {
  // Public URL — uploaded weave when R2 is configured, else the static fallback.
  url: string;
  // Raw rendered bytes, attached directly to platforms that take binary uploads
  // (Bluesky/Facebook) so the saying-image lands even without R2/admin token.
  bytes: Uint8Array | null;
}

async function imageForVariant(
  v: Variant,
  saying: string,
  dateKey: string,
  slot: number,
): Promise<RenderedImage> {
  try {
    const png = renderWeave({
      saying,
      width: v.imageSpec.width,
      height: v.imageSpec.height,
      // Slot in the seed so a day's separate runs weave a visibly different
      // cloth, not the same pattern repeated under different sayings.
      seed: `${dateKey}-${slot}-${v.platform}`,
    });
    const filename = `weave-${dateKey}-${slot}-${v.platform}.png`;
    // Persist locally so preview/CI runs leave the images on disk for review.
    const localPath = path.resolve(process.cwd(), `output/${dateKey}/images/${filename}`);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, png);

    const url = await uploadWeave(png, filename);
    if (url) {
      console.log(`[image] ${v.platform} → ${url}`);
      return { url, bytes: png };
    }
    // No R2 upload (e.g. no admin token) — still hand the bytes to the poster so
    // Bluesky/Facebook get the real woven saying-image, not the static picture.
    console.log(`[image] ${v.platform} → rendered, attaching bytes directly (no R2 upload)`);
    return { url: imageForPlatform(v.platform), bytes: png };
  } catch (err) {
    console.error(`[image] ${v.platform} render failed — static fallback`, err);
  }
  return { url: imageForPlatform(v.platform), bytes: null };
}

async function postAll(source?: SourcePost): Promise<void> {
  const today = source ?? (await readJson<{ source: SourcePost }>("output/source.json"))?.source;
  if (!today) {
    throw new Error("No source post found. Run `generate` first or check output/source.json.");
  }

  const platforms = parsePlatforms();
  const seasonHashtags = seasonalHashtagsForDate();
  if (seasonHashtags.length) {
    console.log(`[variants] seasonal discovery tags active: ${seasonHashtags.join(", ")}`);
  }
  console.log(`[variants] generating ${platforms.length} platform variants…`);
  const variants = await generateVariants({ source: today, platforms, seasonHashtags });

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const slot = now.getUTCHours();
  await writeJson(`output/${dateKey}/variants.json`, variants);

  // Observability: output/ is gitignored, so log the per-platform hashtag count
  // here — it's the only way to confirm tags are being generated in CI.
  console.log(
    `[variants] hashtags: ${variants
      .map((v) => `${v.platform}=${v.hashtags.length}[${v.hashtags.join(",")}]`)
      .join(" ")}`,
  );

  // Bluesky thread: body + CTA as replies to the hook post, last gets link card
  const blueskyThread = today
    ? [today.body.slice(0, 280), today.cta.slice(0, 200)]
    : undefined;

  // Render + upload one distinct cloth image per variant, keyed to today's
  // saying. Done before posting so each platform gets its own woven image rather
  // than the same static picture every day.
  console.log(`[image] rendering ${variants.length} cloth images for saying: "${today.saying}"`);
  const images = await Promise.all(
    variants.map((v) => imageForVariant(v, today.saying, dateKey, slot)),
  );

  console.log(`[post] dispatching ${variants.length} posts…`);
  const results = await Promise.all(
    variants.map((v, i) =>
      post({
        variant: v,
        imageUrl: images[i].url,
        ...(images[i].bytes ? { imageBytes: images[i].bytes! } : {}),
        ...(v.platform === "bluesky" && blueskyThread ? { blueskyThread } : {}),
        imageAlt: today.saying,
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

// Always-on slots (UTC hours) that run every day, year-round — two posts a day
// (≈9am and 5pm ET). The 17:00 slot is seasonal-only: it fires solely inside the
// four high-intent windows (Mother's/Father's/Grandparents/Christmas), lifting
// the cadence to three a day during a peak. Brand voice rule 14 holds — this
// account has near-zero followers, so volume buys nothing; distinct, shareable
// pieces at a calm cadence read as a person, six a day reads as a bot.
const ALWAYS_ON_HOURS = new Set([13, 21]);

async function daily(): Promise<void> {
  // Always-on slots run every day. Any non-always-on scheduled slot skips cleanly
  // outside a seasonal window. Manual workflow_dispatch is always intentional, so
  // it never skips.
  const now = new Date();
  const season = seasonForDate(now);
  const isAlwaysOnSlot = ALWAYS_ON_HOURS.has(now.getUTCHours());
  const scheduled = process.env.GITHUB_EVENT_NAME === "schedule";
  if (scheduled && !isAlwaysOnSlot && !season) {
    console.log("[skip] seasonal-only slot and no season is active today. Nothing posted.");
    return;
  }
  if (season) console.log(`[daily] seasonal window active: ${season.id}`);
  const source = await generate();
  await postAll(source);
}

// Update Bluesky profile avatar + description with the tapestry icon.
// Reads icon-512.png from the sibling cloudflare/frontend/public tree.
async function updateBlueskyProfile(): Promise<void> {
  const handle   = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) { console.log("[profile] BLUESKY_HANDLE or BLUESKY_APP_PASSWORD not set"); return; }

  const sessRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const sess = (await sessRes.json().catch(() => ({}))) as { accessJwt?: string; did?: string };
  if (!sess.accessJwt || !sess.did) { console.error("[profile] auth failed"); return; }

  // Load icon — try repo-relative path first, then fall back to live URL
  let iconBytes: Buffer;
  const iconRelPath = path.resolve(process.cwd(), "../../cloudflare/frontend/public/icons/icon-512.png");
  try {
    iconBytes = await fs.readFile(iconRelPath);
    console.log("[profile] loaded icon from repo");
  } catch {
    console.log("[profile] icon not found locally, fetching from live site…");
    const r = await fetch("https://heirloom.blue/icons/icon-512.png");
    if (!r.ok) { console.error("[profile] could not fetch icon"); return; }
    iconBytes = Buffer.from(await r.arrayBuffer()) as Buffer;
  }

  const blobRes = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
    method: "POST",
    headers: { "Content-Type": "image/png", Authorization: `Bearer ${sess.accessJwt}` },
    body: iconBytes as unknown as BodyInit,
  });
  const { blob: avatarBlob } = (await blobRes.json().catch(() => ({}))) as { blob?: object };
  if (!avatarBlob) { console.error("[profile] uploadBlob failed"); return; }
  console.log("[profile] avatar blob uploaded");

  // Fetch existing profile to preserve other fields
  const prRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${sess.did}&collection=app.bsky.actor.profile&rkey=self`,
    { headers: { Authorization: `Bearer ${sess.accessJwt}` } },
  );
  const existing = prRes.ok ? ((await prRes.json().catch(() => ({}))) as { value?: Record<string, unknown> }) : {};
  const current = existing.value ?? {};

  const newProfile = {
    ...current,
    $type: "app.bsky.actor.profile",
    displayName: current.displayName ?? "Heirloom",
    description: "Start your family's thousand-year thread. Every memory, every voice, every generation — woven together forever.\n\nheirloom.blue",
    avatar: avatarBlob,
  };

  await fetch("https://bsky.social/xrpc/com.atproto.repo.putRecord", {
    method: "POST",
    headers: { Authorization: `Bearer ${sess.accessJwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ repo: sess.did, collection: "app.bsky.actor.profile", rkey: "self", record: newProfile }),
  });
  console.log("[profile] ✓ profile updated — avatar, description refreshed");
}

// Delete all posts from the Bluesky account and repost today's content.
// Used to purge old-branding posts when the social image changes.
async function purgeBluesky(): Promise<void> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) { console.log("[purge] BLUESKY_HANDLE or BLUESKY_APP_PASSWORD not set"); return; }

  const sessRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const sess = (await sessRes.json().catch(() => ({}))) as { accessJwt?: string; did?: string };
  if (!sess.accessJwt || !sess.did) { console.error("[purge] auth failed"); return; }

  // List all posts
  let cursor: string | undefined;
  const toDelete: { uri: string; rkey: string }[] = [];
  do {
    const url = `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${sess.did}&collection=app.bsky.feed.post&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${sess.accessJwt}` } });
    const j = (await r.json().catch(() => ({}))) as { records?: { uri: string }[]; cursor?: string };
    for (const rec of j.records ?? []) {
      const rkey = rec.uri.split("/").pop()!;
      toDelete.push({ uri: rec.uri, rkey });
    }
    cursor = j.cursor;
  } while (cursor);

  console.log(`[purge] deleting ${toDelete.length} Bluesky posts…`);
  for (const { rkey } of toDelete) {
    await fetch("https://bsky.social/xrpc/com.atproto.repo.deleteRecord", {
      method: "POST", headers: { Authorization: `Bearer ${sess.accessJwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ repo: sess.did, collection: "app.bsky.feed.post", rkey }),
    });
    console.log(`[purge] deleted ${rkey}`);
  }
  console.log("[purge] done — reposting with new image…");
}

const cmd = process.argv[2] ?? "preview";

// Commands that drive an LLM for generation/variants. If no provider is
// configured, the engine is simply dormant — exit cleanly rather than
// red-failing the daily cron. Platform creds are already optional (post()
// routes to the queue when tokens are missing), so a missing provider is the
// only thing that should ever stop a run, and it stops it quietly. Add either
// Cloudflare Workers AI (free) or Anthropic creds in repo settings to wake it.
const NEEDS_LLM = new Set(["generate", "daily", "preview", "post", "purge"]);
if (NEEDS_LLM.has(cmd) && !hasGenProvider()) {
  console.log(
    "[dormant] no generation provider configured — marketing engine is idle. " +
      "Add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (free Workers AI) or " +
      "ANTHROPIC_API_KEY to wake it. Nothing posted.",
  );
  process.exit(0);
}
if (NEEDS_LLM.has(cmd)) console.log(`[provider] generating with ${activeProvider()}`);

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
  // purge + repost: wipe all Bluesky posts then post fresh with new image
  purge: async () => {
    await purgeBluesky();
    const source = await generate();
    await postAll(source);
  },
  // update-profile: refresh Bluesky avatar + bio (no post generated)
  "update-profile": async () => {
    await updateBlueskyProfile();
  },
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
