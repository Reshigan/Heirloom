// Pages Function: per-surface OG for /founder and /founder/welcome shared links.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.founder);
