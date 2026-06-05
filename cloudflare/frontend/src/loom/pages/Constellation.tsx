import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../components/ClothShell';
import { ELEANOR_KIN } from '../data/mock';
import { useAuthStore } from '../../stores/authStore';
import { familyApi } from '../../services/api';

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
  const [kin, setKin] = useState<KinEntry[]>(ELEANOR_KIN);
  const [hovered, setHovered] = useState<number | null>(null);
  const minYear = 1890;

  useEffect(() => {
    if (!isAuthenticated) return;
    familyApi.getAll().then((r) => {
      const members: Array<{ id: string; name: string; born?: number; died?: number }> =
        r.data ?? [];
      if (members.length === 0) return; // keep mock if empty
      const mapped: KinEntry[] = members.map((m, i) => ({
        name: m.name,
        born: m.born ?? 1980 + i * 10,
        died: m.died ?? null,
        you: m.id === user?.id,
        picks: [], // no resonance picks yet from API
      }));
      setKin(mapped);
    }).catch(() => {}); // silent fallback to mock
  }, [isAuthenticated, user?.id]);
  const maxYear = 2070;
  const today = 2026;
  const xOf = (y: number) => ((y - minYear) / (maxYear - minYear)) * 100;

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom/weft"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
          }}
        >
          ← cloth
        </Link>
      }
      topbarCenter="bloodline"
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
            <div className="loom-eyebrow">kin · five threads, four generations</div>
            <div
              className="loom-h2"
              style={{
                fontSize: 44,
                marginTop: 12,
                fontWeight: 300,
                letterSpacing: '-0.014em',
              }}
            >
              The Hartshorn line, woven
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

            {kin.map((k, i) => {
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
            })}

            {[
              { x: 1962, top: 22 + 1 * 64, bottom: 22 + 2 * 64 },
              { x: 2019, top: 22 + 2 * 64, bottom: 22 + 3 * 64 },
              { x: 2024, top: 22 + 2 * 64, bottom: 22 + 4 * 64 },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${xOf(r.x)}%`,
                  top: r.top,
                  height: r.bottom - r.top,
                  width: 1,
                  background: 'var(--warm)',
                  opacity: 0.55,
                }}
              />
            ))}
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
              <span
                style={{ fontSize: 10, color: 'var(--bone-dim)', marginLeft: 8 }}
              >
                3 resonances active
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
