import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import {
  billingApi,
  memoriesApi,
  familyApi,
  threadsApi,
  type ThreadSummary,
  type UpcomingUnlock,
} from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Dashboard — Loom-native rewrite.
 *
 * Shape:
 *   - eyebrow: "Today · {weekday} · {date}"
 *   - greeting: "Welcome back, {firstName}."
 *   - subheading: line about the thread state ("3 new entries, 2 locks
 *     opening soon"), pulled from real data
 *   - featured-thread row (your primary thread; entry/member counts;
 *     deep-link to /threads/:id)
 *   - upcoming-unlocks ribbon when there are time-locked entries
 *     opening in the next 90 days
 *   - three actions: Write to your thread / Read your thread / Invite a member
 *   - quiet stats footer (memories, family, plan)
 *
 * Single column, 1180px max. Hairline rules. No sanctuary tiles, no
 * legacy-score orb, no constellation backdrop.
 */
export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: threadList } = useQuery({
    queryKey: ['threads', 'list'],
    queryFn: () => threadsApi.list().then((r) => r.data).catch(() => null),
  });
  const featured: ThreadSummary | undefined = threadList?.threads?.[0];

  const { data: upcoming } = useQuery({
    queryKey: ['threads', 'upcoming-unlocks'],
    queryFn: () => threadsApi.upcomingUnlocks(90).then((r) => r.data).catch(() => null),
  });

  const { data: stats } = useQuery({
    queryKey: ['memories', 'stats'],
    queryFn: () => memoriesApi.getStats?.().then((r: any) => r.data).catch(() => null) ?? null,
  });

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data).catch(() => null),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data).catch(() => null),
  });

  const today = new Date();
  const weekday = today.toLocaleDateString(undefined, { weekday: 'long' });
  const date = today.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  const upcomingCount = upcoming?.upcoming?.length ?? 0;
  const headlineSub =
    upcomingCount > 0
      ? `${upcomingCount} ${upcomingCount === 1 ? 'lock' : 'locks'} opening in the next ninety days. The thread continues.`
      : 'The thread is yours to read; whatever you write today will be there for them.';

  const familyCount = Array.isArray(family) ? family.length : (family?.length ?? 0);
  const memoryCount = stats?.totalMemories ?? 0;
  const tier = subscription?.tier ?? 'STARTER';

  return (
    <AppFrame>
      {/* Header */}
      <header style={{ marginBottom: 56 }}>
        <p
          className="loom-eyebrow"
          style={{ marginBottom: 18 }}
        >
          Today · {weekday} · {date}
        </p>
        <h1
          className="loom-h2"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 300,
            margin: '0 0 18px',
          }}
        >
          Welcome back, <em style={{ fontStyle: 'italic', color: 'var(--warm)' }}>{user?.firstName ?? 'reader'}</em>.
        </h1>
        <p
          className="loom-body"
          style={{
            fontSize: 19,
            color: 'var(--bone-dim)',
            maxWidth: 640,
            margin: 0,
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          {headlineSub}
        </p>
      </header>

      {/* Upcoming unlocks ribbon */}
      {upcoming && upcoming.upcoming.length > 0 ? (
        <UnlockRibbon items={upcoming.upcoming.slice(0, 1)} count={upcomingCount} />
      ) : null}

      {/* Featured thread */}
      {featured ? <FeaturedThread thread={featured} threadCount={threadList?.threads?.length ?? 1} /> : <NoThreadYet />}

      {/* Three actions */}
      <section style={{ marginTop: 56 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 24 }}>
          Today's three
        </p>
        <hr className="loom-hairline" style={{ marginBottom: 28 }} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--rule)',
            border: '1px solid var(--rule)',
          }}
        >
          {[
            {
              num: '01',
              title: 'Write a memory',
              line: 'Add an entry to the thread. The loom will tell you what it rhymes with.',
              cta: 'open the composer →',
              to: '/compose',
            },
            {
              num: '02',
              title: 'Record a voice memo',
              line: 'A few minutes of you, talking. Transcribed, kept, passed on.',
              cta: 'open the recorder →',
              to: '/record',
            },
            {
              num: '03',
              title: 'Invite a member',
              line: 'Living kin or a placeholder for a descendant who is not yet of age.',
              cta: 'open the family →',
              to: '/family',
            },
          ].map((a) => (
            <button
              key={a.num}
              type="button"
              onClick={() => navigate(a.to)}
              style={{
                background: 'var(--ink)',
                border: 0,
                padding: '32px 28px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                gap: 14,
                minHeight: 220,
                transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-card)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink)')}
            >
              <span
                className="loom-mono"
                style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--warm)' }}
              >
                {a.num}
              </span>
              <h3
                className="loom-serif"
                style={{
                  fontSize: 22,
                  fontWeight: 300,
                  color: 'var(--bone)',
                  lineHeight: 1.25,
                  margin: 0,
                }}
              >
                {a.title}
              </h3>
              <div>
                <p className="loom-body" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 14px' }}>
                  {a.line}
                </p>
                <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                  {a.cta}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quiet stats footer */}
      <section
        style={{
          marginTop: 64,
          paddingTop: 28,
          borderTop: '1px solid var(--rule)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32,
        }}
      >
        <Stat label="memories" value={String(memoryCount)} />
        <Stat label="family" value={String(familyCount)} />
        <Stat label="plan" value={tier.toLowerCase()} warm />
        <Stat label="kept since" value={user?.id ? '2026' : '—'} />
      </section>
    </AppFrame>
  );
}

function FeaturedThread({ thread, threadCount }: { thread: ThreadSummary; threadCount: number }) {
  return (
    <section style={{ marginTop: 36 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 20 }}>
        Your family thread
      </p>
      <Link
        to={`/threads/${thread.id}`}
        style={{
          display: 'block',
          padding: '32px 36px',
          border: '1px solid var(--rule)',
          background: 'rgba(244,236,216,0.012)',
          textDecoration: 'none',
          transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--rule-warm)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--rule)')}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              className="loom-h2"
              style={{
                fontSize: 28,
                fontWeight: 300,
                color: 'var(--bone)',
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {thread.name}
            </h2>
            {thread.dedication ? (
              <p
                className="loom-body"
                style={{
                  fontSize: 15,
                  color: 'var(--bone-dim)',
                  margin: '6px 0 0',
                  fontStyle: 'italic',
                }}
              >
                {thread.dedication}
              </p>
            ) : null}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            <span>{thread.entry_count} {thread.entry_count === 1 ? 'entry' : 'entries'}</span>
            <span>{thread.member_count} {thread.member_count === 1 ? 'member' : 'members'}</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--rule)',
          }}
        >
          <span
            className="loom-mono"
            style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
          >
            {thread.role.toLowerCase()} · gen {thread.generation_offset}
          </span>
          <span style={{ color: 'var(--warm)', fontSize: 14 }}>open the thread →</span>
        </div>
      </Link>
      {threadCount > 1 ? (
        <p style={{ marginTop: 12, marginLeft: 4 }}>
          <Link
            to="/threads"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}
          >
            view all {threadCount} threads →
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function NoThreadYet() {
  return (
    <section style={{ marginTop: 36 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 20 }}>
        Your family thread
      </p>
      <div
        style={{
          padding: '40px 36px',
          border: '1px solid var(--rule)',
          background: 'rgba(244,236,216,0.012)',
        }}
      >
        <h2
          className="loom-h2"
          style={{
            fontSize: 26,
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 12px',
            fontStyle: 'italic',
          }}
        >
          The thread will be created on your first entry.
        </h2>
        <p
          className="loom-body"
          style={{ fontSize: 16, color: 'var(--bone-dim)', margin: '0 0 24px', maxWidth: 580, lineHeight: 1.6 }}
        >
          Anything you write, record, or send goes into your family thread automatically. Members
          can be added once the thread is started.
        </p>
        <Link to="/compose" className="loom-btn" style={{ textDecoration: 'none' }}>
          write the first entry
        </Link>
      </div>
    </section>
  );
}

function UnlockRibbon({ items, count }: { items: UpcomingUnlock[]; count: number }) {
  const lead = items[0];
  const when = lead.unlock_date
    ? new Date(lead.unlock_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return (
    <div
      style={{
        marginBottom: 36,
        padding: '20px 24px',
        border: '1px solid var(--rule-warm)',
        background: 'rgba(176,122,74,0.04)',
        display: 'flex',
        alignItems: 'baseline',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <span
        className="loom-mono"
        style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)' }}
      >
        ∞ &nbsp; {count} {count === 1 ? 'lock opening' : 'locks opening'}
      </span>
      <span
        className="loom-body"
        style={{ flex: 1, fontSize: 15, color: 'var(--bone)', minWidth: 280 }}
      >
        {lead.entry_title ?? 'An entry'} in <em style={{ color: 'var(--warm)' }}>{lead.thread_name}</em>
        {when ? ` — opens ${when}` : ''}
        {lead.target_name ? ` for ${lead.target_name}` : ''}.
      </span>
      <Link to="/threads" style={{ color: 'var(--warm)', fontSize: 14, whiteSpace: 'nowrap', textDecoration: 'none' }}>
        view threads →
      </Link>
    </div>
  );
}

function Stat({ label, value, warm }: { label: string; value: string; warm?: boolean }) {
  return (
    <div>
      <p className="loom-eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>
        {label}
      </p>
      <p
        className="loom-serif"
        style={{
          fontSize: 28,
          fontWeight: 300,
          color: warm ? 'var(--warm)' : 'var(--bone)',
          margin: 0,
          textTransform: warm ? 'capitalize' : 'none',
        }}
      >
        {value}
      </p>
    </div>
  );
}
