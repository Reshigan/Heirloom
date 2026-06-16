import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId, dyeVar } from '../loom/dye';
import { giftsApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

interface GiftConfig {
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  memoryType: 'memory' | 'voice' | 'letter';
  memoryId: string;
  memoryTitle: string;
  unlockDate: string;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  marginBottom: 12,
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
};

// Quiet underline-only sans field (email / date).
const lineInput: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  borderRadius: 0,
  outline: 'none',
  fontFamily: 'var(--serif)',
  fontSize: 17,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  padding: '10px 0',
  boxSizing: 'border-box',
};

// Serif body textarea — 18px / 1.75.
const bodyInput: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 0,
  outline: 'none',
  fontFamily: 'var(--serif)',
  fontSize: 18,
  lineHeight: 1.75,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  minHeight: 132,
  resize: 'none',
  padding: 0,
  boxSizing: 'border-box',
};

export function GiftAMemory() {
  const navigate = useNavigate();

  const [config, setConfig] = useState<GiftConfig>({
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
    memoryType: 'memory',
    memoryId: '',
    memoryTitle: '',
    unlockDate: '',
  });

  const { data: memories } = useQuery({
    queryKey: ['gift-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 50 }).then((r) => r.data),
  });

  const { data: letters } = useQuery({
    queryKey: ['gift-letters'],
    queryFn: () => lettersApi.getAll({ limit: 50 }).then((r) => r.data),
  });

  const { data: voices } = useQuery({
    queryKey: ['gift-voices'],
    queryFn: () => voiceApi.getAll({ limit: 50 }).then((r) => r.data),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      giftsApi.send({
        memory_type: config.memoryType,
        memory_id: config.memoryId,
        recipient_email: config.recipientEmail,
        recipient_name: config.recipientName,
        personal_message: config.personalMessage,
        ...(config.unlockDate ? { unlock_date: config.unlockDate } : {}),
      }),
  });

  const getContentList = () => {
    if (config.memoryType === 'memory') {
      const list = Array.isArray(memories) ? memories : (memories as { data?: unknown[]; memories?: unknown[] })?.data || (memories as { memories?: unknown[] })?.memories || [];
      return list as { id: string; title?: string; subject?: string }[];
    }
    if (config.memoryType === 'letter') {
      const list = Array.isArray(letters) ? letters : (letters as { data?: unknown[]; letters?: unknown[] })?.data || (letters as { letters?: unknown[] })?.letters || [];
      return list as { id: string; title?: string; subject?: string }[];
    }
    if (config.memoryType === 'voice') {
      const list = Array.isArray(voices) ? voices : (voices as { data?: unknown[]; recordings?: unknown[] })?.data || (voices as { recordings?: unknown[] })?.recordings || [];
      return list as { id: string; title?: string; subject?: string }[];
    }
    return [] as { id: string; title?: string; subject?: string }[];
  };

  const contentList = getContentList();
  const canSubmit =
    config.recipientName.trim() &&
    config.recipientEmail.trim() &&
    !sendMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) sendMutation.mutate();
  };

  // The recipient owns a stable dye, signalled as a quiet dot beside their name.
  const recipientKey = config.recipientEmail.trim() || config.recipientName.trim();
  const recipientDye = recipientKey ? dyeVar(dyeForId(recipientKey)) : 'var(--warm)';

  const topbar = {
    left: <Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>,
    center: 'gift a memory',
  };

  if (sendMutation.isSuccess) {
    return (
      <ClothShell topbarLeft={topbar.left} topbarCenter={topbar.center}>
        <div
          style={{
            padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
            maxWidth: 'var(--page-max-focus)',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <WaxSeal size={44} />
          <div style={{ ...eyebrow, color: 'var(--warm)', letterSpacing: '0.26em', margin: '28px 0 16px' }}>
            sent · a gift for {config.recipientName}
          </div>
          <h1
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: 0,
            }}
          >
            A piece of the cloth is on its way.
          </h1>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              color: 'var(--bone-faint)',
              margin: '20px auto 0',
              letterSpacing: '0.06em',
              lineHeight: 1.7,
              maxWidth: '34em',
            }}
          >
            {config.recipientName} can accept it without an account, or weave it into a thread of their own.
          </p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: 44 }}>
            <button
              type="button"
              onClick={() => {
                setConfig({
                  recipientName: '',
                  recipientEmail: '',
                  personalMessage: '',
                  memoryType: 'memory',
                  memoryId: '',
                  memoryTitle: '',
                  unlockDate: '',
                });
                sendMutation.reset();
              }}
              style={{
                background: 'transparent',
                border: 0,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              send another
            </button>
            <span aria-hidden style={{ color: 'var(--rule-strong)', fontSize: 10 }}>·</span>
            <button
              type="button"
              onClick={() => navigate('/loom/weft')}
              style={{
                background: 'transparent',
                border: 0,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              back to thread →
            </button>
          </div>
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={topbar.left} topbarCenter={topbar.center}>
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-focus)',
          margin: '0 auto',
        }}
      >
        <div style={{ ...eyebrow, marginBottom: 18 }}>gift a memory</div>
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 'clamp(34px, 7vw, 58px)',
            fontWeight: 380,
            lineHeight: 1.04,
            letterSpacing: '-0.012em',
            color: 'var(--bone)',
            margin: 0,
            maxWidth: '14em',
            fontVariationSettings: '"opsz" 40',
          }}
        >
          Give a thread that outlives you.
        </h1>
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--bone-dim)',
            margin: '20px 0 0',
            maxWidth: '30em',
          }}
        >
          Craft a piece of the cloth for a cherished person.
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 56 }}>
          {/* Personal note — the body of the gift, set as serif prose */}
          <div style={{ marginBottom: 40 }}>
            <label className="hl-mono" htmlFor="gift-personal-message" style={fieldLabel}>
              the message
            </label>
            <textarea
              id="gift-personal-message"
              value={config.personalMessage}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, personalMessage: e.target.value }))
              }
              placeholder="a few words to carry it…"
              style={bodyInput}
            />
          </div>

          {/* Entry selection — only rendered when content exists */}
          {contentList.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <p className="hl-mono" style={fieldLabel}>
                the piece you're giving
              </p>

              {/* Memory type switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  flexWrap: 'wrap',
                  borderBottom: '1px solid var(--rule)',
                  marginBottom: 16,
                }}
              >
                {(['memory', 'letter', 'voice'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, memoryType: t, memoryId: '', memoryTitle: '' }))}
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderBottom: config.memoryType === t ? '1px solid var(--warm)' : '1px solid transparent',
                      marginBottom: -1,
                      padding: '6px 16px 8px',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: config.memoryType === t ? 'var(--warm)' : 'var(--bone-faint)',
                      cursor: 'pointer',
                      transition: `color 180ms ${EASE}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {contentList.map((item) => {
                  const selected = config.memoryId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          memoryId: item.id,
                          memoryTitle: item.title || item.subject || 'Untitled',
                        }))
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 12,
                        width: '100%',
                        textAlign: 'left',
                        padding: '13px 0',
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--rule)',
                        cursor: 'pointer',
                        fontFamily: 'var(--serif)',
                        fontSize: 17,
                        color: selected ? 'var(--warm)' : 'var(--bone-dim)',
                        transition: `color 180ms ${EASE}`,
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>{item.title || item.subject || 'Untitled'}</span>
                      {selected && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)', flex: '0 0 auto' }}>
                          chosen
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recipient — a quiet mono control: dye dot + name + email */}
          <div style={{ marginBottom: 40 }}>
            <label className="hl-mono" htmlFor="gift-recipient-name" style={fieldLabel}>
              for whom
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <WarmDot color={recipientDye} size={6} filled={!!recipientKey} />
              <input
                id="gift-recipient-name"
                type="text"
                value={config.recipientName}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, recipientName: e.target.value }))
                }
                placeholder="their name"
                autoComplete="off"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid var(--rule)',
                  borderRadius: 0,
                  outline: 'none',
                  fontFamily: 'var(--serif)',
                  fontSize: 20,
                  color: recipientKey ? recipientDye : 'var(--bone)',
                  caretColor: 'var(--warm)',
                  padding: '8px 0',
                  boxSizing: 'border-box',
                  transition: `color 180ms ${EASE}`,
                }}
              />
            </div>
            <input
              id="gift-recipient-email"
              type="email"
              value={config.recipientEmail}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))
              }
              placeholder="their@email.com"
              autoComplete="off"
              aria-label="recipient's email"
              style={{ ...lineInput, fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.04em' }}
            />
          </div>

          {/* Bottom action bar: primary verb pill + date pill + status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
              marginTop: 8,
              paddingTop: 28,
              borderTop: '1px solid var(--rule)',
            }}
          >
            {/* Primary verb — mono warm pill */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: 'transparent',
                border: '1px solid var(--warm)',
                borderRadius: 999,
                padding: '11px 26px',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                opacity: canSubmit ? 1 : 0.4,
                cursor: canSubmit ? 'pointer' : 'default',
                transition: `opacity 180ms ${EASE}`,
              }}
            >
              {sendMutation.isPending ? 'gifting…' : 'gift →'}
            </button>

            {/* Date pill — open after (optional) */}
            <label
              htmlFor="gift-unlock-date"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: '1px solid var(--rule)',
                borderRadius: 999,
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: config.unlockDate ? 'var(--bone-dim)' : 'var(--bone-faint)',
                cursor: 'pointer',
              }}
            >
              {config.unlockDate ? 'opens' : 'open after'}
              <input
                id="gift-unlock-date"
                type="date"
                value={config.unlockDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, unlockDate: e.target.value }))
                }
                aria-label="open after (optional)"
                style={{
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  color: 'var(--bone-dim)',
                  colorScheme: 'dark',
                  padding: 0,
                }}
              />
            </label>

            {/* Inline status — never a toast, never red */}
            {sendMutation.isError && (
              <span
                role="alert"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                }}
              >
                couldn't send — try again
              </span>
            )}
          </div>

          <p
            className="hl-mono"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--bone-faint)',
              marginTop: 14,
              letterSpacing: '0.06em',
            }}
          >
            leave the date empty to deliver immediately.
          </p>
        </form>

        {/* Success inline — shown if mutation succeeded but we haven't branched yet (guard) */}
        {sendMutation.isSuccess && (
          <p
            className="hl-mono"
            style={{
              marginTop: 28,
              fontSize: 13,
              color: 'var(--warm)',
              letterSpacing: '0.04em',
            }}
          >
            Gift sent to {config.recipientName}.
          </p>
        )}
      </div>
    </ClothShell>
  );
}

export default GiftAMemory;
