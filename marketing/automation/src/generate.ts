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
import { monthlyHashtagPool } from "./hashtags.js";

// Generation provider. Cloudflare Workers AI is preferred when its creds are
// present (free tier, ~10k neurons/day — this workload of a few short JSON
// generations a day costs $0 and reuses the platform we already run on).
// Anthropic is the fallback when only ANTHROPIC_API_KEY is set. Force either
// explicitly with GEN_PROVIDER=cloudflare|anthropic.
export type GenProvider = "cloudflare" | "anthropic";

// NB: use `||` not `??` — GitHub Actions injects an *empty string* for an unset
// `vars.X`, which `??` would pass through. An empty model collapses the request
// URL to `.../ai/run/` and Cloudflare then errors "Invalid request body: model".
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
// Llama 3.3 70B (fp8 fast) is the closest free model to the prior Sonnet output
// for marketing copy. Override with CLOUDFLARE_AI_MODEL.
const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function hasCloudflare(): boolean {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);
}

// The provider that will actually run, honoring an explicit GEN_PROVIDER and
// otherwise auto-selecting Cloudflare → Anthropic by which creds exist. Returns
// null when nothing is configured (engine stays dormant rather than crashing).
export function activeProvider(): GenProvider | null {
  const explicit = process.env.GEN_PROVIDER as GenProvider | undefined;
  if (explicit === "cloudflare") return hasCloudflare() ? "cloudflare" : null;
  if (explicit === "anthropic") return process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (hasCloudflare()) return "cloudflare";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function hasGenProvider(): boolean {
  return activeProvider() !== null;
}

const sourcePostSchema = z.object({
  hook: z.string().min(5).max(200),
  body: z.string().min(40).max(800),
  cta: z.string().min(5).max(200),
  saying: z.string().min(8).max(160),
  imagePrompt: z.string().min(20).max(600),
  hashtags: z.array(z.string()).max(12),
});

export type SourcePost = z.infer<typeof sourcePostSchema>;

interface GenerateInput {
  theme: Theme;
  date: Date;
  // Optional: recent post hooks to avoid repetition.
  recentHooks?: string[];
  // Optional: which slot this run is in the day (e.g. the UTC hour). When the
  // day fires several runs, this deterministically rotates the angle so each
  // slot draws a different one from the theme's pool — guaranteeing the day's
  // posts diverge instead of randomly colliding. Falls back to random.
  slotSeed?: number;
}

// Lazy — the Anthropic SDK throws on construction without a key, which would
// crash a Cloudflare-only run at import time.
let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function buildUserPrompt({ theme, date, recentHooks, slotSeed }: GenerateInput): string {
  const isoDate = date.toISOString().slice(0, 10);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const recent = recentHooks?.length
    ? `\n\nAlready posted — do NOT repeat the angle, opening, or phrasing of any of these. Take a genuinely different line:\n${recentHooks.map((h) => `- ${h}`).join("\n")}`
    : "";

  // Deterministic per-slot rotation when a slot seed is given, so each of the
  // day's runs lands on a different angle; otherwise fall back to random.
  const angle =
    slotSeed === undefined
      ? theme.angles[Math.floor(Math.random() * theme.angles.length)]
      : theme.angles[slotSeed % theme.angles.length];

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
  "saying": "The headline of the image — at thumbnail size the reader sees ONLY this line, so it must stop the scroll on its own. 8-20 words of plain spoken English a 50-year-old would text to a sibling. Use the taggable-question or asymmetry shape: a question so specific the reader knows exactly who to send it to, or a contrast that reframes something familiar. Examples: 'Ask your dad how he knew he was in love with your mom. Not how you met — how he knew.' / 'Your kids can Google anything. They can't Google your father's voice.' / 'Do you know what your dad was doing at your age? Most people never ask.' NOT poetry fragments, NOT product language (no 'thread', 'weave', 'loom'), no hashtags, no product name, no emoji.",
  "imagePrompt": "A 40-80 word visual brief for the Heirloom cloth image — always a close-up of woven linen or natural-fiber textile. The cloth is the Heirloom identity: woven threads, natural cream-to-bone color, visible weave structure, soft directional light from one side, film grain. Leave the lower third clear for the saying text overlay. NOT: photography of people, hands, letters, objects, or scenery — only the woven cloth itself. Vary the weave tightness, thread texture, and light angle across posts so each feels distinct. Example: 'Close-up of cream linen weave, thread detail visible, raking afternoon light from the left, film grain, no objects, lower third in shadow for text overlay.'",
  "hashtags": ["10-12 lowercase tag candidates without the # symbol, chosen ONLY from this month's rotation pool (the pool rotates monthly so the account never repeats a fixed block): ${monthlyHashtagPool(date).join(", ")}. Pick the ones most relevant to THIS post's relation and angle — not the same 10 every day."]
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

// One chat turn → raw model text. Dispatches to whichever provider is active.
async function chat(system: string, user: string): Promise<string> {
  const provider = activeProvider();
  if (provider === "cloudflare") return chatCloudflare(system, user);
  if (provider === "anthropic") return chatAnthropic(system, user);
  throw new Error(
    "No generation provider configured. Set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (free) or ANTHROPIC_API_KEY.",
  );
}

async function chatAnthropic(system: string, user: string): Promise<string> {
  const response = await anthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Claude response");
  }
  return textBlock.text;
}

async function chatCloudflare(system: string, user: string): Promise<string> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const token = process.env.CLOUDFLARE_API_TOKEN!;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CLOUDFLARE_MODEL}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        max_tokens: 1500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // Nudge models that honor it toward bare JSON; stripFences() handles the rest.
        response_format: { type: "json_object" },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cloudflare Workers AI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    success?: boolean;
    result?: { response?: string | object };
    errors?: unknown[];
  };
  const out = data.result?.response;
  if (!data.success || out == null) {
    throw new Error(
      `Cloudflare Workers AI returned no response: ${JSON.stringify(data.errors ?? data).slice(0, 300)}`,
    );
  }
  // response_format:json_object can come back already-parsed; re-stringify so the
  // shared stripFences/JSON.parse path below handles both shapes uniformly.
  return typeof out === "string" ? out : JSON.stringify(out);
}

// Generic one-shot completion against the active provider. Used by engage.ts to
// draft genuine reply openers. Guard with hasGenProvider() before calling —
// chat() throws when nothing is configured.
export async function complete(system: string, user: string): Promise<string> {
  return (await chat(system, user)).trim();
}

export async function generateSourcePost(input: GenerateInput): Promise<SourcePost> {
  const userPrompt = buildUserPrompt(input);

  const raw = (await chat(BRAND_VOICE_SYSTEM_PROMPT, userPrompt)).trim();
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
