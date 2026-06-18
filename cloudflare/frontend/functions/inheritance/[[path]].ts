// Pages Function: per-surface OG for /inheritance/:token shared links.
// Real users get the full SPA; crawlers get the privacy-safe "left for you"
// card. This route names no recipient and reveals no token — the link is
// reachable by anyone holding it, so the card stays generic.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.inherit);
