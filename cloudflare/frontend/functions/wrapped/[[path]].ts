// Pages Function: per-surface OG for /wrapped/* shared year-in-review links.
import { handleOg, OG_CARDS } from '../_shared/og';

export const onRequestGet: PagesFunction = (context) =>
  handleOg(context as any, OG_CARDS.wrapped);
