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

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

const sourcePostSchema = z.object({
  hook: z.string().min(5).max(200),
  body: z.string().min(40).max(800),
  cta: z.string().min(5).max(120),
  imagePrompt: z.string().min(20).max(400),
  hashtags: z.array(z.string()).max(8),
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
  "imagePrompt": "A short visual brief for an image generator. Warm, photographic, not overly produced. Avoid stock-photo cliches (multigenerational hands, sepia tones, candles). Examples: 'A handwritten recipe card on a wood kitchen table, soft morning light' or 'An open photo album, one Polaroid pulled out, family living room.'",
  "hashtags": ["3-5 lowercase tag candidates without the # symbol, e.g. 'questionstoaskmom'. Variants will pick a subset per platform."]
}

JSON only. No markdown fences. No explanation.`;
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
  // Tolerate accidental markdown fences.
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Claude returned non-JSON: ${raw.slice(0, 300)}`);
  }

  return sourcePostSchema.parse(parsed);
}
