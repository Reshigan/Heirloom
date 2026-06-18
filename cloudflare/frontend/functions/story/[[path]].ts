// Pages Function: per-surface OG for /story/:token shared links.
// Real users get the full SPA; crawlers get the privacy-safe story card.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.story);
