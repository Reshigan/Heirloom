/*
 * Workers-AI model ids, in ONE place.
 *
 * Cloudflare deprecates and removes model ids from the catalog over time. When
 * a referenced model is pulled, every `AI.run('<dead-id>')` call throws and the
 * route returns 500 — which is exactly how `@cf/meta/llama-3-8b-instruct`
 * (removed from the catalog) silently broke every Llama-backed AI feature.
 *
 * Keep all model ids here so the next deprecation is a one-line change, not a
 * cross-file grep. Verify availability with `wrangler ai models`.
 */

// General text generation (chat-completions shape: { messages, max_tokens, temperature }).
export const AI_TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

// Speech-to-text. Still in the catalog — kept here for the same single-source reason.
export const AI_WHISPER_MODEL = '@cf/openai/whisper';
