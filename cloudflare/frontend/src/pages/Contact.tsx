import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, MessageSquare, Send, Check, Loader2 } from 'lucide-react';

export function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="eternal-bg">
          <div className="eternal-aura" />
          <div className="eternal-stars" />
          <div className="eternal-mist" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-display text-paper mb-4">Message Sent</h1>
            <p className="text-paper/60 mb-8">
              Thank you for reaching out. We'll get back to you within 24-48 hours.
            </p>
            <Link to="/" className="btn btn-primary">
              Return Home
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-paper/50 hover:text-gold mb-8 transition-colors">
          <ArrowLeft size={18} />
          Back to Heirloom
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
              <Mail className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display text-paper mb-2">Contact Us</h1>
            <p className="text-paper/60">
              Have a question or need help? We'd love to hear from you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-paper/50 mb-2">Your Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="input pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-paper/50 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-paper/50 mb-2">Subject</label>
              <div className="relative">
                <MessageSquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="How can we help?"
                  className="input pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-paper/50 mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us more about your question or concern..."
                rows={5}
                className="input resize-none"
              />
            </div>

            {error && (
              <p className="text-blood text-sm text-center">{error}</p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full py-4 text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Send Message
                  <Send size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-paper/10 text-center">
            <p className="text-paper/40 text-sm mb-2">Or reach us directly at:</p>
            <a href="mailto:support@heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">
              support@heirloom.blue
            </a>
            <p className="text-paper/30 text-xs mt-4">
              131 Continental Dr Suite 305, Newark, DE 19713, US
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;
