import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { memorialsApi } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

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
  border: '1px solid var(--rule)',
  borderRadius: 2,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
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

  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => memorialsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorials'] });
      setShowCreateModal(false);
      setFormError(null);
      setFormData({ name: '', description: '', style: 'classic', isPublic: true, birthDate: '', deathDate: '', location: '', epitaph: '' });
    },
    onError: (e: any) => setFormError(e?.response?.data?.error ?? 'creation failed'),
  });

  const downloadQR = (memorial: any) => {
    const memorialUrl = `${window.location.origin}/m/${memorial.qr_code}`;
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(memorialUrl)}`;
    link.download = `memorial-${memorial.memorial_name}-qr.png`;
    link.click();
  };

  const shareMemorial = (memorial: any) => {
    const url = `${window.location.origin}/m/${memorial.qr_code}`;
    if (navigator.share) {
      navigator.share({
        title: `${memorial.memorial_name}'s Memorial`,
        text: `Visit the memorial page for ${memorial.memorial_name}`,
        url,
      });
    } else {
      copyToClipboard(url).catch(() => {});
    }
  };

  const memorialList: any[] = memorials || [];

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'memorials' }]} />} topbarCenter="memorials" topbarRight={<UserMenu />}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(16px, 4vw, 32px)', paddingBottom: 80 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 64 }}>
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: 300,
              letterSpacing: '-0.018em',
              margin: 0,
              marginBottom: 40,
              lineHeight: 1.15,
            }}
          >
            In memory of.
          </h1>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="hl-btn"
            style={{ flexShrink: 0, marginTop: 6 }}
          >
            create memorial
          </button>
        </div>

        {/* Memorial list */}
        {isLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ color: 'var(--bone-faint)', fontSize: 16 }}
          >
            Loading…
          </p>
        ) : memorialList.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 64px' }}>
            {memorialList.map((memorial: any) => (
              <li
                key={memorial.id}
                style={{
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 28,
                  marginBottom: 40,
                }}
              >
                <article>
                  {/* Name */}
                  <h3
                    className="hl-serif"
                    style={{
                      fontSize: 24,
                      fontWeight: 400,
                      color: 'var(--bone)',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {memorial.memorial_name}
                  </h3>

                  {/* Dates */}
                  {(memorial.birth_date || memorial.death_date) && (
                    <p
                      className="hl-mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--bone-faint)',
                        marginTop: 6,
                        marginBottom: 0,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {memorial.birth_date
                        ? new Date(memorial.birth_date).getFullYear()
                        : '?'}
                      {' – '}
                      {memorial.death_date
                        ? new Date(memorial.death_date).getFullYear()
                        : '?'}
                      {memorial.location && (
                        <span style={{ marginLeft: 20 }}>{memorial.location}</span>
                      )}
                      <span style={{ marginLeft: 20 }}>{memorial.view_count || 0} visits</span>
                    </p>
                  )}

                  {/* Tribute / notes */}
                  {memorial.memorial_description && (
                    <p
                      className="hl-prose"
                      style={{
                        fontSize: 16,
                        marginTop: 16,
                        marginBottom: 0,
                        color: 'var(--bone-dim)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {memorial.memorial_description}
                    </p>
                  )}

                  {/* Dye swatch */}
                  <div
                    style={{
                      width: 32,
                      height: 3,
                      background: 'var(--dye-iron)',
                      marginTop: 12,
                    }}
                    aria-hidden
                  />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                    <button
                      type="button"
                                            onClick={() => setSelectedMemorial(memorial)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--warm)',
                      }}
                    >
                      view →
                    </button>
                    <button
                      type="button"
                                            onClick={() => downloadQR(memorial)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-faint)',
                      }}
                    >
                      download QR
                    </button>
                    <button
                      type="button"
                                            onClick={() => shareMemorial(memorial)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-faint)',
                      }}
                    >
                      share
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          /* Empty state */
          <p
            className="hl-serif hl-italic"
            style={{
              fontSize: 18,
              fontWeight: 300,
              color: 'var(--bone-faint)',
              margin: '0 0 48px',
            }}
          >
            No memorials yet.
          </p>
        )}

        {/* How it works */}
        <section style={{ borderTop: '1px solid var(--rule)', paddingTop: 40 }}>
          <p className="hl-eyebrow" style={{ marginBottom: 32 }}>How QR memorials work</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 32 }}>
            {[
              { n: '01', h: 'Create the page.', b: 'Add name, dates, a biography, and an epitaph.' },
              { n: '02', h: 'Receive a QR code.', b: 'Download a weather-resistant code for physical placement.' },
              { n: '03', h: 'Place it anywhere.', b: 'Gravestone, photo frame, keepsake, or anywhere meaningful.' },
              { n: '04', h: 'Memories continue.', b: 'Visitors scan and enter. The thread of memory keeps going.' },
            ].map(({ n, h, b }) => (
              <div key={n}>
                <p className="hl-mono" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.06em', margin: '0 0 8px' }}>{n}</p>
                <h3 className="hl-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)', margin: '0 0 6px' }}>{h}</h3>
                <p className="hl-prose" style={{ fontSize: 14, color: 'var(--bone-faint)', margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create overlay */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, overflowY: 'auto',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: 40,
              maxWidth: 520,
              width: '100%',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="hl-eyebrow" style={{ marginBottom: 20 }}>Create a memorial</p>

            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <label style={labelStyle} htmlFor="mem-name">
                  Name <span style={{ color: 'var(--danger)' }} aria-hidden>*</span>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 16 }}>
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
                      type="button"
                                            key={style.id}
                      onClick={() => setFormData({ ...formData, style: style.id })}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${formData.style === style.id ? 'var(--warm)' : 'var(--rule)'}`,
                        borderRadius: 0,
                        color: formData.style === style.id ? 'var(--warm)' : 'var(--bone-faint)',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
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
                  style={{ width: 14, height: 14, accentColor: 'var(--warm)' }}
                />
                <label
                  htmlFor="mem-public"
                  className="hl-prose"
                  style={{ fontSize: 14, color: 'var(--bone-dim)', cursor: 'pointer' }}
                >
                  Allow anyone with the QR code to view this memorial
                </label>
              </div>

              {formError && (
                <p
                  className="hl-mono"
                  style={{ fontSize: 11, color: 'var(--danger)', margin: 0, letterSpacing: '0.06em' }}
                >
                  {formError}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  type="button"
                                    onClick={() => { setShowCreateModal(false); setFormError(null); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--rule)',
                    borderRadius: 0,
                    color: 'var(--bone-dim)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  cancel
                </button>
                <button
                  type="button"
                                    onClick={() => {
                    if (formData.birthDate && formData.deathDate && new Date(formData.deathDate) < new Date(formData.birthDate)) {
                      setFormError('Death date cannot be before birth date.');
                      return;
                    }
                    setFormError(null);
                    createMutation.mutate();
                  }}
                  disabled={!formData.name.trim() || createMutation.isPending}
                  className="hl-btn"
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
            background: 'rgba(14,14,12,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setSelectedMemorial(null)}
        >
          <div
            style={{
              background: 'var(--ink)',
              border: '1px solid var(--rule)',
              padding: 40,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* QR */}
            <div style={{ background: '#fff', padding: 10, display: 'inline-block', marginBottom: 24 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/m/${selectedMemorial.qr_code}`)}`}
                alt="QR Code"
                style={{ display: 'block', width: 128, height: 128 }}
              />
            </div>

            {/* Name */}
            <h3
              className="hl-serif"
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: 'var(--bone)',
                margin: '0 0 6px',
                lineHeight: 1.2,
              }}
            >
              {selectedMemorial.memorial_name}
            </h3>

            {/* Dates */}
            {(selectedMemorial.birth_date || selectedMemorial.death_date) && (
              <p
                className="hl-mono"
                style={{
                  fontSize: 11,
                  color: 'var(--bone-faint)',
                  margin: '6px 0 0',
                  letterSpacing: '0.04em',
                }}
              >
                {selectedMemorial.birth_date
                  ? new Date(selectedMemorial.birth_date).getFullYear()
                  : '?'}
                {' – '}
                {selectedMemorial.death_date
                  ? new Date(selectedMemorial.death_date).getFullYear()
                  : '?'}
              </p>
            )}

            {/* Dye swatch */}
            <div
              style={{
                width: 32,
                height: 3,
                background: 'var(--dye-iron)',
                marginTop: 12,
                marginBottom: 0,
              }}
              aria-hidden
            />

            {/* Description */}
            {selectedMemorial.memorial_description && (
              <p
                className="hl-prose"
                style={{
                  fontSize: 15,
                  color: 'var(--bone-dim)',
                  margin: '16px 0 0',
                  lineHeight: 1.7,
                }}
              >
                {selectedMemorial.memorial_description}
              </p>
            )}

            {/* Epitaph */}
            {selectedMemorial.epitaph && (
              <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 16, marginTop: 16 }}>
                <p
                  className="hl-prose hl-italic"
                  style={{ fontSize: 15, color: 'var(--bone)', margin: 0 }}
                >
                  "{selectedMemorial.epitaph}"
                </p>
              </div>
            )}

            {/* Meta */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
              {selectedMemorial.location && (
                <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
                  {selectedMemorial.location}
                </span>
              )}
              <span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
                {selectedMemorial.view_count || 0} visits
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                type="button"
                                onClick={() => downloadQR(selectedMemorial)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  borderRadius: 0,
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                download QR
              </button>
              <button
                type="button"
                                onClick={() => shareMemorial(selectedMemorial)}
                className="hl-btn"
                style={{ flex: 1 }}
              >
                share
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <a
                href={`${window.location.origin}/m/${selectedMemorial.qr_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hl-link warm"
                style={{ fontSize: 10 }}
              >
                view public page →
              </a>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}
