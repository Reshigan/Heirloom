import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '../services/api';
import { ProgressHair } from '../components/ui/ProgressHair';

/* ── Inline status (replaces alert) ──────────────────────────────── */
type StatusTone = 'ok' | 'err';
function useInlineStatus() {
  const [state, setState] = useState<{ msg: string; tone: StatusTone; key: number } | null>(null);
  return {
    state,
    ok: (msg: string) => setState({ msg, tone: 'ok', key: Date.now() }),
    err: (msg: string) => setState({ msg, tone: 'err', key: Date.now() }),
    clear: () => setState(null),
  };
}
type InlineStatusApi = ReturnType<typeof useInlineStatus>;

function InlineStatus({ status }: { status: InlineStatusApi }) {
  useEffect(() => {
    if (!status.state) return;
    const t = setTimeout(() => status.clear(), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.state?.key]);
  if (!status.state) return null;
  const warm = status.state.tone === 'ok';
  return (
    <div
      role="status"
      style={{
        marginBottom: 20, padding: '8px 14px',
        background: 'var(--ink)',
        border: `1px solid ${warm ? 'var(--rule-warm)' : 'rgba(194,90,90,0.35)'}`,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.04em',
        color: warm ? 'var(--warm)' : '#c25a5a',
      }}
    >
      {status.state.msg}
    </div>
  );
}

const SEGMENTS = ['GENEALOGY', 'GRIEF', 'PARENTING', 'TECH', 'ESTATE_PLANNING', 'PODCAST', 'OTHER'];
const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'EMAIL', 'ALL'];
const INFLUENCER_STATUSES = ['NEW', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'PARTNERED', 'DECLINED', 'UNSUBSCRIBED'];

const INFLUENCER_TEMPLATES: Record<string, { subject: string; body: string }> = {
  GENEALOGY: {
    subject: "Partnership Opportunity: Help Families Preserve Their Stories",
    body: `<p>Hi [Name],</p>
<p>I came across your work in the genealogy space and was genuinely impressed by how you help families connect with their roots.</p>
<p>I'm reaching out from Heirloom, a platform that helps people preserve their life stories, voice recordings, and letters for future generations. We're on a mission to ensure no family story is ever lost.</p>
<p>Given your audience's passion for family history, I thought there might be a natural fit for collaboration. We'd love to offer your community exclusive early access or a special partnership.</p>
<p>Would you be open to a quick chat about how we might work together?</p>
<p>Warm regards,<br>The Heirloom Team</p>`
  },
  GRIEF: {
    subject: "A Tool to Help Families Through Loss",
    body: `<p>Hi [Name],</p>
<p>Your work supporting people through grief has touched many lives, and I wanted to reach out with something that might resonate with your community.</p>
<p>Heirloom is a platform that helps people preserve their voice, stories, and letters for loved ones—creating a lasting presence that families can hold onto.</p>
<p>Many of our users are people who want to leave something meaningful behind, or families who wish they had more recordings of loved ones who've passed.</p>
<p>I'd love to explore how we might partner to bring this resource to people who could benefit from it.</p>
<p>With care,<br>The Heirloom Team</p>`
  },
  PARENTING: {
    subject: "Capture Your Family's Story Before It's Too Late",
    body: `<p>Hi [Name],</p>
<p>As a parent myself, I know how quickly time flies. One day they're taking their first steps, the next they're asking about grandparents they never met.</p>
<p>That's why I wanted to introduce you to Heirloom—a platform that helps families preserve voice recordings, stories, and letters for future generations.</p>
<p>Imagine your kids being able to hear your voice, your stories, your advice—even decades from now. That's what we're building.</p>
<p>I think your community would love this. Would you be interested in trying it out or exploring a partnership?</p>
<p>Best,<br>The Heirloom Team</p>`
  },
  TECH: {
    subject: "Heirloom: Digital Legacy Preservation Built on Cloudflare",
    body: `<p>Hi [Name],</p>
<p>I've been following your content on African tech innovation and thought you might find Heirloom interesting.</p>
<p>We're building a digital legacy platform that helps people preserve their stories, voice recordings, and letters for future generations—all running on Cloudflare's edge infrastructure for global performance.</p>
<p>The tech stack includes Workers, D1, R2, and Workers AI for transcription and emotion analysis. We're particularly focused on making this accessible across Africa.</p>
<p>Would love to chat about the technical architecture or explore a partnership.</p>
<p>Cheers,<br>The Heirloom Team</p>`
  },
  ESTATE_PLANNING: {
    subject: "Beyond Wills: The Emotional Side of Estate Planning",
    body: `<p>Hi [Name],</p>
<p>Your expertise in estate planning helps families prepare for the practical side of legacy. I wanted to introduce you to something that addresses the emotional side.</p>
<p>Heirloom is a platform that helps people preserve their voice, stories, and personal letters for loved ones—the things that can't be captured in a will but matter just as much.</p>
<p>Many estate planners are recommending Heirloom alongside traditional planning as a way to leave a complete legacy.</p>
<p>I'd love to explore how we might work together to serve your clients better.</p>
<p>Best regards,<br>The Heirloom Team</p>`
  },
  PODCAST: {
    subject: "Guest Pitch: The Future of Digital Legacy",
    body: `<p>Hi [Name],</p>
<p>I've been enjoying your podcast and thought your audience might be interested in a conversation about digital legacy and preserving family stories.</p>
<p>I'm from Heirloom, a platform that helps people record their life stories, voice messages, and letters for future generations. We've got some fascinating stories about why people are doing this and the technology behind it.</p>
<p>Topics we could cover: the psychology of legacy, AI in memory preservation, the "Dead Man's Switch" feature, or stories from users.</p>
<p>Would you be open to having us on?</p>
<p>Thanks,<br>The Heirloom Team</p>`
  },
};

/* ── Loom input / select style ─────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--rule)',
  color: 'var(--bone)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  letterSpacing: '0.04em',
  padding: '8px 12px',
  outline: 'none',
  borderRadius: 0,
  width: '100%',
  transition: 'border-color 180ms var(--loom-ease)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: 'var(--bone-faint)',
  marginBottom: 6,
};

export function MarketingTab() {
  const queryClient = useQueryClient();
  const status = useInlineStatus();
  const [activeSubTab, setActiveSubTab] = useState<'influencers' | 'campaigns' | 'content' | 'signups'>('influencers');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: influencers, isLoading: loadingInfluencers } = useQuery({
    queryKey: ['marketing-influencers', selectedSegment, selectedStatus],
    queryFn: () => marketingApi.getInfluencers({
      segment: selectedSegment || undefined,
      status: selectedStatus || undefined
    }).then(r => r.data),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: () => marketingApi.getCampaigns().then(r => r.data),
    enabled: activeSubTab === 'campaigns',
  });

  const { data: creatorSignups } = useQuery({
    queryKey: ['marketing-creator-signups'],
    queryFn: () => marketingApi.getCreatorSignups().then(r => r.data),
    enabled: activeSubTab === 'signups',
  });

  const { data: content } = useQuery({
    queryKey: ['marketing-content'],
    queryFn: () => marketingApi.getContent().then(r => r.data),
    enabled: activeSubTab === 'content',
  });

  const importMutation = useMutation({
    mutationFn: (influencers: any[]) => marketingApi.importInfluencers(influencers),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
      status.ok(`imported ${data.data.imported} threads · skipped ${data.data.skipped}`);
      setShowImportModal(false);
    },
    onError: (error: any) => status.err(`import failed: ${error.response?.data?.error || error.message}`),
  });

  const approveSignupMutation = useMutation({
    mutationFn: (id: string) => marketingApi.approveCreatorSignup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-creator-signups'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
    },
  });

  const subTabs = [
    { id: 'influencers', label: 'Influencers' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'content', label: 'Content Library' },
    { id: 'signups', label: 'Creator Signups' },
  ];

  return (
    <div style={{ color: 'var(--bone)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 10 }}>Marketing</p>
          <h2 className="loom-h2" style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}>
            Outreach & campaigns.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => setShowImportModal(true)}>
            Import CSV
          </button>
          <button className="loom-btn-ghost" style={{ fontSize: 11 }} onClick={() => setShowInfluencerModal(true)}>
            Add Thread
          </button>
          <button className="loom-btn" style={{ fontSize: 11 }} onClick={() => setShowCampaignModal(true)}>
            New Campaign
          </button>
        </div>
      </div>

      <InlineStatus status={status} />

      {/* Sub-tab nav */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 28 }}>
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSubTab(id as any)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === id ? '1px solid var(--warm)' : '1px solid transparent',
              marginBottom: -1,
              padding: '8px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: activeSubTab === id ? 'var(--warm)' : 'var(--bone-faint)',
              cursor: 'pointer',
              transition: 'color 180ms var(--loom-ease)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Influencers tab */}
      {activeSubTab === 'influencers' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              style={{ ...inputStyle, width: 180 }}
            >
              <option value="">All Segments</option>
              {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ ...inputStyle, width: 180 }}
            >
              <option value="">All Statuses</option>
              {INFLUENCER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
              {influencers?.influencers?.length || 0} threads
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                  {['Name', 'Email', 'Platform', 'Segment', 'Status', 'Last Contact'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingInfluencers ? (
                  <tr><td colSpan={6} style={{ padding: '32px 16px' }}><ProgressHair label="Loading…" /></td></tr>
                ) : influencers?.influencers?.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--bone-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>No threads yet. Import or add some.</td></tr>
                ) : (
                  influencers?.influencers?.map((inf: any) => (
                    <tr key={inf.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: 'var(--bone)', fontSize: 14 }}>{inf.name}</div>
                        {inf.handle && <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>@{inf.handle}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--bone-dim)', fontSize: 13 }}>{inf.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="loom-mono" style={{ fontSize: 10, padding: '3px 7px', border: '1px solid var(--rule)', color: 'var(--bone-dim)' }}>
                          {inf.platform}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="loom-mono" style={{ fontSize: 10, padding: '3px 7px', border: '1px solid var(--rule)', color: 'var(--bone-dim)' }}>
                          {inf.segment}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={inf.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
                          {inf.last_contacted_at ? new Date(inf.last_contacted_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns tab */}
      {activeSubTab === 'campaigns' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                {['Campaign', 'Type', 'Status', 'Sent', 'Opens', 'Created'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns?.campaigns?.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--bone-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>No campaigns yet.</td></tr>
              ) : (
                campaigns?.campaigns?.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: 'var(--bone)', fontSize: 14 }}>{c.name}</div>
                      <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{c.subject_line}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="loom-mono" style={{ fontSize: 10, padding: '3px 7px', border: '1px solid var(--rule-warm)', color: 'var(--warm)' }}>
                        {c.campaign_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="loom-mono" style={{ fontSize: 13, color: 'var(--bone)' }}>{c.sent_count || 0}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="loom-mono" style={{ fontSize: 13, color: 'var(--bone)' }}>{c.open_count || 0}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creator Signups tab */}
      {activeSubTab === 'signups' && (
        <div>
          <p className="loom-body" style={{ fontSize: 14, color: 'var(--bone-dim)', marginBottom: 20 }}>
            Creators who signed up through the public form. Approve to add to the thread database.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                  {['Name', 'Email', 'Platform', 'Why Interested', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: h === '' ? 'right' : 'left', padding: '8px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creatorSignups?.signups?.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--bone-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>No signups yet.</td></tr>
                ) : (
                  creatorSignups?.signups?.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--bone)', fontSize: 14 }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--bone-dim)', fontSize: 13 }}>{s.email}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--bone-dim)', fontSize: 13 }}>{s.platform || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--bone-faint)', fontSize: 13, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.why_interested || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={s.status} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {s.status === 'NEW' && (
                          <button
                            onClick={() => approveSignupMutation.mutate(s.id)}
                            disabled={approveSignupMutation.isPending}
                            className="loom-btn"
                            style={{ fontSize: 10, padding: '4px 12px' }}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Library tab */}
      {activeSubTab === 'content' && (
        <div>
          <p className="loom-body" style={{ fontSize: 14, color: 'var(--bone-dim)', marginBottom: 24 }}>
            Marketing content, captions, and templates.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1 }}>
            {content?.content?.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 16px', color: 'var(--bone-faint)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>No content yet.</div>
            ) : (
              content?.content?.map((c: any) => (
                <div key={c.id} style={{ border: '1px solid var(--rule)', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ color: 'var(--bone)', fontSize: 14 }}>{c.title}</div>
                    <span className="loom-mono" style={{ fontSize: 10, padding: '3px 7px', border: '1px solid var(--rule)', color: 'var(--bone-faint)', flexShrink: 0, marginLeft: 8 }}>
                      {c.platform}
                    </span>
                  </div>
                  <p style={{ color: 'var(--bone-dim)', fontSize: 13, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.caption || c.body}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
                    <StatusBadge status={c.status} />
                    {c.theme && <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{c.theme}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportInfluencersModal
          onClose={() => setShowImportModal(false)}
          onImport={(data) => importMutation.mutate(data)}
          isLoading={importMutation.isPending}
        />
      )}

      {showCampaignModal && (
        <CreateCampaignModal
          onClose={() => setShowCampaignModal(false)}
          influencers={influencers?.influencers || []}
        />
      )}

      {showInfluencerModal && (
        <AddInfluencerModal onClose={() => setShowInfluencerModal(false)} />
      )}
    </div>
  );
}

/* ── StatusBadge ─────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const WARM = { border: '1px solid var(--rule-warm)', color: 'var(--warm)' };
  const FAINT = { border: '1px solid var(--rule)', color: 'var(--bone-faint)' };
  const ERR = { border: '1px solid rgba(194,90,90,0.35)', color: '#c25a5a' };

  const s: React.CSSProperties = (
    ['CONTACTED','RESPONDED','INTERESTED','PARTNERED','SENDING','COMPLETED','APPROVED','CONVERTED'].includes(status) ? WARM :
    ['DECLINED','UNSUBSCRIBED'].includes(status) ? ERR :
    FAINT
  );

  return (
    <span className="loom-mono" style={{ fontSize: 10, padding: '3px 7px', letterSpacing: '0.12em', ...s }}>
      {status}
    </span>
  );
}

/* ── Loom modal shell ────────────────────────────────────────────── */
function ModalShell({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,12,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'var(--ink)', border: '1px solid var(--rule)', width: '100%', maxWidth: wide ? 900 : 560, maxHeight: '90vh', overflowY: 'auto', padding: '36px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, borderBottom: '1px solid var(--rule)', paddingBottom: 20 }}>
          <h3 className="loom-h2" style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            className="loom-mono"
            style={{ background: 'none', border: 'none', color: 'var(--bone-faint)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', lineHeight: 1, padding: 4 }}
            aria-label="Close"
          >
            close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── ImportInfluencersModal ──────────────────────────────────────── */
function ImportInfluencersModal({ onClose, onImport, isLoading }: {
  onClose: () => void;
  onImport: (data: any[]) => void;
  isLoading: boolean;
}) {
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const parseCSV = () => {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => {
        if (h === 'name') obj.name = values[i];
        if (h === 'email') obj.email = values[i];
        if (h === 'platform') obj.platform = values[i]?.toUpperCase();
        if (h === 'handle') obj.handle = values[i];
        if (h === 'segment') obj.segment = values[i]?.toUpperCase();
        if (h === 'followers' || h === 'follower_count') obj.followerCount = parseInt(values[i]) || null;
        if (h === 'profile_url' || h === 'url') obj.profileUrl = values[i];
        if (h === 'notes') obj.notes = values[i];
      });
      return obj;
    }).filter(d => d.name && d.email);

    setPreviewData(data);
  };

  return (
    <ModalShell title="Import from CSV." onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>
            CSV format: name, email, platform, handle, segment, followers, profile_url, notes
          </label>
          <textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={"name,email,platform,handle,segment,followers,profile_url,notes\nYour Name,contact@example.com,INSTAGRAM,yourusername,GENEALOGY,50000,https://instagram.com/yourusername,Family history enthusiast"}
            style={{ ...inputStyle, height: 160, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
          />
        </div>

        <button onClick={parseCSV} className="loom-btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 11 }}>
          Preview Import
        </button>

        {previewData.length > 0 && (
          <div>
            <span className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', display: 'block', marginBottom: 8 }}>
              {previewData.length} records ready to import
            </span>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--rule)', padding: '8px 0' }}>
              {previewData.slice(0, 10).map((d, i) => (
                <div key={i} className="loom-mono" style={{ fontSize: 11, padding: '6px 12px', borderBottom: '1px solid var(--rule)', color: 'var(--bone-dim)' }}>
                  {d.name} — {d.email} ({d.platform}, {d.segment})
                </div>
              ))}
              {previewData.length > 10 && (
                <div className="loom-mono" style={{ fontSize: 11, padding: '6px 12px', color: 'var(--bone-faint)' }}>
                  …and {previewData.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
          <button onClick={onClose} className="loom-btn-ghost" style={{ fontSize: 11 }}>Cancel</button>
          <button
            onClick={() => onImport(previewData)}
            disabled={previewData.length === 0 || isLoading}
            className="loom-btn"
            style={{ fontSize: 11, opacity: (previewData.length === 0 || isLoading) ? 0.4 : 1 }}
          >
            {isLoading ? 'Importing…' : `Import ${previewData.length} threads`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── CreateCampaignModal ─────────────────────────────────────────── */
function CreateCampaignModal({ onClose, influencers }: { onClose: () => void; influencers: any[] }) {
  const queryClient = useQueryClient();
  const status = useInlineStatus();
  const [step, setStep] = useState<'setup' | 'compose' | 'review'>('setup');
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'INFLUENCER_OUTREACH',
    subjectLine: '',
    targetSegment: '',
    selectedInfluencers: [] as string[],
    bodyHtml: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const campaign = await marketingApi.createCampaign({
        name: formData.name,
        campaignType: formData.campaignType,
        subjectLine: formData.subjectLine,
        targetSegment: formData.targetSegment || undefined,
      });
      return campaign.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return marketingApi.sendCampaign(campaignId, {
        segment: formData.targetSegment || undefined,
        influencerIds: formData.selectedInfluencers.length > 0 ? formData.selectedInfluencers : undefined,
        bodyHtml: formData.bodyHtml,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      status.ok(`campaign sent · ${data.data.sentCount} sent · ${data.data.failedCount} failed`);
      onClose();
    },
    onError: (error: any) => {
      status.err(`failed to send: ${error.response?.data?.error || error.message}`);
    },
  });

  const applyTemplate = (segment: string) => {
    const template = INFLUENCER_TEMPLATES[segment];
    if (template) {
      setFormData(prev => ({ ...prev, subjectLine: template.subject, bodyHtml: template.body }));
    }
  };

  const handleSend = async () => {
    const campaign = await createMutation.mutateAsync();
    await sendMutation.mutateAsync(campaign.id);
  };

  const filteredInfluencers = formData.targetSegment
    ? influencers.filter(i => i.segment === formData.targetSegment)
    : influencers;

  const STEPS = ['setup', 'compose', 'review'];

  return (
    <ModalShell title="New campaign." onClose={onClose} wide>
      <InlineStatus status={status} />
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="loom-mono" style={{
              fontSize: 10,
              width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${step === s ? 'var(--warm)' : 'var(--rule)'}`,
              color: step === s ? 'var(--warm)' : 'var(--bone-faint)',
            }}>{i + 1}</span>
            <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: step === s ? 'var(--bone)' : 'var(--bone-faint)' }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {step === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Genealogy Influencer Outreach — Dec 2025"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Target Segment (optional)</label>
            <select
              value={formData.targetSegment}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, targetSegment: e.target.value }));
                if (e.target.value) applyTemplate(e.target.value);
              }}
              style={inputStyle}
            >
              <option value="">All Segments</option>
              {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div style={{ border: '1px solid var(--rule)', padding: '14px 16px' }}>
            <div className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', marginBottom: 6 }}>
              {formData.targetSegment
                ? `${filteredInfluencers.length} threads in ${formData.targetSegment} segment`
                : `${influencers.length} total threads`}
            </div>
            <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>
              Only threads with status NEW, CONTACTED, RESPONDED, or INTERESTED receive emails. Unsubscribed and declined are excluded.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <button
              onClick={() => setStep('compose')}
              disabled={!formData.name}
              className="loom-btn"
              style={{ fontSize: 11, opacity: !formData.name ? 0.4 : 1 }}
            >
              Compose email
            </button>
          </div>
        </div>
      )}

      {step === 'compose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>Subject Line</label>
            <input
              type="text"
              value={formData.subjectLine}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectLine: e.target.value }))}
              placeholder="e.g., Partnership Opportunity: Help Families Preserve Their Stories"
              style={inputStyle}
            />
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', display: 'block', marginTop: 4 }}>Use [Name] to personalise.</span>
          </div>

          <div>
            <label style={labelStyle}>Email Body (HTML)</label>
            <textarea
              value={formData.bodyHtml}
              onChange={(e) => setFormData(prev => ({ ...prev, bodyHtml: e.target.value }))}
              placeholder="<p>Hi [Name],</p><p>Your email content here…</p>"
              style={{ ...inputStyle, height: 240, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            />
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', display: 'block', marginTop: 4 }}>Unsubscribe link added automatically.</span>
          </div>

          {formData.targetSegment && INFLUENCER_TEMPLATES[formData.targetSegment] && (
            <button
              onClick={() => applyTemplate(formData.targetSegment)}
              className="loom-btn-ghost"
              style={{ alignSelf: 'flex-start', fontSize: 11 }}
            >
              Reset to {formData.targetSegment} template
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <button onClick={() => setStep('setup')} className="loom-btn-ghost" style={{ fontSize: 11 }}>Back</button>
            <button
              onClick={() => setStep('review')}
              disabled={!formData.subjectLine || !formData.bodyHtml}
              className="loom-btn"
              style={{ fontSize: 11, opacity: (!formData.subjectLine || !formData.bodyHtml) ? 0.4 : 1 }}
            >
              Review & Send
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ border: '1px solid var(--rule)', padding: '16px' }}>
            {[
              ['Campaign', formData.name],
              ['Segment', formData.targetSegment || 'All'],
              ['Recipients', `${filteredInfluencers.filter(i => !['UNSUBSCRIBED', 'DECLINED'].includes(i.status)).length} threads`],
              ['Subject', formData.subjectLine],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', minWidth: 96 }}>{k}</span>
                <span style={{ color: 'var(--bone)', fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Email HTML preview — white surface intentional */}
          <div style={{ padding: '16px', background: '#fff', border: '1px solid var(--rule)' }}>
            <div style={{ color: '#000', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: formData.bodyHtml }} />
          </div>

          <div style={{ border: '1px solid var(--rule-warm)', padding: '14px 16px' }}>
            <div className="loom-mono" style={{ fontSize: 11, color: 'var(--warm)', marginBottom: 6 }}>Ready to send?</div>
            <p style={{ color: 'var(--bone-dim)', fontSize: 13 }}>
              This will send emails to all eligible threads immediately. Emails include an unsubscribe link for compliance.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
            <button onClick={() => setStep('compose')} className="loom-btn-ghost" style={{ fontSize: 11 }}>Back</button>
            <button
              onClick={handleSend}
              disabled={createMutation.isPending || sendMutation.isPending}
              className="loom-btn"
              style={{ fontSize: 11, opacity: (createMutation.isPending || sendMutation.isPending) ? 0.6 : 1 }}
            >
              {createMutation.isPending || sendMutation.isPending ? 'Sending…' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

/* ── AddInfluencerModal ──────────────────────────────────────────── */
function AddInfluencerModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const status = useInlineStatus();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    platform: 'INSTAGRAM',
    handle: '',
    profileUrl: '',
    followerCount: '',
    segment: 'OTHER',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: () => marketingApi.createInfluencer({
      ...formData,
      followerCount: formData.followerCount ? parseInt(formData.followerCount) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-influencers'] });
      onClose();
    },
    onError: (error: any) => {
      status.err(`failed to add: ${error.response?.data?.error || error.message}`);
    },
  });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <ModalShell title="Add thread." onClose={onClose}>
      <InlineStatus status={status} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Name *">
            <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Email *">
            <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Platform">
            <select value={formData.platform} onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))} style={inputStyle}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Segment">
            <select value={formData.segment} onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))} style={inputStyle}>
              {SEGMENTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Handle">
            <input type="text" value={formData.handle} onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))} placeholder="@username" style={inputStyle} />
          </Field>
          <Field label="Followers">
            <input type="number" value={formData.followerCount} onChange={(e) => setFormData(prev => ({ ...prev, followerCount: e.target.value }))} style={inputStyle} />
          </Field>
        </div>

        <Field label="Profile URL">
          <input type="url" value={formData.profileUrl} onChange={(e) => setFormData(prev => ({ ...prev, profileUrl: e.target.value }))} style={inputStyle} />
        </Field>

        <Field label="Notes">
          <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--rule)', paddingTop: 20 }}>
          <button onClick={onClose} className="loom-btn-ghost" style={{ fontSize: 11 }}>Cancel</button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!formData.name || !formData.email || createMutation.isPending}
            className="loom-btn"
            style={{ fontSize: 11, opacity: (!formData.name || !formData.email || createMutation.isPending) ? 0.4 : 1 }}
          >
            {createMutation.isPending ? 'Adding…' : 'Add Thread'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default MarketingTab;
