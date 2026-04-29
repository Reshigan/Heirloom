// Multi-platform posting — free-mode by default.
//
// Strategy: $0/mo path uses direct platform APIs where they're free, plus a
// "queue" fallback that writes formatted posts to disk + webhook for the
// platforms whose API costs money or requires expensive approval.
//
// Platform tiers:
//   - Free direct API: Meta (FB + IG), LinkedIn, Pinterest, YouTube, Threads
//   - Free with app-review: TikTok Content Posting API (~6 weeks approval)
//   - Paid only: X v2 ($200/mo basic) — defaults to queue mode
//   - Bluesky: free, simple
//
// Queue mode writes to output/<date>/<platform>.md AND optionally pings a
// webhook (Discord, Slack, email). The operator pastes from there in 2-3
// minutes/day. This is the realistic free path until app reviews land.
//
// To upgrade: set the relevant API tokens (META_PAGE_ACCESS_TOKEN, etc.).
// post() auto-routes to direct API when token is present.

import fs from "node:fs/promises";
import path from "node:path";
import { Variant } from "./variants.js";
import { PlatformKey } from "./voice.js";

export interface PostInput {
  variant: Variant;
  imageUrl?: string;
  videoUrl?: string;
  scheduleAt?: string;
}

export interface PostResult {
  platform: PlatformKey;
  ok: boolean;
  id?: string;
  error?: string;
  mode: "direct" | "queue";
}

const QUEUE_WEBHOOK = process.env.QUEUE_WEBHOOK_URL;

function caption(variant: Variant): string {
  return variant.hashtags.length
    ? `${variant.caption}\n\n${variant.hashtags.map((h) => `#${h}`).join(" ")}`
    : variant.caption;
}

export async function post(input: PostInput): Promise<PostResult> {
  const { variant } = input;
  const handler = DISPATCH[variant.platform];
  return handler(input);
}

// --- Direct platform integrations (free) -----------------------------------

async function postFacebook(input: PostInput): Promise<PostResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) return queue(input);

  const params = new URLSearchParams({
    message: caption(input.variant),
    access_token: token,
  });
  if (input.imageUrl) params.set("link", input.imageUrl);

  const url = input.imageUrl
    ? `https://graph.facebook.com/v21.0/${pageId}/photos`
    : `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const body = new URLSearchParams({
    [input.imageUrl ? "caption" : "message"]: caption(input.variant),
    access_token: token,
  });
  if (input.imageUrl) body.set("url", input.imageUrl);

  const res = await fetch(url, { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: { message: string } };
  if (!res.ok || json.error) {
    return { platform: input.variant.platform, ok: false, error: json.error?.message ?? `HTTP ${res.status}`, mode: "direct" };
  }
  return { platform: input.variant.platform, ok: true, id: json.id, mode: "direct" };
}

async function postInstagram(input: PostInput): Promise<PostResult> {
  // IG requires a 2-step container -> publish flow. Only image/video URL,
  // no plain-text posts.
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const igUserId = process.env.META_IG_USER_ID;
  if (!token || !igUserId || !input.imageUrl) return queue(input);

  const isReel = input.variant.platform === "reels";
  const containerBody = new URLSearchParams({
    [isReel ? "video_url" : "image_url"]: input.imageUrl,
    caption: caption(input.variant),
    access_token: token,
  });
  if (isReel) containerBody.set("media_type", "REELS");

  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: "POST",
    body: containerBody,
  });
  const container = (await containerRes.json().catch(() => ({}))) as { id?: string; error?: { message: string } };
  if (!containerRes.ok || !container.id) {
    return { platform: input.variant.platform, ok: false, error: container.error?.message ?? `HTTP ${containerRes.status}`, mode: "direct" };
  }

  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: container.id, access_token: token }),
  });
  const publish = (await publishRes.json().catch(() => ({}))) as { id?: string; error?: { message: string } };
  if (!publishRes.ok || !publish.id) {
    return { platform: input.variant.platform, ok: false, error: publish.error?.message ?? `HTTP ${publishRes.status}`, mode: "direct" };
  }
  return { platform: input.variant.platform, ok: true, id: publish.id, mode: "direct" };
}

async function postLinkedIn(input: PostInput): Promise<PostResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN; // e.g. "urn:li:organization:123"
  if (!token || !author) return queue(input);

  const body = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: caption(input.variant) },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { platform: input.variant.platform, ok: false, error: `HTTP ${res.status}`, mode: "direct" };
  }
  const id = res.headers.get("x-restli-id") ?? undefined;
  return { platform: input.variant.platform, ok: true, id, mode: "direct" };
}

async function postPinterest(input: PostInput): Promise<PostResult> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId || !input.imageUrl) return queue(input);

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: boardId,
      title: input.variant.caption.split("\n")[0].slice(0, 100),
      description: caption(input.variant),
      media_source: { source_type: "image_url", url: input.imageUrl },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !json.id) {
    return { platform: input.variant.platform, ok: false, error: json.message ?? `HTTP ${res.status}`, mode: "direct" };
  }
  return { platform: input.variant.platform, ok: true, id: json.id, mode: "direct" };
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

  const recordRes = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessJwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text: caption(input.variant).slice(0, 300),
        createdAt: new Date().toISOString(),
      },
    }),
  });
  const json = (await recordRes.json().catch(() => ({}))) as { uri?: string; error?: string };
  if (!recordRes.ok) {
    return { platform: input.variant.platform, ok: false, error: json.error ?? `HTTP ${recordRes.status}`, mode: "direct" };
  }
  return { platform: input.variant.platform, ok: true, id: json.uri, mode: "direct" };
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
  instagram: postInstagram,
  reels: postInstagram,
  linkedin: postLinkedIn,
  pinterest: postPinterest,
  bluesky: postBluesky,
  // No free direct API → queue mode for now.
  tiktok: queue,
  youtubeshorts: queue,
  threads: queue, // Threads API exists but in beta as of 2025/26 — queue for safety.
  x: queue, // X v2 free tier removed posting; queue.
};
