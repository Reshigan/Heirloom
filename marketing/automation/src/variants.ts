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
  hashtags: z.array(z.string()).max(10),
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
}

export async function generateVariants({ source, platforms }: VariantInput): Promise<Variant[]> {
  const platformBlock = platforms
    .map((p) => `### ${p}\n${PLATFORM_GUIDELINES[p]}`)
    .join("\n\n");

  const userPrompt = `Source post (one idea, multiple platforms below):

Hook: ${source.hook}
Body: ${source.body}
CTA: ${source.cta}
Hashtag candidates: ${source.hashtags.join(", ")}

Platforms to produce variants for:

${platformBlock}

Produce strict JSON. No prose. No markdown fences:

{
  "variants": [
    {
      "platform": "instagram" | "reels" | "tiktok" | "pinterest" | "facebook" | "linkedin" | "x" | "threads" | "bluesky" | "youtubeshorts",
      "caption": "Full caption ready to post. Must obey the platform's guideline above.",
      "hashtags": ["lowercase", "no", "hashes"],
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
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Claude returned non-JSON: ${raw.slice(0, 300)}`);
  }

  const result = variantsSchema.parse(parsed);
  return result.variants;
}
