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
import { monthlyHashtagPool, rotateForSlot } from "./hashtags.js";

// See generate.ts — Sonnet 4.6 default for cost.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const variantSchema = z.object({
  platform: z.enum(["facebook", "bluesky"]),
  caption: z.string().min(10),
  // Clamp rather than reject: both platforms ask for at most 3 quiet tags, so a
  // model that returns a tag wall would overflow a hard .max() and kill the whole
  // run. Trim to 3 (the highest either guideline requests).
  hashtags: z.array(z.string()).transform((tags) => tags.slice(0, 3)),
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
  facebook: { aspectRatio: "1.91:1", width: 1200, height: 630 },
  bluesky: { aspectRatio: "16:9", width: 1600, height: 900 },
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

// A caption is exactly ONE post. Models sometimes "help" by laying out a whole
// thread plan inside the single caption field — literal "Post 2:" / "Post 3:"
// labels, or echoed schema keys ("Hook:", "Body:", "CTA:") — which then ship as
// the post body verbatim (the Bluesky opener once published a literal
// "...Post 2: ... Post 3: ..." plan). Cut everything from the first scaffold
// label onward so only the real opening post survives.
const SCAFFOLD_LABEL = /(?:^|\n)[ \t]*(?:post[ \t]*\d+|hook|body|cta|caption|saying|thread)[ \t]*:/i;

export function sanitizeCaption(raw: string): string {
  let c = (raw ?? "").trim();
  // Drop a single echoed label at the very start (search below only cuts labels
  // that appear *after* position 0).
  c = c.replace(/^[ \t]*(?:post[ \t]*\d+|hook|body|cta|caption|saying|thread)[ \t]*:[ \t]*/i, "");
  const m = c.match(SCAFFOLD_LABEL);
  if (m && m.index !== undefined && m.index > 0) c = c.slice(0, m.index);
  return c.replace(/\n{3,}/g, "\n\n").trim();
}

// The caption field must never contain '#' — tags belong in the hashtags array
// (the prompt says so, but the free model ignores it). Pull any inline #tags out
// so they still count toward the post's tags, then strip them from the prose.
function harvestInlineTags(caption: string): { caption: string; tags: string[] } {
  const tags: string[] = [];
  for (const m of caption.matchAll(/#([\p{L}\p{N}_]{2,40})/gu)) tags.push(m[1]);
  const cleaned = caption
    .replace(/#[\p{L}\p{N}_]{2,40}/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { caption: cleaned, tags };
}

export async function generateVariants({ source, platforms, seasonHashtags }: VariantInput): Promise<Variant[]> {
  const platformBlock = platforms
    .map((p) => `### ${p}\n${PLATFORM_GUIDELINES[p]}`)
    .join("\n\n");

  // Both surfaces carry a couple of quiet community tags, so seasonal discovery
  // tags are eligible on either; per-platform counts (below) keep them sparse.
  const HASHTAG_PLATFORMS: PlatformKey[] = ["facebook", "bluesky"];
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

HASHTAG RULES — follow exactly. Few and quiet beats many — tag walls get posts downranked and read as marketing, which kills both surfaces. Pick tags from the candidates above (and the active-season tags when present) that fit a family-keeper audience. Calm community tags only (#familystories, #familyhistory) — never branded, never decorative:
- facebook: 0-2 tags.
- bluesky: 0-2 tags, and they ride the FINAL post only, counting against the 300-char budget.

Do NOT write hashtags inside the caption text — they go in the hashtags array ONLY and are appended automatically. The caption field must NEVER contain any # symbols.

The caption is ONE single post. NEVER lay out a multi-post thread inside it. NEVER write labels like "Post 1:", "Post 2:", "Post 3:", "Hook:", "Body:", "CTA:", or "Thread:" anywhere in the caption — write only the finished post text itself.

CAPTION SEO — search now finds posts through caption KEYWORDS more than hashtags (≈70/30 on Instagram). Work one natural search phrase into each caption where it doesn't bend the sentence — phrases real people type: "questions to ask your dad", "family stories", "record your parents' voice", "family history". Never stuff; one phrase, naturally placed.

SHARE TRIGGER — where it fits the post, end the Facebook caption with ONE short line that gives the reader something to do with another person: a gentle question about their own experience, or "Send this to the family group chat." Comments and sends are the strongest ranking signals Facebook has. Never bolt it onto grief, and never use "tag 3 friends"-style bait. On Bluesky the action is the final thread post, not a share-beg.

Produce strict JSON. No prose. No markdown fences:

{
  "variants": [
    {
      "platform": "facebook" | "bluesky",
      "caption": "Full caption text only — no # symbols ever.",
      "hashtags": ["tagone", "tagtwo"],
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

  // Safety net: the prompt asks for non-empty hashtags on every platform, but
  // the schema permits []. The daily run now uses the free Cloudflare Llama
  // model, which complies less reliably than Sonnet — and an empty array on a
  // hashtag platform means a published post with NO hashtags (exactly the
  // Facebook "old type, no #'s" symptom). Backfill any short/empty array from
  // the source candidates + active-season tags so this can't reach the wire.
  // No forced minimum — the 2026 brand allows zero tags. A quiet post with no
  // hashtags is correct here, so there is nothing to backfill up to.
  const HASHTAG_MINIMUMS: Partial<Record<PlatformKey, number>> = {};
  // Backfill pool: season tags first (highest intent), then the source's picks,
  // then the month's rotation pool — rotated by slot so two posts never share
  // the exact same fallback block (identical repeated tag blocks read as spam).
  const slotSeed = new Date().getUTCDate() * 24 + new Date().getUTCHours();
  const fallbackPool = [
    ...(seasonHashtags ?? []),
    ...rotateForSlot([...source.hashtags, ...monthlyHashtagPool()], slotSeed),
  ]
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
  // Hard caps per 2026 platform norms — a model that ignores the prompt and
  // returns a tag wall would otherwise get the account downranked.
  const HASHTAG_MAXIMUMS: Partial<Record<PlatformKey, number>> = {
    facebook: 2, bluesky: 2,
  };
  for (const v of result.variants) {
    // Strip any thread-plan scaffolding the model leaked into the single-post
    // caption, then move inline #tags into the hashtags array before the
    // min/max enforcement below counts them.
    v.caption = sanitizeCaption(v.caption);
    const harvested = harvestInlineTags(v.caption);
    v.caption = harvested.caption;
    if (harvested.tags.length) {
      const have = new Set(v.hashtags.map((t) => t.toLowerCase()));
      for (const tag of harvested.tags) {
        const key = tag.toLowerCase();
        if (have.has(key)) continue;
        v.hashtags.push(tag);
        have.add(key);
      }
    }
    const min = HASHTAG_MINIMUMS[v.platform];
    if (min && v.hashtags.length < min) {
      const have = new Set(v.hashtags.map((t) => t.toLowerCase()));
      for (const tag of fallbackPool) {
        if (v.hashtags.length >= min) break;
        if (have.has(tag.toLowerCase())) continue;
        v.hashtags.push(tag);
        have.add(tag.toLowerCase());
      }
    }
    const max = HASHTAG_MAXIMUMS[v.platform];
    if (max && v.hashtags.length > max) v.hashtags = v.hashtags.slice(0, max);
  }

  return result.variants;
}
