import { describe, it, expect } from 'vitest';
import {
  buildShareMeta,
  shareKindForPath,
  isShareKind,
  sanitiseText,
  formatCount,
  wrapForCard,
  escapeHtml,
  renderMetaTags,
  renderShareCardSvg,
  DEFAULT_ORIGIN,
  SITE_NAME,
} from './share-meta';

// These are the zero-budget viral surfaces. The whole point is that a shared
// link unfurls as an on-voice card; if this logic regresses, every share goes
// back to looking like the generic homepage. So the tests pin behaviour AND
// the brand/voice/privacy invariants.

describe('shareKindForPath', () => {
  it('routes known prefixes to their surfaces', () => {
    expect(shareKindForPath('/inherit/abc123')).toBe('inherit');
    expect(shareKindForPath('/wrapped/2026')).toBe('wrapped');
    expect(shareKindForPath('/milestone/1000')).toBe('milestone');
    expect(shareKindForPath('/entry/xyz')).toBe('entry');
    expect(shareKindForPath('/s/xyz')).toBe('entry');
  });

  it('is case-insensitive', () => {
    expect(shareKindForPath('/Inherit/ABC')).toBe('inherit');
  });

  it('defaults unknown paths to the thread surface', () => {
    expect(shareKindForPath('/')).toBe('thread');
    expect(shareKindForPath('/dashboard')).toBe('thread');
    expect(shareKindForPath('')).toBe('thread');
  });
});

describe('isShareKind', () => {
  it('accepts the five known kinds and rejects everything else', () => {
    for (const k of ['thread', 'inherit', 'wrapped', 'milestone', 'entry']) {
      expect(isShareKind(k)).toBe(true);
    }
    expect(isShareKind('toString')).toBe(false); // not fooled by prototype keys
    expect(isShareKind('nope')).toBe(false);
    expect(isShareKind('')).toBe(false);
  });
});

describe('buildShareMeta — defaults & structure', () => {
  it('always returns a complete object with absolute URLs', () => {
    const m = buildShareMeta('thread');
    expect(m.title.length).toBeGreaterThan(0);
    expect(m.description.length).toBeGreaterThan(0);
    expect(m.url.startsWith(DEFAULT_ORIGIN)).toBe(true);
    expect(m.image.startsWith(DEFAULT_ORIGIN)).toBe(true);
    expect(m.siteName).toBe(SITE_NAME);
    expect(m.card).toBe('summary_large_image');
  });

  it('degrades unknown kinds to the thread surface', () => {
    // @ts-expect-error deliberately passing an invalid kind
    const m = buildShareMeta('garbage');
    expect(m.kind).toBe('thread');
    expect(m.title).toContain('thousand-year thread');
  });

  it('normalises a trailing-slash origin and joins the path cleanly', () => {
    const m = buildShareMeta('inherit', { origin: 'https://staging.heirloom.blue/', path: '/inherit/tok' });
    expect(m.url).toBe('https://staging.heirloom.blue/inherit/tok');
    expect(m.image).toBe('https://staging.heirloom.blue/og/inherit.png');
  });

  it('ignores a non-absolute path and falls back to the per-kind default', () => {
    const m = buildShareMeta('wrapped', { path: 'javascript:alert(1)' });
    expect(m.url).toBe(`${DEFAULT_ORIGIN}/wrapped`);
  });
});

describe('buildShareMeta — privacy invariant (inherit)', () => {
  it('never embeds a supplied title or PII for inherit', () => {
    const m = buildShareMeta('inherit', { title: 'Love, Grandma Rosa', path: '/inherit/secret-token' });
    expect(m.title).toBe('Someone has been writing to you.');
    expect(m.title).not.toContain('Rosa');
    expect(m.description).not.toContain('Rosa');
    // The token may appear in the canonical URL (it must, to resolve) but never
    // in the human-facing card copy.
    expect(m.title).not.toContain('secret-token');
    expect(m.description).not.toContain('secret-token');
  });
});

describe('buildShareMeta — counts', () => {
  it('formats wrapped/milestone counts with separators', () => {
    expect(buildShareMeta('wrapped', { count: 1234 }).title).toContain('1,234');
    expect(buildShareMeta('milestone', { count: 1000 }).title).toContain('No. 1,000');
  });

  it('accepts numeric strings and clamps negatives/garbage to the countless copy', () => {
    expect(buildShareMeta('wrapped', { count: '42' }).title).toContain('42');
    expect(buildShareMeta('milestone', { count: -5 }).title).toBe('Another entry in our family thread.');
    expect(buildShareMeta('wrapped', { count: 'NaN' }).title).toBe('A year, added to a family thread.');
  });
});

describe('buildShareMeta — voice guardrails', () => {
  it('never uses the forbidden word "legacy" in any surface copy', () => {
    for (const k of ['thread', 'inherit', 'wrapped', 'milestone', 'entry'] as const) {
      const m = buildShareMeta(k, { count: 100, title: 'A quiet afternoon' });
      expect(`${m.title} ${m.description}`.toLowerCase()).not.toContain('legacy');
    }
  });
});

describe('sanitiseText', () => {
  it('collapses whitespace and strips newlines/control chars', () => {
    expect(sanitiseText('hello   world\n\tagain', 100)).toBe('hello world again');
  });

  it('clamps long input on a word boundary and adds a single ellipsis', () => {
    const out = sanitiseText('the quick brown fox jumps over the lazy dog again and again', 25);
    expect(out.length).toBeLessThanOrEqual(25);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toContain('……');
  });

  it('handles empty/garbage input', () => {
    expect(sanitiseText('', 10)).toBe('');
    // @ts-expect-error testing runtime resilience to non-strings
    expect(sanitiseText(undefined, 10)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes the five dangerous characters', () => {
    expect(escapeHtml(`<script>"&'`)).toBe('&lt;script&gt;&quot;&amp;&#39;');
  });
});

describe('renderMetaTags', () => {
  it('emits OG + Twitter tags and escapes interpolated values', () => {
    const meta = buildShareMeta('entry', { title: 'Mum & "the garden"' });
    const html = renderMetaTags(meta);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('og:image:width" content="1200"');
    // No raw ampersand/quote leaked into an attribute.
    expect(html).not.toMatch(/content="[^"]*&(?!amp;|#39;|quot;|lt;|gt;)/);
    expect(html).toContain('&amp;');
  });
});

describe('wrapForCard', () => {
  it('wraps without splitting words', () => {
    const lines = wrapForCard('Start your family thousand year thread today', 18);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(18 + 8); // last word may overflow slightly
    expect(lines.join(' ')).not.toContain('  ');
  });

  it('always returns at least one line', () => {
    expect(wrapForCard('', 20)).toEqual(['']);
  });
});

describe('formatCount', () => {
  it('groups thousands and floors/guards bad input', () => {
    expect(formatCount(1000000)).toBe('1,000,000');
    expect(formatCount(-3)).toBe('0');
    expect(formatCount(12.9)).toBe('12');
  });
});

describe('renderShareCardSvg', () => {
  it('produces a well-formed 1200x630 SVG carrying the title and brand marks', () => {
    const meta = buildShareMeta('milestone', { count: 1000 });
    const svg = renderShareCardSvg(meta);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
    // Brand constitution: ink bg, bone text, single warm accent, infinity mark.
    expect(svg).toContain('#0e0e0c');
    expect(svg).toContain('#f4ecd8');
    expect(svg).toContain('#b07a4a');
    expect(svg).toContain('∞');
    expect(svg).toContain('No. 1,000');
    // Balanced tags (no obviously broken markup from interpolation).
    expect((svg.match(/<text/g) || []).length).toBe((svg.match(/<\/text>/g) || []).length);
  });

  it('escapes a malicious shared title inside the SVG', () => {
    const meta = buildShareMeta('entry', { title: '</text><script>x' });
    const svg = renderShareCardSvg(meta);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;');
  });
});
