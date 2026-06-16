/**
 * safeRedirect — sanitize a `?redirect=` (or similar) param to prevent
 * open-redirect attacks. Only same-origin, absolute in-app paths are honored;
 * anything else (absolute URLs, protocol-relative `//evil.com`, `javascript:`)
 * falls back to the caller's safe default.
 *
 * A valid target must start with a single `/` and must not start with `//`
 * (protocol-relative) or `/\` (which some browsers normalize to `//`).
 */
export function safeRedirect(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
