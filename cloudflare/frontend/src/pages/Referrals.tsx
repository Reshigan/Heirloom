import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { familyReferralsApi } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

export function Referrals() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    copyToClipboard(`${window.location.origin}/signup?ref=${code}`)
      .then(() => {
        setCopied(true);
        setCopiedCode(code);
        setTimeout(() => { setCopied(false); setCopiedCode(null); }, 2000);
      })
      .catch(() => {});
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
    borderRadius: 0,
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
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--bone-faint)',
    marginBottom: 10,
  };

  const eyebrow = isLoading
    ? 'REFERRALS'
    : `${totalInvites} INVITED · ${accepted} JOINED`;

  return (
    <ClothShell
      topbarLeft={<Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>}
      topbarCenter="referrals"
    >
      <div
        style={{
          maxWidth: 'var(--page-max-wide)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <CosmicHeader
          eyebrow={eyebrow}
          title="Invite someone to begin their thread."
        />

        {isLoading ? (
          <div
            style={{
              height: 1,
              background: 'var(--rule)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: 320,
              marginTop: 40,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '40%',
                background: 'var(--bone-dim)',
                animation: 'none',
                opacity: 0.6,
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 56, marginTop: 40 }}>

            {/* Referral code — flat mono value with a quiet COPY affordance */}
            {referralData?.referralCode && (
              <section>
                <SectionLabel>Your invite link</SectionLabel>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                    gap: 16,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--rule)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 14,
                      letterSpacing: '0.04em',
                      color: 'var(--bone)',
                      flex: 1,
                      minWidth: 0,
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
                    style={{
                      background: 'none',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--warm)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copied && copiedCode === referralData.referralCode ? 'copied' : 'copy'}
                  </button>
                </div>
              </section>
            )}

            {/* Ledger summary + milestones */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 28,
                  flexWrap: 'wrap',
                  marginBottom: 28,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>
                    {accepted}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                    joined
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>
                    +{bonusMB}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                    MB earned
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="hl-btn"
                  style={{ marginLeft: 'auto' }}
                >
                  invite a family member
                </button>
              </div>

              <SectionLabel>When they join</SectionLabel>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {inviteMarks.map((mark) => {
                  const reached = accepted >= mark.count;
                  const progress = Math.min(100, (accepted / mark.count) * 100);
                  return (
                    <li
                      key={mark.count}
                      style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 16,
                          marginBottom: reached ? 0 : 7,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 16,
                            color: reached ? 'var(--bone)' : 'var(--bone-dim)',
                          }}
                        >
                          {reached ? '∞ ' : ''}{mark.reward}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: reached ? 'var(--warm)' : 'var(--bone-faint)',
                            whiteSpace: 'nowrap',
                          }}
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
                              background: 'var(--bone-dim)',
                              transition: 'width 360ms var(--ease)',
                            }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Family branches */}
            <section>
              <SectionLabel>Family branches</SectionLabel>
              {familyBranches.map((branch) => {
                const branchReferrals: any[] = referralData?.referrals?.filter(
                  (r: any) => r.family_branch === branch.id
                ) || [];
                const branchJoined = branchReferrals.filter(
                  (r: any) => r.status === 'accepted'
                ).length;
                return (
                  <div key={branch.id}>
                    {branchReferrals.length > 0 ? (
                      <>
                        {branchReferrals.slice(0, 3).map((ref: any) => (
                          <EntryRow
                            key={ref.id}
                            title={ref.referred_email}
                            meta={`${branch.label.toUpperCase()} · ${ref.status === 'accepted' ? 'JOINED' : 'PENDING'}`}
                          />
                        ))}
                        {branchReferrals.length > 3 && (
                          <p
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                              color: 'var(--bone-faint)',
                              margin: '10px 0 0',
                            }}
                          >
                            +{branchReferrals.length - 3} more in {branch.label}
                            {branchJoined > 0 ? ` · ${branchJoined} joined` : ''}
                          </p>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 20,
                          padding: '15px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--bone-dim)' }}>
                          {branch.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowInviteModal(true)}
                          style={{
                            background: 'none',
                            border: 0,
                            padding: 0,
                            cursor: 'pointer',
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'var(--warm)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          invite →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* All invites — vertical EntryRow list */}
            {referralData?.referrals && referralData.referrals.length > 0 && (
              <section>
                <SectionLabel>All invites</SectionLabel>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {referralData.referrals.map((ref: any) => {
                    const isAccepted = ref.status === 'accepted';
                    const statusColor = isAccepted ? 'var(--warm)' : 'var(--bone-faint)';
                    const date = new Date(ref.created_at).toLocaleDateString();
                    return (
                      <li
                        key={ref.id}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 20,
                          flexWrap: 'wrap',
                          padding: '15px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--serif)',
                              fontSize: 19,
                              lineHeight: 1.3,
                              color: 'var(--bone)',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {ref.referred_email}
                          </span>
                          {ref.relationship && (
                            <span
                              style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 10,
                                letterSpacing: '0.16em',
                                textTransform: 'uppercase',
                                color: 'var(--bone-faint)',
                                display: 'block',
                                marginTop: 4,
                              }}
                            >
                              {ref.relationship}
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 16,
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            letterSpacing: '0.14em',
                            flex: '0 0 auto',
                          }}
                        >
                          <span style={{ textTransform: 'uppercase', letterSpacing: '0.16em', color: statusColor }}>
                            {ref.status}
                          </span>
                          <span style={{ color: 'var(--bone-faint)' }}>{date}</span>
                          <button
                            type="button"
                            onClick={() => copyInviteLink(ref.invite_code)}
                            style={{
                              background: 'none',
                              border: 0,
                              padding: 0,
                              cursor: 'pointer',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: 'var(--warm)',
                            }}
                          >
                            {copied && copiedCode === ref.invite_code ? 'copied' : 'copy link'}
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Rewards earned */}
            {referralData?.rewards && referralData.rewards.length > 0 && (
              <section>
                <SectionLabel>Storage earned</SectionLabel>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {referralData.rewards.map((reward: any) => (
                    <li
                      key={reward.id}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 20,
                        flexWrap: 'wrap',
                        padding: '15px 0',
                        borderBottom: '1px solid var(--rule)',
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.3, color: 'var(--bone)', display: 'block' }}>
                          {reward.milestone}
                        </span>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 16,
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          letterSpacing: '0.14em',
                          flex: '0 0 auto',
                        }}
                      >
                        <span style={{ color: 'var(--warm)', letterSpacing: '0.1em' }}>
                          {reward.reward_value}
                        </span>
                        <span style={{ color: 'var(--bone-faint)' }}>
                          {new Date(reward.claimed_at).toLocaleDateString()}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div style={{ paddingTop: 16 }}>
              <WaxSeal />
            </div>

          </div>
        )}
      </div>

      {/* Invite overlay */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'color-mix(in srgb, var(--ink) 84%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="cosmic-panel cosmic-panel--solid"
            style={{
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
                fontSize: 26,
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

              {inviteMutation.isError && (
                <p
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--warm)',
                    margin: 0,
                  }}
                  role="status"
                >
                  Could not send invite. Try again.
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="hl-btn ghost"
                  style={{ flex: 1 }}
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
    </ClothShell>
  );
}
