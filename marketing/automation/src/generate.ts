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
// Anthropic is the fallback when only ANTHROPIC_API_KEY is set. Ollama is a
// self-hosted text-only backend (OLLAMA_BASE_URL + OLLAMA_MODEL) — for local
// dev or a private GPU; it never receives images, only the JSON text prompt.
// Force any explicitly with GEN_PROVIDER=cloudflare|anthropic|ollama.
export type GenProvider = "cloudflare" | "anthropic" | "ollama";

// NB: use `||` not `??` — GitHub Actions injects an *empty string* for an unset
// `vars.X`, which `??` would pass through. An empty model collapses the request
// URL to `.../ai/run/` and Cloudflare then errors "Invalid request body: model".
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
// Llama 3.3 70B (fp8 fast) is the closest free model to the prior Sonnet output
// for marketing copy. Override with CLOUDFLARE_AI_MODEL.
const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
// Ollama default — a capable local instruct model for the JSON-shaped source
// post. Override with OLLAMA_MODEL (e.g. llama3.1:8b, qwen2.5:14b, gemma2:9b).
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

function hasCloudflare(): boolean {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);
}

function hasOllama(): boolean {
  return Boolean(process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL !== undefined) ||
    Boolean(process.env.GEN_PROVIDER === "ollama" && process.env.OLLAMA_BASE_URL);
}

// Anthropic is usable via either a direct ANTHROPIC_API_KEY or the
// ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL pair (e.g. the Claude Code local
// proxy) — the SDK reads both. Lets the engine run preview locally with no
// paid key.
function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) ||
    Boolean(process.env.ANTHROPIC_AUTH_TOKEN && process.env.ANTHROPIC_BASE_URL);
}

// The provider that will actually run, honoring an explicit GEN_PROVIDER and
// otherwise auto-selecting Cloudflare → Anthropic → Ollama by which creds exist.
// Returns null when nothing is configured (engine stays dormant rather than crashing).
export function activeProvider(): GenProvider | null {
  const explicit = process.env.GEN_PROVIDER as GenProvider | undefined;
  if (explicit === "cloudflare") return hasCloudflare() ? "cloudflare" : null;
  if (explicit === "anthropic") return hasAnthropic() ? "anthropic" : null;
  if (explicit === "ollama") return hasOllama() ? "ollama" : null;
  if (hasCloudflare()) return "cloudflare";
  if (hasAnthropic()) return "anthropic";
  if (hasOllama()) return "ollama";
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
  // Optional: a qualitative steer derived from live system signals (signals.ts)
  // biasing the angle toward what families actually do here. Angle-only — it
  // must never make the model cite counts or "other families".
  signalHint?: string;
}

// Lazy — the Anthropic SDK throws on construction without a key, which would
// crash a Cloudflare-only run at import time.
let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) {
    // The SDK reads ANTHROPIC_API_KEY, or ANTHROPIC_AUTH_TOKEN +
    // ANTHROPIC_BASE_URL (Claude Code local proxy) from env automatically.
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

function buildUserPrompt({ theme, date, recentHooks, slotSeed, signalHint }: GenerateInput): string {
  const isoDate = date.toISOString().slice(0, 10);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const recent = recentHooks?.length
    ? `\n\nAlready posted — do NOT repeat the angle, opening, or phrasing of any of these. Take a genuinely different line:\n${recentHooks.map((h) => `- ${h}`).join("\n")}`
    : "";
  const steer = signalHint
    ? `\n\nStrategic steer (shapes the angle only — never cite numbers, counts, or 'other families'): ${signalHint}`
    : "";

  // Deterministic per-slot rotation when a slot seed is given, so each of the
  // day's runs lands on a different angle; otherwise fall back to random.
  const angle =
    slotSeed === undefined
      ? theme.angles[Math.floor(Math.random() * theme.angles.length)]
      : theme.angles[slotSeed % theme.angles.length];

  // Brand themes (id prefix "b0") talk about the product itself — the family
  // water, the book, the seal. The story-hook saying rule bans product language
  // ("thread"/"weave"/"loom"); brand posts NEED it, so swap in a brand saying
  // brief that still bans generic motivational poetry but permits the Deep's
  // own vocabulary (water, dye, seal, deep, settle, thread).
  const isBrand = theme.id.startsWith("b0");
  const sayingBrief = isBrand
    ? `"saying": "The image headline — at thumbnail size the reader sees ONLY this line. 8-20 words of plain spoken English. Name the differentiator concretely: the family's own water, their dye, the seal, the book. Permitted vocabulary: water, deep, dye, seal, settle, thread, family, colour. BANNED: generic 'memories/legacy/forever' language, poetry fragments, hashtags, emoji, product name 'Heirloom'. Examples: 'Every family's water is a different colour. Yours is mixed from your own dyes.' / 'You don't hit save. You seal it — in your own colour.' / 'One day the deep water becomes a book your great-granddaughter holds.'",`
    : `"saying": "The headline of the image — at thumbnail size the reader sees ONLY this line, so it must stop the scroll on its own. 8-20 words of plain spoken English a 50-year-old would text to a sibling. Use the taggable-question or asymmetry shape: a question so specific the reader knows exactly who to send it to, or a contrast that reframes something familiar. Examples: 'Ask your dad how he knew he was in love with your mom. Not how you met — how he knew.' / 'Your kids can Google anything. They can't Google your father's voice.' / 'Do you know what your dad was doing at your age? Most people never ask.' NOT poetry fragments, NOT product language (no 'thread', 'weave', 'loom'), no hashtags, no product name, no emoji.",`;

  return `Today is ${dayOfWeek}, ${isoDate}.

Theme: ${theme.title}
Hook prompt (for inspiration only, don't copy): ${theme.hook}
Angle: ${angle}
Relation focus: ${theme.relation}${recent}${steer}

Produce ONE source post we'll adapt across platforms. Output strict JSON, no prose:

{
  "hook": "First 1-2 sentences. Must stop the scroll. Specific, present-tense, no abstract 'memories' / 'legacy' language. 80-200 chars.",
  "body": "The middle. 80-500 chars. One concrete observation, one small example, one human moment. No generic motivational content.",
  "cta": "A small, specific action. 'Ask one question this Sunday.' Not 'start your legacy.' Not a URL — leave linking to the variant layer.",
  ${sayingBrief}
  "imagePrompt": "A 40-80 word visual brief for the Heirloom Deep image — always a close-up of deep still water with a warm surface line and the family's natural-dye colour subtly seeding the water (a faint tint, never a flat colour fill). The Deep is the Heirloom identity: ink-dark ground #070d14, a thin warm (copper) line at the surface, slow concentric depth-rings (the Sounding mark) faintly visible, soft directional light from one side, film grain. Leave the lower third clear for the saying text overlay. NOT: photography of people, hands, letters, objects, scenery, or woven cloth/textile — only the deep water surface itself. Vary the dye tint, depth-ring spacing, and light angle across posts so each feels distinct. Example: 'Close-up of deep still water, ink-dark with a faint copper surface line, slow concentric depth-rings barely visible, raking light from the left, film grain, no objects, lower third in shadow for text overlay.'",
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
  if (provider === "ollama") return chatOllama(system, user);
  throw new Error(
    "No generation provider configured. Set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (free), ANTHROPIC_API_KEY, or OLLAMA_BASE_URL + OLLAMA_MODEL.",
  );
}

async function chatAnthropic(system: string, user: string): Promise<string> {
  const response = await anthropic().messages.create({
    model: ANTHROPIC_MODEL,
    // Generous budget: some Anthropic-compatible proxies (e.g. ollama.com) emit
    // a `thinking` block before the text answer; 1500 can exhaust on thinking
    // alone and never produce the text block. 4096 leaves room for both.
    max_tokens: 4096,
    // Disable extended thinking. The marketing JSON prompts need a direct text
    // answer, not a reasoning trace — and some local proxies force a thinking
    // block that eats the whole budget before any JSON is emitted. Explicit
    // disabled is a no-op on real Anthropic (thinking is off by default) and
    // asks the proxy to skip the trace. The stripFences/JSON.parse path still
    // guards against any prose that leaks through.
    thinking: { type: "disabled" },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const textBlock = response.content.find((c) => c.type === "text");
  if (textBlock && textBlock.type === "text") return textBlock.text;
  // Fallback: a proxy that returned only a thinking block, or a non-standard
  // content shape. Use the last block's `text`/`thinking` field rather than
  // crashing — stripFences + JSON.parse downstream will reject garbage safely.
  const last = response.content[response.content.length - 1] as
    | { text?: string; thinking?: string } | undefined;
  const fallback = last?.text ?? last?.thinking;
  if (fallback) return fallback;
  throw new Error("No text content in Claude response");
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

async function chatOllama(system: string, user: string): Promise<string> {
  // Ollama /api/chat — text-only. format:json forces a JSON-shaped reply so the
  // shared stripFences/JSON.parse path works the same as Cloudflare. Images are
  // never sent (the Ollama provider is text-only by design).
  const res = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      options: { num_predict: 1500, temperature: 0.8 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { message?: { content?: string }; error?: string };
  if (data.error) throw new Error(`Ollama error: ${data.error}`);
  const out = data.message?.content;
  if (!out) throw new Error("Ollama returned no message content");
  return out;
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
    throw new Error(`${activeProvider()} returned non-JSON: ${raw.slice(0, 300)}`);
  }

  return sourcePostSchema.parse(parsed);
}
