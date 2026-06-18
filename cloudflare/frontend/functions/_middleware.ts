// Root Pages middleware — privacy guardrail for share/social unfurls.
//
// The SPA shell (index.html) ships ONE static, privacy-safe homepage card, and
// each public share surface has its own per-route Pages Function under
// functions/<prefix>/ that rewrites the card to a generic (no-PII) variant.
// Client-side Helmet on those pages is irrelevant to scrapers (they don't run
// JS) but is kept generic in the SPA too as defence-in-depth.
//
// This middleware is the LAST-RESORT net: for an HTML navigation that has NO
// per-route function AND is not the homepage, it re-asserts the generic
// homepage card so a future un-handled deep link can never unfurl with whatever
// the SPA shell happened to contain. It is intentionally a near-no-op:
// - asset / API / non-HTML requests defer straight to next()
// - every prefix that already owns a per-route function defers to next()
//   (so per-surface cards are NEVER clobbered)
// - on ANY error it returns the untouched response (a bug here can't 500 a link)
import { injectOg } from './_shared/og';

// Prefixes that already have a dedicated functions/<prefix>/[[path]].ts handler.
// Requests under these are left entirely to that handler.
const HANDLED_PREFIXES = [
  'm',
  'story',
  'card',
  'inherit',
  'inheritance',
  'gift-memory',
  'memory-room',
  'wrapped',
  'founder',
  'pricing',
  'terms',
  'privacy',
];

// Generic, privacy-safe card identical in spirit to the SPA homepage shell.
const HOME_CARD = {
  title: 'Heirloom — your family’s thousand-year thread',
  description:
    'A perpetual, append-only archive owned by your bloodline, not a single account. The thread continues after you, after us, after the company.',
  image: '/og-image.png',
};

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;

  // Only ever consider GET navigations.
  if (request.method !== 'GET') return next();

  const url = new URL(request.url);
  const firstSegment = url.pathname.split('/').filter(Boolean)[0] || '';

  // Defer to the dedicated per-route handler — never touch its card.
  if (HANDLED_PREFIXES.includes(firstSegment)) return next();

  const res = await next();
  try {
    const contentType = res.headers.get('content-type') || '';
    // Assets, API JSON, anything non-HTML: pass through untouched.
    if (!contentType.includes('text/html')) return res;
    // Re-assert the generic, privacy-safe card on any other HTML navigation.
    return injectOg(res, HOME_CARD, url.toString(), url.origin);
  } catch {
    return res;
  }
};
