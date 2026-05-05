import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Settings — Loom-native rewrite.
 *
 * Five tabs across a small-caps row (no pills, no boxes):
 *   - Profile: name, email, password change
 *   - Notifications: weekly digest, push, marketing
 *   - Encryption: status only (vault setup is in onboarding)
 *   - Succession: link to /threads + successor docs
 *   - Support: contact link
 *
 * Same settingsApi calls as before. The full v1/v2 deadman /
 * legacy-contacts / data-export flows are reachable from the
 * "More" menu in the top nav for now.
 */

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'succession', label: 'Succession' },
  { id: 'support', label: 'Support' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function Settings() {
  const [tab, setTab] = useState<TabId>('profile');

  return (
    <AppFrame>
      <header style={{ marginBottom: 32 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Settings
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Your account.
        </h1>
      </header>

      {/* Tab strip */}
      <nav
        style={{
          display: 'flex',
          gap: 28,
          borderBottom: '1px solid var(--loom-rule)',
          marginBottom: 36,
          paddingBottom: 14,
          overflowX: 'auto',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 0,
              padding: '0 0 8px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: tab === t.id ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
              borderBottom: '1px solid',
              borderColor: tab === t.id ? 'var(--loom-warm)' : 'transparent',
              marginBottom: -15,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'encryption' && <EncryptionTab />}
      {tab === 'succession' && <SuccessionTab />}
      {tab === 'support' && <SupportTab />}
    </AppFrame>
  );
}

function ProfileTab() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  const save = useMutation({
    mutationFn: () => settingsApi.updateProfile({ firstName, lastName }).then((r) => r.data),
    onSuccess: () => {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    },
  });

  return (
    <div style={{ maxWidth: 560, display: 'grid', gap: 28 }}>
      <p className="loom-eyebrow">Identity</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Field label="first name" value={firstName} onChange={setFirstName} />
        <Field label="last name" value={lastName} onChange={setLastName} />
      </div>
      <Field label="email" value={user?.email ?? ''} disabled />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="loom-btn">
          {save.isPending ? 'saving…' : 'save'}
        </button>
        {savedFlash ? (
          <span className="loom-mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}>
            ∞ saved
          </span>
        ) : null}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { data, refetch } = useQuery({
    queryKey: ['notifications', 'prefs'],
    queryFn: () => settingsApi.getNotifications().then((r) => r.data).catch(() => null),
  });

  const update = useMutation({
    mutationFn: (patch: Record<string, boolean>) => settingsApi.updateNotifications(patch),
    onSuccess: () => refetch(),
  });

  const prefs = (data ?? {}) as Record<string, boolean>;

  const items: { key: string; label: string }[] = [
    { key: 'weeklyDigest', label: 'Weekly digest of new entries from family members' },
    { key: 'reminderEmails', label: 'Quiet quarterly check-in' },
    { key: 'pushNotifications', label: 'Push notifications when locks open' },
    { key: 'emailNotifications', label: 'Transactional emails (receipts, sealed letters)' },
    { key: 'marketingEmails', label: 'Occasional product updates' },
  ];

  return (
    <div style={{ maxWidth: 640 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 18 }}>
        What we send you
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
        {items.map((it) => (
          <li
            key={it.key}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
              padding: '12px 0',
              borderBottom: '1px solid var(--loom-rule)',
            }}
          >
            <input
              type="checkbox"
              checked={!!prefs[it.key]}
              onChange={(e) => update.mutate({ [it.key]: e.target.checked })}
              style={{ accentColor: 'var(--loom-warm)' }}
            />
            <span className="loom-body" style={{ fontSize: 16, color: 'var(--loom-bone)' }}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EncryptionTab() {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        Encryption
      </p>
      <p
        className="loom-body"
        style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '0 0 20px', lineHeight: 1.7 }}
      >
        Each thread holds its body content encrypted in browser with a family key escrowed across
        your successor designations. If you lose access, the key is recoverable through the
        successor chain.
      </p>
      <p
        className="loom-mono"
        style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em', margin: 0 }}
      >
        aes-256-gcm · key escrow · 2 of 3 contacts · 48-hour cooldown
      </p>
    </div>
  );
}

function SuccessionTab() {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        Succession
      </p>
      <p
        className="loom-body"
        style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '0 0 24px', lineHeight: 1.7 }}
      >
        If you step away or die, the highest-ranked active successor takes founder rights — keeping
        the thread going without breaking continuity. Designations are append-only; Founders are
        succeeded, never removed.
      </p>
      <a
        href="/threads"
        className="loom-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-warm)',
          textDecoration: 'none',
        }}
      >
        manage successors per thread →
      </a>
    </div>
  );
}

function SupportTab() {
  return (
    <div style={{ maxWidth: 640 }}>
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        Support
      </p>
      <p
        className="loom-body"
        style={{ fontSize: 16, color: 'var(--loom-bone-dim)', margin: '0 0 12px', lineHeight: 1.7 }}
      >
        If something is wrong, or someone has died, write to us.
      </p>
      <a
        href="mailto:support@heirloom.blue"
        className="loom-mono"
        style={{
          fontSize: 13,
          letterSpacing: '0.04em',
          color: 'var(--loom-warm)',
          textDecoration: 'none',
        }}
      >
        support@heirloom.blue
      </a>
      <p className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', marginTop: 12 }}>
        we respond within two business days
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span className="loom-eyebrow" style={{ display: 'block', marginBottom: 6, fontSize: 10 }}>
        {label}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
      />
    </label>
  );
}
