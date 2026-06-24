import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { useListener } from '../hooks/useListener';
import { useTapestryEntries } from '../hooks/useTapestryEntries';
import { useAuthStore } from '../stores/authStore';
import { aiApi, engagementApi } from '../services/api';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { EASE as ease } from '../loom/motion';

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
  const { entries, isLoading: entriesLoading } = useTapestryEntries();
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

  const todayTopbar = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'today' }]} />
  );

  // Carry the live Listener prompt into the Composer (consumes ?prompt as seedPrompt).
  const composeTo = !promptUnavailable && prompt
    ? `/compose?prompt=${encodeURIComponent(prompt)}`
    : '/compose';

  // The outlined amber mono pill — the cosmic-home WRITE / SPEAK affordance,
  // mirroring Login's "enter" pill. warm = the lead action, quiet = the second.
  const pillStyle = (_lead: boolean): CSSProperties => ({
    padding: '12px 30px',
    background: 'transparent',
    border: '1px solid var(--copper-border)',
    borderRadius: 0,
    color: 'var(--warm)',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  // A centred recent line — small serif, a faint warm diamond mark before it.
  const RecentLine = ({ children, italic }: { children: ReactNode; italic?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, padding: '6px 0' }}>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 15, lineHeight: 1 }}>·</span>
      <span style={{
        fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300,
        fontStyle: italic ? 'italic' : 'normal', color: 'var(--bone-dim)', lineHeight: 1.4,
      }}>
        {children}
      </span>
    </div>
  );

  // Still loading the thread — show the hairline progress, not the first-run
  // empty state, so the sealed-letter prompt doesn't flash before data arrives.
  if (entriesLoading && entries.length === 0) {
    return (
      <ClothShell topbarLeft={todayTopbar}>
        <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x)', maxWidth: 'var(--page-max-focus)', margin: '0 auto', textAlign: 'center' }}>
          <ProgressHair width={80} />
        </div>
      </ClothShell>
    );
  }

  // First-run: no entries yet — show focused sealed letter prompt, in the same
  // centred crown idiom as the capture home (global ClothBackdrop paints crown)
  if (entries.length === 0) {
    return (
      <ClothShell topbarLeft={todayTopbar}>
        <div style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
          textAlign: 'center',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(14px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}>
          {/* LEDGER header — entry no. 0001 eyebrow + serif title */}
          <CosmicHeader
            align="center"
            eyebrow="entry no. 0001"
            title={<>There is someone who needs to read this.<br />Just not yet.</>}
            sub="Write a letter today. Seal it for a date, a milestone, a death — or the moment you choose. It holds safe and finds them exactly when you intended."
          />

          {/* Sealed letter preview — left warm thread + mono label */}
          <div style={{
            display: 'inline-flex', flexDirection: 'column', gap: 6,
            padding: '12px 18px',
            borderLeft: '2px solid var(--thread-warm)',
            marginBottom: 44, textAlign: 'left',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.26em',
              textTransform: 'uppercase', color: 'var(--bone-faint)',
            }}>
              sealed · delivery: your choice
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
                your first letter — written today
              </span>
            </div>
          </div>

          {/* Capture affordances — outlined amber WRITE / quiet SPEAK pills */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link to={composeTo} style={pillStyle(true)}>write</Link>
            <Link to="/record" style={pillStyle(false)}>speak</Link>
          </div>

          {/* The Listener prompt */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
            <SectionLabel>the listener</SectionLabel>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic',
              color: 'var(--bone-faint)', lineHeight: 1.7, margin: '8px auto 0', maxWidth: '44ch',
            }}>
              {promptUnavailable ? (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--bone-dim)' }}>
                  prompt unavailable
                </span>
              ) : prompt}
            </p>
          </div>
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={todayTopbar}>
      {/* Woven header band — thread-band PNG fading into the ground, behind content */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 240,
          backgroundImage: `linear-gradient(180deg, transparent 55%, var(--ink)), image-set(url("/woven/thread-band.avif") type("image/avif"), url("/woven/thread-band.webp") type("image/webp"), url("/woven/thread-band.png") type("image/png"))`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        maxWidth: 'var(--page-max-focus)',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
      }}>
        {/* THE LISTENER ASKS — centred crown capture (global ClothBackdrop paints
            the radiating crown filament behind this; the page renders no backdrop).
            Hero set inline (not via CosmicHeader) to hold the smaller, calmer
            Cormorant listener-question scale — muted eyebrow, ~28–34px display. */}
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.26em',
            textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 18,
          }}>
            the listener asks
          </div>
          <h1 style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(28px, 6vw, 34px)',
            lineHeight: 1.16,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: 0,
            fontWeight: 500,
          }}>
            {promptUnavailable ? (
              <span style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>prompt unavailable</span>
            ) : prompt}
          </h1>
        </header>

        {/* Capture affordances — outlined amber WRITE / quiet SPEAK pills */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link to={composeTo} style={pillStyle(true)}>write</Link>
          <Link to="/record" style={pillStyle(false)}>speak</Link>
        </div>

        {/* Recent voices — centred ledger lines */}
        {contributors.length > 0 && (
          <div style={{
            opacity: revealed ? 1 : 0,
            transition: `opacity 720ms ${ease}`,
            transitionDelay: '360ms',
            marginBottom: 8,
          }}>
            {contributors.map((c) => (
              <RecentLine key={String(c.author)}>{String(c.author ?? '')}</RecentLine>
            ))}
          </div>
        )}

        {/* On this day — centred ledger lines */}
        {(onThisDay.length > 0 || onThisDayError) && (
          <div style={{
            opacity: revealed ? 1 : 0,
            transition: `opacity 720ms ${ease}`,
            transitionDelay: '720ms',
          }}>
            {onThisDayError ? (
              <p style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                color: 'var(--bone-dim)', margin: '8px 0 0',
              }}>
                unavailable
              </p>
            ) : (
              onThisDay.slice(0, 3).map((m) => (
                <RecentLine key={m.id} italic>
                  {m.title ?? m.description ?? '—'}
                  {m.yearsAgo !== undefined && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                      color: 'var(--bone-faint)', marginLeft: 10,
                    }}>
                      {m.yearsAgo} {m.yearsAgo === 1 ? 'yr' : 'yrs'} ago
                    </span>
                  )}
                </RecentLine>
              ))
            )}
          </div>
        )}

        {/* WaxSeal foot */}
        <div style={{ marginTop: 64, paddingBottom: 24 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}
