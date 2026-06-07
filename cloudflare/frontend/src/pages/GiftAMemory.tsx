import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
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

const inputBase: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  borderRadius: 0,
  fontFamily: 'var(--serif)',
  fontSize: 17,
  color: 'var(--bone)',
  padding: '10px 0',
  outline: 'none',
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

  const topbar = {
    left: <Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>,
    center: 'gift a memory',
  };

  if (sendMutation.isSuccess) {
    return (
      <ClothShell topbarLeft={topbar.left} topbarCenter={topbar.center}>
        <div
          style={{
            padding: '64px 32px 80px',
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          <p
            className="hl-eyebrow"
            style={{ marginBottom: 24 }}
          >
            sent
          </p>
          <h2
            className="hl-serif"
            style={{
              fontSize: 36,
              fontWeight: 300,
              margin: '0 0 20px',
              color: 'var(--bone)',
            }}
          >
            Piece of the cloth sent.
          </h2>
          <p
            className="hl-serif"
            style={{
              fontSize: 16,
              color: 'var(--bone-dim)',
              margin: '0 0 8px',
              lineHeight: 1.6,
            }}
          >
            {config.recipientName} will receive a link.
          </p>
          <p
            className="hl-mono"
            style={{
              fontSize: 12,
              color: 'var(--bone-faint)',
              margin: '0 0 48px',
              letterSpacing: '0.04em',
            }}
          >
            They can accept it without an account, or weave it into a thread of their own.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <span style={{ color: 'var(--rule-strong)', fontSize: 10 }}>·</span>
            <button
              type="button"
              onClick={() => navigate('/loom/weft')}
              className="hl-btn"
            >
              back to thread
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
          padding: '64px 32px 80px',
          maxWidth: 560,
          margin: '0 auto',
        }}
      >
        {/* H1 */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 36,
            fontWeight: 300,
            margin: '0 0 28px',
            color: 'var(--bone)',
            lineHeight: 1.2,
          }}
        >
          Send a piece of the cloth.
        </h1>

        <hr
          className="hl-rule"
          style={{ marginBottom: 36 }}
        />

        <form onSubmit={handleSubmit} noValidate>
          {/* Recipient name */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-eyebrow"
              htmlFor="gift-recipient-name"
              style={{ display: 'block', marginBottom: 10 }}
            >
              recipient's name
            </label>
            <input
              id="gift-recipient-name"
              type="text"
              value={config.recipientName}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="their name"
              autoComplete="off"
              style={inputBase}
            />
          </div>

          {/* Recipient email */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-eyebrow"
              htmlFor="gift-recipient-email"
              style={{ display: 'block', marginBottom: 10 }}
            >
              recipient's email
            </label>
            <input
              id="gift-recipient-email"
              type="email"
              value={config.recipientEmail}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))
              }
              placeholder="their@email.com"
              autoComplete="off"
              style={inputBase}
            />
          </div>

          {/* Personal note */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="hl-eyebrow"
              htmlFor="gift-personal-message"
              style={{ display: 'block', marginBottom: 10 }}
            >
              personal note
            </label>
            <textarea
              id="gift-personal-message"
              value={config.personalMessage}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, personalMessage: e.target.value }))
              }
              placeholder="a few words…"
              style={{
                ...inputBase,
                minHeight: 120,
                resize: 'none',
                lineHeight: 1.6,
                paddingTop: 10,
              }}
            />
          </div>

          {/* Entry selection — only rendered when content exists */}
          {contentList.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p
                className="hl-eyebrow"
                style={{ marginBottom: 10 }}
              >
                choose entry to gift
              </p>

              {/* Memory type switcher */}
              <div
                style={{
                  display: 'flex',
                  gap: 0,
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
                      transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* List */}
              <div
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {contentList.map((item) => (
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
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 0',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      cursor: 'pointer',
                      fontFamily: 'var(--serif)',
                      fontSize: 15,
                      color:
                        config.memoryId === item.id
                          ? 'var(--warm)'
                          : 'var(--bone-dim)',
                      transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {item.title || item.subject || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unlock date (optional) */}
          <div style={{ marginBottom: 36 }}>
            <label
              className="hl-eyebrow"
              htmlFor="gift-unlock-date"
              style={{ display: 'block', marginBottom: 10 }}
            >
              open after (optional)
            </label>
            <input
              id="gift-unlock-date"
              type="date"
              value={config.unlockDate}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, unlockDate: e.target.value }))
              }
              style={inputBase}
            />
            <p
              className="hl-mono"
              style={{
                fontSize: 10,
                color: 'var(--bone-faint)',
                marginTop: 6,
                letterSpacing: '0.04em',
              }}
            >
              leave empty to deliver immediately
            </p>
          </div>

          {/* Error state */}
          {sendMutation.isError && (
            <p
              role="alert"
              className="hl-serif"
              style={{
                fontStyle: 'italic',
                color: 'var(--danger)',
                fontSize: 14,
                margin: '0 0 20px',
              }}
            >
              Failed to send. Please try again.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="hl-btn"
            style={{
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {sendMutation.isPending ? 'sending…' : 'Send →'}
          </button>
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
