// Daily entrypoint for the autonomous content engine.
//
// Subcommands:
//   tsx src/run.ts daily       — generate + variants + post for today's theme
//   tsx src/run.ts generate    — generate-only, write source post to disk
//   tsx src/run.ts preview     — dry-run, prints to stdout, no API calls except Claude
//   tsx src/run.ts post        — post pre-generated source post (from output/source.json)
//   tsx src/run.ts metrics     — pull metrics back for known post IDs
//   tsx src/run.ts engage      — daily organic-growth work-list (no posting)
//
// Designed to be called by GitHub Actions on a daily cron. See
// .github/workflows/social-autopost.yml.

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { themeForDate, evergreenThemeForDate, brandThemeForDate, seasonForDate, seasonalHashtagsForDate } from "./themes.js";
import { resolveSlotHour } from "./slot.js";
import { generateSourcePost, SourcePost, hasGenProvider, activeProvider } from "./generate.js";
import { generateVariants, buildPackVariants, sanitizeCaption } from "./variants.js";
import { post } from "./post.js";
import { pullMetrics, topHooks } from "./metrics.js";
import { engage } from "./engage.js";
import { planMonth, plannedPostFor } from "./plan.js";
import { PlatformKey } from "./voice.js";
import { renderWeave, renderDeepVideo, uploadWeave } from "./image.js";
import { packForSlot } from "./packs.js";
import type { Variant } from "./variants.js";

const DEFAULT_PLATFORMS: PlatformKey[] = ["facebook", "bluesky"];

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
  const hour = resolveSlotHour(date);

  const ledger = await readDayLedger(dateKey);

  // Prefer the pre-built monthly plan for this exact slot. The monthly cron
  // (plan-month) generates the whole month up front, biased by live system
  // signals — so using it here means the day's post already reflects "what's
  // happening on the system". Falls back to live generation below when no plan
  // entry exists (zero regression if the monthly job never ran).
  const planned = await plannedPostFor(date);
  if (planned) {
    console.log(`[generate] using planned post for ${dateKey} ${hour}:00 (monthly plan)`);
    await writeJson(`output/${dateKey}/source.json`, { source: planned });
    await writeJson(`output/source.json`, { source: planned });
    await writeJson(`output/${dateKey}/ledger.json`, [
      ...ledger,
      { hour, hook: planned.hook, saying: planned.saying },
    ]);
    return planned;
  }

  // Avoid-list = anything already posted today (same-day distinctness — the whole
  // point of multiple daily slots) plus any top historical hooks.

  // In-season variety: the day's first slot carries the seasonal theme; later
  // slots pull an evergreen theme so a peak window doesn't turn the feed into
  // one occasion on loop.
  //
  // Brand cadence: roughly one late slot in three carries a BRAND theme (the
  // product differentiators — the family-water, the book, the seal) instead of
  // a story hook. Story-hook → product, never product-first: brand only ever
  // runs in a LATER slot, so the day always opens on the elder/question, then
  // earns the right to talk about what keeps it. dayOfYear rotates which brand
  // theme and whether the slot is brand at all, so it never lands the same two
  // days running.
  const dayOfYear = Math.floor(
    (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  const isBrandSlot = ledger.length > 0 && dayOfYear % 3 === 0;
  const theme = isBrandSlot
    ? brandThemeForDate(date, ledger.length)
    : seasonForDate(date) && ledger.length > 0
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
  // Landscape OG card (1200×630) — the static fallback for both surfaces.
  facebook: process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
  bluesky:  process.env.SOCIAL_IMAGE_URL || `${BASE}/og-image.png`,
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
  packVisual?: { dye: string; eyebrow: string },
): Promise<RenderedImage> {
  try {
    const png = renderWeave({
      saying,
      width: v.imageSpec.width,
      height: v.imageSpec.height,
      // Slot in the seed so a day's separate runs weave a visibly different
      // cloth, not the same pattern repeated under different sayings.
      seed: `${dateKey}-${slot}-${v.platform}`,
      // Pack mode: the need-state's signature dye + copper addressing line.
      ...(packVisual ? { dye: packVisual.dye, eyebrow: packVisual.eyebrow } : {}),
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

async function postAll(
  source?: SourcePost,
  packVisual?: { dye: string; eyebrow: string },
): Promise<void> {
  const today = source ?? (await readJson<{ source: SourcePost }>("output/source.json"))?.source;
  if (!today) {
    throw new Error("No source post found. Run `generate` first or check output/source.json.");
  }

  const platforms = parsePlatforms();
  const seasonHashtags = seasonalHashtagsForDate();
  if (seasonHashtags.length) {
    console.log(`[variants] seasonal discovery tags active: ${seasonHashtags.join(", ")}`);
  }
  // Packs carry final, hand-written copy — build variants deterministically
  // (no LLM). The live engine path still generates per-platform variants.
  const variants = packVisual
    ? buildPackVariants(today, platforms, seasonHashtags)
    : await (async () => {
        console.log(`[variants] generating ${platforms.length} platform variants…`);
        return generateVariants({ source: today, platforms, seasonHashtags });
      })();

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const slot = resolveSlotHour(now);
  await writeJson(`output/${dateKey}/variants.json`, variants);

  // Observability: output/ is gitignored, so log the per-platform hashtag count
  // here — it's the only way to confirm tags are being generated in CI.
  console.log(
    `[variants] hashtags: ${variants
      .map((v) => `${v.platform}=${v.hashtags.length}[${v.hashtags.join(",")}]`)
      .join(" ")}`,
  );

  // Bluesky thread: body + CTA as replies to the hook post, last gets link card.
  // Sanitize each part too — the same thread-plan leak that hits captions can
  // surface in the source body/CTA, and these ship as post bodies verbatim.
  const blueskyThread = today
    ? [sanitizeCaption(today.body).slice(0, 280), sanitizeCaption(today.cta).slice(0, 200)]
    : undefined;

  // Render + upload one distinct Deep-water image per variant, keyed to today's
  // saying. Done before posting so each platform gets its own water surface rather
  // than the same static picture every day.
  console.log(`[image] rendering ${variants.length} deep-water images for saying: "${today.saying}"`);
  const images = await Promise.all(
    variants.map((v) => imageForVariant(v, today.saying, dateKey, slot, packVisual)),
  );

  // Pack mode: render the animated MP4 once (square, reused per video platform).
  // ffmpeg-gated and wrapped — any failure leaves video=null and every platform
  // falls back to its gorgeous static image, so a render hiccup never drops a post.
  let video: Buffer | null = null;
  if (packVisual) {
    try {
      console.log(`[video] rendering animated pack for: "${today.saying}"`);
      video = await renderDeepVideo({
        saying: today.saying, width: 1080, height: 1080,
        seed: `${dateKey}-${slot}-pack`, dye: packVisual.dye, eyebrow: packVisual.eyebrow,
      });
      const vpath = path.resolve(process.cwd(), `output/${dateKey}/images/pack-${dateKey}-${slot}.mp4`);
      await fs.mkdir(path.dirname(vpath), { recursive: true });
      await fs.writeFile(vpath, video);
      console.log(`[video] rendered ${video.length} bytes → ${vpath}`);
    } catch (err) {
      console.error(`[video] render failed — falling back to static image`, err);
    }
  }

  console.log(`[post] dispatching ${variants.length} posts…`);
  const results = await Promise.all(
    variants.map((v, i) =>
      post({
        variant: v,
        imageUrl: images[i].url,
        ...(images[i].bytes ? { imageBytes: images[i].bytes! } : {}),
        // Both platforms get the animated video; each falls back to its static
        // image automatically if the video upload/encode fails.
        ...(video ? { videoBytes: video } : {}),
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

// Always-on slots (UTC hours) that run every day, year-round — two posts a day,
// timed to the largest catchable audience for the 30–55 family-keeper buyer:
// 13:00 UTC ≈ 9am ET (US East/Central morning + 2pm UK afternoon) and 23:00 UTC
// ≈ 7pm ET (US evening prime — the demographic's biggest Facebook/Pinterest
// engagement block, ET+CT = ~76% of the US — plus 9am AEST Australia morning).
// The 17:00 slot is seasonal-only: it fires solely inside the four high-intent
// windows (Mother's/Father's/Grandparents/Christmas), lifting the cadence to
// three a day during a peak; in-season it is also the best single global hour
// (US lunch coast-to-coast + UK/SA evening). Brand voice rule 14 holds — this
// account has near-zero followers, so volume buys nothing; distinct, shareable
// pieces at a calm cadence read as a person, six a day reads as a bot.
const ALWAYS_ON_HOURS = new Set([13, 23]);

async function daily(): Promise<void> {
  // Always-on slots run every day. Any non-always-on scheduled slot skips cleanly
  // outside a seasonal window. Manual workflow_dispatch is always intentional, so
  // it never skips.
  const now = new Date();
  const season = seasonForDate(now);
  const slotNow = resolveSlotHour(now);
  const isAlwaysOnSlot = ALWAYS_ON_HOURS.has(slotNow);
  const scheduled = process.env.GITHUB_EVENT_NAME === "schedule";
  if (scheduled && !isAlwaysOnSlot && !season) {
    console.log("[skip] seasonal-only slot and no season is active today. Nothing posted.");
    return;
  }
  if (season) console.log(`[daily] seasonal window active: ${season.id}`);

  // Packs mode (POST_MODE=packs): the curated need-state track — a deterministic,
  // animated pack per slot, no LLM call. The default path keeps the live LLM
  // engine, so nothing changes unless the workflow opts in.
  if (process.env.POST_MODE === "packs") {
    const pack = packForSlot(now, slotNow);
    console.log(`[packs] ${pack.needState} · "${pack.saying}"`);
    const dateKey = now.toISOString().slice(0, 10);
    await writeJson(`output/${dateKey}/source.json`, { source: pack.source });
    await postAll(pack.source, { dye: pack.dye, eyebrow: pack.eyebrow });
    return;
  }

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
    description: "Some things are meant to be kept. Write and record your family's voices, and set them to reach the people you mean them for — held safe across generations.\n\nheirloom.blue",
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
async function blueskySession(): Promise<{ accessJwt: string; did: string } | null> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) { console.log("[bsky] BLUESKY_HANDLE or BLUESKY_APP_PASSWORD not set"); return null; }
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const j = (await res.json().catch(() => ({}))) as { accessJwt?: string; did?: string };
  if (!j.accessJwt || !j.did) { console.error("[bsky] auth failed"); return null; }
  return { accessJwt: j.accessJwt, did: j.did };
}

async function listBlueskyRkeys(accessJwt: string, did: string): Promise<string[]> {
  const rkeys: string[] = [];
  let cursor: string | undefined;
  do {
    const url = `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${accessJwt}` } });
    const j = (await r.json().catch(() => ({}))) as { records?: { uri: string }[]; cursor?: string };
    for (const rec of j.records ?? []) rkeys.push(rec.uri.split("/").pop()!);
    cursor = j.cursor;
  } while (cursor);
  return rkeys;
}

// Gather every published Facebook object id across the edges FB exposes (feed +
// photo/video edges overlap; the Set dedupes), with per-edge counts.
async function listFacebookIds(token: string, pageId: string): Promise<{ ids: Set<string>; perEdge: Record<string, number> }> {
  const ids = new Set<string>();
  const perEdge: Record<string, number> = {};
  // /photos + /videos yield the deletable media-OBJECT ids; a photo/video post's
  // feed-story id often rejects DELETE ("does not support this operation"), so
  // listing the objects is what actually clears media posts.
  for (const edge of ["published_posts", "videos", "photos", "feed"]) {
    let url: string | undefined = `https://graph.facebook.com/v21.0/${pageId}/${edge}?fields=id&limit=100&access_token=${token}`;
    let guard = 0, count = 0;
    while (url && guard++ < 50) {
      const r = await fetch(url);
      const j = (await r.json().catch(() => ({}))) as { data?: { id: string }[]; paging?: { next?: string }; error?: { message: string } };
      if (j.error) { console.warn(`[fb] list ${edge}: ${j.error.message}`); break; }
      for (const p of j.data ?? []) { ids.add(p.id); count++; }
      url = j.paging?.next;
    }
    perEdge[edge] = count;
  }
  return { ids, perEdge };
}

async function purgeBluesky(): Promise<void> {
  const sess = await blueskySession();
  if (!sess) return;
  const rkeys = await listBlueskyRkeys(sess.accessJwt, sess.did);
  console.log(`[purge] deleting ${rkeys.length} Bluesky posts…`);
  for (const rkey of rkeys) {
    await fetch("https://bsky.social/xrpc/com.atproto.repo.deleteRecord", {
      method: "POST", headers: { Authorization: `Bearer ${sess.accessJwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ repo: sess.did, collection: "app.bsky.feed.post", rkey }),
    });
  }
  console.log(`[purge] Bluesky: deleted ${rkeys.length} posts`);
}

async function purgeFacebook(): Promise<void> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) {
    console.log("[purge] META_PAGE_ACCESS_TOKEN or META_PAGE_ID not set — skipping Facebook");
    return;
  }

  const { ids } = await listFacebookIds(token, pageId);
  console.log(`[purge] deleting ${ids.size} Facebook objects…`);
  let ok = 0, fail = 0;
  for (const id of ids) {
    const r = await fetch(`https://graph.facebook.com/v21.0/${id}?access_token=${token}`, { method: "DELETE" });
    const j = (await r.json().catch(() => ({}))) as { success?: boolean; error?: { message: string } };
    if (r.ok && !j.error) ok++;
    else { fail++; if (fail <= 5) console.warn(`[purge] FB delete ${id} failed: ${j.error?.message ?? `HTTP ${r.status}`}`); }
  }
  console.log(`[purge] Facebook: ${ok} deleted, ${fail} failed`);
}

const cmd = process.argv[2] ?? "preview";

// Commands that drive an LLM for generation/variants. If no provider is
// configured, the engine is simply dormant — exit cleanly rather than
// red-failing the daily cron. Platform creds are already optional (post()
// routes to the queue when tokens are missing), so a missing provider is the
// only thing that should ever stop a run, and it stops it quietly. Add either
// Cloudflare Workers AI (free) or Anthropic creds in repo settings to wake it.
const NEEDS_LLM = new Set(["generate", "daily", "preview", "post", "purge", "plan-month"]);
// Packs mode is curated content — it drives no LLM, so the dormancy guard must
// not idle the daily run (or a purge-and-repost) when only the provider is missing.
const packsDaily =
  process.env.POST_MODE === "packs" && (cmd === "daily" || cmd === "purge");
if (NEEDS_LLM.has(cmd) && !packsDaily && !hasGenProvider()) {
  console.log(
    "[dormant] no generation provider configured — marketing engine is idle. " +
      "Add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (free Workers AI) or " +
      "ANTHROPIC_API_KEY to wake it. Nothing posted.",
  );
  process.exit(0);
}
if (NEEDS_LLM.has(cmd) && !packsDaily) console.log(`[provider] generating with ${activeProvider()}`);

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
  // purge + repost: wipe ALL posts on both platforms, then start fresh with
  // today's content. In packs mode that's the deterministic pack for this slot
  // (no LLM); otherwise the live engine generates one.
  purge: async () => {
    await purgeFacebook();
    await purgeBluesky();
    if (process.env.POST_MODE === "packs") {
      const now = new Date();
      const pack = packForSlot(now, resolveSlotHour(now));
      console.log(`[purge] reposting fresh pack: ${pack.needState} · "${pack.saying}"`);
      await postAll(pack.source, { dye: pack.dye, eyebrow: pack.eyebrow });
    } else {
      const source = await generate();
      await postAll(source);
    }
  },
  // audit: read-only — count remaining posts on both platforms. Deletes and
  // posts nothing. After a purge, FB videos should equal just the fresh pack (1);
  // more means test videos survived the wipe.
  audit: async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN, pageId = process.env.META_PAGE_ID;
    if (token && pageId) {
      const { ids, perEdge } = await listFacebookIds(token, pageId);
      console.log(`[audit] Facebook: ${ids.size} unique objects — ${Object.entries(perEdge).map(([e, n]) => `${e}=${n}`).join(" ")}`);
      // Dump each published post so we can see whether any pre-purge post survived.
      const dr = await fetch(`https://graph.facebook.com/v21.0/${pageId}/published_posts?fields=id,created_time,message&limit=25&access_token=${token}`);
      const dj = (await dr.json().catch(() => ({}))) as { data?: { id: string; created_time?: string; message?: string }[] };
      for (const p of dj.data ?? []) {
        console.log(`[audit]   ${p.created_time ?? "?"} ${p.id} — ${(p.message ?? "(no message)").replace(/\n/g, " ").slice(0, 60)}`);
      }
    } else {
      console.log("[audit] Facebook creds not set");
    }
    const sess = await blueskySession();
    if (sess) {
      const rkeys = await listBlueskyRkeys(sess.accessJwt, sess.did);
      console.log(`[audit] Bluesky: ${rkeys.length} records`);
    }
  },
  // update-profile: refresh Bluesky avatar + bio (no post generated)
  "update-profile": async () => {
    await updateBlueskyProfile();
  },
  // plan-month: build the WHOLE next month of posts up front, biased by live
  // system signals, into output/plan/YYYY-MM.json. The daily run then prefers
  // that planned post per slot. Optional arg "YYYY-MM" overrides the target
  // month (default: next month from today). Run by the monthly cron.
  "plan-month": async () => {
    const arg = process.argv[3];
    let year: number, month: number;
    if (arg && /^\d{4}-\d{2}$/.test(arg)) {
      [year, month] = arg.split("-").map(Number);
    } else {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth() + 2; // next month, 1-based
      if (month > 12) { month = 1; year += 1; }
    }
    await planMonth(year, month);
  },
  // engage: daily organic-growth work-list — where a human should genuinely
  // reply (Bluesky threads) or comment (FB groups). Works with no LLM; enriches
  // with reply-opener drafts when a provider is set. NOT in NEEDS_LLM.
  engage: async () => {
    await engage();
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
