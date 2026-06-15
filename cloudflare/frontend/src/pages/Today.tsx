import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { useListener } from '../hooks/useListener';
import { useTapestryEntries } from '../hooks/useTapestryEntries';
import { useAuthStore } from '../stores/authStore';
import { aiApi, engagementApi } from '../services/api';

interface OnThisDayEntry {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string;
  createdAt?: string;
  yearsAgo?: number;
}

export function Today() {
  const { prompt: localPrompt } = useListener();
  const { isAuthenticated } = useAuthStore();
  const [prompt, setPrompt] = useState<string>(localPrompt);
  const [promptUnavailable, setPromptUnavailable] = useState(false);
  const [onThisDay, setOnThisDay] = useState<OnThisDayEntry[]>([]);
  const { entries } = useTapestryEntries();
  const [onThisDayError, setOnThisDayError] = useState(false);

  // Fetch real AI prompt when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    aiApi.getPrompt()
      .then(r => {
        if (r.data?.text) {
          setPrompt(r.data.text);
          setPromptUnavailable(false);
        }
      })
      .catch((err) => {
        console.error('[Today] AI prompt fetch failed:', err);
        setPromptUnavailable(true);
        // localPrompt (from useListener) remains as the fallback
      });
  }, [isAuthenticated]);

  // Fetch "on this day" memories when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    engagementApi.getOnThisDay()
      .then(r => {
        const raw = r.data;
        const list: OnThisDayEntry[] = Array.isArray(raw)
          ? raw
          : (raw?.memoriesFromThisDay ?? raw?.memories ?? raw?.data ?? []);
        setOnThisDay(list);
        setOnThisDayError(false);
      })
      .catch((err) => {
        console.error('[Today] on-this-day fetch failed:', err);
        setOnThisDayError(true);
      });
  }, [isAuthenticated]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Last 3 unique contributors from entries (most recent first) — skip null/empty authors
  const contributors = [...new Map(
    [...entries].filter(e => e.author).reverse().map(e => [e.author, e])
  ).values()].slice(0, 3);

  const ease = 'cubic-bezier(0.16,1,0.3,1)';

  const todayTopbar = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'today' }]} />
  );

  // First-run: no entries yet — show focused sealed letter prompt
  if (entries.length === 0) {
    return (
      <ClothShell topbarLeft={todayTopbar}>
        <div style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(14px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}>
          <div className="hl-eyebrow" style={{ marginBottom: 22, color: 'var(--warm)' }}>
            entry no. 0001
          </div>
          <h1 className="hl-serif hl-tight" style={{
            fontSize: 'clamp(30px, 4.8vw, 54px)', fontWeight: 300,
            margin: '0 0 24px', color: 'var(--bone)', fontVariationSettings: '"opsz" 54',
          }}>
            There is someone who needs to read this.<br />Just not yet.
          </h1>
          <p className="hl-serif" style={{
            fontSize: 'clamp(16px, 1.7vw, 19px)', fontWeight: 300,
            color: 'var(--bone-dim)', lineHeight: 1.74, margin: '0 0 36px', maxWidth: '44ch',
          }}>
            Write a letter today. Seal it for a date, a milestone, a death — or the moment you choose.
            It holds safe and finds them exactly when you intended.
          </p>

          {/* Sealed letter preview */}
          <div style={{
            display: 'inline-flex', flexDirection: 'column', gap: 6,
            padding: '12px 16px 12px 18px',
            border: '1px solid rgba(244,236,216,0.10)',
            borderLeft: '2px solid rgba(176,122,74,0.55)',
            marginBottom: 32,
          }}>
            <div className="hl-mono" style={{ fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
              sealed · delivery: your choice
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="hl-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
              <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
                your first letter — written today
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/compose" className="hl-btn">Write your first sealed letter →</Link>
            <Link to="/record" style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--bone-dim)', textDecoration: 'none', borderBottom: '1px solid var(--rule)', paddingBottom: 1,
            }}>or record a voice →</Link>
          </div>

          <div style={{ marginTop: 52, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <div className="hl-eyebrow" style={{ marginBottom: 10, color: 'var(--bone-faint)' }}>the listener</div>
            <p className="hl-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0, maxWidth: '44ch' }}>
              {promptUnavailable ? 'prompt unavailable' : prompt}
            </p>
          </div>
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={todayTopbar}>
      {/* ── Content: flex column filling full height ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Content: top third of screen ── */}
      <div style={{
        padding: 'var(--page-pad-top) var(--page-pad-x) 0',
        maxWidth: 720,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
      }}>
        {/* eyebrow: tonight's prompt time */}
        <div
          className="hl-eyebrow loom-today-eyebrow"
          style={{ marginBottom: 22 }}
        >
          tonight · 8 pm
        </div>

        {/* The Listener's daily question */}
        <h1
          className="hl-serif hl-tight loom-today-headline"
          style={{
            fontSize: 'clamp(28px, 4.4vw, 48px)',
            fontWeight: 300,
            lineHeight: 1.12,
            margin: 0,
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 48',
          }}
        >
          {prompt}
        </h1>

        {/* CTA */}
        <div className="loom-today-cta" style={{ marginTop: 36, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/compose" className="hl-btn">write now</Link>
          <Link
            to="/record"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: 'var(--bone-dim)', textDecoration: 'none',
              borderBottom: '1px solid var(--rule)', paddingBottom: 1,
            }}
          >
            or speak →
          </Link>
        </div>

        {/* Recent voices */}
        {contributors.length > 0 && (
          <div
            className="loom-today-family"
            style={{ marginTop: 52, borderTop: '1px solid var(--rule)', paddingTop: 20,
              opacity: revealed ? 1 : 0, transition: `opacity 1400ms ${ease}`, transitionDelay: '360ms' }}
          >
            <div className="hl-eyebrow" style={{ marginBottom: 12 }}>recent voices</div>
            <div style={{ display: 'flex', gap: 28 }}>
              {contributors.map((c) => (
                <span key={c.author} className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {String(c.author ?? '').slice(0, 8)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* On this day — real data when authenticated */}
        {(onThisDay.length > 0 || onThisDayError) && (
          <div
            style={{ marginTop: 40, borderTop: '1px solid var(--rule)', paddingTop: 20,
              opacity: revealed ? 1 : 0, transition: `opacity 1400ms ${ease}`, transitionDelay: '540ms' }}
          >
            <div className="hl-eyebrow" style={{ marginBottom: 14 }}>on this day</div>
            {onThisDayError ? (
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', fontStyle: 'italic', letterSpacing: '0.08em', margin: 0 }}>
                unavailable
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {onThisDay.slice(0, 3).map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {m.yearsAgo !== undefined && (
                      <span className="hl-mono" style={{ fontSize: 8.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                        {m.yearsAgo} {m.yearsAgo === 1 ? 'year' : 'years'} ago
                      </span>
                    )}
                    <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, color: 'var(--bone-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      {m.title ?? m.description ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      </div>
    </ClothShell>
  );
}
