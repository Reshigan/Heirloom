import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { useAuthStore } from '../stores/authStore';
import { familyApi, threadsApi, memoriesApi } from '../services/api';
import { dyeColor } from '../loom/dye';

/**
 * Screen 08 — The Constellation
 *
 * The bloodline rendered as a calm vertical tree: kin stacked by the order
 * they enter the line, connected by hairline threads. Each member is a mono
 * uppercase name in their own dye hue with a small dye square — no avatars. "you" is the
 * one warm thread. Where the loom finds a resonance across lives, the footer
 * counts it. Lots of dark negative space; type is the hero.
 */

type KinEntry = {
  id: string;
  name: string;
  born: number;
  died: number | null;
  you: boolean;
  picks: number[];
};

export function Constellation() {
  const { user, isAuthenticated } = useAuthStore();
  const [kin, setKin] = useState<KinEntry[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [resonances, setResonances] = useState<{ year: number; memberIds: string[] }[]>([]);
  const [error, setError] = useState(false);
  // Start loading so the "no threads yet" empty state doesn't flash before the fetch lands.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);

    const familyPromise = familyApi.getAll();

    // Fetch entries: try thread entries first, fall back to memories
    const entriesPromise: Promise<Array<{ author_member_id?: string; author_id?: string; authorId?: string; user_id?: string; era_year?: number | null; created_at?: string; createdAt?: string; memory_date?: string }>> =
      user?.defaultThreadId
        ? threadsApi.listEntries(user.defaultThreadId, { limit: 500 })
            .then(r => (r.data as { entries: typeof r.data extends { entries: infer E } ? E : never[] }).entries ?? [])
            .catch(() => memoriesApi.getAll({ limit: 500 }).then(r => {
              const d = r.data as any;
              return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
            }).catch(() => []))
        : memoriesApi.getAll({ limit: 500 }).then(r => {
            const d = r.data as any;
            return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
          }).catch(() => []);

    Promise.all([familyPromise, entriesPromise]).then(([familyResp, entries]) => {
      const members: Array<{ id: string; name: string; born?: number; died?: number }> =
        familyResp.data ?? [];

      // Compute resonances: group by authorId → years with entries
      const authorYears = new Map<string, Set<number>>();
      for (const entry of entries) {
        const authorId =
          (entry as any).author_member_id ??
          (entry as any).author_id ??
          (entry as any).authorId ??
          (entry as any).user_id;
        if (!authorId) continue;
        // Use era_year if present, otherwise fall back to date fields
        let year: number | null = null;
        if ((entry as any).era_year != null) {
          year = Number((entry as any).era_year);
        } else {
          const raw = (entry as any).memory_date ?? (entry as any).createdAt ?? (entry as any).created_at;
          if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) year = d.getFullYear();
          }
        }
        if (year == null || isNaN(year)) continue;
        if (!authorYears.has(authorId)) authorYears.set(authorId, new Set());
        authorYears.get(authorId)!.add(year);
      }

      // Find years where ≥2 different authors have entries
      const yearAuthors = new Map<number, Set<string>>();
      for (const [authorId, years] of authorYears) {
        for (const y of years) {
          if (!yearAuthors.has(y)) yearAuthors.set(y, new Set());
          yearAuthors.get(y)!.add(authorId);
        }
      }
      const res: { year: number; memberIds: string[] }[] = [];
      for (const [y, ids] of yearAuthors) {
        if (ids.size >= 2) res.push({ year: y, memberIds: [...ids] });
      }
      res.sort((a, b) => a.year - b.year);
      setResonances(res);

      const mapped: KinEntry[] = members.map((m, i) => ({
        id: m.id,
        name: m.name,
        born: m.born ?? 1980 + i * 10,
        died: m.died ?? null,
        you: m.id === user?.id,
        picks: res.filter(r => r.memberIds.includes(m.id)).map(r => r.year),
      }));
      setKin(mapped);
    }).catch(() => { setError(true); }).finally(() => { setLoading(false); });
  }, [isAuthenticated, user?.id, user?.defaultThreadId]);

  // Layout: group kin into generation rows. No explicit generation field on
  // the data, so we derive one — banding by birth into ~25-year cohorts gives a
  // stable genealogical stack (root ancestor → descendants) that matches the
  // cosmic-tree mockup. Sort oldest → newest first, then bucket by cohort.
  const ordered = [...kin].sort((a, b) => a.born - b.born);
  const generations: KinEntry[][] = [];
  if (ordered.length > 0) {
    const base = ordered[0].born;
    for (const k of ordered) {
      const gen = Math.floor((k.born - base) / 25);
      (generations[gen] ??= []).push(k);
    }
  }
  // Collapse the sparse array (empty cohorts) into contiguous rows.
  const rows = generations.filter(Boolean);

  // --- Curved-connector geometry --------------------------------------------
  // The tree's connectors are PAGE CONTENT: warm bezier curves drawn in an
  // in-page SVG, fanning from each generation's convergence point down to every
  // member of the next generation (the V→spray gesture in the reference). We
  // measure live chip centres with refs + a ResizeObserver so the curves track
  // wrapping and viewport changes — no hard-coded coordinates.
  const treeRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [paths, setPaths] = useState<{ d: string; lit: boolean }[]>([]);
  const [svgSize, setSvgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const setChipRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    chipRefs.current.set(id, el);
  }, []);

  const measure = useCallback(() => {
    const host = treeRef.current;
    if (!host || rows.length === 0) { setPaths(prev => (prev.length === 0 ? prev : [])); return; }
    const hostBox = host.getBoundingClientRect();
    setSvgSize(prev => (prev.w === hostBox.width && prev.h === hostBox.height ? prev : { w: hostBox.width, h: hostBox.height }));

    // Per-row geometry: each chip's centre x, plus the row's top and bottom y.
    const rowGeo = rows.map(row => {
      const pts = row
        .map(k => {
          const el = chipRefs.current.get(k.id);
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return {
            id: k.id,
            cx: b.left + b.width / 2 - hostBox.left,
            top: b.top - hostBox.top,
            bottom: b.bottom - hostBox.top,
            lit: hovered === kin.findIndex(x => x.id === k.id) || k.you,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p != null);
      if (pts.length === 0) return null;
      const xs = pts.map(p => p.cx);
      const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
      const bottom = Math.max(...pts.map(p => p.bottom));
      const top = Math.min(...pts.map(p => p.top));
      const anyLit = pts.some(p => p.lit);
      return { pts, mid, bottom, top, anyLit };
    });

    const next: { d: string; lit: boolean }[] = [];
    for (let i = 0; i < rowGeo.length - 1; i++) {
      const parent = rowGeo[i];
      const child = rowGeo[i + 1];
      if (!parent || !child) continue;
      // Convergence point: centred just below the parent generation.
      const jx = parent.mid;
      const jy = parent.bottom + 6;
      for (const c of child.pts) {
        const cyTop = c.top - 4;
        // Cubic bezier: hold the line vertical out of the junction, then ease
        // toward the child — the gentle warm sweep of the reference.
        const dyMid = (cyTop - jy) * 0.55;
        const d = `M ${jx} ${jy} C ${jx} ${jy + dyMid}, ${c.cx} ${cyTop - dyMid}, ${c.cx} ${cyTop}`;
        next.push({ d, lit: parent.anyLit || c.lit });
      }
    }
    setPaths(prev => {
      if (prev.length === next.length && prev.every((p, i) => p.d === next[i].d && p.lit === next[i].lit)) {
        return prev;
      }
      return next;
    });
  }, [rows, kin, hovered]);

  useLayoutEffect(() => {
    measure();
    const host = treeRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'bloodline' }]} />}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'clamp(40px, 9vh, 96px) 24px clamp(40px, 8vh, 88px)',
          background: 'radial-gradient(120% 80% at 50% 30%, var(--vignette-core), var(--vignette-edge) 72%)',
        }}
      >
        {/* Centred mono eyebrow — the warm wing-sprays above it belong to the
            global ClothBackdrop (tree variant), not this page. */}
        <div
          role="heading"
          aria-level={1}
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 24,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            textAlign: 'center',
            marginBottom: 'clamp(80px, 16vh, 180px)',
            paddingLeft: '0.3em',
          }}
        >
          The Lineage
        </div>

        {/* The tree — generation rows stacked vertically, joined by warm CURVED
            connector lines drawn as in-page SVG content (the V→spray gesture).
            Siblings sit side-by-side in a row; the SVG fans from each
            generation's convergence point down to every child below. */}
        <div
          ref={treeRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 720,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* woven sigil — the lineage tree, layered behind the live nodes */}
          <picture style={{ display: 'contents' }}>
            <source type="image/avif" srcSet="/woven/thread-tree.avif" />
            <source type="image/webp" srcSet="/woven/thread-tree.webp" />
            <img
              src="/woven/thread-tree.png"
              alt=""
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                height: 520,
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                opacity: 0.5,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          </picture>
          {/* curved connector lines — page content, drawn behind the chips */}
          {paths.length > 0 && (
            <svg
              aria-hidden
              width={svgSize.w}
              height={svgSize.h}
              viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}
            >
              {paths.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  fill="none"
                  stroke={p.lit ? 'var(--warm-bright)' : 'var(--warm)'}
                  strokeWidth={p.lit ? 1.4 : 1}
                  strokeLinecap="round"
                  style={{
                    opacity: p.lit ? 0.85 : 0.5,
                    filter: p.lit ? 'drop-shadow(0 0 6px var(--warm-glow))' : 'none',
                    transition: 'opacity 360ms var(--ease), stroke 360ms var(--ease)',
                  }}
                />
              ))}
            </svg>
          )}
          {loading && kin.length === 0 ? (
            <div style={{ paddingTop: 'clamp(24px, 6vh, 64px)' }}>
              <ProgressHair width={80} />
            </div>
          ) : !error && kin.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                paddingTop: 'clamp(24px, 6vh, 64px)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 17,
                  fontStyle: 'italic',
                  color: 'var(--bone-faint)',
                }}
              >
                the bloodline has no threads yet.
              </div>
              <Link
                to="/family"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  textDecoration: 'none',
                }}
              >
                invite family →
              </Link>
            </div>
          ) : (
            (() => {
              const kinIndex = new Map(kin.map((k, i) => [k.id, i]));
              return rows.map((row, rowIdx) => {
              // deepest generation reads slightly smaller — the line tapering out
              const squareSize = rowIdx === rows.length - 1 ? 6 : 7;
              return (
                <div
                  key={row.map(k => k.id).join('-')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    // vertical air between generations — the SVG fans across it
                    marginTop: rowIdx > 0 ? 'clamp(56px, 11vh, 120px)' : 0,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* the generation row — siblings side by side */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      gap: 'clamp(24px, 6vw, 56px)',
                      width: '100%',
                    }}
                  >
                    {row.map(k => {
                      const idx = kinIndex.get(k.id);
                      const isLit = hovered === idx || k.you;
                      const nameColor = k.you
                        ? 'var(--warm)'
                        : isLit
                          ? 'var(--bone)'
                          : 'var(--text-soft)';
                      const dye = k.you ? 'var(--warm)' : dyeColor(k.id);
                      return (
                        <div
                          key={k.id}
                          ref={setChipRef(k.id)}
                          tabIndex={0}
                          role="img"
                          aria-label={`${k.name}, born ${k.born}${k.died ? `, died ${k.died}` : ', living'}`}
                          onMouseEnter={() => setHovered(idx ?? null)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(idx ?? null)}
                          onBlur={() => setHovered(null)}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'default',
                            padding: '4px 2px',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          {/* the dye SQUARE — the member's identity signal */}
                          <span
                            aria-hidden
                            style={{
                              width: squareSize,
                              height: squareSize,
                              flex: '0 0 auto',
                              background: dye,
                              opacity: isLit ? 1 : 0.78,
                              transition: 'opacity 360ms var(--ease)',
                            }}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              fontWeight: 400,
                              fontStyle: k.you ? 'italic' : 'normal',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: nameColor,
                              transition: 'color 360ms var(--ease)',
                              whiteSpace: 'nowrap',
                              textAlign: 'left',
                            }}
                          >
                            {k.name}
                            {k.picks.length > 0 && (
                              <span style={{ color: 'var(--warm-dim)', marginLeft: 8, letterSpacing: '0.12em' }}>
                                ∞ {k.picks.length}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
            })()
          )}
        </div>

        {error && (
          <p
            style={{
              color: 'var(--warm)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: '24px 0 0',
            }}
          >
            could not load the bloodline
          </p>
        )}

        {/* quiet resonance count — the only footer line, no legend chrome */}
        {kin.length > 0 && (
          <div
            className="loom-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--bone-faint)',
              marginTop: 'clamp(40px, 8vh, 80px)',
            }}
          >
            <span style={{ color: 'var(--warm)' }}>∞</span>
            <span style={{ marginLeft: 8 }}>
              {resonances.length > 0
                ? `${resonances.length} resonance${resonances.length !== 1 ? 's' : ''} found`
                : 'no resonances yet'}
            </span>
          </div>
        )}

        {kin.length > 0 && (
          <div style={{ marginTop: 'clamp(36px, 7vh, 72px)' }}>
            <WaxSeal size={26} />
          </div>
        )}
      </div>
    </ClothShell>
  );
}
