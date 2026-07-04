/**
 * share-meta — zero-budget viral surface generator.
 *
 * Every shareable Heirloom link should unfurl as a quiet, on-voice card rather
 * than the generic homepage. This module is the single source of truth for the
 * per-surface title/description, the Open Graph / Twitter meta tags, and a
 * brand-correct SVG share card. It is intentionally PURE (no env, no I/O, no
 * Date.now) so it can be unit-tested exhaustively and reused from both the
 * Worker (API) and the Pages Function (crawler OG injection).
 *
 * Design constitution it must honour (ART_DIRECTION.md):
 *   - Type is the hero. Cormorant Garamond serif headline, no icon library, the
 *     only mark allowed is the infinity glyph (the U+221E character).
 *   - ONE emotional colour: warm #cf8248, used sparingly (a single hairline).
 *   - Bone #f2e6d0 on ink #070d14. 0px radius. 1px hairlines.
 *   - Voice (marketing/automation voice.ts): never the word "legacy", never
 *     gift-product framing. Evocative restraint.
 *
 * Privacy invariant: the `inherit` surface is reachable by anyone holding the
 * link (and by every crawler that touches it), so it MUST NOT embed recipient
 * or author PII. It speaks in the second person without naming anyone.
 */

export type ShareKind = 'thread' | 'inherit' | 'wrapped' | 'milestone' | 'entry';

export interface ShareParams {
  /** Absolute origin, e.g. "https://heirloom.blue". No trailing slash required. */
  origin?: string;
  /** Canonical path for this share, e.g. "/inherit/abc". Defaults per-kind. */
  path?: string;
  /** Entry count, for `wrapped` / `milestone`. Coerced to a non-negative int. */
  count?: number | string;
  /** A sharer-supplied title, for `entry`. Sanitised + clamped. Never used for `inherit`. */
  title?: string;
}

export interface ShareMeta {
  kind: ShareKind;
  title: string;
  description: string;
  /** Absolute URL to the og:image. */
  image: string;
  /** Absolute canonical URL. */
  url: string;
  siteName: string;
  card: 'summary_large_image';
}

export const SITE_NAME = 'Heirloom';
export const DEFAULT_ORIGIN = 'https://heirloom.blue';

const TITLE_MAX = 70;
const DESC_MAX = 200;
const ELLIPSIS = '…';
// the Drop mark (brand/mark/heirloom-drop-*) — replaces the retired ∞

const KINDS: Record<ShareKind, true> = {
  thread: true,
  inherit: true,
  wrapped: true,
  milestone: true,
  entry: true,
};

export function isShareKind(value: string): value is ShareKind {
  return Object.prototype.hasOwnProperty.call(KINDS, value);
}

/** Map a request pathname to the share surface it represents. */
export function shareKindForPath(pathname: string): ShareKind {
  const p = (pathname || '/').toLowerCase();
  if (p.startsWith('/inherit')) return 'inherit';
  if (p.startsWith('/wrapped')) return 'wrapped';
  if (p.startsWith('/milestone')) return 'milestone';
  if (p.startsWith('/entry') || p.startsWith('/s/')) return 'entry';
  return 'thread';
}

function normaliseOrigin(origin?: string): string {
  const o = (origin || DEFAULT_ORIGIN).trim();
  return o.replace(/\/+$/, '');
}

function coerceCount(count?: number | string): number {
  const n = typeof count === 'string' ? parseInt(count, 10) : count;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** Collapse whitespace, strip control chars, and clamp to a max length. */
export function sanitiseText(input: string, max: number): string {
  const cleaned = (input || '')
    // Strip ASCII control characters (incl. newlines/tabs) before collapsing.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= max) return cleaned;
  // Clamp on a word boundary where possible, then add a single ellipsis.
  const slice = cleaned.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const body = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${body.trimEnd()}${ELLIPSIS}`;
}

/** Group digits with thin separators: 1234 -> "1,234". */
export function formatCount(n: number): string {
  return coerceCount(n).toLocaleString('en-US');
}

/**
 * Build the canonical share metadata for a surface. Always returns a complete,
 * safe object — unknown/garbage input degrades to the `thread` default.
 */
export function buildShareMeta(kind: ShareKind, params: ShareParams = {}): ShareMeta {
  const origin = normaliseOrigin(params.origin);
  const safeKind: ShareKind = isShareKind(kind) ? kind : 'thread';
  const count = coerceCount(params.count);

  let title: string;
  let description: string;
  let image: string;
  let defaultPath: string;

  switch (safeKind) {
    case 'inherit':
      // Privacy-safe: no names, no content. Second person, no ceremony spoiled.
      title = 'Someone has been writing to you.';
      description =
        'A thread was set aside for you to read when the time came. Open it when you are ready - it has been waiting.';
      image = `${origin}/og/inherit.png`;
      defaultPath = '/inherit';
      break;
    case 'wrapped':
      title = count > 0
        ? `${formatCount(count)} entries added to a family thread this year.`
        : 'A year, added to a family thread.';
      description =
        'Every entry is permanent and in order. The thread continues after this year, after us, after the company.';
      image = `${origin}/og/wrapped.png`;
      defaultPath = '/wrapped';
      break;
    case 'milestone':
      title = count > 0
        ? `Entry No. ${formatCount(count)} in our family thread.`
        : 'Another entry in our family thread.';
      description =
        'Append-only, multi-generational, time-locked. Start the entry no one else can write.';
      image = `${origin}/og/milestone.png`;
      defaultPath = '/milestone';
      break;
    case 'entry': {
      const shared = sanitiseText(params.title || '', TITLE_MAX);
      title = shared || 'An entry from our family thread.';
      description =
        'One entry, kept in order with all the others. Read what came before. Add what comes next.';
      image = `${origin}/og/entry.png`;
      defaultPath = '/';
      break;
    }
    case 'thread':
    default:
      title = "Some things only get deeper.";
      description =
        'Write today. Lock entries for descendants who do not exist yet. Read what came before. The thread continues after you, after us, after the company.';
      image = `${origin}/og-image.png`;
      defaultPath = '/';
      break;
  }

  const path = params.path && params.path.startsWith('/') ? params.path : defaultPath;

  return {
    kind: safeKind,
    title: sanitiseText(title, TITLE_MAX),
    description: sanitiseText(description, DESC_MAX),
    image,
    url: `${origin}${path}`,
    siteName: SITE_NAME,
    card: 'summary_large_image',
  };
}

/** HTML/attribute-escape a value for safe interpolation into markup. */
export function escapeHtml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render the Open Graph + Twitter meta tags as an HTML fragment. Used both to
 * build the crawler shell and (by the Pages Function) to replace the static
 * homepage tags on a per-route basis.
 */
export function renderMetaTags(meta: ShareMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  const site = escapeHtml(meta.siteName);
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${site}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="${meta.card}" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="twitter:url" content="${url}" />`,
  ].join('\n    ');
}

/**
 * Render a brand-correct 1200x630 share card as an SVG string. Pure and
 * dependency-free so it runs at the edge and in tests. Used for the in-product
 * "share preview" and as a downloadable asset; the Worker serves it at
 * /api/share/card.svg. (PNG rasterisation for og:image is a documented
 * follow-up — see VIRAL_MECHANICS.md.)
 */
export function renderShareCardSvg(meta: ShareMeta): string {
  const ink = '#070d14';
  const bone = '#f2e6d0';
  const warm = '#cf8248';
  const muted = '#9b9486';

  // Wrap the headline onto at most three lines for the serif display setting.
  const lines = wrapForCard(meta.title, 22).slice(0, 3);
  const lineHeight = 76;
  const blockTop = 300 - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, i) => `<tspan x="100" y="${blockTop + i * lineHeight}">${escapeHtml(line)}</tspan>`)
    .join('');

  const eyebrow = escapeHtml(eyebrowFor(meta.kind));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeHtml(meta.title)}">
  <rect width="1200" height="630" fill="${ink}"/>
  <line x1="100" y1="120" x2="1100" y2="120" stroke="${warm}" stroke-width="1"/>
  <text x="100" y="100" font-family="'Space Mono', ui-monospace, monospace" font-size="22" letter-spacing="3" fill="${muted}">${eyebrow}</text>
  <text font-family="'Cormorant Garamond', 'Times New Roman', serif" font-size="60" fill="${bone}" font-weight="400">${tspans}</text>
  <line x1="100" y1="500" x2="1100" y2="500" stroke="${bone}" stroke-width="1" opacity="0.18"/>
  <text x="100" y="548" font-family="Inter, system-ui, sans-serif" font-size="24" fill="${muted}">${escapeHtml(SITE_NAME)} — the family thread that outlives all of us</text>
  <g transform="translate(1046, 508) scale(1.05)" fill="${warm}">
    <path d="M4 13.9 C 15 11.9, 29 15.3, 44 13 C 30 16.3, 15 14, 4 15 Z"/>
    <path d="M23.6 24.9 C 26.8 24.8, 28.7 27.2, 28.2 30 C 27.8 32.6, 25.2 34.1, 22.8 33.4 C 20.5 32.7, 19.5 30.3, 20.3 27.9 C 21 26, 22.2 25.1, 23.6 24.9 Z"/>
    <path d="M10 31.4 C 14.5 41.2, 33.5 41.9, 38.4 30.7 C 33.5 40.2, 14.5 40.2, 10 31.4 Z" fill-opacity="0.55"/>
  </g>
</svg>`;
}

function eyebrowFor(kind: ShareKind): string {
  switch (kind) {
    case 'inherit':
      return 'LEFT FOR YOU';
    case 'wrapped':
      return 'A YEAR IN THE THREAD';
    case 'milestone':
      return 'THE THREAD CONTINUES';
    case 'entry':
      return 'FROM THE THREAD';
    case 'thread':
    default:
      return 'HEIRLOOM';
  }
}

/** Greedy word-wrap into lines of at most `maxChars`, never splitting words. */
export function wrapForCard(text: string, maxChars: number): string[] {
  const words = sanitiseText(text, TITLE_MAX).split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}
