import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Save, Users, Calendar, Clock, Check, AlertCircle, X } from 'lucide-react';
import { lettersApi, familyApi } from '../services/api';

type DeliveryTrigger = 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS';

export function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState({
    title: '',
    salutation: '',
    body: '',
    signature: '',
    deliveryTrigger: 'POSTHUMOUS' as DeliveryTrigger,
    scheduledDate: '',
    recipientIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

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
        salutation: existingLetter.salutation || '',
        body: existingLetter.body || '',
        signature: existingLetter.signature || '',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      showToast('success', 'Letter saved as draft');
      navigate('/memories?filter=letters');
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
      navigate('/memories?filter=letters');
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

  const selectedRecipients = family?.filter((m: any) => form.recipientIds.includes(m.id)) || [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-6 md:px-12 py-12">
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={20} />
          Back to Vault
        </motion.button>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-light mb-2">
              {editId ? 'Edit Your' : 'Write a'} <em>Letter</em>
            </h1>
            <p className="text-paper/50">Words that will be treasured forever</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl p-8 md:p-12"
          >
            {/* Recipients */}
            <div className="mb-8">
              <label className="block text-sm text-paper/50 mb-3">To</label>
              <button
                onClick={() => setShowRecipientModal(true)}
                className="w-full p-4 glass rounded-xl text-left flex items-center justify-between hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-gold" />
                  {selectedRecipients.length > 0 ? (
                    <span className="text-paper">
                      {selectedRecipients.map((r: any) => r.name).join(', ')}
                    </span>
                  ) : (
                    <span className="text-paper/40">Select recipients...</span>
                  )}
                </div>
                <span className="text-paper/40">{selectedRecipients.length} selected</span>
              </button>
              {errors.recipients && <p className="text-blood text-sm mt-2">{errors.recipients}</p>}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm text-paper/50 mb-2">Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="A letter to my loved ones..."
              />
            </div>

            {/* Salutation */}
            <div className="mb-6">
              <label className="block text-sm text-paper/50 mb-2">Salutation</label>
              <input
                type="text"
                value={form.salutation}
                onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                className="input"
                placeholder="My dearest..."
              />
            </div>

            {/* Body */}
            <div className="mb-6">
              <label className="block text-sm text-paper/50 mb-2">Your Letter *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={`input min-h-[300px] resize-none font-serif text-lg leading-relaxed ${errors.body ? 'border-blood' : ''}`}
                placeholder="Write from your heart..."
              />
              {errors.body && <p className="text-blood text-sm mt-2">{errors.body}</p>}
            </div>

            {/* Signature */}
            <div className="mb-8">
              <label className="block text-sm text-paper/50 mb-2">Signature</label>
              <input
                type="text"
                value={form.signature}
                onChange={(e) => setForm({ ...form, signature: e.target.value })}
                className="input"
                placeholder="With all my love..."
              />
            </div>

            <div className="divider mb-8" />

            {/* Delivery Options */}
            <div className="mb-8">
              <label className="block text-sm text-paper/50 mb-4">When should this be delivered?</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, deliveryTrigger: 'IMMEDIATE' })}
                  className={`p-4 glass rounded-xl text-left transition-all ${
                    form.deliveryTrigger === 'IMMEDIATE' ? 'border-gold bg-gold/10' : 'hover:border-gold/30'
                  }`}
                >
                  <Send size={24} className="text-gold mb-2" />
                  <div className="font-medium">Immediately</div>
                  <div className="text-sm text-paper/50">Send right after sealing</div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, deliveryTrigger: 'SCHEDULED' })}
                  className={`p-4 glass rounded-xl text-left transition-all ${
                    form.deliveryTrigger === 'SCHEDULED' ? 'border-gold bg-gold/10' : 'hover:border-gold/30'
                  }`}
                >
                  <Calendar size={24} className="text-gold mb-2" />
                  <div className="font-medium">On a Date</div>
                  <div className="text-sm text-paper/50">Schedule for a specific day</div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, deliveryTrigger: 'POSTHUMOUS' })}
                  className={`p-4 glass rounded-xl text-left transition-all ${
                    form.deliveryTrigger === 'POSTHUMOUS' ? 'border-gold bg-gold/10' : 'hover:border-gold/30'
                  }`}
                >
                  <Clock size={24} className="text-gold mb-2" />
                  <div className="font-medium">After I'm Gone</div>
                  <div className="text-sm text-paper/50">Delivered posthumously</div>
                </button>
              </div>

              {form.deliveryTrigger === 'SCHEDULED' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className={`input ${errors.scheduledDate ? 'border-blood' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.scheduledDate && <p className="text-blood text-sm mt-2">{errors.scheduledDate}</p>}
                </motion.div>
              )}
            </div>

            {errors.submit && (
              <div className="p-4 bg-blood/10 border border-blood/30 rounded-xl text-blood mb-6">
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-secondary flex-1 justify-center"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Draft
                  </>
                )}
              </button>

              <button
                onClick={handleSeal}
                disabled={sealMutation.isPending || !editId}
                className="btn btn-primary flex-1 justify-center"
              >
                {sealMutation.isPending ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Sealing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Seal & Schedule
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recipient Selection Modal */}
      <AnimatePresence>
        {showRecipientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowRecipientModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">Select Recipients</h2>
                <button
                  onClick={() => setShowRecipientModal(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {family && family.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {family.map((member: any) => (
                    <button
                      key={member.id}
                      onClick={() => toggleRecipient(member.id)}
                      className={`w-full p-4 glass rounded-xl text-left flex items-center justify-between transition-all ${
                        form.recipientIds.includes(member.id) ? 'border-gold bg-gold/10' : 'hover:border-gold/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-paper/50">{member.relationship}</div>
                        </div>
                      </div>
                      {form.recipientIds.includes(member.id) && (
                        <Check size={20} className="text-gold" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-paper/50">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No family members yet</p>
                  <button
                    onClick={() => navigate('/family')}
                    className="btn btn-primary mt-4"
                  >
                    Add Family Members
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-white/[0.04]">
                <button
                  onClick={() => setShowRecipientModal(false)}
                  className="btn btn-primary w-full justify-center"
                >
                  Done ({form.recipientIds.length} selected)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
