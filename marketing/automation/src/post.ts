// Multi-platform posting via Ayrshare.
//
// Ayrshare (https://www.ayrshare.com) was selected per PLAYBOOK §5 — it
// abstracts X, IG, TikTok, Pinterest, FB, LinkedIn, YouTube, Threads, Bluesky
// behind one REST API. Pricing ~$149/mo business tier.
//
// In MOCK mode (no AYRSHARE_API_KEY set, or DRY_RUN=1), variants are written
// to disk under marketing/automation/output/ and not posted. This is the
// default for local development and CI smoke tests.
//
// To migrate off Ayrshare later, swap the `postToAyrshare` implementation for
// direct platform APIs. The rest of the pipeline doesn't care.

import fs from "node:fs/promises";
import path from "node:path";
import { Variant } from "./variants.js";
import { PlatformKey } from "./voice.js";

const AYRSHARE_API_URL = "https://app.ayrshare.com/api/post";
const AYRSHARE_KEY = process.env.AYRSHARE_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "1" || !AYRSHARE_KEY;

// Ayrshare's platform identifiers don't quite match our internal keys.
const AYRSHARE_PLATFORM: Record<PlatformKey, string | null> = {
  instagram: "instagram",
  reels: "instagram", // Reels post via Instagram with mediaType=REELS
  tiktok: "tiktok",
  pinterest: "pinterest",
  facebook: "facebook",
  linkedin: "linkedin",
  x: "twitter",
  threads: "threads",
  bluesky: "bluesky",
  youtubeshorts: "youtube",
};

export interface PostInput {
  variant: Variant;
  imageUrl?: string;
  videoUrl?: string;
  // Future schedule support: ISO 8601 string (UTC).
  scheduleAt?: string;
}

export interface PostResult {
  platform: PlatformKey;
  ok: boolean;
  id?: string;
  error?: string;
  dryRun: boolean;
}

export async function post(input: PostInput): Promise<PostResult> {
  const { variant, imageUrl, videoUrl, scheduleAt } = input;
  const ayrPlatform = AYRSHARE_PLATFORM[variant.platform];

  if (!ayrPlatform) {
    return {
      platform: variant.platform,
      ok: false,
      error: `Unsupported platform: ${variant.platform}`,
      dryRun: false,
    };
  }

  const tagged = variant.hashtags.length
    ? `${variant.caption}\n\n${variant.hashtags.map((h) => `#${h}`).join(" ")}`
    : variant.caption;

  if (DRY_RUN) {
    await writeDryRun(variant, tagged, imageUrl, videoUrl, scheduleAt);
    return { platform: variant.platform, ok: true, dryRun: true };
  }

  const body: Record<string, unknown> = {
    post: tagged,
    platforms: [ayrPlatform],
  };
  if (imageUrl) body.mediaUrls = [imageUrl];
  if (videoUrl) body.mediaUrls = [videoUrl];
  if (variant.platform === "reels") body.instagramOptions = { mediaType: "REELS" };
  if (scheduleAt) body.scheduleDate = scheduleAt;

  const res = await fetch(AYRSHARE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AYRSHARE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    id?: string;
    errors?: { code: number; message: string }[];
  };

  if (!res.ok || json.status === "error") {
    return {
      platform: variant.platform,
      ok: false,
      error: json.errors?.[0]?.message ?? `HTTP ${res.status}`,
      dryRun: false,
    };
  }

  return { platform: variant.platform, ok: true, id: json.id, dryRun: false };
}

async function writeDryRun(
  variant: Variant,
  caption: string,
  imageUrl: string | undefined,
  videoUrl: string | undefined,
  scheduleAt: string | undefined,
): Promise<void> {
  const dir = path.resolve(process.cwd(), "output", new Date().toISOString().slice(0, 10));
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${variant.platform}.md`);
  const content = `# ${variant.platform}

**Image:** ${variant.imageSpec.aspectRatio} (${variant.imageSpec.width}×${variant.imageSpec.height})
${imageUrl ? `**Image URL:** ${imageUrl}\n` : ""}${videoUrl ? `**Video URL:** ${videoUrl}\n` : ""}${scheduleAt ? `**Schedule:** ${scheduleAt}\n` : ""}
---

${caption}
`;
  await fs.writeFile(file, content, "utf-8");
}
