// Per-platform variant generation.
//
// Takes one SourcePost (from generate.ts) and produces platform-specific
// variants — caption length adapted, hashtags filtered, image dimensions
// noted. Variants are produced by Claude using the platform guidelines from
// voice.ts.
//
// Why one Claude call instead of N: amortize the system prompt via cache,
// and let the model coordinate variants so they don't read identically.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SourcePost } from "./generate.js";
import { BRAND_VOICE_SYSTEM_PROMPT, PLATFORM_GUIDELINES, PlatformKey } from "./voice.js";

// See generate.ts — Sonnet 4.6 default for cost.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const variantSchema = z.object({
  platform: z.enum([
    "instagram",
    "reels",
    "tiktok",
    "pinterest",
    "facebook",
    "linkedin",
    "x",
    "threads",
    "bluesky",
    "youtubeshorts",
  ]),
  caption: z.string().min(10),
  // Clamp rather than reject: the Instagram guideline asks for up to 12 tags, so
  // a valid IG variant would overflow a hard .max(10) and kill the whole daily
  // run. Trim to 12 (the highest any platform guideline requests).
  hashtags: z.array(z.string()).transform((tags) => tags.slice(0, 12)),
  imageSpec: z.object({
    aspectRatio: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

export type Variant = z.infer<typeof variantSchema>;

const variantsSchema = z.object({
  variants: z.array(variantSchema).min(1),
});

const IMAGE_SPECS: Record<PlatformKey, { aspectRatio: string; width: number; height: number }> = {
  instagram: { aspectRatio: "1:1", width: 1080, height: 1080 },
  reels: { aspectRatio: "9:16", width: 1080, height: 1920 },
  tiktok: { aspectRatio: "9:16", width: 1080, height: 1920 },
  pinterest: { aspectRatio: "2:3", width: 1000, height: 1500 },
  facebook: { aspectRatio: "1.91:1", width: 1200, height: 630 },
  linkedin: { aspectRatio: "1.91:1", width: 1200, height: 627 },
  x: { aspectRatio: "16:9", width: 1600, height: 900 },
  threads: { aspectRatio: "1:1", width: 1080, height: 1080 },
  bluesky: { aspectRatio: "16:9", width: 1600, height: 900 },
  youtubeshorts: { aspectRatio: "9:16", width: 1080, height: 1920 },
};

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface VariantInput {
  source: SourcePost;
  platforms: PlatformKey[];
  // Active seasonal discovery tags (Father's Day etc.). When present, the model
  // is told to fold 1-2 in on the hashtag platforms so the post lands on the
  // in-season hashtag pages where intent peaks. Empty/absent outside a window.
  seasonHashtags?: string[];
}

function stripFences(raw: string): string {
  // Try to extract content between ```json ... ``` fences first
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();
  // Fall back to extracting from first { to last }
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1).trim();
  return raw.trim();
}

export async function generateVariants({ source, platforms, seasonHashtags }: VariantInput): Promise<Variant[]> {
  const platformBlock = platforms
    .map((p) => `### ${p}\n${PLATFORM_GUIDELINES[p]}`)
    .join("\n\n");

  // Hashtag-driven discovery surfaces only. Tags do nothing on x/bluesky/
  // facebook/linkedin-prose, so don't waste the in-season tags there.
  const HASHTAG_PLATFORMS: PlatformKey[] = ["instagram", "reels", "tiktok", "threads", "youtubeshorts"];
  const seasonBlock =
    seasonHashtags && seasonHashtags.length
      ? `\n\nACTIVE SEASON — high-intent discovery tags: ${seasonHashtags.join(", ")}.
On the hashtag platforms only (${HASHTAG_PLATFORMS.filter((p) => platforms.includes(p)).join(", ") || "none in this run"}), include 1-2 of these in the hashtags array so the post lands on the in-season hashtag pages. Do NOT add them to platforms that don't use hashtags. Stay within each platform's hashtag count. Never let the seasonal tag turn the post into gift-product marketing — the post is still a specific, true thing; the tag is only for placement.`
      : "";

  const userPrompt = `Source post (one idea, multiple platforms below):

Hook: ${source.hook}
Body: ${source.body}
CTA: ${source.cta}
Saying (image text overlay): ${source.saying}
Hashtag candidates: ${source.hashtags.join(", ")}${seasonBlock}

Platforms to produce variants for:

${platformBlock}

HASHTAG RULES — follow exactly:
- VISUAL PLATFORMS (instagram, reels, tiktok, threads, youtubeshorts): hashtags array MUST be non-empty. Use 5-12 tags chosen from the candidates above. Do NOT write hashtags inside the caption text — they go in the hashtags array ONLY and will be appended automatically.
- DISCOVERY PLATFORMS (pinterest): hashtags array must be empty []. Pinterest is a search engine — hashtags go in description keywords, not the array.
- TEXT PLATFORMS (facebook, linkedin, x, bluesky): hashtags array must be empty [] per their guidelines above.

The caption field must NEVER contain any # symbols — hashtags belong only in the hashtags array.

Produce strict JSON. No prose. No markdown fences:

{
  "variants": [
    {
      "platform": "instagram" | "reels" | "tiktok" | "pinterest" | "facebook" | "linkedin" | "x" | "threads" | "bluesky" | "youtubeshorts",
      "caption": "Full caption text only — no # symbols ever.",
      "hashtags": ["tagone", "tagtwo", "tagthree"],
      "imageSpec": { "aspectRatio": "...", "width": ..., "height": ... }
    }
  ]
}

Use these image specs literally:
${platforms.map((p) => `- ${p}: ${JSON.stringify(IMAGE_SPECS[p])}`).join("\n")}

Variants must NOT read identically. Each platform's audience is different. Vary the hook, the rhythm, and the CTA.

JSON only.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: [
      {
        type: "text",
        text: BRAND_VOICE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  const raw = textBlock.text.trim();
  const json = stripFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Claude returned non-JSON: ${raw.slice(0, 300)}`);
  }

  const result = variantsSchema.parse(parsed);
  return result.variants;
}
