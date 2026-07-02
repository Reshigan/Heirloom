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
  // Raw rendered MP4 bytes (the animated pack). When present, video platforms
  // post the video and fall back to imageBytes if the video upload fails — so a
  // video hiccup never drops the post.
  videoBytes?: Uint8Array;
  videoUrl?: string;
  // Message-matched landing page for this post (defaults to the homepage).
  // Platform ?ref= is appended at send time for signup attribution.
  linkUrl?: string;
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

// The landing URL a post links to, tagged with the platform ref for signup
// attribution (worker stores it via ?ref= → localStorage → /auth/register).
function landingUrl(input: PostInput, ref: string): string {
  const base = input.linkUrl ?? "https://heirloom.blue";
  return `${base}${base.includes("?") ? "&" : "?"}ref=${ref}`;
}

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

// Publish the pack MP4 as a Facebook REEL — the one surface Meta still pushes
// to non-followers organically. Three phases per the Reels API: start (returns
// an upload session), binary upload to rupload, finish (PUBLISHED). Returns
// null on any failure so the caller falls back to the feed-video/image path.
async function postFacebookReel(
  bytes: Uint8Array,
  cap: string,
  token: string,
  pageId: string,
): Promise<string | null> {
  try {
    const startRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/video_reels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upload_phase: "start", access_token: token }),
    });
    const start = (await startRes.json().catch(() => ({}))) as {
      video_id?: string; upload_url?: string; error?: { message: string };
    };
    if (!start.video_id || !start.upload_url) {
      console.warn(`[fb] reel start failed (${start.error?.message ?? startRes.status}) — falling back`);
      return null;
    }
    const upRes = await fetch(start.upload_url, {
      method: "POST",
      headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(bytes.byteLength) },
      body: bytes as unknown as BodyInit,
    });
    const up = (await upRes.json().catch(() => ({}))) as { success?: boolean; debug_info?: { message?: string } };
    if (!upRes.ok || up.success === false) {
      console.warn(`[fb] reel upload failed (${up.debug_info?.message ?? upRes.status}) — falling back`);
      return null;
    }
    const finRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/video_reels?upload_phase=finish&video_id=${start.video_id}` +
        `&video_state=PUBLISHED&description=${encodeURIComponent(cap)}&access_token=${token}`,
      { method: "POST" },
    );
    const fin = (await finRes.json().catch(() => ({}))) as { success?: boolean; error?: { message: string } };
    if (!finRes.ok || fin.error || fin.success === false) {
      console.warn(`[fb] reel finish failed (${fin.error?.message ?? finRes.status}) — falling back`);
      return null;
    }
    console.log(`[fb] reel(${bytes.byteLength}B) → published id=${start.video_id}`);
    return start.video_id;
  } catch (err: any) {
    console.warn(`[fb] reel threw — falling back: ${err?.message ?? err}`);
    return null;
  }
}

async function postFacebook(input: PostInput): Promise<PostResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return queue(input);

  const cap = caption(input.variant);

  // Animated pack: try the REEL first (organic non-follower reach), then the
  // feed /videos post, then the static image — the post always goes out.
  if (input.videoBytes) {
    const reelId = await postFacebookReel(input.videoBytes, cap, token, pageId);
    if (reelId) {
      // Reel processing is async server-side; the link comment may race it.
      // Best-effort — the description already names the landing page.
      await fetch(`https://graph.facebook.com/v21.0/${reelId}/comments`, {
        method: "POST",
        body: new URLSearchParams({ message: `Some things are meant to be kept → ${landingUrl(input, "fb")}`, access_token: token }),
      }).catch(() => undefined);
      return { platform: input.variant.platform, ok: true, id: reelId, mode: "direct" };
    }
  }

  // Animated pack: post the MP4 to /videos. On any failure, fall through to the
  // static-image path below so the post still goes out.
  if (input.videoBytes) {
    try {
      const vform = new FormData();
      vform.set("description", cap);
      vform.set("access_token", token);
      vform.set("source", new Blob([input.videoBytes as unknown as BlobPart], { type: "video/mp4" }), "pack.mp4");
      const vres = await fetch(`https://graph.facebook.com/v21.0/${pageId}/videos`, { method: "POST", body: vform });
      const vjson = (await vres.json().catch(() => ({}))) as { id?: string; error?: { message: string } };
      console.log(`[fb] video(${input.videoBytes.byteLength}B) → ${vres.status} id=${vjson.id ?? "-"}${vjson.error ? ` err=${vjson.error.message}` : ""}`);
      if (vres.ok && vjson.id && !vjson.error) {
        await fetch(`https://graph.facebook.com/v21.0/${vjson.id}/comments`, {
          method: "POST",
          body: new URLSearchParams({ message: `Some things are meant to be kept → ${landingUrl(input, "fb")}`, access_token: token }),
        }).catch(() => undefined);
        return { platform: input.variant.platform, ok: true, id: vjson.id, mode: "direct" };
      }
      console.warn("[fb] video post failed — falling back to static image");
    } catch (err: any) {
      console.warn(`[fb] video post threw — falling back to static image: ${err?.message ?? err}`);
    }
  }

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
        message: `Some things are meant to be kept → ${landingUrl(input, "fb")}`,
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

// Upload an MP4 to Bluesky's video service and return the processed video blob,
// or null on any failure (caller falls back to the static image). Flow per the
// AT Protocol: service-auth token → uploadVideo (returns a job) → poll
// getJobStatus until the blob is ready.
// The video service-auth token must be audienced to the user's own PDS, not to
// did:web:video.bsky.app (accounts on bsky.network PDSs are rejected otherwise).
// Resolve the PDS host from the session DID doc, falling back to plc.directory.
type DidDoc = { service?: Array<{ id?: string; type?: string; serviceEndpoint?: string }> };
function pdsHostFromDidDoc(doc: DidDoc | undefined): string | null {
  const svc = doc?.service?.find((s) => s.id === "#atproto_pds" || s.type === "AtprotoPersonalDataServer");
  if (svc?.serviceEndpoint) { try { return new URL(svc.serviceEndpoint).hostname; } catch { /* noop */ } }
  return null;
}
async function resolvePdsHost(did: string, didDoc: DidDoc | undefined): Promise<string | null> {
  const fromSession = pdsHostFromDidDoc(didDoc);
  if (fromSession) return fromSession;
  try {
    if (did.startsWith("did:plc:")) {
      const r = await fetch(`https://plc.directory/${did}`);
      if (r.ok) return pdsHostFromDidDoc((await r.json()) as DidDoc);
    }
  } catch { /* fall through */ }
  return null;
}

async function uploadBlueskyVideo(
  bytes: Uint8Array,
  did: string,
  accessJwt: string,
  pdsHost: string,
): Promise<BlueskyBlob | null> {
  try {
    const exp = Math.floor(Date.now() / 1000) + 30 * 60;
    const authRes = await fetch(
      `https://bsky.social/xrpc/com.atproto.server.getServiceAuth?aud=${encodeURIComponent(`did:web:${pdsHost}`)}&lxm=com.atproto.repo.uploadBlob&exp=${exp}`,
      { headers: { Authorization: `Bearer ${accessJwt}` } },
    );
    const authJson = (await authRes.json().catch(() => ({}))) as { token?: string };
    if (!authRes.ok || !authJson.token) {
      console.warn("[bsky] video service-auth failed — falling back to image");
      return null;
    }
    const svc = authJson.token;

    const name = `pack-${Date.now()}.mp4`;
    const upRes = await fetch(
      `https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?did=${encodeURIComponent(did)}&name=${encodeURIComponent(name)}`,
      { method: "POST", headers: { Authorization: `Bearer ${svc}`, "Content-Type": "video/mp4" }, body: bytes as unknown as BodyInit },
    );
    const upJson = (await upRes.json().catch(() => ({}))) as {
      jobId?: string;
      jobStatus?: { jobId?: string; blob?: BlueskyBlob; state?: string };
      error?: string;
    };
    if (upJson.jobStatus?.blob) return upJson.jobStatus.blob; // already processed (dedup)
    const jobId = upJson.jobId ?? upJson.jobStatus?.jobId;
    if (!jobId) {
      console.warn(`[bsky] video upload returned no job (${upJson.error ?? upRes.status}) — falling back`);
      return null;
    }

    // Poll until the encode completes. Capped well under the 10-min CI budget.
    const deadline = Date.now() + 4 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const stRes = await fetch(
        `https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?jobId=${encodeURIComponent(jobId)}`,
        { headers: { Authorization: `Bearer ${svc}` } },
      );
      const st = ((await stRes.json().catch(() => ({}))) as {
        jobStatus?: { state?: string; blob?: BlueskyBlob; error?: string };
      }).jobStatus;
      if (!st) continue;
      if (st.state === "JOB_STATE_COMPLETED" && st.blob) return st.blob;
      if (st.error || st.state === "JOB_STATE_FAILED") {
        console.warn(`[bsky] video encode failed (${st.error ?? st.state}) — falling back`);
        return null;
      }
    }
    console.warn("[bsky] video encode timed out — falling back to image");
    return null;
  } catch (err: any) {
    console.warn(`[bsky] video upload threw — falling back to image: ${err?.message ?? err}`);
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
  const session = (await sessionRes.json().catch(() => ({}))) as { accessJwt?: string; did?: string; didDoc?: DidDoc };
  if (!sessionRes.ok || !session.accessJwt || !session.did) {
    return { platform: input.variant.platform, ok: false, error: "auth failed", mode: "direct" };
  }

  // Prefer the rendered woven-cloth bytes (the saying-image); fall back to a
  // public image URL only when bytes aren't available. The image is always
  // uploaded so it can back the video (fallback) and the link-card thumb.
  const imageBlob = input.imageBytes
    ? await uploadBlueskyBlobBytes(input.imageBytes, "image/png", session.accessJwt)
    : input.imageUrl
      ? await uploadBlueskyBlob(input.imageUrl, session.accessJwt)
      : null;

  // Animated pack: upload the MP4 to the video service. Null on any failure, so
  // the first post falls back to the static image embed below.
  const pdsHost = input.videoBytes ? await resolvePdsHost(session.did, session.didDoc) : null;
  const videoBlob = input.videoBytes && pdsHost
    ? await uploadBlueskyVideo(input.videoBytes, session.did, session.accessJwt, pdsHost)
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

    if (isFirst && videoBlob) {
      record.embed = {
        $type: "app.bsky.embed.video",
        video: videoBlob,
        aspectRatio: { width: 1, height: 1 }, // packs render square
        alt: input.imageAlt ?? "Heirloom — some things are meant to be kept.",
      };
    } else if (isFirst && imageBlob) {
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
          uri: landingUrl(input, "bsky"),
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
