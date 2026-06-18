// Pages Function: per-surface OG for /m/:token shared memorial links.
// Real users get the full SPA; crawlers get the privacy-safe memorial card.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.memorial);
