import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { WaxSeal, WarmDot } from '../loom/cosmic/CosmicUI';
import { dyeColor } from '../loom/dye';

/* ── Types ─────────────────────────────────────────────────────────── */

interface GiftThread {
  id: string;
  senderName: string;
  recipientName: string;
  title: string;
  body: string;
  entryCount: number;
  createdAt: string;
}

interface GiftPayload {
  thread: GiftThread;
  accessToken: string;
}

/* ── Token resolution: route param or ?token= query param ──────────── */

function useGiftToken(): string | null {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  return routeToken ?? searchParams.get('token');
}

/* ── Loading state — hairline progress bar (no spinner) ────────────── */

function LoadingBar() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '62%',
        height: 1,
        background: 'var(--warm)',
        opacity: 0.7,
      }}
    />
  );
}

/* ── Mono eyebrow / meta line (READING subline language) ───────────── */

const monoMeta: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  margin: 0,
};

/* ── Main component ────────────────────────────────────────────────── */

export function RecipientExperience() {
  const token = useGiftToken();
  const [opened, setOpened] = useState(false);

  /* Fetch gift data using the token from the URL */
  const { data, isLoading, isError } = useQuery<GiftPayload>({
    queryKey: ['gift', token],
    queryFn: () =>
      api
        .get(`/recipient-experience/gift/${token}`)
        .then((r: { data: GiftPayload }) => r.data),
    enabled: !!token,
    retry: false,
  });

  const thread = data?.thread;

  /* ── Screen wrapper ─────────────────────────────────────────────── */
  const screenStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--ink)',
    color: 'var(--bone)',
    overflow: 'hidden auto',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
  };

  /* ── Topbar: kind eyebrow · sender/count · create account ───────── */
  const topbar = (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px clamp(20px, 6vw, 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        zIndex: 5,
      }}
    >
      {/* Left: "your gift" */}
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
        }}
      >
        your gift
      </span>

      {/* Center: sender · entry count */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          whiteSpace: 'nowrap',
        }}
      >
        {thread ? (
          <>
            <span style={{ color: 'var(--bone-dim)' }}>{thread.senderName}</span>
            {' · '}
            <span>
              {thread.entryCount} {thread.entryCount === 1 ? 'entry' : 'entries'}
            </span>
          </>
        ) : (
          <span>∞ heirloom</span>
        )}
      </span>

      {/* Right: "create account →" warm */}
      <Link
        to="/signup"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          textDecoration: 'none',
          transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
        }}
      >
        create account →
      </Link>
    </div>
  );

  /* ── Loading ────────────────────────────────────────────────────── */
  if (isLoading || !token) {
    return (
      <div style={screenStyle}>
        <LoadingBar />
        {topbar}
        <div style={{ padding: '120px clamp(20px, 6vw, 56px)' }}>
          <p style={{ ...monoMeta, color: 'var(--bone-faint)' }}>
            unsealing your gift…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error / invalid token ──────────────────────────────────────── */
  if (isError || !thread) {
    return (
      <div style={screenStyle}>
        {topbar}
        <div
          style={{
            maxWidth: 620,
            margin: '0 auto',
            padding: '120px clamp(20px, 6vw, 56px) 80px',
          }}
        >
          <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
            <p style={{ ...monoMeta, color: 'var(--copper-label)', marginBottom: 22 }}>
              this link has closed
            </p>
            <h1
              style={{
                fontFamily: 'var(--serif-display)',
                fontSize: 'clamp(30px, 6vw, 44px)',
                fontWeight: 500,
                lineHeight: 1.08,
                color: 'var(--bone)',
                margin: '0 0 22px',
              }}
            >
              This link has expired.
            </h1>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--bone-dim)',
                margin: '0 0 36px',
                maxWidth: '52ch',
              }}
            >
              The gift link you followed is no longer valid. It may have already been
              claimed, or the sender may have updated their settings.
            </p>
            <Link
              to="/"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
              }}
            >
              return home →
            </Link>
          </div>
          <div style={{ marginTop: 72 }}>
            <WaxSeal size={28} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Gift reveal (READING) ──────────────────────────────────────── */
  const dye = dyeColor(thread.id);
  const year = new Date(thread.createdAt).getFullYear();
  const bodyShown = opened
    ? thread.body
    : thread.body.length > 280
    ? thread.body.slice(0, 280).trimEnd() + '…'
    : thread.body;
  const paragraphs = bodyShown.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const remaining = thread.entryCount - 1;

  return (
    <div style={screenStyle}>
      {topbar}

      <article
        style={{
          maxWidth: 620,
          margin: '0 auto',
          padding: '120px clamp(20px, 6vw, 56px) 80px',
        }}
      >
        {/* Dye margin thread + headline column */}
        <div style={{ borderLeft: `3px solid ${dye}`, paddingLeft: 24 }}>
          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(30px, 6vw, 44px)',
              fontWeight: 500,
              lineHeight: 1.08,
              color: 'var(--bone)',
              margin: '0 0 16px',
            }}
          >
            {thread.title?.trim() || 'Something was left for you.'}
          </h1>

          {/* Mono copper subline — A MEMORY BY <AUTHOR> · <YEAR> (+ for recipient) */}
          <p style={{ ...monoMeta, color: 'var(--copper-label)', display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span>a thread by {thread.senderName} · {year}</span>
            {thread.recipientName ? (
              <>
                <WarmDot color={dye} size={5} />
                <span style={{ color: 'var(--bone-dim)' }}>for {thread.recipientName}</span>
              </>
            ) : null}
          </p>
        </div>

        {/* Sender intent — serif prose */}
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: 1.75,
            color: 'var(--bone-dim)',
            margin: '40px 0 0',
            paddingLeft: 24,
            maxWidth: '52ch',
          }}
        >
          {thread.senderName} wove a thread for you — stories, letters, and memories
          they wanted you to carry forward. It will unfold at its own pace.
        </p>

        {/* Letter body — serif 18/1.75 justified, paragraph breaks preserved */}
        <div
          style={{
            margin: '48px 0 0',
            paddingLeft: 24,
            maxWidth: '62ch',
          }}
        >
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 18,
                lineHeight: 1.75,
                color: 'var(--bone)',
                textAlign: 'justify',
                margin: i === 0 ? 0 : '20px 0 0',
              }}
            >
              {para}
            </p>
          ))}

          {/* Thread entry-count note */}
          {remaining >= 1 && !opened && (
            <p style={{ ...monoMeta, color: 'var(--bone-faint)', marginTop: 28, letterSpacing: '0.18em' }}>
              +{remaining} more {remaining === 1 ? 'entry' : 'entries'} in the thread
            </p>
          )}

          {/* Open → / Claim → — quiet mono affordance, same onClick */}
          <div style={{ marginTop: 32 }}>
            {opened ? (
              <a
                href={`/signup?token=${token}`}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  textDecoration: 'none',
                }}
              >
                claim your thread →
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setOpened(true)}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                open →
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            ...monoMeta,
            color: 'var(--bone-faint)',
            letterSpacing: '0.18em',
            lineHeight: 1.9,
            margin: '64px 0 0',
            paddingLeft: 24,
            maxWidth: '52ch',
          }}
        >
          To read the full thread and receive future entries, create a free Heirloom
          account. Your thread is waiting.
        </p>

        {/* Wax seal foot */}
        <div style={{ marginTop: 72 }}>
          <WaxSeal size={30} />
        </div>
      </article>
    </div>
  );
}

export default RecipientExperience;
