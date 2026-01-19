import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Copy, Check, Users, Gift, TrendingUp, 
  Share2, Link2, Edit3, Loader2, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { referralApi } from '../services/api';
import { Navigation } from '../components/Navigation';

export function Referral() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: referralData, isLoading } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: () => referralApi.getMyCode().then(r => r.data),
  });

  const { data: referralsData } = useQuery({
    queryKey: ['my-referrals'],
    queryFn: () => referralApi.getMyReferrals().then(r => r.data),
  });

  const customizeCodeMutation = useMutation({
    mutationFn: (code: string) => referralApi.customizeCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Referral code updated!' });
      setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (error: any) => {
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update code' 
      });
      setTimeout(() => setStatusMessage(null), 3000);
    },
  });

  const referralCode = referralData?.code || '';
  const referralLink = `https://heirloom.app/ref/${referralCode}`;
  const stats = referralData?.stats || { clicks: 0, signups: 0, conversions: 0, rewardsEarned: 0 };
  const referrals = referralsData?.referrals || [];

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomize = () => {
    if (customCode.length >= 3 && customCode.length <= 20) {
      customizeCodeMutation.mutate(customCode.toUpperCase());
    }
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Heirloom',
          text: 'Preserve your family memories with Heirloom. Use my referral link for an extended trial!',
          url: referralLink,
        });
      } catch (err) {
        copyToClipboard(referralLink);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-light mb-4">Refer Friends & Family</h1>
            <p className="text-paper/60 text-lg">
              Share Heirloom with your loved ones and earn rewards when they subscribe
            </p>
          </motion.div>

          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl text-center ${
                statusMessage.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-blood/10 border border-blood/30 text-blood'
              }`}
            >
              {statusMessage.text}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Link2 className="text-gold" size={24} />
              </div>
              <div>
                <h2 className="text-xl">Your Referral Link</h2>
                <p className="text-paper/50 text-sm">Share this link to invite others</p>
              </div>
            </div>

            <div className="bg-void/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 bg-transparent text-paper/80 outline-none text-sm"
                />
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="text-green-400" size={20} />
                  ) : (
                    <Copy className="text-gold" size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={shareReferral}
                className="btn btn-primary flex items-center gap-2"
              >
                <Share2 size={18} />
                Share Link
              </button>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setCustomCode(referralCode);
                }}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Edit3 size={18} />
                Customize Code
              </button>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-paper/10"
              >
                <label className="block text-sm text-paper/50 mb-2">
                  Custom Referral Code (3-20 characters)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="YOURCODE"
                    maxLength={20}
                    className="input flex-1"
                  />
                  <button
                    onClick={handleCustomize}
                    disabled={customCode.length < 3 || customizeCodeMutation.isPending}
                    className="btn btn-primary"
                  >
                    {customizeCodeMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Link Clicks', value: stats.clicks, icon: ExternalLink },
              { label: 'Sign Ups', value: stats.signups, icon: Users },
              { label: 'Conversions', value: stats.conversions, icon: TrendingUp },
              { label: 'Months Earned', value: stats.rewardsEarned, icon: Gift },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="card text-center"
              >
                <stat.icon className="text-gold mx-auto mb-2" size={24} />
                <p className="text-3xl font-light mb-1">{stat.value}</p>
                <p className="text-paper/50 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card mb-8"
          >
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Gift className="text-gold" size={20} />
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gold font-medium">1</span>
                </div>
                <h3 className="font-medium mb-1">Share Your Link</h3>
                <p className="text-paper/50 text-sm">
                  Send your unique referral link to friends and family
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gold font-medium">2</span>
                </div>
                <h3 className="font-medium mb-1">They Sign Up</h3>
                <p className="text-paper/50 text-sm">
                  They get a 30-day trial and 20% off their first year
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gold font-medium">3</span>
                </div>
                <h3 className="font-medium mb-1">You Earn Rewards</h3>
                <p className="text-paper/50 text-sm">
                  Get 1 free month added to your subscription for each conversion
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Users className="text-gold" size={20} />
              Your Referrals
            </h2>
            
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-paper/50">
                <Users className="mx-auto mb-3 opacity-50" size={40} />
                <p>No referrals yet. Share your link to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral: any) => (
                  <div 
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-void/30 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">
                        {referral.refereeEmail || 'Anonymous'}
                      </p>
                      <p className="text-paper/50 text-sm">
                        Signed up {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${
                      referral.status === 'CONVERTED' 
                        ? 'badge-success' 
                        : referral.status === 'SIGNED_UP'
                        ? 'badge-gold'
                        : 'badge-default'
                    }`}>
                      {referral.status === 'CONVERTED' ? 'Converted' : 
                       referral.status === 'SIGNED_UP' ? 'Signed Up' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
