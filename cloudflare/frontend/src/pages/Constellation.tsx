import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { useAuthStore } from '../stores/authStore';
import { familyApi, threadsApi, memoriesApi } from '../services/api';

/**
 * Screen 08 — The Constellation
 *
 * Kin as parallel life-threads, all set against a single 1890–2070
 * timeline. Each line is one life. Where lines overlap horizontally,
 * the two people knew each other. Where the AI has found a resonance
 * across generations, a warm vertical hairline crosses the lines.
 *
 * "you" is rendered in warm; the rest in bone. Past lives terminate
 * at their death year (no glow); living lives fade out toward 2070.
 */

type KinEntry = {
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
  const minYear = 1890;

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
        name: m.name,
        born: m.born ?? 1980 + i * 10,
        died: m.died ?? null,
        you: m.id === user?.id,
        picks: res.filter(r => r.memberIds.includes(m.id)).map(r => r.year),
      }));
      setKin(mapped);
    }).catch(() => {});
  }, [isAuthenticated, user?.id, user?.defaultThreadId]);
  const maxYear = 2070;
  const today = 2026;
  const xOf = (y: number) => ((y - minYear) / (maxYear - minYear)) * 100;

  const familyName = kin.length > 0 && !kin.some(k => k.you)
    ? 'your bloodline, woven'
    : kin.length > 0
      ? `${kin.find(k => k.you)?.name.split(' ').slice(-1)[0] ?? ''} line, woven`.trim()
      : 'your bloodline';

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'bloodline' }]} />}
      backdropOpacity={0.3}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '44px 80px 0',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 28,
        }}
      >
          <div>
            <div className="loom-eyebrow">{`kin · ${kin.length} thread${kin.length !== 1 ? 's' : ''}`}</div>
            <div
              className="loom-h2"
              style={{
                fontSize: 44,
                marginTop: 12,
                fontWeight: 300,
                letterSpacing: '-0.014em',
              }}
            >
              {familyName}
            </div>
            <div
              className="loom-body loom-dim"
              style={{ fontSize: 15, fontStyle: 'italic', marginTop: 6, maxWidth: 700 }}
            >
              each line is one life. where the lines overlap, you knew them. where they meet
              vertically, the loom found a resonance — a phrase, a place, a habit shared across
              generations.
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: `${xOf(today)}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--warm)',
                opacity: 0.4,
              }}
            />
            <div
              className="loom-mono"
              style={{
                position: 'absolute',
                left: `${xOf(today)}%`,
                transform: 'translateX(-50%)',
                top: -18,
                fontSize: 10,
                color: 'var(--warm)',
              }}
            >
              today
            </div>

            {[1900, 1920, 1940, 1960, 1980, 2000, 2020, 2040, 2060].map((y) => (
              <Fragment key={y}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${xOf(y)}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--rule)',
                  }}
                />
                <div
                  className="loom-mono"
                  style={{
                    position: 'absolute',
                    left: `${xOf(y)}%`,
                    transform: 'translateX(-50%)',
                    bottom: -18,
                    fontSize: 9,
                    color: 'var(--bone-faint)',
                  }}
                >
                  {y}
                </div>
              </Fragment>
            ))}

            {resonances.map((r) => (
              <div
                key={r.year}
                style={{
                  position: 'absolute',
                  left: `${xOf(r.year)}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--warm)',
                  opacity: 0.22,
                  pointerEvents: 'none',
                  transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            ))}

            {kin.length === 0 ? (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12,
              }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--bone-faint)' }}>
                  the bloodline has no threads yet.
                </div>
                <Link to="/family" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none' }}>
                  invite family →
                </Link>
              </div>
            ) : (
              kin.map((k, i) => {
                const top = 22 + i * 64;
                const dead = k.died != null;
                const endYear = k.died ?? today;
                const isLit = hovered === i || k.you;
                return (
                  <Fragment key={i}>
                    <div
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        position: 'absolute',
                        left: `${xOf(k.born)}%`,
                        width: `${xOf(endYear) - xOf(k.born)}%`,
                        top,
                        height: k.you ? 3 : 2,
                        background: k.you
                          ? 'var(--warm)'
                          : isLit
                            ? 'var(--bone)'
                            : 'var(--bone-dim)',
                        boxShadow: k.you ? '0 0 8px rgba(207,147,90,0.4)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                    {!dead ? (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${xOf(endYear)}%`,
                          width: `${xOf(maxYear) - xOf(endYear)}%`,
                          top,
                          height: k.you ? 3 : 2,
                          background: `linear-gradient(to right, ${
                            k.you ? 'var(--warm)' : 'var(--bone-dim)'
                          }, transparent)`,
                          opacity: 0.4,
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null}
                    {k.picks.map((py, j) => (
                      <div
                        key={j}
                        style={{
                          position: 'absolute',
                          left: `${xOf(py)}%`,
                          top: top - 2,
                          width: 4,
                          height: 6,
                          background: k.you ? 'var(--warm-bright)' : 'var(--bone)',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    ))}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${xOf(k.born)}%`,
                        top: top - 26,
                        transform: 'translateX(-2px)',
                        fontFamily: "'Source Serif 4', serif",
                        fontVariationSettings: "'opsz' 28",
                        fontSize: 15,
                        fontWeight: 400,
                        color: k.you
                          ? 'var(--warm)'
                          : isLit
                            ? 'var(--bone)'
                            : 'var(--bone-dim)',
                        fontStyle: k.you ? 'italic' : 'normal',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k.name}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        left: `${xOf(k.born)}%`,
                        top: top + 8,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.04em',
                        color: 'var(--bone-faint)',
                      }}
                    >
                      {k.born} — {k.died ?? '∞'}
                    </div>
                  </Fragment>
                );
              })
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 36,
              paddingTop: 24,
              borderTop: '1px solid var(--rule)',
              alignItems: 'baseline',
            }}
          >
            <LegendItem swatch="var(--warm)" label="you" italic />
            <LegendItem swatch="var(--bone)" label="kin" />
            <LegendItem
              swatch="var(--bone-dim)"
              label="recorded life — first-hand or remembered"
            />
            <LegendItem
              swatch="rgba(244,236,216,0.18)"
              label="thread continues, beyond the loom's edge"
            />
            <div style={{ marginLeft: 'auto' }} className="loom-mono">
              <span style={{ color: 'var(--warm)', fontSize: 10 }}>∞</span>
              <span style={{ fontSize: 10, color: 'var(--bone-faint)', marginLeft: 8 }}>
                {resonances.length > 0
                  ? `${resonances.length} resonance${resonances.length !== 1 ? 's' : ''} found`
                  : 'no resonances yet'}
              </span>
            </div>
          </div>
      </div>
    </ClothShell>
  );
}

function LegendItem({
  swatch,
  label,
  italic,
}: {
  swatch: string;
  label: string;
  italic?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 18, height: 2, background: swatch }} />
      <span
        className="loom-serif"
        style={{
          fontSize: 13,
          color: 'var(--bone-dim)',
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {label}
      </span>
    </div>
  );
}
