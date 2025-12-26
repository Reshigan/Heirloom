import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, Check, Users, Heart, Sparkles } from '../components/Icons';
import { InfinityMark } from '../components/Logo';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'TWITTER', label: 'Twitter/X' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'BLOG', label: 'Blog/Newsletter' },
  { value: 'OTHER', label: 'Other' },
];

const SEGMENTS = [
  { value: 'GENEALOGY', label: 'Family History & Genealogy', desc: 'You help families discover their roots' },
  { value: 'GRIEF', label: 'Grief & Loss Support', desc: 'You support people through difficult times' },
  { value: 'PARENTING', label: 'Parenting & Family', desc: 'You create content for parents and families' },
  { value: 'TECH', label: 'Tech & Productivity', desc: 'You review apps and digital tools' },
  { value: 'ESTATE_PLANNING', label: 'Estate Planning & Legal', desc: 'You help people plan for the future' },
  { value: 'PODCAST', label: 'Storytelling & Podcasts', desc: 'You share stories and interviews' },
  { value: 'WELLNESS', label: 'Wellness & Self-Care', desc: 'You focus on mental health and wellbeing' },
  { value: 'LIFESTYLE', label: 'Lifestyle & General', desc: 'You create diverse lifestyle content' },
];

export function CreatorSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    platform: '',
    handle: '',
    followerCount: '',
    segment: '',
    website: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post(`${API_URL}/marketing/creator-signup`, {
        name: data.name,
        email: data.email,
        platform: data.platform,
        handle: data.handle,
        follower_count: data.followerCount ? parseInt(data.followerCount) : null,
        segment: data.segment,
        website: data.website || null,
        message: data.message || null,
      });
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check size={40} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-light mb-4">Thank You!</h1>
          <p className="text-paper/60 mb-8">
            We've received your application. Our team will review it and reach out within 48 hours 
            if there's a good fit for collaboration.
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Heirloom
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-stars" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 glass-subtle border-b border-white/[0.04]" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              className="text-gold"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <InfinityMark size={28} />
            </motion.div>
            <span className="text-lg tracking-[0.2em] text-paper/80">Heirloom</span>
          </Link>
          <Link to="/signup" className="btn btn-primary text-sm">
            Start Free Trial
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-subtle rounded-full mb-6">
              <Sparkles size={16} className="text-gold" />
              <span className="text-sm text-paper/60 tracking-wider">CREATOR PARTNERSHIP</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Help Families Preserve What Matters
            </h1>
            <p className="text-xl text-paper/50 max-w-2xl mx-auto">
              Join our creator community and help your audience preserve their most precious memories 
              for generations to come.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Heart, title: 'Meaningful Impact', desc: 'Help families create lasting legacies' },
              { icon: Users, title: 'Generous Commission', desc: 'Earn for every referral that converts' },
              { icon: Sparkles, title: 'Exclusive Access', desc: 'Early features and premium support' },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="card text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <benefit.icon size={24} className="text-gold" />
                </div>
                <h3 className="font-medium mb-2">{benefit.title}</h3>
                <p className="text-sm text-paper/50">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-2xl font-light mb-6 text-center">Apply to Partner</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input w-full"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input w-full"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Primary Platform *</label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    required
                    className="input w-full"
                  >
                    <option value="">Select platform</option>
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Handle/Username *</label>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={handleChange}
                    required
                    className="input w-full"
                    placeholder="@yourhandle"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Follower Count</label>
                  <input
                    type="number"
                    name="followerCount"
                    value={formData.followerCount}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Approximate number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Website/Portfolio</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-paper/60 mb-2">Content Focus *</label>
                <p className="text-xs text-paper/40 mb-3">Select the category that best describes your content</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {SEGMENTS.map(seg => (
                    <label
                      key={seg.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.segment === seg.value
                          ? 'border-gold bg-gold/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="segment"
                        value={seg.value}
                        checked={formData.segment === seg.value}
                        onChange={handleChange}
                        className="mt-1"
                        required
                      />
                      <div>
                        <div className="font-medium text-sm">{seg.label}</div>
                        <div className="text-xs text-paper/50">{seg.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-paper/60 mb-2">Tell Us About Yourself</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="input w-full resize-none"
                  placeholder="Why are you interested in partnering with Heirloom? What makes your audience a good fit?"
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn btn-primary px-8 py-3 group"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                {submitMutation.isError && (
                  <p className="text-red-400 text-sm mt-3">
                    Something went wrong. Please try again.
                  </p>
                )}
              </div>

              <p className="text-xs text-paper/40 text-center">
                By submitting, you agree to receive occasional emails from Heirloom about partnership opportunities. 
                You can unsubscribe at any time.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
