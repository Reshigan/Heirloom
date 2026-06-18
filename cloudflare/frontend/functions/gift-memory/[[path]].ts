// Pages Function: per-surface OG for /gift-memory/* shared links.
// Real users get the full SPA; crawlers get the privacy-safe "a gift for you" card.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.giftMemory);
