// Multi-platform posting — free-mode by default.
//
// Three modes, in order of preference:
//
//   1. WORKER_QUEUE — POST variants to the worker's /api/social/bulk-load
//      endpoint. The worker's existing 5-minute Postiz cron picks them up
//      and publishes via Postiz (open-source, self-hostable, free). This
//      is the production path: one publishing pipeline (Layer A) fed by
//      one content engine (Layer B). Set HEIRLOOM_API_URL +
//      HEIRLOOM_ADMIN_TOKEN to enable.
//
//   2. DIRECT — direct platform APIs (Meta, LinkedIn, Pinterest, Bluesky).
//      Free where the platform exposes a free posting API. Used when the
//      worker queue isn't configured but a platform token is.
//
//   3. QUEUE_FILE — write to output/<date>/queue/<platform>.md, optionally
//      ping QUEUE_WEBHOOK_URL. Operator pastes manually. Last resort for
//      TikTok / X / Threads / YT Shorts where direct posting needs paid
//      tiers or app review.
//
// post() auto-routes per the table above based on what's configured.

import fs from "node:fs/promises";
import path from "node:path";
import { Variant } from "./variants.js";
import { PlatformKey } from "./voice.js";

export interface PostInput {
  variant: Variant;
  imageUrl?: string;
  // Raw rendered image bytes (the woven-cloth + saying PNG). Preferred over
  // imageUrl on platforms that accept a binary upload (Bluesky blob, Facebook
  // /photos source) — it carries the actual saying-image without needing a
  // public URL / R2 round-trip (which is gated on HEIRLOOM_ADMIN_TOKEN).
  imageBytes?: Uint8Array;
  videoUrl?: string;
  scheduleAt?: string;
  // Bluesky thread: additional post texts posted as replies to variant.caption.
  // Last part gets a heirloom.blue link card embed.
  blueskyThread?: string[];
  // Alt text for the attached image. The weave image IS its saying, so passing
  // the saying makes the alt accurate for screen readers and puts the line in
  // text platforms index — generic brand alt wastes both.
  imageAlt?: string;
}

export interface PostResult {
  platform: PlatformKey;
  ok: boolean;
  id?: string;
  error?: string;
  mode: "direct" | "queue" | "worker";
}

const QUEUE_WEBHOOK = process.env.QUEUE_WEBHOOK_URL;
const HEIRLOOM_API_URL = process.env.HEIRLOOM_API_URL;
const HEIRLOOM_ADMIN_TOKEN = process.env.HEIRLOOM_ADMIN_TOKEN;

function caption(variant: Variant): string {
  return variant.hashtags.length
    ? `${variant.caption}\n\n${variant.hashtags.map((h) => `#${h}`).join(" ")}`
    : variant.caption;
}

// Fit text + a hashtag suffix into Bluesky's 300-grapheme post cap. Trims the
// body (never the tags) so the tags always survive; if the tags alone won't
// fit, drop them and keep the body intact.
function fitWithTags(text: string, tagLine: string): string {
  if (!tagLine) return text.slice(0, 300);
  const suffix = `\n\n${tagLine}`;
  const room = 300 - suffix.length;
  if (room < 20) return text.slice(0, 300);
  return text.length <= room ? `${text}${suffix}` : `${text.slice(0, room).trimEnd()}${suffix}`;
}

// Build Bluesky richtext tag facets for every "#tag" in the text. Facet ranges
// are UTF-8 BYTE offsets (not char indices), so we measure with TextEncoder.
function buildTagFacets(
  text: string,
): Array<{ index: { byteStart: number; byteEnd: number }; features: Array<{ $type: string; tag: string }> }> {
  const enc = new TextEncoder();
  const facets: Array<{
    index: { byteStart: number; byteEnd: number };
    features: Array<{ $type: string; tag: string }>;
  }> = [];
  const re = /(^|\s)(#[A-Za-z0-9_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const tagStart = m.index + m[1].length; // skip the leading whitespace group
    const byteStart = enc.encode(text.slice(0, tagStart)).length;
    const byteEnd = enc.encode(text.slice(0, tagStart + m[2].length)).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag: m[2].slice(1) }],
    });
  }
  return facets;
}

export async function post(input: PostInput): Promise<PostResult> {
  // Worker queue takes precedence when configured — it hands off to the
  // existing Postiz cron, which is the production publish pipeline.
  if (HEIRLOOM_API_URL && HEIRLOOM_ADMIN_TOKEN) {
    const result = await postToWorkerQueue(input);
    if (result.ok) return result;
    // Fall through on failure — better to surface via direct/queue than
    // drop the post entirely.
  }
  const handler = DISPATCH[input.variant.platform];
  return handler(input);
}

// --- Layer A handoff: worker /api/social/bulk-load -------------------------

async function postToWorkerQueue(input: PostInput): Promise<PostResult> {
  const url = `${HEIRLOOM_API_URL!.replace(/\/$/, '')}/api/social/bulk-load`;
  const scheduledAt = input.scheduleAt ?? new Date().toISOString();
  const week = isoWeekOf(new Date(scheduledAt));

  // The worker's bulk-load endpoint expects a week + array of posts. We
  // send a one-post array per call so we can shape per-platform variants
  // independently. The worker's cron picks them up at the scheduled time.
  const body = {
    week,
    startDate: scheduledAt.slice(0, 10),
    posts: [
      {
        platforms: [variantToPostizPlatform(input.variant.platform)],
        pillar: 'autopost',
        content: {
          text: caption(input.variant),
          imageUrl: input.imageUrl,
          videoUrl: input.videoUrl,
          source: 'heirloom-automation',
        },
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HEIRLOOM_ADMIN_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { loaded?: number; error?: string };
    if (!res.ok) {
      return { platform: input.variant.platform, ok: false, error: json.error ?? `HTTP ${res.status}`, mode: 'worker' };
    }
    return { platform: input.variant.platform, ok: true, mode: 'worker' };
  } catch (err: any) {
    return { platform: input.variant.platform, ok: false, error: err?.message ?? 'fetch failed', mode: 'worker' };
  }
}

function variantToPostizPlatform(p: PlatformKey): string {
  // Postiz canonical names — kept here so changing them doesn't require
  // touching post.ts elsewhere.
  switch (p) {
    case 'facebook':
      return 'facebook';
    case 'bluesky':
      return 'bluesky';
  }
}

function isoWeekOf(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// --- Direct platform integrations (free) -----------------------------------

async function postFacebook(input: PostInput): Promise<PostResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return queue(input);

  const cap = caption(input.variant);

  // Prefer uploading the rendered woven-cloth bytes directly to /photos via a
  // multipart `source` — that puts the actual saying-image on the post with no
  // public URL needed. Fall back to a public image URL, then plain feed text.
  let url: string;
  let body: BodyInit;
  let imgMode: string;
  if (input.imageBytes) {
    url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
    const form = new FormData();
    form.set("caption", cap);
    form.set("access_token", token);
    form.set("source", new Blob([input.imageBytes as unknown as BlobPart], { type: "image/png" }), "weave.png");
    body = form;
    imgMode = `weave-bytes(${input.imageBytes.byteLength}B)`;
  } else if (input.imageUrl) {
    url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
    body = new URLSearchParams({ caption: cap, url: input.imageUrl, access_token: token });
    imgMode = `url(${input.imageUrl})`;
  } else {
    url = `https://graph.facebook.com/v21.0/${pageId}/feed`;
    body = new URLSearchParams({ message: cap, access_token: token });
    imgMode = "text-only";
  }

  const res = await fetch(url, { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { id?: string; post_id?: string; error?: { message: string } };
  console.log(`[fb] image=${imgMode} → ${res.status} id=${json.id ?? "-"} post_id=${json.post_id ?? "-"}${json.error ? ` err=${json.error.message}` : ""}`);
  if (!res.ok || json.error) {
    return { platform: input.variant.platform, ok: false, error: json.error?.message ?? `HTTP ${res.status}`, mode: "direct" };
  }

  // Link-in-first-comment: Facebook demotes posts with links in the caption by ~50%.
  // Post the link as the first comment so reach is preserved but the link is still visible.
  if (json.id) {
    await fetch(`https://graph.facebook.com/v21.0/${json.id}/comments`, {
      method: "POST",
      body: new URLSearchParams({
        message: "Some things are meant to be kept → heirloom.blue",
        access_token: token,
      }),
    }).catch(() => undefined);
  }

  return { platform: input.variant.platform, ok: true, id: json.id, mode: "direct" };
}

type BlueskyBlob = {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
};

async function uploadBlueskyBlobBytes(
  bytes: Uint8Array,
  mimeType: string,
  token: string,
): Promise<BlueskyBlob | null> {
  try {
    const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.uploadBlob", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: bytes as unknown as BodyInit,
    });
    const json = (await res.json().catch(() => ({}))) as { blob?: BlueskyBlob };
    return json.blob ?? null;
  } catch {
    return null;
  }
}

async function uploadBlueskyBlob(imageUrl: string, token: string): Promise<BlueskyBlob | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    return uploadBlueskyBlobBytes(bytes, mimeType, token);
  } catch {
    return null;
  }
}

async function postBluesky(input: PostInput): Promise<PostResult> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) return queue(input);

  const sessionRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const session = (await sessionRes.json().catch(() => ({}))) as { accessJwt?: string; did?: string };
  if (!sessionRes.ok || !session.accessJwt || !session.did) {
    return { platform: input.variant.platform, ok: false, error: "auth failed", mode: "direct" };
  }

  // Prefer the rendered woven-cloth bytes (the saying-image); fall back to a
  // public image URL only when bytes aren't available.
  const imageBlob = input.imageBytes
    ? await uploadBlueskyBlobBytes(input.imageBytes, "image/png", session.accessJwt)
    : input.imageUrl
      ? await uploadBlueskyBlob(input.imageUrl, session.accessJwt)
      : null;

  // Hashtags ride the FINAL post, not the opener. The opener is the longest
  // post (hook + body) and slicing it to 300 would shear off any appended tags;
  // the final post (CTA) is short and has room. fitWithTags guarantees the tags
  // survive the 300-char cap on whichever post carries them.
  const tagLine = input.variant.hashtags.length
    ? input.variant.hashtags.map((h) => `#${h}`).join(" ")
    : "";
  const base = [input.variant.caption, ...(input.blueskyThread ?? [])];
  const threadPosts = base.map((text, i) =>
    i === base.length - 1 ? fitWithTags(text, tagLine) : text.slice(0, 300),
  );

  let rootUri = "";
  let rootCid = "";
  let parentUri = "";
  let parentCid = "";

  for (let i = 0; i < threadPosts.length; i++) {
    const isFirst = i === 0;
    const isLast = i === threadPosts.length - 1;

    const text = threadPosts[i].slice(0, 300);
    const record: Record<string, unknown> = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    };

    // Without tag facets, a "#foo" in the text is inert literal text — Bluesky
    // only treats it as a real, clickable/searchable hashtag when a richtext
    // facet#tag points at its byte range.
    const facets = buildTagFacets(text);
    if (facets.length) record.facets = facets;

    if (!isFirst) {
      record.reply = {
        root: { uri: rootUri, cid: rootCid },
        parent: { uri: parentUri, cid: parentCid },
      };
    }

    if (isFirst && imageBlob) {
      record.embed = {
        $type: "app.bsky.embed.images",
        images: [{ image: imageBlob, alt: input.imageAlt ?? "Heirloom — some things are meant to be kept." }],
      };
    }

    // Last post in a multi-post thread gets the link card. Give it the woven
    // saying-image as its thumb so the reply (which sits at the top of the
    // feed) shows the cloth too — not a blank gray card.
    if (isLast && !isFirst) {
      record.embed = {
        $type: "app.bsky.embed.external",
        external: {
          uri: "https://heirloom.blue",
          title: "Heirloom",
          description: "Some things are meant to be kept.",
          ...(imageBlob ? { thumb: imageBlob } : {}),
        },
      };
    }

    const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessJwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
    });
    const json = (await res.json().catch(() => ({}))) as { uri?: string; cid?: string; error?: string };
    if (!res.ok || !json.uri || !json.cid) {
      return { platform: input.variant.platform, ok: false, error: json.error ?? `HTTP ${res.status}`, mode: "direct" };
    }

    if (isFirst) {
      rootUri = json.uri;
      rootCid = json.cid;
    }
    parentUri = json.uri;
    parentCid = json.cid;
  }

  return { platform: input.variant.platform, ok: true, id: rootUri || undefined, mode: "direct" };
}

// --- Queue mode (free fallback) --------------------------------------------

async function queue(input: PostInput): Promise<PostResult> {
  const dir = path.resolve(process.cwd(), "output", new Date().toISOString().slice(0, 10), "queue");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${input.variant.platform}.md`);
  const content = `# ${input.variant.platform}

**Image spec:** ${input.variant.imageSpec.aspectRatio} (${input.variant.imageSpec.width}×${input.variant.imageSpec.height})
${input.imageUrl ? `**Image:** ${input.imageUrl}\n` : ""}${input.videoUrl ? `**Video:** ${input.videoUrl}\n` : ""}${input.scheduleAt ? `**Post at:** ${input.scheduleAt}\n` : ""}
---

${caption(input.variant)}
`;
  await fs.writeFile(file, content, "utf-8");

  if (QUEUE_WEBHOOK) {
    await fetch(QUEUE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `📬 New post queued: **${input.variant.platform}**\n\n${caption(input.variant)}`,
        platform: input.variant.platform,
        imageUrl: input.imageUrl,
      }),
    }).catch(() => undefined);
  }

  return { platform: input.variant.platform, ok: true, mode: "queue" };
}

const DISPATCH: Record<PlatformKey, (i: PostInput) => Promise<PostResult>> = {
  facebook: postFacebook,
  bluesky: postBluesky,
};
