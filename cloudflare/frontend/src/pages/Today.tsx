import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { useListener } from '../hooks/useListener';
import { useTapestryEntries } from '../hooks/useTapestryEntries';
import { useAuthStore } from '../stores/authStore';
import { aiApi, engagementApi } from '../services/api';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

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
          margin: '0 auto',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(14px)',
          transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
        }}>
          {/* LEDGER header — entry no. 0001 eyebrow + serif title */}
          <CosmicHeader
            eyebrow="entry no. 0001"
            title={<>There is someone who needs to read this.<br />Just not yet.</>}
            sub="Write a letter today. Seal it for a date, a milestone, a death — or the moment you choose. It holds safe and finds them exactly when you intended."
          />

          {/* Sealed letter preview — left warm thread + mono label */}
          <div style={{
            display: 'inline-flex', flexDirection: 'column', gap: 6,
            padding: '12px 16px 12px 18px',
            borderLeft: '2px solid rgba(176,122,74,0.55)',
            marginBottom: 40,
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

          {/* Compose CTAs — mono text affordances */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link
              to="/compose"
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none',
                borderBottom: '1px solid var(--warm)', paddingBottom: 2,
                minHeight: 44, display: 'inline-flex', alignItems: 'center',
              }}
            >
              write your first sealed letter →
            </Link>
            <Link
              to="/record"
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none',
                borderBottom: '1px solid var(--rule)', paddingBottom: 2,
                minHeight: 44, display: 'inline-flex', alignItems: 'center',
              }}
            >
              or record a voice →
            </Link>
          </div>

          {/* The Listener prompt */}
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <SectionLabel>the listener</SectionLabel>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic',
              color: 'var(--bone-faint)', lineHeight: 1.7, margin: '8px 0 0', maxWidth: '44ch',
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
      <div style={{
        padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 720ms ${ease}, transform 720ms ${ease}`,
      }}>
        {/* LEDGER header — "tonight · 8 pm" eyebrow + the listener's daily question */}
        <CosmicHeader
          eyebrow="tonight · 8 pm"
          title={promptUnavailable ? (
            <span style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>prompt unavailable</span>
          ) : prompt}
        />

        {/* Compose CTAs — mono text affordances */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <Link
            to="/compose"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none',
              borderBottom: '1px solid var(--warm)', paddingBottom: 2,
              minHeight: 44, display: 'inline-flex', alignItems: 'center',
            }}
          >
            write now →
          </Link>
          <Link
            to="/record"
            style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
              textTransform: 'uppercase', color: 'var(--bone-dim)', textDecoration: 'none',
              borderBottom: '1px solid var(--rule)', paddingBottom: 2,
              minHeight: 44, display: 'inline-flex', alignItems: 'center',
            }}
          >
            or speak →
          </Link>
        </div>

        {/* Recent voices — EntryRow list */}
        {contributors.length > 0 && (
          <div style={{
            opacity: revealed ? 1 : 0,
            transition: `opacity 1400ms ${ease}`,
            transitionDelay: '360ms',
          }}>
            <SectionLabel>recent voices</SectionLabel>
            {contributors.map((c) => (
              <EntryRow
                key={String(c.author)}
                title={String(c.author ?? '')}
                author={String(c.author ?? '').slice(0, 8).toUpperCase()}
              />
            ))}
          </div>
        )}

        {/* On this day — EntryRow list */}
        {(onThisDay.length > 0 || onThisDayError) && (
          <div style={{
            opacity: revealed ? 1 : 0,
            transition: `opacity 1400ms ${ease}`,
            transitionDelay: '540ms',
          }}>
            <SectionLabel>on this day</SectionLabel>
            {onThisDayError ? (
              <p style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                color: 'var(--bone-dim)', margin: '8px 0 0',
              }}>
                unavailable
              </p>
            ) : (
              onThisDay.slice(0, 3).map((m) => (
                <EntryRow
                  key={m.id}
                  title={m.title ?? m.description ?? '—'}
                  italic
                  year={m.yearsAgo !== undefined
                    ? `${m.yearsAgo} ${m.yearsAgo === 1 ? 'yr' : 'yrs'} ago`
                    : undefined}
                />
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
