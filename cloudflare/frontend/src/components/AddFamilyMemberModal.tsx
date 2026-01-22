import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Mail, Loader2 } from './Icons';
import { familyApi } from '../services/api';

const RELATIONSHIPS = [
  'Spouse', 'Partner', 'Son', 'Daughter', 'Child', 'Parent', 'Mother', 'Father',
  'Sibling', 'Brother', 'Sister', 'Grandchild', 'Grandson', 'Granddaughter',
  'Grandparent', 'Grandmother', 'Grandfather', 'Mother-in-law', 'Father-in-law',
  'Son-in-law', 'Daughter-in-law', 'Brother-in-law', 'Sister-in-law',
  'Aunt', 'Uncle', 'Cousin', 'Niece', 'Nephew', 'Stepchild', 'Stepparent',
  'Godchild', 'Godparent', 'Friend', 'Mentor', 'Other'
];

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
}

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (member: FamilyMember) => void;
}

export function AddFamilyMemberModal({ isOpen, onClose, onCreated }: AddFamilyMemberModalProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setRelationship('');
    setEmail('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!relationship) newErrors.relationship = 'Please select a relationship';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await familyApi.create({
        name: name.trim(),
        relationship,
        email: email.trim() || undefined,
      });
      
      const newMember: FamilyMember = {
        id: response.data.id,
        name: response.data.name,
        relationship: response.data.relationship,
        email: response.data.email,
      };
      
      onCreated(newMember);
      handleClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add family member';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-void/80 backdrop-blur-sm z-[1100]"
                      onClick={handleClose}
                    />
          
                    {/* Modal Container - Full screen flex for mobile-friendly positioning */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 overflow-y-auto"
                      onClick={handleClose}
                    >
                      <div 
                        className="glass-strong rounded-2xl border border-gold/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Users size={20} className="text-gold" />
                  </div>
                  <h2 className="text-xl font-light">Add Family Member</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/30" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter their name"
                      className="w-full pl-10 pr-4 py-3 bg-void-elevated border border-gold/20 rounded-xl text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm text-paper/60 mb-2">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-4 py-3 bg-void-elevated border border-gold/20 rounded-xl text-paper focus:outline-none focus:border-gold/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-void">Select relationship</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel} className="bg-void">{rel}</option>
                    ))}
                  </select>
                  {errors.relationship && <p className="text-red-400 text-sm mt-1">{errors.relationship}</p>}
                </div>

                {/* Email (required) */}
                <div>
                  <label className="block text-sm text-paper/60 mb-2">
                    Email <span className="text-gold">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="For letter delivery"
                      className="w-full pl-10 pr-4 py-3 bg-void-elevated border border-gold/20 rounded-xl text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {errors.submit}
                  </div>
                )}

                {/* Note */}
                <p className="text-paper/40 text-xs">
                  You can add a photo and more details later from the Family page.
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 glass border border-gold/20 rounded-xl text-paper/70 hover:text-paper hover:border-gold/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gold to-gold-dim text-void-deep font-semibold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
