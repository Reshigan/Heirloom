// Pages Function: per-surface OG for /inherit/* shared links.
// Real users get the full SPA; crawlers get the privacy-safe "left for you" card.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.inherit);
