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
