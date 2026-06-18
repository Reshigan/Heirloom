/**
 * Cloudflare Pages OG injection — crawler-facing Open Graph for share links.
 *
 * The SPA ships ONE static set of OG tags in index.html (the homepage card), so
 * every shared deep link unfurls identically and generically. This helper takes
 * the SPA shell that Pages would otherwise serve and rewrites its social tags
 * per-surface, on the fly, with HTMLRewriter. Real users still receive the full
 * SPA (the JS boots normally); crawlers and link unfurlers see the right card.
 *
 * The canonical copy generator lives in the Worker at
 * cloudflare/worker/src/lib/share-meta.ts (unit-tested). These constants are
 * kept byte-identical to its `inherit` / `wrapped` (countless) branches. They
 * are intentionally STATIC and PRIVACY-SAFE: an inherit link is reachable by
 * anyone holding it, so its card names no one and reveals no content.
 */

export interface OgCard {
  title: string;
  description: string;
  image: string; // path under the site origin
}

export const OG_CARDS: Record<
  | 'inherit'
  | 'wrapped'
  | 'pricing'
  | 'terms'
  | 'privacy'
  | 'founder'
  | 'memoryRoom'
  | 'story'
  | 'card'
  | 'memorial',
  OgCard
> = {
  inherit: {
    title: 'Someone has been writing to you.',
    description:
      'A thread was set aside for you to read when the time came. Open it when you are ready - it has been waiting.',
    image: '/og/inherit.png',
  },
  wrapped: {
    title: 'A year, added to a family thread.',
    description:
      'Every entry is permanent and in order. The thread continues after this year, after us, after the company.',
    image: '/og/wrapped.png',
  },

  // --- Marketing routes: richer brand copy (no private data, public pages). ---
  pricing: {
    title: 'Start your family’s thousand-year thread.',
    description:
      'A perpetual, append-only archive owned by your bloodline, not a single account. Free to begin. Founder access secures it for good.',
    image: '/og-image.png',
  },
  founder: {
    title: 'Become a Founder of the Thread.',
    description:
      'A lifetime place in the founding generation of Heirloom - the archive built to outlast the company, the platform, and us.',
    image: '/og-image.png',
  },
  terms: {
    title: 'Heirloom - Terms of Service.',
    description:
      'The promises behind a perpetual family archive: append-only, owned by the bloodline, built to be inherited.',
    image: '/og-image.png',
  },
  privacy: {
    title: 'Heirloom - Privacy.',
    description:
      'How a thousand-year family thread is kept private: encrypted at rest, owned by the family, never sold.',
    image: '/og-image.png',
  },

  // --- Content routes: PRIVACY-SAFE. A shared link is reachable by anyone ---
  // --- holding it, so these name no one and reveal no entry content. ---
  memoryRoom: {
    title: 'A room in a family thread has been opened for you.',
    description:
      'Someone shared a place where their family’s story is kept. Step inside when you are ready - it was set aside for you.',
    image: '/og/entry.png',
  },
  story: {
    title: 'A family story has been shared with you.',
    description:
      'An entry from a perpetual family thread, kept in order and meant to last. Open the link to read it.',
    image: '/og/entry.png',
  },
  card: {
    title: 'A keepsake from a family thread.',
    description:
      'Someone made you a card from their family’s archive - a single thread, set aside to be passed on.',
    image: '/og/entry.png',
  },
  memorial: {
    title: 'A life is remembered here.',
    description:
      'A memorial kept inside a perpetual family thread - permanent, in order, and meant to be carried forward.',
    image: '/og/milestone.png',
  },
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rewrite the social meta of an SPA HTML response for one share surface.
 * Strips the static og:* / twitter:* tags, rewrites <title>, and appends the
 * per-surface tags into <head>. Returns a NEW Response; never throws on
 * well-formed HTML (callers still guard and fall back to the untouched SPA).
 */
export function injectOg(response: Response, card: OgCard, canonicalUrl: string, origin: string): Response {
  const absImage = card.image.startsWith('http') ? card.image : `${origin}${card.image}`;
  const t = escapeAttr(card.title);
  const d = escapeAttr(card.description);
  const img = escapeAttr(absImage);
  const url = escapeAttr(canonicalUrl);

  const tags =
    `<meta property="og:type" content="website" />` +
    `<meta property="og:site_name" content="Heirloom" />` +
    `<meta property="og:title" content="${t}" />` +
    `<meta property="og:description" content="${d}" />` +
    `<meta property="og:url" content="${url}" />` +
    `<meta property="og:image" content="${img}" />` +
    `<meta property="og:image:width" content="1200" />` +
    `<meta property="og:image:height" content="630" />` +
    `<meta name="twitter:card" content="summary_large_image" />` +
    `<meta name="twitter:title" content="${t}" />` +
    `<meta name="twitter:description" content="${d}" />` +
    `<meta name="twitter:image" content="${img}" />` +
    `<meta name="twitter:url" content="${url}" />`;

  return new HTMLRewriter()
    .on('meta[property^="og:"]', { element: (el) => el.remove() })
    .on('meta[name^="twitter:"]', { element: (el) => el.remove() })
    .on('title', { element: (el) => el.setInnerContent(card.title) })
    .on('head', { element: (el) => el.append(tags, { html: true }) })
    .transform(response);
}

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

/**
 * Shared handler body: fetch the SPA shell via next(), inject the card, and on
 * ANY failure fall back to the untouched SPA so a bug here can never 500 a real
 * shared link.
 */
export async function handleOg(context: PagesContext, card: OgCard): Promise<Response> {
  const res = await context.next();
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return res;
    const url = new URL(context.request.url);
    return injectOg(res, card, url.toString(), url.origin);
  } catch {
    return res;
  }
}
