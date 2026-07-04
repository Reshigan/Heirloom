import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { usePageMeta } from '../lib/usePageMeta';
import { CosmicHeader, SectionLabel, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';
import { useLoomTheme } from '../loom/theme';
import { dyeForId, dyeTextVar, dyeVar, moodForDye } from '../loom/dye';

/**
 * Profile — the member's own page of the ledger.
 *
 * The page opens on the member's identity: their name set in their own dye,
 * the dye named and shown as the thread (a hairline filament — the surviving
 * identity signal), then a quiet hairline menu to the real destinations that
 * exist in the app (Settings, Account/Billing, theme, Sign out). No icons,
 * radius 0, copper kept to thin strokes and text — the ledger's one warm note.
 *
 * No ThemeToggle component exists in this tree; Settings.tsx manages the theme
 * inline via useLoomTheme, so this page reuses that exact idiom rather than
 * inventing a parallel control.
 */
export function Profile() {
  usePageMeta('Profile');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  // The Deep is water-only — useLoomTheme pins data-theme="dark" app-wide.
  useLoomTheme();

  // The member's dye is their identity colour. There is no stored dye on the
  // User record, so it is derived deterministically from the user id — the same
  // hash every consuming surface uses, so the colour matches the thread, the
  // name, and the small marks the member carries everywhere else in the loom.
  const dye = user ? dyeForId(user.id) : dyeForId('anon');
  const nameColor = dyeTextVar(dye); // AA-tuned for NAME text in both themes
  const threadColor = dyeVar(dye);   // vivid thread token — the filament signal
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Member';
  const mood = moodForDye(dye);

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'profile' }]} />}
    >
      <div style={{ maxWidth: 'var(--page-max-prose)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>

        <CosmicHeader eyebrow="THE HAND" title="Profile" align="left" />

        {/* ════════ IDENTITY ════════
            The member's own name in their own dye, sitting on a thin dye
            filament — the same left-thread that marks their entries on the
            cloth, here naming the person rather than an entry. */}
        <div
          style={{
            borderLeft: `1px solid ${threadColor}`,
            paddingLeft: 18,
            margin: '0 0 8px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(28px, 5vw, 40px)',
              lineHeight: 1.08,
              fontWeight: 500,
              color: nameColor,
              margin: 0,
            }}
          >
            {fullName}
          </h2>
          <p
            className="hl-serif"
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--bone-dim)',
              lineHeight: 1.6,
              margin: '8px 0 0',
            }}
          >
            {user?.email ?? '—'}
          </p>
        </div>

        {/* The thread / dye — the member's identity signal, named. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            margin: '18px 0 0',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span aria-hidden style={{ width: 24, height: 1, background: threadColor, alignSelf: 'center', flex: '0 0 auto' }} />
          <span style={{ color: nameColor }}>{dye}</span>
          <span style={{ color: 'var(--muted-3)' }}>·</span>
          <span style={{ color: 'var(--muted-3)' }}>{mood}</span>
        </div>

        {/* ════════ KEEPING ════════
            The quiet hairline menu — real destinations only. Each is verified
            to exist in App.tsx: /settings, /billing, /threads, /family. */}
        <SectionLabel>Keeping</SectionLabel>

        <EntryRow
          title="Settings"
          sub="Account, notifications, appearance, privacy"
          meta="OPEN →"
          onClick={() => navigate('/settings')}
        />
        <EntryRow
          title="Account & billing"
          sub="Plan, payment, and invoices"
          meta="MANAGE →"
          onClick={() => navigate('/billing')}
        />
        <EntryRow
          title="Search the Deep"
          sub="Every entry, letter, and voice"
          meta="OPEN →"
          onClick={() => navigate('/search')}
        />
        <EntryRow
          title="Inbox"
          sub="What has surfaced for you"
          meta="OPEN →"
          onClick={() => navigate('/inbox')}
        />
        <EntryRow
          title="On this day"
          sub="What the family set down on today's date"
          meta="OPEN →"
          onClick={() => navigate('/on-this-day')}
        />
        <EntryRow
          title="The book"
          sub="The Deep, bound and printed"
          meta="OPEN →"
          onClick={() => navigate('/book')}
        />
        <EntryRow
          title="Wrapped"
          sub="The year, kept"
          meta="OPEN →"
          onClick={() => navigate('/wrapped')}
        />
        <EntryRow
          title="Gift the Deep"
          sub="Give another family a Deep of their own"
          meta="GIVE →"
          onClick={() => navigate('/gift-subscriptions')}
        />

        {/* ════════ THE BLOODLINE ════════ */}
        <SectionLabel>The Bloodline</SectionLabel>

        <EntryRow
          title="Your family"
          sub="The family who share your Deep"
          meta="VIEW →"
          onClick={() => navigate('/family')}
        />
        <EntryRow
          title="Threads & successors"
          sub="Stewardship and who inherits the Deep"
          meta="MANAGE →"
          onClick={() => navigate('/threads')}
        />

        {/* ════════ APPEARANCE ════════
            The Deep is deep water only — no theme toggle. Show the surface as
            a quiet fixed value; the deeper appearance levers (accent, text
            size, contrast) live on the full Settings page. */}
        <SectionLabel>Appearance</SectionLabel>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 20,
            padding: '15px 0',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.3, color: 'var(--bone)', display: 'block' }}>
              Surface
            </span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--bone-dim)', display: 'block', marginTop: 4, lineHeight: 1.5 }}>
              the Deep is deep water — it only reads one way
            </span>
          </span>
          <span className="hl-mono" style={{ flex: '0 0 auto', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
            deep water
          </span>
        </div>

        {/* The full Settings page carries the deeper appearance levers
            (text size, contrast); keep this page quiet and point there. */}
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--bone-faint)', lineHeight: 1.6, margin: '12px 0 0', maxWidth: '52ch' }}>
          Text size and contrast live in{' '}
          <Link to="/settings" style={{ color: 'var(--warm)', textDecoration: 'none' }}>Settings</Link>.
        </p>

        {/* ── Sign out ─────────────────────────────────── */}
        <button
          type="button"
          onClick={() => { void logout().then(() => navigate('/', { replace: true })); }}
          style={{
            display: 'block',
            margin: '56px auto 40px',
            background: 'transparent',
            border: 0,
            padding: '22px 0',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--muted-3)',
            transition: 'color 360ms var(--ease)',
          }}
        >
          Sign out
        </button>

        <div style={{ textAlign: 'center' }}>
          <WaxSeal size={28} />
        </div>

      </div>
    </ClothShell>
  );
}
