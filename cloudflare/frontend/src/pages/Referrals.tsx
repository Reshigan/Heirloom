import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { familyReferralsApi } from '../services/api';

export function Referrals() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => familyReferralsApi.getStats().then(r => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; relationship?: string }) =>
      familyReferralsApi.createInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRelationship('');
    },
  });

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(`https://heirloom.blue/signup?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const familyBranches = [
    { id: 'maternal', label: 'Maternal' },
    { id: 'paternal', label: 'Paternal' },
    { id: 'spouse', label: 'Spouse\'s family' },
    { id: 'children', label: 'Children' },
  ];

  // Storage/discount markers — plain text, no badge metaphor
  const inviteMarks = [
    { count: 5, reward: '+500 MB storage' },
    { count: 10, reward: '25% off renewal' },
    { count: 25, reward: '1 month free' },
    { count: 50, reward: '50% lifetime discount' },
  ];

  const accepted: number = referralData?.stats?.accepted || 0;
  const totalInvites: number = referralData?.stats?.totalInvites || 0;
  const bonusMB: number = referralData?.stats?.totalBonusMB || 0;

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

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Grow the bloodline</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Invite your bloodline.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          The thread is stronger with more weavers. Invite family members to join and contribute their threads.
        </p>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 48 }}>

          {/* Counts + invite */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
              <p className="loom-eyebrow">Invitations sent</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 32 }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
                  {[
                    { n: totalInvites, label: 'invites sent' },
                    { n: accepted, label: 'joined' },
                    { n: `+${bonusMB} MB`, label: 'storage earned' },
                  ].map(({ n, label }) => (
                    <div key={label}>
                      <p className="loom-mono" style={{ fontSize: 28, color: 'var(--loom-bone)', margin: '0 0 4px', lineHeight: 1 }}>
                        {n}
                      </p>
                      <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: 0 }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowInviteModal(true)} className="loom-btn">
                  invite a family member
                </button>
              </div>

              {/* Invite marks */}
              <div style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 32 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 16 }}>When they join</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {inviteMarks.map((mark) => {
                    const reached = accepted >= mark.count;
                    const progress = Math.min(100, (accepted / mark.count) * 100);
                    return (
                      <li
                        key={mark.count}
                        style={{ padding: '10px 0', borderBottom: '1px solid var(--loom-rule)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: reached ? 0 : 6 }}>
                          <p
                            className="loom-mono"
                            style={{ margin: 0, fontSize: 11, color: reached ? 'var(--loom-warm)' : 'var(--loom-bone-dim)', letterSpacing: '0.04em' }}
                          >
                            {reached ? '∞ ' : ''}{mark.reward}
                          </p>
                          <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                            {mark.count} members
                          </p>
                        </div>
                        {!reached && (
                          <div style={{ height: 1, background: 'var(--loom-rule)', position: 'relative', overflow: 'hidden' }}>
                            <div
                              style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: `${progress}%`,
                                background: 'var(--loom-warm)',
                                transition: 'width 360ms cubic-bezier(0.16,1,0.3,1)',
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

          {/* Family branches */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <p className="loom-eyebrow">Family branches</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: '1px solid var(--loom-rule)' }}>
              {familyBranches.map((branch) => {
                const branchReferrals: any[] = referralData?.referrals?.filter(
                  (r: any) => r.family_branch === branch.id
                ) || [];
                return (
                  <div
                    key={branch.id}
                    style={{ padding: '20px 18px', borderRight: '1px solid var(--loom-rule)' }}
                  >
                    <p className="loom-eyebrow" style={{ marginBottom: 8 }}>{branch.label}</p>
                    <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-dim)', margin: '0 0 14px' }}>
                      {branchReferrals.length} {branchReferrals.length === 1 ? 'member' : 'members'}
                    </p>
                    {branchReferrals.length > 0 ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {branchReferrals.slice(0, 3).map((ref: any) => (
                          <div key={ref.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span
                              className="loom-mono"
                              style={{ fontSize: 10, color: ref.status === 'accepted' ? 'var(--loom-warm)' : 'var(--loom-bone-faint)' }}
                            >
                              {ref.status === 'accepted' ? '∞' : '·'}
                            </span>
                            <span
                              className="loom-body"
                              style={{ fontSize: 13, color: 'var(--loom-bone-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {ref.referred_email}
                            </span>
                          </div>
                        ))}
                        {branchReferrals.length > 3 && (
                          <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                            +{branchReferrals.length - 3} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowInviteModal(true)}
                        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
                      >
                        invite →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* All invites */}
          {referralData?.referrals && referralData.referrals.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <p className="loom-eyebrow">All invites</p>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {referralData.referrals.map((ref: any) => (
                  <li
                    key={ref.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 80px 80px 80px',
                      gap: 20,
                      alignItems: 'baseline',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <p className="loom-body" style={{ margin: 0, fontSize: 15, color: 'var(--loom-bone)' }}>
                      {ref.referred_email}
                    </p>
                    <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}>
                      {ref.relationship || '—'}
                    </p>
                    <p
                      className="loom-mono"
                      style={{
                        margin: 0, fontSize: 10, letterSpacing: '0.06em',
                        color: ref.status === 'accepted' ? 'var(--loom-warm)' : ref.status === 'expired' ? '#c25a5a' : 'var(--loom-bone-faint)',
                      }}
                    >
                      {ref.status}
                    </p>
                    <button
                      onClick={() => copyInviteLink(ref.invite_code)}
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', color: 'var(--loom-warm)', textAlign: 'left' }}
                    >
                      copy link
                    </button>
                    <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                      {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Rewards earned */}
          {referralData?.rewards && referralData.rewards.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <p className="loom-eyebrow">Storage earned</p>
                <hr className="loom-hairline" style={{ flex: 1 }} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {referralData.rewards.map((reward: any) => (
                  <li
                    key={reward.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto',
                      gap: 24,
                      alignItems: 'baseline',
                      padding: '14px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <p className="loom-mono" style={{ margin: 0, fontSize: 12, color: 'var(--loom-warm)', letterSpacing: '0.04em' }}>
                      {reward.reward_value}
                    </p>
                    <p className="loom-body" style={{ margin: 0, fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                      {reward.milestone}
                    </p>
                    <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                      {new Date(reward.claimed_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Inline copy confirmation */}
      {copied && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--loom-ink-card)',
            border: '1px solid var(--loom-rule)',
            padding: '10px 20px',
            zIndex: 300,
          }}
          role="status"
        >
          <p className="loom-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '0.06em', color: 'var(--loom-bone-dim)' }}>
            Invite link copied.
          </p>
        </div>
      )}

      {/* Invite overlay */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 440,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Invite a family member</p>
            <h3
              className="loom-serif"
              style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 6px' }}
            >
              Extend the thread.
            </h3>
            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 28px', lineHeight: 1.6 }}>
              They receive a personal welcome. You earn additional storage when they join.
            </p>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="inv-email">Email address</label>
                <input
                  id="inv-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family@example.com"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="inv-rel">Relationship (optional)</label>
                <select
                  id="inv-rel"
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  style={{ ...fieldStyle, fontFamily: "'Inter', sans-serif", fontSize: 13 }}
                >
                  <option value="">Select…</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="aunt_uncle">Aunt / Uncle</option>
                  <option value="cousin">Cousin</option>
                  <option value="spouse">Spouse</option>
                  <option value="in_law">In-Law</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowInviteModal(false)} className="loom-btn-ghost" style={{ flex: 1 }}>
                  cancel
                </button>
                <button
                  onClick={() => inviteMutation.mutate({ email: inviteEmail, relationship: inviteRelationship })}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                  className="loom-btn"
                  style={{ flex: 1 }}
                >
                  {inviteMutation.isPending ? 'sending…' : 'send invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
