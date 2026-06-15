import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader } from '../loom/cosmic/CosmicUI';
import { useAuthStore } from '../stores/authStore';
import { familyApi, threadsApi, memoriesApi } from '../services/api';
import { dyeColor } from '../loom/dye';

/**
 * Screen 08 — The Constellation
 *
 * The bloodline rendered as a calm vertical tree: kin stacked by the order
 * they enter the line, connected by hairline threads. Each member is a serif
 * name in their own dye hue with a small dye point — no avatars. "you" is the
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

  useEffect(() => {
    if (!isAuthenticated) return;

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
    }).catch(() => { setError(true); });
  }, [isAuthenticated, user?.id, user?.defaultThreadId]);

  // Layout: group kin into generation rows. No explicit generation field on
  // the data, so we derive one — banding by birth into ~25-year cohorts gives a
  // stable genealogical stack (root ancestor → descendants) that matches the
  // cosmic-tree mockup. Sort oldest → newest first, then bucket by cohort.
  const ordered = [...kin].sort((a, b) => a.born - b.born);
  const thisYear = new Date().getFullYear();
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

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'bloodline' }]} />}
      backdropOpacity={0.3}
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
        }}
      >
        <CosmicHeader eyebrow="THE LINEAGE" title="Family Tree" />

        {/* The tree — generation rows stacked vertically, joined by hairline
            CSS-border connectors. Siblings sit side-by-side in a row; a centered
            vertical rule descends from each generation into the next. */}
        <div
          style={{
            width: '100%',
            maxWidth: 720,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {!error && kin.length === 0 ? (
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
              const rowLit = row.some(k => hovered === kinIndex.get(k.id) || k.you);
              return (
                <div
                  key={row.map(k => k.id).join('-')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  {/* vertical connector descending from the prior generation */}
                  {rowIdx > 0 && (
                    <div
                      aria-hidden
                      style={{
                        width: 0,
                        height: 'clamp(26px, 4vh, 44px)',
                        borderLeft: '1px solid',
                        borderColor: rowLit
                          ? 'var(--warm)'
                          : 'rgba(176,122,74,0.32)',
                        transition: 'border-color 360ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                  )}

                  {/* horizontal sibling rule — spans the row when >1 member */}
                  {rowIdx > 0 && row.length > 1 && (
                    <div
                      aria-hidden
                      style={{
                        width: 'min(86%, 460px)',
                        height: 0,
                        borderTop: '1px solid rgba(176,122,74,0.22)',
                        marginBottom: 'clamp(14px, 2vh, 22px)',
                      }}
                    />
                  )}

                  {/* the generation row — siblings side by side */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      gap: 'clamp(28px, 6vw, 64px)',
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
                          : 'var(--bone-dim)';
                      const dye = k.you ? 'var(--warm)' : dyeColor(k.id);
                      const age = (k.died ?? thisYear) - k.born;
                      return (
                        <div
                          key={k.id}
                          tabIndex={0}
                          role="img"
                          aria-label={`${k.name}, born ${k.born}${k.died ? `, died ${k.died}` : ', living'}`}
                          onMouseEnter={() => setHovered(idx ?? null)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(idx ?? null)}
                          onBlur={() => setHovered(null)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'default',
                            padding: '4px 0',
                          }}
                        >
                          {/* the dye point — the member's identity signal */}
                          <span
                            aria-hidden
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 0,
                              background: dye,
                              transform: 'rotate(45deg)',
                              opacity: isLit ? 1 : 0.78,
                              boxShadow: k.you
                                ? '0 0 8px 1px rgba(176,122,74,0.55)'
                                : isLit
                                  ? '0 0 7px 1px rgba(176,122,74,0.4)'
                                  : '0 0 5px 0 rgba(176,122,74,0.22)',
                              transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1), box-shadow 360ms cubic-bezier(0.16,1,0.3,1)',
                            }}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--serif)',
                              fontVariationSettings: "'opsz' 28",
                              fontSize: 17,
                              fontWeight: 400,
                              fontStyle: k.you ? 'italic' : 'normal',
                              letterSpacing: '0.01em',
                              color: nameColor,
                              transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                            }}
                          >
                            {k.name}
                          </span>
                          <span
                            className="loom-mono"
                            style={{
                              fontSize: 8.5,
                              letterSpacing: '0.18em',
                              color: 'var(--bone-faint)',
                            }}
                          >
                            {k.died ? `${k.born} — ${k.died}` : `AGE ${age}`}
                            {k.picks.length > 0 && (
                              <span style={{ color: 'var(--warm-dim)', marginLeft: 8 }}>
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
              color: 'var(--danger)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              margin: '24px 0 0',
            }}
          >
            could not load constellation
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
      </div>
    </ClothShell>
  );
}
