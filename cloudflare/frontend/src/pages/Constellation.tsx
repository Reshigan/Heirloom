import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
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

  // Layout: kin sorted oldest → newest, the order they enter the bloodline.
  const ordered = [...kin].sort((a, b) => a.born - b.born);
  const youName = kin.find(k => k.you)?.name.split(' ').slice(-1)[0] ?? '';
  const familyName = kin.length > 0 && !kin.some(k => k.you)
    ? 'Family Tree'
    : kin.length > 0 && youName
      ? `${youName} Line`
      : 'Family Tree';

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
        }}
      >
        {/* Header — centered, type as hero, deep negative space above the line */}
        <header
          style={{
            textAlign: 'center',
            paddingTop: 'clamp(40px, 9vh, 96px)',
            paddingBottom: 'clamp(36px, 7vh, 72px)',
          }}
        >
          <div
            className="loom-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            the bloodline
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontVariationSettings: "'opsz' 40",
              fontWeight: 300,
              fontSize: 'clamp(34px, 5.4vw, 52px)',
              letterSpacing: '-0.018em',
              color: 'var(--bone)',
              margin: '14px 0 0',
              lineHeight: 1.04,
            }}
          >
            {familyName}
          </h1>
          <div
            className="loom-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              color: 'var(--warm)',
              marginTop: 16,
            }}
          >
            ∞
          </div>
        </header>

        {/* The tree — a single centered column of kin joined by hairline threads */}
        <div
          style={{
            flex: '1 0 auto',
            width: '100%',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: 'clamp(40px, 8vh, 88px)',
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
            ordered.map((k, i) => {
              const idx = kin.indexOf(k);
              const isLit = hovered === idx || k.you;
              const nameColor = k.you
                ? 'var(--warm)'
                : isLit
                  ? 'var(--bone)'
                  : 'var(--bone-dim)';
              const dye = k.you ? 'var(--warm)' : dyeColor(k.id);
              return (
                <div
                  key={k.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  {/* hairline connector descending into this node */}
                  {i > 0 && (
                    <div
                      aria-hidden
                      style={{
                        width: 1,
                        height: 'clamp(22px, 3.4vh, 38px)',
                        background: isLit ? 'var(--warm-dim)' : 'var(--rule)',
                        transition: 'background 360ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                  )}

                  {/* node — dye point + serif name + mono lifespan, no avatar */}
                  <div
                    tabIndex={0}
                    role="img"
                    aria-label={`${k.name}, born ${k.born}${k.died ? `, died ${k.died}` : ', living'}`}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(idx)}
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
                        opacity: isLit ? 1 : 0.7,
                        transition: 'opacity 360ms cubic-bezier(0.16,1,0.3,1)',
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
                      {k.born} — {k.died ?? '∞'}
                      {k.picks.length > 0 && (
                        <span style={{ color: 'var(--warm-dim)', marginLeft: 8 }}>
                          ∞ {k.picks.length}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && (
          <p
            style={{
              color: 'var(--danger)',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              margin: '0 0 24px',
            }}
          >
            could not load constellation
          </p>
        )}

        {/* Footer — quiet legend + resonance count, hairline rule above */}
        {kin.length > 0 && (
          <footer
            style={{
              width: '100%',
              maxWidth: 720,
              display: 'flex',
              gap: 28,
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'center',
              padding: '22px 24px clamp(28px, 6vh, 56px)',
              borderTop: '1px solid var(--rule)',
            }}
          >
            <LegendItem swatch="var(--warm)" label="you" italic />
            <LegendItem swatch="var(--bone-dim)" label="kin" />
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>
              <span style={{ color: 'var(--warm)' }}>∞</span>
              <span style={{ marginLeft: 8 }}>
                {resonances.length > 0
                  ? `${resonances.length} resonance${resonances.length !== 1 ? 's' : ''} found`
                  : 'no resonances yet'}
              </span>
            </span>
          </footer>
        )}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span
        aria-hidden
        style={{ width: 5, height: 5, background: swatch, transform: 'rotate(45deg)' }}
      />
      <span
        className="loom-serif"
        style={{
          fontSize: 12,
          color: 'var(--bone-dim)',
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {label}
      </span>
    </div>
  );
}
