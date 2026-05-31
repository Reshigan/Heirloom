import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { giftsApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

type GiftStep = 'select-type' | 'select-content' | 'recipient' | 'confirm';

interface GiftConfig {
  memoryType: 'memory' | 'voice' | 'letter';
  memoryId: string;
  memoryTitle: string;
  recipientEmail: string;
  recipientName: string;
  personalMessage: string;
  unlockDate: string;
}

export function GiftAMemory() {
  const navigate = useNavigate();
  const [step, setStep] = useState<GiftStep>('select-type');
  const [config, setConfig] = useState<GiftConfig>({
    memoryType: 'memory',
    memoryId: '',
    memoryTitle: '',
    recipientEmail: '',
    recipientName: '',
    personalMessage: '',
    unlockDate: '',
  });

  const { data: memories } = useQuery({
    queryKey: ['gift-memories'],
    queryFn: () => memoriesApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'memory',
  });

  const { data: letters } = useQuery({
    queryKey: ['gift-letters'],
    queryFn: () => lettersApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'letter',
  });

  const { data: voices } = useQuery({
    queryKey: ['gift-voices'],
    queryFn: () => voiceApi.getAll({ limit: 50 }).then((r) => r.data),
    enabled: config.memoryType === 'voice',
  });

  const sendMutation = useMutation({
    mutationFn: () => giftsApi.send({
      memory_type: config.memoryType,
      memory_id: config.memoryId,
      recipient_email: config.recipientEmail,
      recipient_name: config.recipientName,
      personal_message: config.personalMessage,
      unlock_date: config.unlockDate || undefined,
    }),
    onSuccess: () => setStep('confirm' as GiftStep),
  });

  const typeOptions = [
    { id: 'memory' as const, label: 'a photograph', desc: 'a single image from your thread, passed to someone who matters.' },
    { id: 'voice' as const, label: 'a voice recording', desc: 'the sound of your voice, preserved and given.' },
    { id: 'letter' as const, label: 'a written letter', desc: 'words from your thread, sealed and sent.' },
  ];

  const getContentList = () => {
    if (config.memoryType === 'memory') {
      const list = Array.isArray(memories) ? memories : memories?.data || memories?.memories || [];
      return list;
    }
    if (config.memoryType === 'letter') {
      const list = Array.isArray(letters) ? letters : letters?.data || letters?.letters || [];
      return list;
    }
    if (config.memoryType === 'voice') {
      const list = Array.isArray(voices) ? voices : voices?.data || voices?.recordings || [];
      return list;
    }
    return [];
  };

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>give a thread</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Gift a place on the thread.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
        >
          Send something from your thread to someone you love, or invite them to begin their own.
        </p>
      </header>

      <hr className="loom-hairline" style={{ marginBottom: 40 }} />

      {sendMutation.isSuccess ? (
        <div style={{ maxWidth: 480, paddingTop: 24 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 20 }}>sent</p>
          <h2
            className="loom-h2"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 16px' }}
          >
            Gift sent.
          </h2>
          <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 16, margin: '0 0 8px' }}>
            {config.recipientName} will receive a link to their gift.
          </p>
          <p className="loom-body" style={{ color: 'var(--loom-bone-faint)', fontSize: 14, margin: '0 0 40px' }}>
            They can accept it without an account, or weave it into a thread of their own.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setConfig({ memoryType: 'memory', memoryId: '', memoryTitle: '', recipientEmail: '', recipientName: '', personalMessage: '', unlockDate: '' });
                setStep('select-type');
                sendMutation.reset();
              }}
              className="loom-btn-ghost"
            >
              send another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="loom-btn"
            >
              back to thread
            </button>
          </div>
        </div>
      ) : (
        <>
          {step === 'select-type' && (
            <div style={{ maxWidth: 520 }}>
              <p className="loom-body" style={{ color: 'var(--loom-bone-faint)', fontSize: 14, marginBottom: 28 }}>
                what would you like to give?
              </p>
              <div style={{ display: 'grid', gap: 1 }}>
                {typeOptions.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, memoryType: id }));
                      setStep('select-content');
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '20px 0',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      cursor: 'pointer',
                      transition: 'color 180ms var(--loom-ease)',
                    }}
                  >
                    <p
                      className="loom-body"
                      style={{ color: 'var(--loom-bone)', fontSize: 18, fontStyle: 'italic', margin: '0 0 4px' }}
                    >
                      {label}
                    </p>
                    <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 13, margin: 0 }}>
                      {desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'select-content' && (
            <div style={{ maxWidth: 520 }}>
              <p className="loom-body" style={{ color: 'var(--loom-bone-faint)', fontSize: 14, marginBottom: 28 }}>
                choose the {config.memoryType} to gift
              </p>
              <div style={{ display: 'grid', gap: 1, maxHeight: 380, overflowY: 'auto', marginBottom: 28 }}>
                {getContentList().map((item: { id: string; title?: string; subject?: string }) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        memoryId: item.id,
                        memoryTitle: item.title || item.subject || 'Untitled',
                      }));
                      setStep('recipient');
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 0',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--loom-rule)',
                      cursor: 'pointer',
                      color: config.memoryId === item.id ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                      transition: 'color 180ms var(--loom-ease)',
                    }}
                  >
                    <span className="loom-body" style={{ fontSize: 15 }}>
                      {item.title || item.subject || 'Untitled'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep('select-type')}
                className="loom-mono"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--loom-bone-faint)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                back
              </button>
            </div>
          )}

          {step === 'recipient' && (
            <div style={{ maxWidth: 480 }}>
              <p className="loom-body" style={{ color: 'var(--loom-bone-faint)', fontSize: 14, marginBottom: 32 }}>
                who should receive this gift?
              </p>
              <div style={{ display: 'grid', gap: 28 }}>
                <div>
                  <label
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
                  >
                    recipient's name
                  </label>
                  <input
                    type="text"
                    value={config.recipientName}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="their name"
                  />
                </div>
                <div>
                  <label
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
                  >
                    recipient's email
                  </label>
                  <input
                    type="email"
                    value={config.recipientEmail}
                    onChange={(e) => setConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="their@email.com"
                  />
                </div>
                <div>
                  <label
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
                  >
                    a note (optional)
                  </label>
                  <textarea
                    value={config.personalMessage}
                    onChange={(e) => setConfig((prev) => ({ ...prev, personalMessage: e.target.value }))}
                    placeholder="a few words…"
                    style={{ resize: 'vertical', minHeight: 88 }}
                  />
                </div>
                <div>
                  <label
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
                  >
                    open after (optional)
                  </label>
                  <input
                    type="date"
                    value={config.unlockDate}
                    onChange={(e) => setConfig((prev) => ({ ...prev, unlockDate: e.target.value }))}
                  />
                  <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 6 }}>
                    leave empty to deliver immediately
                  </p>
                </div>

                {sendMutation.isError && (
                  <p
                    role="alert"
                    className="loom-body"
                    style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}
                  >
                    Failed to send. Please try again.
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                  <button
                    onClick={() => setStep('select-content')}
                    className="loom-mono"
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: 'var(--loom-bone-faint)',
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    back
                  </button>
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={!config.recipientEmail || !config.recipientName || sendMutation.isPending}
                    className="loom-btn"
                    style={{ opacity: (!config.recipientEmail || !config.recipientName || sendMutation.isPending) ? 0.5 : 1 }}
                  >
                    {sendMutation.isPending ? 'sending…' : 'send gift'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppFrame>
  );
}

export default GiftAMemory;
