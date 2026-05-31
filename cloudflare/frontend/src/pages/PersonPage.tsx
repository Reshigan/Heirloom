import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { familyApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { ProgressHair } from '../components/ui/ProgressHair';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  notes?: string;
  recentMemories: any[];
  recentLetters: any[];
  recentVoiceRecordings: any[];
}

interface PersonPrompt {
  id: string;
  prompt: string;
  category: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--loom-bone)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showWhyNote, setShowWhyNote] = useState(false);
  const [whyNote, setWhyNote] = useState('');
  const [whyNoteSaved, setWhyNoteSaved] = useState(false);

  const { data: member, isLoading } = useQuery<FamilyMember>({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: prompts, isLoading: promptsLoading, refetch: refetchPrompts } = useQuery<{ prompts: PersonPrompt[] }>({
    queryKey: ['person-prompts', id],
    queryFn: () => api.get(`/api/ai/person-prompts/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  const saveWhyNoteMutation = useMutation({
    mutationFn: (note: string) => familyApi.update(id!, { notes: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      setWhyNoteSaved(true);
      setTimeout(() => { setShowWhyNote(false); setWhyNoteSaved(false); }, 1500);
    },
  });

  const totalContent = (member?.recentLetters?.length || 0) +
    (member?.recentMemories?.length || 0) +
    (member?.recentVoiceRecordings?.length || 0);

  const playVoice = (recording: any) => {
    if (playingVoiceId === recording.id) {
      audioElement?.pause();
      setPlayingVoiceId(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(recording.fileUrl);
      audio.onended = () => { setPlayingVoiceId(null); setAudioElement(null); };
      audio.play();
      setPlayingVoiceId(recording.id);
      setAudioElement(audio);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppFrame>
        <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
          <ProgressHair label="loading…" width={200} />
        </div>
      </AppFrame>
    );
  }

  if (!member) {
    return (
      <AppFrame>
        <div style={{ border: '1px solid var(--loom-rule)', padding: '64px 32px', textAlign: 'center' }}>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 20px', fontStyle: 'italic' }}>
            Person not found.
          </p>
          <Link to="/family" className="loom-btn-ghost" style={{ textDecoration: 'none' }}>
            Back to Family
          </Link>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/family')}
        style={{
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-bone-faint)',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        ← Family
      </button>

      {/* Person header */}
      <header style={{ marginBottom: 48 }}>
        {/* Avatar — 0px radius, hairline frame, no shadow */}
        {member.avatarUrl && (
          <div
            style={{
              width: 80,
              height: 80,
              border: '1px solid var(--loom-rule)',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <img
              src={member.avatarUrl}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>{member.relationship}</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          What you've left for {member.name}.
        </h1>

        {/* Why note */}
        <div style={{ marginTop: 20 }}>
          {member.notes ? (
            <button
              type="button"
              onClick={() => { setWhyNote(member.notes || ''); setShowWhyNote(true); }}
              style={{
                background: 'transparent',
                border: '1px solid var(--loom-rule)',
                padding: '10px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-rule-warm)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
            >
              <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', fontStyle: 'italic' }}>
                "{member.notes}"
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowWhyNote(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--loom-rule)',
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-rule-warm)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
            >
              <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)' }}>
                Add a note: "Why I'm doing this for {member.name}"
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          marginBottom: 48,
          border: '1px solid var(--loom-rule)',
        }}
      >
        {[
          { count: member.recentLetters?.length || 0, label: 'Letters' },
          { count: member.recentMemories?.length || 0, label: 'Memories' },
          { count: member.recentVoiceRecordings?.length || 0, label: 'Voice' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: '24px 0',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--loom-rule)' : 'none',
            }}
          >
            <p
              className="loom-serif"
              style={{ fontSize: 28, fontWeight: 300, color: i === 0 ? 'var(--loom-warm)' : 'var(--loom-bone)', margin: '0 0 4px' }}
            >
              {stat.count}
            </p>
            <p className="loom-eyebrow">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Suggested Prompts */}
      <section style={{ border: '1px solid var(--loom-rule)', padding: '28px 32px', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 6 }}>Next message for {member.name}</p>
            <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: 0 }}>
              Suggested prompts for {member.relationship.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetchPrompts()}
            disabled={promptsLoading}
            style={{
              background: 'transparent',
              border: '1px solid var(--loom-rule)',
              borderRadius: 1,
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              opacity: promptsLoading ? 0.45 : 1,
              transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            Refresh
          </button>
        </div>

        {promptsLoading ? (
          <div style={{ padding: '24px 0' }}>
            <ProgressHair label="loading…" width={160} />
          </div>
        ) : prompts?.prompts?.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
            {prompts.prompts.slice(0, 3).map((prompt) => (
              <li key={prompt.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/record?prompt=${encodeURIComponent(prompt.prompt)}&for=${id}`)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '1px solid var(--loom-rule)',
                    padding: '14px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 16,
                  }}
                >
                  <span className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', fontStyle: 'italic' }}>
                    "{prompt.prompt}"
                  </span>
                  <span style={{ color: 'var(--loom-bone-faint)', flexShrink: 0 }}>→</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', fontStyle: 'italic', margin: '0 0 20px' }}>
            No prompts available. Click refresh to generate some.
          </p>
        )}

        <Link
          to={`/record?for=${id}`}
          className="loom-btn"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Record a message for {member.name}
        </Link>
      </section>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 48 }}>
        <Link
          to={`/compose?for=${id}`}
          style={{
            display: 'block',
            border: '1px solid var(--loom-rule)',
            padding: '24px 28px',
            textDecoration: 'none',
            transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-rule-warm)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
        >
          <p className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}>
            Write a letter
          </p>
          <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: 0 }}>
            Express your feelings in words.
          </p>
        </Link>
        <Link
          to={`/memories?for=${id}`}
          style={{
            display: 'block',
            border: '1px solid var(--loom-rule)',
            borderLeft: 'none',
            padding: '24px 28px',
            textDecoration: 'none',
            transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-rule-warm)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
        >
          <p className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}>
            Add a memory
          </p>
          <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: 0 }}>
            Share a photo or moment.
          </p>
        </Link>
      </div>

      {/* Recent content */}
      {totalContent > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
            <span className="loom-eyebrow">What {member.name} will receive</span>
            <hr className="loom-hairline" style={{ flex: 1 }} />
          </div>

          {/* Letters */}
          {member.recentLetters?.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Letters</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {member.recentLetters.map((letter: any) => (
                  <li key={letter.id}>
                    <Link
                      to={`/letters/${letter.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 16,
                        padding: '16px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                        textDecoration: 'none',
                      }}
                    >
                      <div>
                        <p className="loom-serif" style={{ fontSize: 17, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                          {letter.title || 'Untitled Letter'}
                        </p>
                        <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0, letterSpacing: '0.06em' }}>
                          {new Date(letter.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ color: 'var(--loom-bone-faint)', flexShrink: 0 }}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Voice recordings */}
          {member.recentVoiceRecordings?.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Voice recordings</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {member.recentVoiceRecordings.map((recording: any) => (
                  <li
                    key={recording.id}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '16px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button
                        type="button"
                        onClick={() => playVoice(recording)}
                        aria-label={playingVoiceId === recording.id ? 'Pause' : 'Play'}
                        style={{
                          width: 32,
                          height: 32,
                          background: 'transparent',
                          border: '1px solid var(--loom-rule)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--loom-warm)',
                          fontSize: 11,
                          flexShrink: 0,
                        }}
                      >
                        {playingVoiceId === recording.id ? '❚❚' : '▶'}
                      </button>
                      <div>
                        <p className="loom-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                          {recording.title}
                        </p>
                        <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0, letterSpacing: '0.06em' }}>
                          {formatDuration(recording.duration)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Memories */}
          {member.recentMemories?.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Memories</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 4 }}>
                {member.recentMemories.map((memory: any) => (
                  <Link
                    key={memory.id}
                    to={`/memories/${memory.id}`}
                    style={{
                      display: 'block',
                      aspectRatio: '1',
                      overflow: 'hidden',
                      border: '1px solid var(--loom-rule)',
                      position: 'relative',
                      textDecoration: 'none',
                    }}
                  >
                    {memory.fileUrl ? (
                      <img
                        src={memory.fileUrl}
                        alt={memory.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span className="loom-mono" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--loom-bone-faint)' }}>
                          Memory
                        </span>
                      </div>
                    )}
                    {/* Hover caption */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '8px 10px',
                        background: 'linear-gradient(to top, rgba(14,14,12,0.8), transparent)',
                        opacity: 0,
                        transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                      className="memory-caption"
                    >
                      <p style={{ fontSize: 12, color: 'var(--loom-bone)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {memory.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {totalContent === 0 && (
        <div style={{ border: '1px solid var(--loom-rule)', padding: '64px 32px', textAlign: 'center' }}>
          <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 12px' }}>
            Start creating for {member.name}.
          </h3>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 auto 28px', maxWidth: 420 }}>
            You haven't created any content yet. Use the prompts above or record your first message.
          </p>
          <Link to={`/record?for=${id}`} className="loom-btn" style={{ textDecoration: 'none' }}>
            Record your first message
          </Link>
        </div>
      )}

      {/* Why Note overlay */}
      {showWhyNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(14,14,12,0.82)',
            padding: 24,
          }}
          onClick={() => setShowWhyNote(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--loom-ink)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: '0 0 8px' }}>
              Why I'm doing this
            </h3>
            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 20px' }}>
              A personal note to remind yourself why you're creating this legacy for {member.name}.
            </p>

            <textarea
              value={whyNote}
              onChange={(e) => setWhyNote(e.target.value)}
              placeholder={`e.g., "I want ${member.name} to know how much they mean to me…"`}
              maxLength={500}
              rows={5}
              style={{ ...inputStyle, resize: 'none', marginBottom: 20 }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setShowWhyNote(false)} className="loom-btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveWhyNoteMutation.mutate(whyNote)}
                disabled={saveWhyNoteMutation.isPending || whyNoteSaved}
                className="loom-btn"
                style={{ flex: 1, opacity: saveWhyNoteMutation.isPending || whyNoteSaved ? 0.65 : 1 }}
              >
                {whyNoteSaved ? 'Saved' : saveWhyNoteMutation.isPending ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
