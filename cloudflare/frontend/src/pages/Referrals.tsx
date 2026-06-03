import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Frame } from '../loom/components/Frame';
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
    { id: 'spouse', label: "Spouse's family" },
    { id: 'children', label: 'Children' },
  ];

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

  return (
    <Frame left="referrals">
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: '64px 40px 80px',
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 52 }}>
          <h1
            className="hl-serif"
            style={{
              fontSize: 36,
              fontWeight: 300,
              color: 'var(--bone)',
              margin: '0 0 28px',
              lineHeight: 1.2,
            }}
          >
            Invite someone to begin their thread.
          </h1>
        </header>

        {isLoading ? (
          <div
            style={{
              height: 1,
              background: 'var(--rule)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: 320,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '40%',
                background: 'var(--warm)',
                animation: 'none',
                opacity: 0.6,
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 56 }}>

            {/* Referral link */}
            {referralData?.referralCode && (
              <section>
                <p
                  className="hl-eyebrow"
                  style={{ marginBottom: 12 }}
                >
                  Your invite link
                </p>
                <div
                  style={{
                    background: '#0a0a08',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 14,
                      color: 'var(--bone)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`https://heirloom.blue/signup?ref=${referralData.referralCode}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyInviteLink(referralData.referralCode)}
                    className="hl-link warm"
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    copy →
                  </button>
                </div>
                {copied && (
                  <p
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      color: 'var(--warm)',
                      margin: '8px 0 0',
                    }}
                    role="status"
                  >
                    Copied.
                  </p>
                )}
              </section>
            )}

            {/* Count stat */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 38,
                    fontWeight: 300,
                    color: 'var(--warm)',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {totalInvites}
                </p>
                <span
                  className="hl-mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.12em',
                    color: 'var(--bone-dim)',
                  }}
                >
                  people invited
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 40,
                }}
              >
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <p
                      className="hl-serif"
                      style={{
                        fontSize: 28,
                        fontWeight: 300,
                        color: 'var(--warm)',
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {accepted}
                    </p>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--bone-dim)' }}
                    >
                      joined
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <p
                      className="hl-serif"
                      style={{
                        fontSize: 28,
                        fontWeight: 300,
                        color: 'var(--warm)',
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      +{bonusMB}
                    </p>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--bone-dim)' }}
                    >
                      MB storage earned
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="hl-btn"
                    style={{ marginTop: 8, alignSelf: 'start' }}
                  >
                    invite a family member
                  </button>
                </div>

                {/* Invite milestones */}
                <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 32 }}>
                  <p className="hl-eyebrow" style={{ marginBottom: 14 }}>When they join</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {inviteMarks.map((mark) => {
                      const reached = accepted >= mark.count;
                      const progress = Math.min(100, (accepted / mark.count) * 100);
                      return (
                        <li
                          key={mark.count}
                          style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                              marginBottom: reached ? 0 : 6,
                            }}
                          >
                            <span
                              className="hl-mono"
                              style={{
                                fontSize: 11,
                                color: reached ? 'var(--warm)' : 'var(--bone-dim)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {reached ? '∞ ' : ''}{mark.reward}
                            </span>
                            <span
                              className="hl-mono"
                              style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                            >
                              {mark.count} members
                            </span>
                          </div>
                          {!reached && (
                            <div
                              style={{
                                height: 1,
                                background: 'var(--rule)',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${progress}%`,
                                  background: 'var(--warm)',
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
              <div
                style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}
              >
                <p className="hl-eyebrow">Family branches</p>
                <hr className="hl-rule" style={{ flex: 1, margin: 0 }} />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  border: '1px solid var(--rule)',
                }}
              >
                {familyBranches.map((branch, i) => {
                  const branchReferrals: any[] = referralData?.referrals?.filter(
                    (r: any) => r.family_branch === branch.id
                  ) || [];
                  return (
                    <div
                      key={branch.id}
                      style={{
                        padding: '20px 18px',
                        borderRight: i < familyBranches.length - 1
                          ? '1px solid var(--rule)'
                          : undefined,
                      }}
                    >
                      <p className="hl-eyebrow" style={{ marginBottom: 8 }}>{branch.label}</p>
                      <p
                        className="hl-mono"
                        style={{ fontSize: 11, color: 'var(--bone-dim)', margin: '0 0 14px' }}
                      >
                        {branchReferrals.length}{' '}
                        {branchReferrals.length === 1 ? 'member' : 'members'}
                      </p>
                      {branchReferrals.length > 0 ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {branchReferrals.slice(0, 3).map((ref: any) => (
                            <div
                              key={ref.id}
                              style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                            >
                              <span
                                className="hl-mono"
                                style={{
                                  fontSize: 10,
                                  color:
                                    ref.status === 'accepted'
                                      ? 'var(--warm)'
                                      : 'var(--bone-faint)',
                                }}
                              >
                                {ref.status === 'accepted' ? '∞' : '·'}
                              </span>
                              <span
                                className="hl-serif"
                                style={{
                                  fontSize: 13,
                                  color: 'var(--bone-dim)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {ref.referred_email}
                              </span>
                            </div>
                          ))}
                          {branchReferrals.length > 3 && (
                            <p
                              className="hl-mono"
                              style={{ margin: 0, fontSize: 10, color: 'var(--bone-faint)' }}
                            >
                              +{branchReferrals.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowInviteModal(true)}
                          className="hl-link warm"
                          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <p className="hl-eyebrow">All invites</p>
                  <hr className="hl-rule" style={{ flex: 1, margin: 0 }} />
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
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <span className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)' }}>
                        {ref.referred_email}
                      </span>
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--bone-faint)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {ref.relationship || '—'}
                      </span>
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          color:
                            ref.status === 'accepted'
                              ? 'var(--warm)'
                              : ref.status === 'expired'
                              ? 'var(--danger)'
                              : 'var(--bone-faint)',
                        }}
                      >
                        {ref.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyInviteLink(ref.invite_code)}
                        className="hl-link warm"
                        style={{
                          background: 'none',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        copy link
                      </button>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                      >
                        {new Date(ref.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Rewards earned */}
            {referralData?.rewards && referralData.rewards.length > 0 && (
              <section>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <p className="hl-eyebrow">Storage earned</p>
                  <hr className="hl-rule" style={{ flex: 1, margin: 0 }} />
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
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <span
                        className="hl-mono"
                        style={{
                          fontSize: 12,
                          color: 'var(--warm)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {reward.reward_value}
                      </span>
                      <span
                        className="hl-serif"
                        style={{ fontSize: 14, color: 'var(--bone-dim)' }}
                      >
                        {reward.milestone}
                      </span>
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)' }}
                      >
                        {new Date(reward.claimed_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </div>
        )}
      </div>

      {/* Invite overlay */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14,14,12,0.84)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: '#0e0e0c',
              border: '1px solid var(--rule)',
              padding: 40,
              maxWidth: 440,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="hl-eyebrow" style={{ marginBottom: 14 }}>Invite a family member</p>
            <h3
              className="hl-serif"
              style={{
                fontSize: 22,
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--bone)',
                margin: '0 0 6px',
              }}
            >
              Extend the thread.
            </h3>
            <p
              className="hl-serif"
              style={{
                fontSize: 14,
                color: 'var(--bone-dim)',
                margin: '0 0 28px',
                lineHeight: 1.6,
              }}
            >
              They receive a personal welcome. You earn additional storage when they join.
            </p>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={labelStyle} htmlFor="inv-email">Email address</label>
                <input
                  id="inv-email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="family@example.com"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="inv-rel">Relationship (optional)</label>
                <select
                  id="inv-rel"
                  value={inviteRelationship}
                  onChange={e => setInviteRelationship(e.target.value)}
                  style={{ ...fieldStyle, fontFamily: 'var(--mono)', fontSize: 13 }}
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
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--rule)',
                    color: 'var(--bone-dim)',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '12px 0',
                    cursor: 'pointer',
                    borderRadius: 0,
                  }}
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    inviteMutation.mutate({
                      email: inviteEmail,
                      relationship: inviteRelationship,
                    })
                  }
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                  className="hl-btn"
                  style={{ flex: 1 }}
                >
                  {inviteMutation.isPending ? 'sending…' : 'send invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}
