import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader, WaxSeal, SectionLabel } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { useAuthStore } from '../stores/authStore';
import { familyApi, threadsApi, memoriesApi } from '../services/api';
import { DYES, dyeForId, dyeVar, dyeTextVar, type Dye } from '../loom/dye';
import { captureWater } from '../loom/water/capture';

/**
 * The Colour of Us — the one screen the loom lacked.
 *
 * Every author owns a dye (the family identity signal, src/loom/dye.ts). Here
 * those dyes BLEND: each member's hue weighted by how much of the thread they
 * wove, mixed into a single colour the whole bloodline shares. The blended orb
 * is the lone dye-FILL on the product — every other surface keeps dye to a 3px
 * thread (§2.7). This screen IS the exemption: its entire meaning is the mixed
 * colour, so the colour must be shown, not signalled. (NewUI scene 3, real data.)
 *
 * Data mirrors Constellation: the family roster + the thread's entries grouped
 * by author. Weight = entries authored; before the first word, every thread
 * counts equally so a young family still has a colour.
 */

type Member = { id: string; name: string; dye: Dye; count: number };

/** Resolve a member's dye exactly as the roster does: a chosen key wins,
 *  otherwise a deterministic hue off the id (so it's never collapsed to copper). */
function memberDye(m: { id: string; dye?: string | null }): Dye {
  const raw = m.dye?.toLowerCase();
  return raw && (DYES as readonly string[]).includes(raw) ? (raw as Dye) : dyeForId(m.id);
}

/** Read a CSS dye token to concrete RGB via a throwaway probe — theme-aware,
 *  so the blend re-resolves when the parchment/ink theme flips. Returns null if
 *  the browser can't resolve it (SSR / jsdom), so the caller can fall back. */
function tokenRGB(probe: HTMLElement, dye: Dye): [number, number, number] | null {
  probe.style.color = dyeVar(dye);
  const m = getComputedStyle(probe).color.match(/(\d+(?:\.\d+)?)/g);
  if (!m || m.length < 3) return null;
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

/**
 * B3 (Day 22): Family Spectrum share card. Renders the family's blended colour
 * + each member's dye as a horizontal spectrum onto a 1200×630 canvas — the
 * same shape as an OG card — so a family can post their thread's colour to
 * social. Deep-water ground, Sounding-mark wordmark, no cloth/filament.
 */
function renderSpectrumCard(
  members: Member[],
  blend: [number, number, number] | null,
  caption: string,
  threadName: string,
): HTMLCanvasElement {
  const W = 1200, H = 630;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const INK = '#070d14', BONE = '#f2e6d0', BONE_DIM = 'rgba(242,230,208,0.72)';

  // Deep-water ground — a soft radial so it isn't a flat black.
  const ground = ctx.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, W * 0.7);
  ground.addColorStop(0, '#0c1822');
  ground.addColorStop(1, INK);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);

  // Eyebrow.
  ctx.fillStyle = 'rgba(242,230,208,0.62)';
  ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('THE COLOUR OF US', W / 2, 92);

  // Title — the thread name, or the brand line.
  ctx.fillStyle = BONE;
  ctx.font = '400 64px "Fraunces", Georgia, serif';
  ctx.fillText(threadName || 'One thread, every hand', W / 2, 168);

  // The orb — the blended family colour. Falls back to copper if no blend.
  const [r, g, b] = blend ?? [224, 160, 98];
  const cx = W / 2, cy = 330, rad = 150;
  const orb = ctx.createRadialGradient(cx - 50, cy - 55, 20, cx, cy, rad);
  orb.addColorStop(0, `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`);
  orb.addColorStop(0.6, `rgb(${r}, ${g}, ${b})`);
  orb.addColorStop(1, `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`);
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fillStyle = orb;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(224,160,98,0.5)';
  ctx.stroke();

  // The spectrum bar — each member's dye, weighted by entries authored.
  const barX = 200, barW = W - 400, barY = 540, barH = 8;
  const total = members.reduce((s, m) => s + (m.count > 0 ? m.count : 1), 0) || members.length;
  let x = barX;
  for (const m of members) {
    const w = (m.count > 0 ? m.count : 1) / total * barW;
    ctx.fillStyle = dyeVar(m.dye);
    ctx.fillRect(x, barY, Math.max(2, w), barH);
    x += w;
  }

  // Caption + wordmark.
  ctx.fillStyle = BONE_DIM;
  ctx.font = 'italic 300 26px "Source Serif 4", Georgia, serif';
  ctx.fillText(caption, W / 2, 588);
  ctx.fillStyle = 'rgba(224,160,98,0.7)';
  ctx.font = '600 16px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('HEIRLOOM.BLUE', W / 2, 612);

  return cv;
}

export function ColourOfUs() {
  const { isAuthenticated, user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Bumped by the theme MutationObserver so the blended hex recomputes on flip.
  const [themeTick, setThemeTick] = useState(0);
  const probeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);

    // Entries: the thread when one exists, else the legacy memory list. Same
    // source-of-truth fork Constellation uses, so authorship lines up.
    const entriesPromise: Promise<Array<Record<string, unknown>>> = user?.defaultThreadId
      ? threadsApi.listEntries(user.defaultThreadId, { limit: 500 })
          .then((r) => ((r.data as any)?.entries as Array<Record<string, unknown>>) ?? [])
          .catch(() => memoriesApi.getAll({ limit: 500 }).then((r) => {
            const d = r.data as { data?: unknown };
            return Array.isArray(d?.data) ? d.data as Array<Record<string, unknown>> : [];
          }).catch(() => []))
      : memoriesApi.getAll({ limit: 500 }).then((r) => {
          const d = r.data as { data?: unknown };
          return Array.isArray(d?.data) ? d.data as Array<Record<string, unknown>> : [];
        }).catch(() => []);

    Promise.all([familyApi.getAll(), entriesPromise]).then(([fam, entries]) => {
      const roster: Array<{ id: string; name: string; dye?: string | null; pendingDeletion?: boolean }> =
        (fam.data as any) ?? [];

      // Tally entries per author (same 4-key author resolution as Constellation).
      const counts = new Map<string, number>();
      for (const e of entries) {
        const id = (e.author_member_id ?? e.author_id ?? e.authorId ?? e.user_id) as string | undefined;
        if (!id) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }

      setMembers(
        roster
          .filter((m) => !m.pendingDeletion)
          .map((m) => ({ id: m.id, name: m.name, dye: memberDye(m), count: counts.get(m.id) ?? 0 })),
      );
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [isAuthenticated, user?.id, user?.defaultThreadId]);

  // Re-blend when the theme flips (dye tokens carry different hexes per theme).
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // The orb is a window into the living water — which now IS the family's
  // colour (the dye-seeded backdrop). Snapshot it on a slow beat so the orb
  // breathes. '' in light theme / no-WebGL → the static blend stands in.
  const [waterShot, setWaterShot] = useState('');
  useEffect(() => {
    const grab = () => setWaterShot(captureWater());
    grab();
    const id = setInterval(grab, 1500);
    return () => clearInterval(id);
  }, []);

  const totalEntries = useMemo(() => members.reduce((s, m) => s + m.count, 0), [members]);
  // Before the first word every thread weighs the same, so the colour still forms.
  const youngThread = members.length > 0 && totalEntries === 0;

  // Weighted average of each member's dye → the one colour. themeTick forces a
  // recompute on theme flip; the probe span is mounted hidden below.
  const blendRGB = useMemo<{ rgb: [number, number, number]; css: string } | null>(() => {
    void themeTick;
    const probe = probeRef.current;
    if (!probe || members.length === 0) return null;
    let r = 0, g = 0, b = 0, w = 0;
    for (const m of members) {
      const rgb = tokenRGB(probe, m.dye);
      if (!rgb) continue;
      const weight = youngThread ? 1 : m.count;
      if (weight <= 0) continue;
      r += rgb[0] * weight; g += rgb[1] * weight; b += rgb[2] * weight; w += weight;
    }
    if (w === 0) return null;
    const R = Math.round(r / w), G = Math.round(g / w), B = Math.round(b / w);
    return { rgb: [R, G, B], css: `rgb(${R}, ${G}, ${B})` };
  }, [members, youngThread, themeTick]);
  const blend = blendRGB?.css ?? null;

  // Legend / bar order: loudest thread first, so the dominant voice reads top.
  const ranked = useMemo(
    () => [...members].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [members],
  );
  const barTotal = youngThread ? members.length : totalEntries;

  const caption = youngThread
    ? 'your family’s colour, before the first word'
    : `${totalEntries} ${totalEntries === 1 ? 'memory' : 'memories'}, one colour`;

  // B3: render the family spectrum to a 1200×630 PNG and share it (Web Share
  // API where available, otherwise download). The card is the family's dye
  // identity — safe to post: it carries no names, no entry text, no link back.
  const [sharing, setSharing] = useState(false);
  const shareSpectrum = async () => {
    if (members.length === 0) return;
    setSharing(true);
    try {
      const cv = renderSpectrumCard(ranked, blendRGB?.rgb ?? null, caption, user?.lastName ?? '');
      const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), 'image/png'));
      const file = new File([blob], 'our-colour.png', { type: 'image/png' });
      const canShare = typeof navigator !== 'undefined' && !!navigator.share &&
        !!(navigator as any).canShare?.({ files: [file] });
      if (canShare) {
        await navigator.share({ files: [file], title: 'The colour of us', text: 'our family’s colour, on Heirloom' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'our-colour.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch {
      // user cancelled or share unavailable — quiet no-op.
    } finally {
      setSharing(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'the colour of us' }]} />}
     
    >
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none' }}>
          <ProgressHair />
        </div>
      )}

      {/* Hidden probe — the dye token resolver reads its computed colour. */}
      <span ref={probeRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />

      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <CosmicHeader eyebrow="The Colour of Us" title="One water, every hand" align="center" />

        {/* Empty: no roster yet — send them to add kin (each carries a dye). */}
        {!loading && members.length === 0 && !error && (
          <p
            style={{
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
              fontSize: 17, color: 'var(--bone-dim)', lineHeight: 1.7, marginTop: 64,
            }}
          >
            Add your family, and their colours<br />will blend into one here.
            {' '}
            <Link to="/family" style={{ color: 'var(--copper-label)', textDecoration: 'none' }}>the family →</Link>
          </p>
        )}

        {error && (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--bone-dim)', marginTop: 64 }}>
            The colour wouldn’t settle. <button type="button" onClick={() => location.reload()} style={{ background: 'none', border: 0, color: 'var(--copper-label)', cursor: 'pointer', font: 'inherit' }}>try again →</button>
          </p>
        )}

        {members.length > 0 && (
          <>
            {/* THE ORB — a window into the living water, which now IS the family's
                colour (the dye-seeded backdrop). When the water can't be read
                (light theme / no-WebGL) it falls back to the static weighted
                blend. Either way it's the product's single sanctioned dye-fill;
                copper hairline ring, no glassy glow. ponytail: deliberate §2.7
                exemption — this screen is the reason the exemption exists. */}
            <div
              aria-hidden
              style={{
                width: 'min(62vw, 248px)',
                height: 'min(62vw, 248px)',
                borderRadius: '50%',
                margin: '12px 0 28px',
                backgroundColor: 'var(--ink-card)',
                backgroundImage: waterShot
                  ? `url(${waterShot})`
                  : blend
                    ? `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${blend} 78%, var(--bone) 22%), ${blend} 64%, color-mix(in srgb, ${blend} 72%, var(--ink) 28%))`
                    : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid var(--copper-border)',
                transition: 'background-image 720ms var(--ease)',
              }}
            />

            <p
              style={{
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300,
                fontSize: 18, color: 'var(--bone-dim)', lineHeight: 1.6, margin: '0 0 24px',
              }}
            >
              {caption}
            </p>

            {/* B3: share the family spectrum as a PNG card. */}
            <button
              type="button"
              disabled={sharing || members.length === 0}
              onClick={shareSpectrum}
              style={{
                background: 'transparent',
                border: '1px solid var(--copper-border)',
                color: 'var(--gold-text)',
                fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em',
                textTransform: 'uppercase', padding: '15px 26px', minHeight: 44, cursor: 'pointer',
                opacity: sharing ? 0.5 : 1, marginBottom: 32,
                transition: `opacity 180ms var(--ease)`,
              }}
            >
              {sharing ? 'rendering…' : 'share our colour →'}
            </button>

            {/* The weave bar — each author's share of the cloth, in their dye.
                A proportional ledger, not decoration: width = entries authored. */}
            <div
              role="img"
              aria-label={`Each member's share of the water: ${ranked.map((m) => `${m.name}, ${m.count}`).join('; ')}`}
              style={{
                display: 'flex', width: '100%', maxWidth: 420, height: 6,
                marginBottom: 48, overflow: 'hidden',
              }}
            >
              {ranked.map((m) => {
                const weight = youngThread ? 1 : m.count;
                if (weight <= 0) return null;
                return (
                  <span
                    key={m.id}
                    style={{ flex: `${weight} 0 0`, background: dyeVar(m.dye), minWidth: barTotal > 0 ? 2 : 0 }}
                  />
                );
              })}
            </div>

            {/* The threads — one row per member: dye thread, name in their hue,
                count in mono. The 3px left thread is the constitutional signal. */}
            <div style={{ width: '100%', maxWidth: 420, textAlign: 'left' }}>
              <SectionLabel>the threads</SectionLabel>
              {ranked.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
                    padding: '14px 0 14px 16px',
                    borderLeft: `3px solid ${dyeVar(m.dye)}`,
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: dyeTextVar(m.dye) }}>
                    {m.name}
                  </span>
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 11, letterSpacing: '0.16em', textTransform: 'lowercase',
                      color: 'var(--bone-faint)', whiteSpace: 'nowrap',
                    }}
                  >
                    {youngThread ? '—' : `${m.count} ${m.count === 1 ? 'memory' : 'memories'}`}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 64 }}>
              <WaxSeal size={22} />
            </div>
          </>
        )}
      </div>
    </ClothShell>
  );
}

export default ColourOfUs;
