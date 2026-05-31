import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
import { Navigation } from '../components/Navigation';
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
    { id: 'maternal', label: 'Maternal Side' },
    { id: 'paternal', label: 'Paternal Side' },
    { id: 'spouse', label: 'Spouse\'s Family' },
    { id: 'children', label: 'Children' },
  ];

  const milestones = [
        { count: 5, reward: '500MB Storage' },
        { count: 10, reward: '25% Discount' },
        { count: 25, reward: '1 Month Free' },
        { count: 50, reward: '50% Lifetime' },
  ];

  return (
    <div className="min-h-screen bg-void text-paper">
      <Navigation />

      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-body font-light text-3xl md:text-4xl mb-2 tracking-[-0.014em]">Family Tree Referrals</h1>
          <p className="text-paper-70">Grow your family tree and earn rewards</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-void-surface border border-paper-15 p-6"
            >
              <div className="grid grid-cols-3 gap-6 text-center mb-8">
                <div>
                  <div className="text-4xl font-body font-light text-gold mb-1">
                    {referralData?.stats?.totalInvites || 0}
                  </div>
                  <div className="text-paper-70 text-sm">Invites Sent</div>
                </div>
                <div>
                  <div className="text-4xl font-body font-light text-gold mb-1">
                    {referralData?.stats?.accepted || 0}
                  </div>
                  <div className="text-paper-70 text-sm">Joined</div>
                </div>
                <div>
                  <div className="text-4xl font-body font-light text-gold mb-1">
                    +{referralData?.stats?.totalBonusMB || 0}MB
                  </div>
                  <div className="text-paper-70 text-sm">Bonus Storage</div>
                </div>
              </div>

              <button
                onClick={() => setShowInviteModal(true)}
                className="btn btn-primary w-full"
              >
                <span>Invite Family Member</span>
              </button>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-void-surface border border-paper-15 p-6"
            >
              <h3 className="text-lg font-medium mb-4">Milestones</h3>

              <div className="space-y-3">
                {milestones.map((milestone) => {
                  const achieved = (referralData?.stats?.accepted || 0) >= milestone.count;
                  const progress = Math.min(100, ((referralData?.stats?.accepted || 0) / milestone.count) * 100);

                  return (
                    <div
                      key={milestone.count}
                      className={`p-3 rounded-[2px] ${achieved ? 'bg-gold/10 border border-gold-40' : 'border border-paper-15'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={achieved ? 'text-gold' : 'text-paper-30'} aria-hidden>{achieved ? '∞' : '·'}</span>
                          <span className={achieved ? 'text-gold' : 'text-paper-70'}>{milestone.reward}</span>
                        </div>
                        <span className="text-xs text-paper-65">{milestone.count} members</span>
                      </div>
                      {!achieved && (
                        <div className="h-px bg-paper-15 overflow-hidden">
                          <div
                            className="h-full bg-gold transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Family Tree Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 bg-void-surface border border-paper-15 p-6"
            >
              <h3 className="text-lg font-medium mb-6">Your Family Tree</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {familyBranches.map((branch) => {
                  const branchReferrals = referralData?.referrals?.filter(
                    (r: any) => r.family_branch === branch.id
                  ) || [];

                  return (
                    <div key={branch.id} className="border border-paper-15 rounded-[2px] p-4">
                      <h4 className="font-medium mb-1">{branch.label}</h4>
                      <div className="text-sm text-paper-70 mb-3">
                        {branchReferrals.length} member{branchReferrals.length !== 1 ? 's' : ''}
                      </div>

                      {branchReferrals.length > 0 ? (
                        <div className="space-y-2">
                          {branchReferrals.slice(0, 3).map((ref: any) => (
                            <div key={ref.id} className="flex items-center gap-2 text-sm">
                              <span className={`text-xs ${
                                ref.status === 'accepted' ? 'text-gold' : 'text-paper-50'
                              }`} aria-hidden>{ref.status === 'accepted' ? '✓' : '·'}</span>
                              <span className="truncate">{ref.referred_email}</span>
                            </div>
                          ))}
                          {branchReferrals.length > 3 && (
                            <div className="text-xs text-paper-65">
                              +{branchReferrals.length - 3} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="text-sm text-gold hover:text-gold-bright transition-colors"
                        >
                          Add member <span aria-hidden>→</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Referrals */}
            {referralData?.referrals && referralData.referrals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-3 bg-void-surface border border-paper-15 p-6"
              >
                <h3 className="text-lg font-medium mb-4">All Invites</h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-paper-65 text-sm border-b border-paper-15">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Relationship</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Invite Link</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-15">
                      {referralData.referrals.map((ref: any) => (
                        <tr key={ref.id}>
                          <td className="py-3">{ref.referred_email}</td>
                          <td className="py-3 text-paper-70">{ref.relationship || '-'}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-xs border ${
                              ref.status === 'accepted'
                                ? 'border-gold-40 text-gold'
                                : ref.status === 'expired'
                                ? 'border-paper-15 text-blood'
                                : 'border-paper-15 text-paper-65'
                            }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => copyInviteLink(ref.invite_code)}
                              className="text-gold hover:text-gold-bright transition-colors text-sm"
                            >
                              Copy
                            </button>
                          </td>
                          <td className="py-3 text-paper-65 text-sm">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Rewards Earned */}
            {referralData?.rewards && referralData.rewards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-3 bg-void-surface border border-gold-40 p-6"
              >
                <h3 className="text-lg font-medium mb-4">Rewards Earned</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  {referralData.rewards.map((reward: any) => (
                    <div key={reward.id} className="border border-paper-15 rounded-[2px] p-4">
                      <div className="text-gold font-medium mb-1">{reward.reward_value}</div>
                      <div className="text-sm text-paper-70">{reward.milestone}</div>
                      <div className="text-xs text-paper-70 mt-2">
                        Earned {new Date(reward.claimed_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 text-paper-65 hover:text-paper"
                aria-label="Close"
              >
                <span aria-hidden>×</span>
              </button>

              <div className="text-center mb-6">
                <div className="text-4xl text-gold mb-4" aria-hidden>∞</div>
                <h3 className="text-xl font-medium">Invite Family Member</h3>
                <p className="text-paper-70 text-sm mt-1">
                  They'll get a special welcome, you'll get bonus storage
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper-70 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="family@example.com"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper-70 mb-2">Relationship (optional)</label>
                  <select
                    value={inviteRelationship}
                    onChange={(e) => setInviteRelationship(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="aunt_uncle">Aunt/Uncle</option>
                    <option value="cousin">Cousin</option>
                    <option value="spouse">Spouse</option>
                    <option value="in_law">In-Law</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => inviteMutation.mutate({
                      email: inviteEmail,
                      relationship: inviteRelationship,
                    })}
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy confirmation — inline status */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-void-surface border border-gold-40 text-paper px-4 py-2 rounded-[2px]"
          >
            <span>Invite link copied.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
