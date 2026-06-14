import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HLogo } from '../loom/components/HLogo';
import api from '../services/api';

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

/* ── Loading state — hairline progress bar ─────────────────────────── */

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
        animation: 'none',
      }}
    />
  );
}

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

  /* ── Topbar (parchment variant) ─────────────────────────────────── */
  const topbar = (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 5,
      }}
    >
      {/* Left: "your gift" */}
      <span
        className="hl-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
        }}
      >
        your gift
      </span>

      {/* Center: thread info */}
      <span
        className="hl-mono"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--parchment-faint)',
          whiteSpace: 'nowrap',
        }}
      >
        {thread ? (
          <>
            <span style={{ color: 'var(--parchment-dim)' }}>{thread.senderName}</span>
            {' · '}
            <span>{thread.entryCount} {thread.entryCount === 1 ? 'entry' : 'entries'}</span>
          </>
        ) : (
          <span>heirloom</span>
        )}
      </span>

      {/* Right: "create account →" warm */}
      <Link
        to="/signup"
        className="hl-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          textDecoration: 'none',
          transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
      >
        create account →
      </Link>
    </div>
  );

  /* ── Screen wrapper (parchment) ────────────────────────────────── */
  const screenStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--parchment)',
    color: 'var(--parchment-ink)',
    overflow: 'hidden auto',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
  };

  /* ── Loading ────────────────────────────────────────────────────── */
  if (isLoading || !token) {
    return (
      <div style={screenStyle}>
        <LoadingBar />
        {topbar}
      </div>
    );
  }

  /* ── Error / invalid token ──────────────────────────────────────── */
  if (isError || !thread) {
    return (
      <div style={screenStyle}>
        {topbar}
        <div style={{ padding: '84px 56px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginBottom: 48,
            }}
          >
            <HLogo size={20} mono color="var(--parchment-faint)" />
          </div>
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 48,
              fontWeight: 300,
              color: 'var(--parchment-ink)',
              margin: '0 0 20px',
            }}
          >
            This link has expired.
          </h1>
          <p
            className="hl-prose"
            style={{
              fontSize: 'var(--type-body)',
              color: 'var(--parchment-dim)',
              margin: '0 0 32px',
              maxWidth: '52ch',
            }}
          >
            The gift link you followed is no longer valid. It may have already been claimed
            or the sender may have updated their settings.
          </p>
          <Link
            to="/"
            className="hl-btn"
            style={{ display: 'inline-flex' }}
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  /* ── Gift reveal ────────────────────────────────────────────────── */
  return (
    <div style={screenStyle}>
      {topbar}

      <div style={{ padding: '84px 56px' }}>
        {/* Logo lockup */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 48,
          }}
        >
          <HLogo size={20} mono color="var(--parchment-faint)" />
        </div>

        {/* Headline */}
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'var(--type-display)',
            fontWeight: 300,
            color: 'var(--parchment-ink)',
            margin: '0 0 20px',
          }}
        >
          Something was left for you.
        </h1>

        {/* Sub-copy */}
        <p
          className="hl-prose"
          style={{
            fontSize: 'var(--type-body)',
            color: 'var(--parchment-dim)',
            margin: '0 0 32px',
            maxWidth: '52ch',
          }}
        >
          {thread.senderName} wove a thread for you — stories, letters, and memories
          they wanted you to carry forward. It will unfold at its own pace.
        </p>

        {/* Inner letter card — parchment-deep */}
        <div
          style={{
            background: 'var(--parchment-deep)',
            padding: '40px 48px',
            maxWidth: 540,
            marginBottom: 32,
          }}
        >
          {/* Sender line */}
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--parchment-faint)',
              margin: '0 0 24px',
            }}
          >
            from {thread.senderName}
            {thread.recipientName ? (
              <> · for {thread.recipientName}</>
            ) : null}
          </p>

          {/* Hairline separator */}
          <div
            style={{
              height: 1,
              background: 'var(--parchment-rule)',
              margin: '0 0 24px',
            }}
          />

          {/* Letter body */}
          <p
            className="hl-prose"
            style={{
              fontSize: 'var(--type-body-lg)',
              color: 'var(--parchment-ink)',
              margin: 0,
              maxWidth: 'none',
              lineHeight: 1.85,
            }}
          >
            {opened
              ? thread.body
              : thread.body.length > 280
              ? thread.body.slice(0, 280).trimEnd() + '…'
              : thread.body}
          </p>

          {/* Thread entry count note */}
          {thread.entryCount > 1 && !opened && (
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--parchment-faint)',
                margin: '20px 0 0',
              }}
            >
              +{thread.entryCount - 1} more {thread.entryCount - 1 === 1 ? 'entry' : 'entries'} in the thread
            </p>
          )}

          {/* Open → button */}
          <div style={{ marginTop: 24 }}>
            {opened ? (
              <a
                href={`/signup?token=${token}`}
                className="hl-btn"
                style={{ display: 'inline-flex' }}
              >
                Claim your thread →
              </a>
            ) : (
              <button
                type="button"
                className="hl-btn"
                onClick={() => setOpened(true)}
              >
                Open →
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--parchment-faint)',
            maxWidth: '52ch',
            lineHeight: 1.8,
          }}
        >
          To read the full thread and receive future entries, create a free Heirloom
          account. Your thread is waiting.
        </p>
      </div>
    </div>
  );
}

export default RecipientExperience;
