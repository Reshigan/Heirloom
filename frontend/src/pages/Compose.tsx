import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Calendar, Clock, Check, AlertCircle, X, Sparkles, Loader2 } from 'lucide-react';
import { lettersApi, familyApi } from '../services/api';
import { EmotionBadge } from '../components/ui/EmotionBadge';

type DeliveryTrigger = 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS';

export function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState({
    title: '',
    salutation: 'My dearest',
    body: '',
    signature: 'With all my love',
    deliveryTrigger: 'POSTHUMOUS' as DeliveryTrigger,
    scheduledDate: '',
    recipientIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    recipientName: '',
    relationship: 'child',
    occasion: '',
    tone: 'warm and loving',
  });

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: existingLetter } = useQuery({
    queryKey: ['letter', editId],
    queryFn: () => lettersApi.getOne(editId!).then(r => r.data),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingLetter) {
      setForm({
        title: existingLetter.title || '',
        salutation: existingLetter.salutation || 'My dearest',
        body: existingLetter.body || '',
        signature: existingLetter.signature || 'With all my love',
        deliveryTrigger: existingLetter.deliveryTrigger || 'POSTHUMOUS',
        scheduledDate: existingLetter.scheduledDate ? new Date(existingLetter.scheduledDate).toISOString().split('T')[0] : '',
        recipientIds: existingLetter.recipients?.map((r: any) => r.id) || [],
      });
    }
  }, [existingLetter]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => lettersApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      showToast('success', 'Letter saved as draft');
      navigate(`/compose?edit=${res.data.id}`);
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.error || 'Failed to save letter' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => lettersApi.update(editId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter', editId] });
      showToast('success', 'Letter updated');
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.error || 'Failed to update letter' });
    },
  });

  const sealMutation = useMutation({
    mutationFn: (id: string) => lettersApi.seal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      showToast('success', 'Letter sealed and scheduled for delivery');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.error || 'Failed to seal letter');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.body.trim()) newErrors.body = 'Letter content is required';
    if (form.recipientIds.length === 0) newErrors.recipients = 'Select at least one recipient';
    if (form.deliveryTrigger === 'SCHEDULED' && !form.scheduledDate) {
      newErrors.scheduledDate = 'Select a delivery date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (editId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleSeal = () => {
    if (!validateForm()) return;
    if (!editId) {
      showToast('error', 'Please save the letter first');
      return;
    }
    if (confirm('Once sealed, this letter cannot be edited. Are you sure?')) {
      sealMutation.mutate(editId);
    }
  };

  const toggleRecipient = (id: string) => {
    setForm(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(id)
        ? prev.recipientIds.filter(r => r !== id)
        : [...prev.recipientIds, id],
    }));
  };

  const analyzeEmotion = async () => {
    if (!form.body.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/letters/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ text: `${form.salutation} ${form.body} ${form.signature}` }),
      });
      if (response.ok) {
        const data = await response.json();
        setEmotion(data.emotion?.label || null);
      }
    } catch (error) {
      console.error('Failed to analyze emotion:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (form.body.length > 50) {
        analyzeEmotion();
      }
    }, 1000);
    return () => clearTimeout(debounce);
  }, [form.body]);

  const handleSuggestion = async () => {
    if (!suggestionForm.recipientName || !suggestionForm.relationship) {
      showToast('error', 'Please fill in recipient name and relationship');
      return;
    }
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/letters/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(suggestionForm),
      });
      if (response.ok) {
        const data = await response.json();
        setForm(prev => ({
          ...prev,
          salutation: data.salutation || prev.salutation,
          body: data.body || prev.body,
          signature: data.signature || prev.signature,
        }));
        setEmotion(data.emotion || null);
        setShowSuggestionModal(false);
        showToast('success', 'Letter suggestion applied');
      } else {
        showToast('error', 'Failed to get suggestion');
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
      showToast('error', 'Failed to get suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen px-6 md:px-12 py-12 relative">
      {/* Candle glow effect */}
      <div className="fixed top-24 right-12 pointer-events-none">
        <motion.div
          className="w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255, 179, 71, 0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl ${
              toast.type === 'success' ? 'bg-green-900/90 border border-green-500/30' : 'bg-red-900/90 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
              <span className="text-paper">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
      >
        <ArrowLeft size={20} />
        Back to Vault
      </motion.button>

      <div className="max-w-4xl mx-auto">
        {/* Recipients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <span className="text-paper/40 text-sm">To:</span>
          <div className="flex gap-2 flex-wrap">
            {family?.map((member: any) => (
              <button
                key={member.id}
                onClick={() => toggleRecipient(member.id)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-all ${
                  form.recipientIds.includes(member.id)
                    ? 'border-gold bg-gold/20 text-gold'
                    : 'border-white/10 text-paper/40 hover:border-gold/30'
                }`}
              >
                {member.name[0]}
              </button>
            ))}
            <button
              onClick={() => navigate('/family')}
              className="w-10 h-10 rounded-full border border-dashed border-white/10 text-paper/30 hover:border-gold/30 flex items-center justify-center"
            >
              +
            </button>
          </div>
          {errors.recipients && <span className="text-blood text-sm">{errors.recipients}</span>}
        </motion.div>

        {/* Letter tools bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between mb-4"
        >
          <button
            onClick={() => setShowSuggestionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg text-gold hover:bg-gold/20 transition-all"
          >
            <Sparkles size={16} />
            Help me write
          </button>
          
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <span className="flex items-center gap-2 text-paper/40 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </span>
            )}
            {emotion && !isAnalyzing && (
              <EmotionBadge emotion={emotion} size="md" />
            )}
          </div>
        </motion.div>

        {/* Letter paper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-[#f5f1e8] p-12 md:p-16 min-h-[600px] shadow-2xl rounded-sm"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, #e8e2d6 35px, #e8e2d6 36px)',
          }}
        >
          {/* Red margin line */}
          <div className="absolute top-0 bottom-0 left-16 w-px bg-red-300/40" />

          {/* Salutation */}
          <input
            type="text"
            value={form.salutation}
            onChange={(e) => setForm({ ...form, salutation: e.target.value })}
            className="w-full bg-transparent text-2xl text-[#2c1810] border-none outline-none mb-8 placeholder-[#2c1810]/30"
            style={{ fontFamily: "'Caveat', cursive" }}
            placeholder="My dearest..."
          />

          {/* Body */}
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className={`w-full bg-transparent text-xl text-[#2c1810] border-none outline-none resize-none min-h-[300px] placeholder-[#2c1810]/30 ${
              errors.body ? 'ring-2 ring-red-400 rounded' : ''
            }`}
            style={{ fontFamily: "'Caveat', cursive", lineHeight: '36px' }}
            placeholder="Write your letter here..."
          />
          {errors.body && <p className="text-red-600 text-sm mt-2">{errors.body}</p>}

          {/* Signature */}
          <div className="text-right mt-12">
            <input
              type="text"
              value={form.signature}
              onChange={(e) => setForm({ ...form, signature: e.target.value })}
              className="bg-transparent text-xl text-[#2c1810] border-none outline-none text-right placeholder-[#2c1810]/30"
              style={{ fontFamily: "'Caveat', cursive" }}
              placeholder="With love..."
            />
          </div>

          {/* Word count */}
          <div className="absolute bottom-4 right-4 text-[#2c1810]/30 text-sm">{wordCount} words</div>
        </motion.div>

        {/* Delivery options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
        >
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'IMMEDIATE', label: 'Immediately', icon: Send },
              { value: 'SCHEDULED', label: 'On Date', icon: Calendar },
              { value: 'POSTHUMOUS', label: "After I'm Gone", icon: Clock },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setForm({ ...form, deliveryTrigger: value as DeliveryTrigger })}
                className={`flex items-center gap-2 px-4 py-2 border transition-all rounded ${
                  form.deliveryTrigger === value
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-white/10 text-paper/40 hover:border-gold/30'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {form.deliveryTrigger === 'SCHEDULED' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
            >
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className={`px-4 py-2 bg-void border rounded text-paper ${
                  errors.scheduledDate ? 'border-blood' : 'border-white/10'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.scheduledDate && <p className="text-blood text-sm mt-1">{errors.scheduledDate}</p>}
            </motion.div>
          )}
        </motion.div>

        {errors.submit && (
          <div className="mt-4 p-4 bg-blood/10 border border-blood/30 rounded-xl text-blood">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-4 justify-end"
        >
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn btn-secondary"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>

          {editId && !existingLetter?.sealedAt && (
            <button
              onClick={handleSeal}
              disabled={sealMutation.isPending || form.recipientIds.length === 0}
              className="btn bg-[#8b0000] text-paper hover:bg-[#a00000] disabled:opacity-50 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full border border-paper/30 flex items-center justify-center text-xs">
                <span className="text-gold">&#8734;</span>
              </div>
              {sealMutation.isPending ? 'Sealing...' : 'Seal Letter'}
            </button>
          )}
        </motion.div>
      </div>

      {/* Letter Suggestion Modal */}
      <AnimatePresence>
        {showSuggestionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuggestionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-void border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-gold">Letter Writing Assistant</h3>
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  className="text-paper/40 hover:text-paper"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-paper/60 text-sm mb-2">Recipient Name</label>
                  <input
                    type="text"
                    value={suggestionForm.recipientName}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, recipientName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper focus:border-gold/50 outline-none"
                    placeholder="e.g., Sarah"
                  />
                </div>

                <div>
                  <label className="block text-paper/60 text-sm mb-2">Relationship</label>
                  <select
                    value={suggestionForm.relationship}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, relationship: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper focus:border-gold/50 outline-none"
                  >
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="grandchild">Grandchild</option>
                    <option value="friend">Friend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-paper/60 text-sm mb-2">Occasion (optional)</label>
                  <select
                    value={suggestionForm.occasion}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, occasion: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper focus:border-gold/50 outline-none"
                  >
                    <option value="">General / No specific occasion</option>
                    <option value="birthday">Birthday</option>
                    <option value="wedding">Wedding</option>
                    <option value="graduation">Graduation</option>
                    <option value="holiday">Holiday</option>
                    <option value="memorial">Memorial / Remembrance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-paper/60 text-sm mb-2">Tone</label>
                  <select
                    value={suggestionForm.tone}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, tone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper focus:border-gold/50 outline-none"
                  >
                    <option value="warm and loving">Warm and Loving</option>
                    <option value="reflective and nostalgic">Reflective and Nostalgic</option>
                    <option value="encouraging and proud">Encouraging and Proud</option>
                    <option value="grateful and appreciative">Grateful and Appreciative</option>
                    <option value="hopeful and optimistic">Hopeful and Optimistic</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSuggestionModal(false)}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-paper/60 hover:text-paper hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuggestion}
                  disabled={isSuggesting || !suggestionForm.recipientName}
                  className="flex-1 px-4 py-3 bg-gold text-void rounded-lg font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSuggesting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Letter
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
