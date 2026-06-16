import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Dye } from '../dye';
import { dyeVar } from '../dye';
import { WaxSeal } from '../cosmic/CosmicUI';

/**
 * The Thousand-Year Spine — the signature home surface (Higgsfield concept "A").
 *
 * The family thread stands as one luminous vertical filament. A bright molten
 * core marks the present day; woven entries descend below it, brightest nearest
 * now and fading into the ancestral deep; above the present the warp rises bare
 * and faint — the days that belong to those still to come. Each entry is a node
 * on the spine, its title set in serif to one side, its year in mono, the hand
 * that wove it tinted by its dye.
 *
 * The glow is painted on a canvas with layered strokes (a wide faint pass and a
 * thin bright core) — the same additive technique the loom uses, never a blur
 * filter or frosted glass. The labels are real DOM, crisp and clickable, laid
 * out from the same vertical schedule the canvas paints, so they sit exactly on
 * their nodes. Type is the hero; one warm colour carries all the light.
 */

export interface SpineEntry {
  title: string;
  year: number;
  dye: Dye;
  route?: string;
  sealed?: boolean;
}

interface Node {
  entry: SpineEntry;
  y: number;
  side: 1 | -1; // 1 → right of the spine, -1 → left
  /** 0 (present) → 1 (deep ancestral) — drives the fade. */
  depth: number;
}

interface Layout {
  cx: number;
  yPresent: number;
  yFutureTop: number;
  yBottom: number;
  nodes: Node[];
}

function buildLayout(W: number, H: number, entries: SpineEntry[]): Layout {
  const cx = Math.round(W / 2);
  const yPresent = Math.round(H * 0.36);
  const yFutureTop = Math.round(H * 0.1);
  const footReserve = 132;
  const yBottom = Math.round(H - footReserve);

  const available = Math.max(0, yBottom - (yPresent + 56));
  const maxNodes = Math.max(1, Math.min(9, Math.floor(available / 56)));
  // Most-recent first, descending into the past.
  const recent = entries.slice(-maxNodes).slice().reverse();
  const gap = recent.length > 0 ? available / recent.length : 0;

  const nodes: Node[] = recent.map((entry, i) => ({
    entry,
    y: Math.round(yPresent + 56 + gap * (i + 0.5)),
    side: (i % 2 === 0 ? 1 : -1) as 1 | -1,
    depth: recent.length > 1 ? i / (recent.length - 1) : 0,
  }));

  return { cx, yPresent, yFutureTop, yBottom, nodes };
}

function cssVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export function SpineThread({
  entries,
  headline,
  tagline,
  presentLabel,
  presentYear,
  prompt,
  addLabel = 'add to the thread',
  addRoute = '/compose',
  status,
  onNavigate,
  minHeightCss = 'calc(100svh - 56px - env(safe-area-inset-top, 0px))',
}: {
  entries: SpineEntry[];
  /** Brand headline rendered at the crown — used by the anonymous threshold. */
  headline?: ReactNode;
  tagline?: ReactNode;
  presentLabel?: string;
  presentYear?: number;
  /** The Listener's one quiet line, set beside the present-day core. */
  prompt?: string;
  addLabel?: string;
  addRoute?: string;
  status?: string;
  onNavigate?: (route: string) => void;
  /** Host min-height; callers shorten it to clear a bottom nav. */
  minHeightCss?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ W: 0, H: 0 });

  // Measure the surface; the layout (and the canvas) follow its real size.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      setSize({ W: Math.max(1, r.width), H: Math.max(1, r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () => (size.H > 200 ? buildLayout(size.W, size.H, entries) : null),
    [size.W, size.H, entries],
  );

  // ── Paint the glowing spine: layered additive strokes, a molten present core,
  //    a dye-tinted dot at every node, and a bare faint warp rising into the future.
  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv || !layout || size.H < 200) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const loom = (host.closest('.loom') as HTMLElement) ?? document.documentElement;
    const warm = cssVar(loom, '--warm', '#b07a4a');
    const warmBright = cssVar(loom, '--warm-bright', '#cf935a');
    const ink = cssVar(loom, '--ink', '#0e0e0c');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { W, H } = size;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const t = ctx;
    t.setTransform(dpr, 0, 0, dpr, 0, 0);
    t.clearRect(0, 0, W, H);

    const { cx, yPresent, yFutureTop, yBottom, nodes } = layout;

    // A soft ink clearing down the centre so the ambient loom recedes behind the
    // spine and the labels read clean — no blur, just a radial ink wash.
    const wash = t.createRadialGradient(cx, H * 0.42, 24, cx, H * 0.42, Math.max(W, H) * 0.6);
    wash.addColorStop(0, ink);
    wash.addColorStop(0.55, `${ink}cc`);
    wash.addColorStop(1, `${ink}00`);
    t.fillStyle = wash;
    t.fillRect(0, 0, W, H);

    t.globalCompositeOperation = 'lighter';
    t.lineCap = 'round';

    // The past spine: present (bright) → ancestral bottom (faint).
    const pastGrad = t.createLinearGradient(0, yPresent, 0, yBottom);
    pastGrad.addColorStop(0, warmBright);
    pastGrad.addColorStop(1, warm);
    const drawSpine = (x: number, y0: number, y1: number, stroke: string | CanvasGradient, alpha: number) => {
      // wide faint glow
      t.strokeStyle = stroke;
      t.shadowColor = warmBright;
      t.shadowBlur = 18;
      t.globalAlpha = alpha * 0.5;
      t.lineWidth = 3.4;
      t.beginPath();
      t.moveTo(x, y0);
      t.lineTo(x, y1);
      t.stroke();
      // thin bright core
      t.shadowBlur = 6;
      t.globalAlpha = alpha;
      t.lineWidth = 1.1;
      t.beginPath();
      t.moveTo(x, y0);
      t.lineTo(x, y1);
      t.stroke();
    };
    drawSpine(cx, yPresent, yBottom, pastGrad, 0.92);

    // The bare warp above the present — the unwoven future, faint and receding.
    t.shadowBlur = 0;
    t.globalAlpha = 1;
    t.strokeStyle = warm;
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const a = (1 - i / steps) * 0.34;
      const y0 = yPresent - ((yPresent - yFutureTop) * i) / steps;
      const y1 = yPresent - ((yPresent - yFutureTop) * (i + 1)) / steps;
      t.globalAlpha = a;
      t.lineWidth = 1.1;
      t.shadowColor = warm;
      t.shadowBlur = 5;
      t.beginPath();
      t.moveTo(cx, y0);
      t.lineTo(cx, y1);
      t.stroke();
    }

    // The molten present core.
    t.globalAlpha = 1;
    const core = t.createRadialGradient(cx, yPresent, 0, cx, yPresent, 46);
    core.addColorStop(0, warmBright);
    core.addColorStop(0.4, warm);
    core.addColorStop(1, `${ink}00`);
    t.fillStyle = core;
    t.beginPath();
    t.arc(cx, yPresent, 46, 0, 7);
    t.fill();
    t.shadowColor = warmBright;
    t.shadowBlur = 22;
    t.fillStyle = warmBright;
    t.beginPath();
    t.arc(cx, yPresent, 4.5, 0, 7);
    t.fill();

    // A dye-tinted node + short tick at every woven entry.
    for (const n of nodes) {
      const dye = cssVar(loom, `--dye-${n.entry.dye}`, warm);
      const a = 0.9 - n.depth * 0.5;
      t.globalAlpha = a;
      t.strokeStyle = dye;
      t.shadowColor = dye;
      t.shadowBlur = 8;
      t.lineWidth = 1;
      t.beginPath();
      t.moveTo(cx, n.y);
      t.lineTo(cx + n.side * 22, n.y);
      t.stroke();
      // the knot
      t.shadowBlur = 12;
      t.globalAlpha = Math.min(1, a + 0.1);
      t.fillStyle = dye;
      t.beginPath();
      t.arc(cx, n.y, n.entry.sealed ? 2.4 : 3.2, 0, 7);
      t.fill();
      if (n.entry.sealed) {
        // a sealed letter rests as an open ring — a knot not yet untied
        t.shadowBlur = 0;
        t.globalAlpha = a * 0.7;
        t.strokeStyle = dye;
        t.lineWidth = 1;
        t.beginPath();
        t.arc(cx, n.y, 6, 0, 7);
        t.stroke();
      }
    }

    t.globalAlpha = 1;
    t.shadowBlur = 0;
    t.globalCompositeOperation = 'source-over';
  }, [layout, size]);

  const navigate = (route?: string) => {
    if (!route) return;
    if (onNavigate) onNavigate(route);
  };

  return (
    <div
      ref={hostRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: minHeightCss,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="hl-cloth-breath"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      {/* eyebrow — the living thread */}
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
        }}
      >
        the living thread
      </div>

      {/* crown — the brand statement (anonymous threshold only) */}
      {headline && (
        <div
          style={{
            position: 'absolute',
            top: 62,
            left: 0,
            right: 0,
            textAlign: 'center',
            padding: '0 clamp(24px, 8vw, 64px)',
          }}
        >
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 6.4vw, 46px)', lineHeight: 1.12, letterSpacing: '-0.01em', fontWeight: 380, color: 'var(--bone)', margin: 0, fontVariationSettings: '"opsz" 40' }}>
            {headline}
          </h1>
          {tagline && (
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 16, lineHeight: 1.5, color: 'var(--bone-dim)', margin: '16px auto 0', maxWidth: '28em' }}>
              {tagline}
            </p>
          )}
        </div>
      )}

      {layout && (
        <>
          {/* the present-day marker, set just right of the molten core */}
          <div
            style={{
              position: 'absolute',
              left: `calc(${layout.cx}px + 30px)`,
              top: layout.yPresent,
              transform: 'translateY(-50%)',
              maxWidth: `calc(${size.W - layout.cx}px - 44px)`,
            }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--warm-bright)' }}>
              {presentLabel ?? 'the present day'}
            </div>
            {presentYear != null && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', color: 'var(--bone-faint)', marginTop: 4 }}>
                {presentYear}
              </div>
            )}
            {prompt && (
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 14, lineHeight: 1.5, color: 'var(--bone-dim)', margin: '10px 0 0', maxWidth: '22em' }}>
                {prompt}
              </p>
            )}
          </div>

          {/* entry nodes — serif title + mono year, alternating sides, dye-tinted */}
          {layout.nodes.map((n, i) => {
            const right = n.side === 1;
            const tint = dyeVar(n.entry.dye);
            return (
              <button
                key={`${n.entry.title}-${i}`}
                type="button"
                onClick={() => navigate(n.entry.route)}
                disabled={!n.entry.route}
                style={{
                  position: 'absolute',
                  top: n.y,
                  transform: 'translateY(-50%)',
                  [right ? 'left' : 'right']: `calc(${right ? layout.cx : size.W - layout.cx}px + 30px)`,
                  maxWidth: `calc(${right ? size.W - layout.cx : layout.cx}px - 46px)`,
                  textAlign: right ? 'left' : 'right',
                  background: 'none',
                  border: 0,
                  padding: 0,
                  cursor: n.entry.route ? 'pointer' : 'default',
                  opacity: 1 - n.depth * 0.55,
                  transition: 'opacity 360ms var(--ease)',
                } as React.CSSProperties}
              >
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(15px, 4.4vw, 18px)', fontWeight: 400, lineHeight: 1.25, color: 'var(--bone)' }}>
                  {n.entry.title}
                  {n.entry.sealed ? <span style={{ color: 'var(--warm)' }}> ∞</span> : null}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: tint, marginTop: 3, display: 'flex', gap: 8, justifyContent: right ? 'flex-start' : 'flex-end' }}>
                  <span>{n.entry.year}</span>
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* foot — add to the thread + the single mark */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Link
          to={addRoute}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            textDecoration: 'none',
            border: '1px solid var(--warm)',
            padding: '13px 30px',
            background: 'transparent',
            transition: 'background 180ms var(--ease), color 180ms var(--ease)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--warm)'; e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--bone)'; }}
        >
          {addLabel}
        </Link>
        <WaxSeal size={26} />
        {status && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', margin: 0, textAlign: 'center', padding: '0 24px' }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
