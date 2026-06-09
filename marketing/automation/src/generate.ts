// Content generation via Claude API.
//
// Takes a theme (from themes.ts) and produces a single source post that
// captures the day's idea. variants.ts then derives per-platform variants.
//
// Uses prompt caching to amortize the system prompt + voice guidelines
// across all daily generations.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { Theme } from "./themes.js";
import { BRAND_VOICE_SYSTEM_PROMPT } from "./voice.js";

// Default to Sonnet 4.6 — quality is more than enough for marketing copy,
// and at this volume (1 daily run, ~250K input + ~120K output tokens/mo)
// cost is roughly $3-5/mo at sonnet pricing. Switch to claude-haiku-4-5
// for ~$0.25/mo, or claude-opus-4-7 for ~$13/mo if quality drift appears.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

const sourcePostSchema = z.object({
  hook: z.string().min(5).max(200),
  body: z.string().min(40).max(800),
  cta: z.string().min(5).max(200),
  saying: z.string().min(8).max(120),
  imagePrompt: z.string().min(20).max(400),
  hashtags: z.array(z.string()).max(12),
});

export type SourcePost = z.infer<typeof sourcePostSchema>;

interface GenerateInput {
  theme: Theme;
  date: Date;
  // Optional: recent post hooks to avoid repetition.
  recentHooks?: string[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildUserPrompt({ theme, date, recentHooks }: GenerateInput): string {
  const isoDate = date.toISOString().slice(0, 10);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const recent = recentHooks?.length
    ? `\n\nRecent hooks to avoid repeating (vary your angle and phrasing):\n${recentHooks.map((h) => `- ${h}`).join("\n")}`
    : "";

  const angle = theme.angles[Math.floor(Math.random() * theme.angles.length)];

  return `Today is ${dayOfWeek}, ${isoDate}.

Theme: ${theme.title}
Hook prompt (for inspiration only, don't copy): ${theme.hook}
Angle: ${angle}
Relation focus: ${theme.relation}${recent}

Produce ONE source post we'll adapt across platforms. Output strict JSON, no prose:

{
  "hook": "First 1-2 sentences. Must stop the scroll. Specific, present-tense, no abstract 'memories' / 'legacy' language. 80-200 chars.",
  "body": "The middle. 80-500 chars. One concrete observation, one small example, one human moment. No generic motivational content.",
  "cta": "A small, specific action. 'Ask one question this Sunday.' Not 'start your legacy.' Not a URL — leave linking to the variant layer.",
  "saying": "A single short line (12-18 words max) distilled from the post's central truth — the one sentence a reader would screenshot and share. No hashtags, no product name, no emoji. Must work as text on a cloth image. Example shapes: 'The recipe with no card. The voice on the 1997 tape. The photo nobody can name.' or 'Ask before the seat at the table changes.' or 'Your grandchildren can Google anything. They can't Google her voice.'",
  "imagePrompt": "A 40-80 word visual brief for the Heirloom cloth image — always a close-up of woven linen or natural-fiber textile. The cloth is the Heirloom identity: woven threads, natural cream-to-bone color, visible weave structure, soft directional light from one side, film grain. Leave the lower third clear for the saying text overlay. NOT: photography of people, hands, letters, objects, or scenery — only the woven cloth itself. Vary the weave tightness, thread texture, and light angle across posts so each feels distinct. Example: 'Close-up of cream linen weave, thread detail visible, raking afternoon light from the left, film grain, no objects, lower third in shadow for text overlay.'",
  "hashtags": ["10-12 lowercase tag candidates without the # symbol. Use all four groups below, picking the most relevant 2-4 from each: (1) intent tags — 'questionstoaskmom', 'questionstoaskdad', 'questionstoaskyourgrandparents', 'thingstodowithagingparents', 'questionstodowithparents', 'eldercare', 'agingparents'; (2) community tags — 'familyhistory', 'genealogy', 'ancestors', 'heritage', 'familytree', 'familystories', 'oralhistory', 'rootsandculture'; (3) emotion/occasion tags — 'memoriesforever', 'neverforget', 'generationalgift', 'familylove', 'familymemories', 'keepingitmemorable', 'rememberingthem'; (4) discovery tags — 'digitallegacy', 'legacyplanning', 'familyarchive', 'timecapsule', 'familykeepsake', 'preservefamilystories'. Vary per theme — don't repeat the same 10 every day."]
}

JSON only. No markdown fences. No explanation.`;
}

function stripFences(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fenced) return fenced[1].trim();
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last !== -1) return raw.slice(first, last + 1).trim();
  return raw.trim();
}

export async function generateSourcePost(input: GenerateInput): Promise<SourcePost> {
  const userPrompt = buildUserPrompt(input);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
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
  // Tolerate accidental markdown fences (including ```json, ```javascript, ```js).
  const json = stripFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Claude returned non-JSON: ${raw.slice(0, 300)}`);
  }

  return sourcePostSchema.parse(parsed);
}
