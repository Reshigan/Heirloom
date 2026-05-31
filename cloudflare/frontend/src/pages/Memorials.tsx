import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { memorialsApi } from '../services/api';

// Design styles kept for API compatibility; not displayed as a visual style chooser
const designStyles = [
  { id: 'classic', name: 'Classic' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'modern', name: 'Modern' },
  { id: 'floral', name: 'Floral' },
  { id: 'religious', name: 'Religious' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  marginBottom: 10,
};

export function Memorials() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMemorial, setSelectedMemorial] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    style: 'classic',
    isPublic: true,
    birthDate: '',
    deathDate: '',
    location: '',
    epitaph: '',
  });

  const { data: memorials, isLoading } = useQuery({
    queryKey: ['memorials'],
    queryFn: () => memorialsApi.getAll().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => memorialsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorials'] });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', style: 'classic', isPublic: true, birthDate: '', deathDate: '', location: '', epitaph: '' });
    },
  });

  const downloadQR = (memorial: any) => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://hlm.blue/m/${memorial.qr_code}`;
    link.download = `memorial-${memorial.memorial_name}-qr.png`;
    link.click();
  };

  const shareMemorial = (memorial: any) => {
    const url = `https://hlm.blue/m/${memorial.qr_code}`;
    if (navigator.share) {
      navigator.share({
        title: `${memorial.memorial_name}'s Memorial`,
        text: `Visit the memorial page for ${memorial.memorial_name}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const memorialList: any[] = memorials || [];

  return (
    <AppFrame>
      <header style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>In memoriam</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            A place in the thread.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
          >
            Memorial pages carry a QR code that can be placed anywhere — a gravestone, a frame, a keepsake.
            Those who scan it enter the memory.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="loom-btn"
          style={{ flexShrink: 0, marginTop: 8 }}
        >
          create memorial
        </button>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : memorialList.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 48px' }}>
          {memorialList.map((memorial: any) => (
            <li
              key={memorial.id}
              style={{ padding: '28px 0', borderBottom: '1px solid var(--loom-rule)' }}
            >
              <article style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 32, alignItems: 'start' }}>
                <div>
                  <h3
                    className="loom-serif"
                    style={{ fontSize: 22, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1.2 }}
                  >
                    <span style={{ color: 'var(--loom-warm)', marginRight: 10 }}>∞</span>
                    {memorial.memorial_name}
                  </h3>
                  {memorial.family_member_name && (
                    <p className="loom-body" style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                      {memorial.family_member_name}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: memorial.memorial_description ? 10 : 0 }}>
                    {memorial.birth_date && memorial.death_date && (
                      <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}>
                        {new Date(memorial.birth_date).getFullYear()} – {new Date(memorial.death_date).getFullYear()}
                      </p>
                    )}
                    {memorial.location && (
                      <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                        {memorial.location}
                      </p>
                    )}
                    <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                      {memorial.view_count || 0} visits
                    </p>
                  </div>
                  {memorial.memorial_description && (
                    <p
                      className="loom-body"
                      style={{
                        fontSize: 15,
                        color: 'var(--loom-bone-dim)',
                        margin: '8px 0 0',
                        lineHeight: 1.7,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {memorial.memorial_description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                    <button
                      onClick={() => setSelectedMemorial(memorial)}
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
                    >
                      view →
                    </button>
                    <button
                      onClick={() => downloadQR(memorial)}
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                    >
                      download QR
                    </button>
                    <button
                      onClick={() => shareMemorial(memorial)}
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                    >
                      share
                    </button>
                  </div>
                </div>
                {/* QR preview */}
                <div style={{ background: '#fff', padding: 6, flexShrink: 0 }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://hlm.blue/m/${memorial.qr_code}`}
                    alt="QR Code"
                    style={{ display: 'block', width: '100%' }}
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center', marginBottom: 48 }}>
          <p className="loom-mono" style={{ fontSize: 22, color: 'var(--loom-warm)', marginBottom: 16 }}>∞</p>
          <h2 className="loom-serif" style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 10px' }}>
            No memorials yet.
          </h2>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
            A memorial is a page in the thread for someone no longer here. It carries a QR code you can
            place anywhere to bring their memory forward.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="loom-btn">
            create the first
          </button>
        </div>
      )}

      {/* How it works */}
      <section style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 32 }}>How QR memorials work</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
          {[
            { n: '01', h: 'Create the page.', b: 'Add name, dates, a biography, and an epitaph.' },
            { n: '02', h: 'Receive a QR code.', b: 'Download a weather-resistant code for physical placement.' },
            { n: '03', h: 'Place it anywhere.', b: 'Gravestone, photo frame, keepsake, or anywhere meaningful.' },
            { n: '04', h: 'Memories continue.', b: 'Visitors scan and enter. The thread of memory keeps going.' },
          ].map(({ n, h, b }) => (
            <div key={n}>
              <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.06em', margin: '0 0 8px' }}>{n}</p>
              <h3 className="loom-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}>{h}</h3>
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.7 }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Create overlay */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, overflowY: 'auto',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 520,
              width: '100%',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 20 }}>Create a memorial</p>

            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={labelStyle} htmlFor="mem-name">
                  Name <span style={{ color: '#c25a5a' }} aria-hidden>*</span>
                </label>
                <input
                  id="mem-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="In loving memory of…"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="mem-desc">Biography</label>
                <textarea
                  id="mem-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief life in their own thread…"
                  rows={3}
                  style={fieldStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle} htmlFor="mem-born">Birth date</label>
                  <input
                    id="mem-born"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="mem-died">Date of passing</label>
                  <input
                    id="mem-died"
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    style={fieldStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle} htmlFor="mem-loc">Resting place</label>
                <input
                  id="mem-loc"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Resting place or hometown"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="mem-epitaph">Epitaph</label>
                <textarea
                  id="mem-epitaph"
                  value={formData.epitaph}
                  onChange={(e) => setFormData({ ...formData, epitaph: e.target.value })}
                  placeholder="A meaningful line to carry them forward…"
                  rows={2}
                  style={fieldStyle}
                />
              </div>

              {/* Style selector — minimal, for API value only */}
              <div>
                <label style={labelStyle}>Page style</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {designStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setFormData({ ...formData, style: style.id })}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${formData.style === style.id ? 'var(--loom-warm)' : 'var(--loom-rule)'}`,
                        borderRadius: 0,
                        color: formData.style === style.id ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        padding: '7px 12px',
                        cursor: 'pointer',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="mem-public"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  style={{ width: 14, height: 14, accentColor: 'var(--loom-warm)' }}
                />
                <label
                  htmlFor="mem-public"
                  className="loom-body"
                  style={{ fontSize: 14, color: 'var(--loom-bone-dim)', cursor: 'pointer' }}
                >
                  Allow anyone with the QR code to view this memorial
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button onClick={() => setShowCreateModal(false)} className="loom-btn-ghost" style={{ flex: 1 }}>
                  cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.name.trim() || createMutation.isPending}
                  className="loom-btn"
                  style={{ flex: 1 }}
                >
                  {createMutation.isPending ? 'creating…' : 'create memorial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View memorial overlay */}
      {selectedMemorial && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setSelectedMemorial(null)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* QR */}
            <div style={{ background: '#fff', padding: 10, display: 'inline-block', marginBottom: 20 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hlm.blue/m/${selectedMemorial.qr_code}`}
                alt="QR Code"
                style={{ display: 'block', width: 128, height: 128 }}
              />
            </div>

            <p className="loom-mono" style={{ fontSize: 18, color: 'var(--loom-warm)', margin: '0 0 6px' }}>∞</p>
            <h3
              className="loom-serif"
              style={{ fontSize: 24, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}
            >
              {selectedMemorial.memorial_name}
            </h3>

            {selectedMemorial.birth_date && selectedMemorial.death_date && (
              <p className="loom-mono" style={{ fontSize: 12, color: 'var(--loom-bone-dim)', margin: '0 0 12px', letterSpacing: '0.04em' }}>
                {new Date(selectedMemorial.birth_date).getFullYear()} – {new Date(selectedMemorial.death_date).getFullYear()}
              </p>
            )}

            {selectedMemorial.memorial_description && (
              <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 0 16px', lineHeight: 1.7 }}>
                {selectedMemorial.memorial_description}
              </p>
            )}

            {selectedMemorial.epitaph && (
              <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 16, marginBottom: 16, textAlign: 'left' }}>
                <p className="loom-body" style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--loom-bone)', margin: 0 }}>
                  "{selectedMemorial.epitaph}"
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              {selectedMemorial.location && (
                <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                  {selectedMemorial.location}
                </span>
              )}
              <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                {selectedMemorial.view_count || 0} visits
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => downloadQR(selectedMemorial)} className="loom-btn-ghost" style={{ flex: 1 }}>
                download QR
              </button>
              <button onClick={() => shareMemorial(selectedMemorial)} className="loom-btn" style={{ flex: 1 }}>
                share
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <a
                href={`https://hlm.blue/m/${selectedMemorial.qr_code}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--loom-warm)',
                  textDecoration: 'none',
                }}
              >
                view public page →
              </a>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
