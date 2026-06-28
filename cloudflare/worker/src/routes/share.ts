/**
 * Share routes — public, unauthenticated surfaces that power free reach.
 *
 *   GET /api/share/meta      -> JSON ShareMeta for a kind (consumed by the SPA
 *                               and the Pages OG-injection function)
 *   GET /api/share/card.svg  -> a brand-correct 1200x630 SVG share card
 *
 * Everything here is derived from the pure ./lib/share-meta module, so it holds
 * no secrets and touches no database — safe to cache hard at the edge.
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';
import {
  buildShareMeta,
  renderShareCardSvg,
  isShareKind,
  type ShareKind,
} from '../lib/share-meta';

export const shareRoutes = new Hono<AppEnv>();

function readParams(c: any): { kind: ShareKind; count?: string; title?: string; origin: string } {
  const rawKind = (c.req.query('kind') || 'thread').toLowerCase();
  const kind: ShareKind = isShareKind(rawKind) ? rawKind : 'thread';
  const origin = c.env?.APP_URL || new URL(c.req.url).origin;
  return {
    kind,
    count: c.req.query('count') || undefined,
    title: c.req.query('title') || undefined,
    origin,
  };
}

shareRoutes.get('/meta', (c) => {
  const { kind, count, title, origin } = readParams(c);
  const meta = buildShareMeta(kind, { count, title, origin });
  c.header('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return c.json(meta);
});

shareRoutes.get('/card.svg', (c) => {
  const { kind, count, title, origin } = readParams(c);
  const meta = buildShareMeta(kind, { count, title, origin });
  const svg = renderShareCardSvg(meta);
  c.header('Content-Type', 'image/svg+xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return c.body(svg);
});

// B4 (Day 23): public, unauthenticated read-only letter view.
// An opaque share token unlocks a single letter's readable fields only —
// title, salutation, body, signature, and the author's first name. Everything
// else (id, user_id, delivery state, recipients, revisions) is redacted. A
// revoked or missing token returns 404 so a dead link reveals nothing.
shareRoutes.get('/note/:token', async (c) => {
  const token = c.req.param('token');

  const row = await c.env.DB.prepare(
    `SELECT t.revoked_at AS revoked_at, t.token AS token,
            l.title AS title, l.salutation AS salutation,
            l.body AS body, l.signature AS signature,
            l.deleted_at AS deleted_at, u.first_name AS author_first
       FROM letter_share_tokens t
       JOIN letters l ON l.id = t.letter_id
       JOIN users u ON u.id = t.user_id
      WHERE t.token = ?`,
  ).bind(token).first() as
    | { revoked_at: string | null; title: string | null; salutation: string | null;
        body: string | null; signature: string | null; deleted_at: string | null;
        author_first: string | null }
    | null;

  if (!row || row.revoked_at || row.deleted_at) {
    return c.json({ error: 'This link is no longer available' }, 404);
  }

  c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
  return c.json({
    data: {
      title: row.title,
      salutation: row.salutation,
      body: row.body,
      signature: row.signature,
      author: row.author_first || 'your family',
    },
  });
});
