import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Pen, Trash2 } from 'lucide-react';
import { familyApi } from '../services/api';

export function Family() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });
  
  const { data: selectedMember } = useQuery({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });
  
  const createMutation = useMutation({
    mutationFn: familyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setShowAddModal(false);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: familyApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      navigate('/family');
    },
  });
  
  const [form, setForm] = useState({ name: '', relationship: '', email: '', phone: '' });
  
  return (
    <div className="min-h-screen px-6 md:px-12 py-12 relative overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-gold rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>
      
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8 relative z-10">
        <ArrowLeft size={20} />
        Back to Vault
      </button>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light">Your Family Constellation</h1>
          <p className="text-paper/50 mt-2">The people who matter most</p>
        </div>
        
        {/* Constellation view */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Center - You */}
          <div className="absolute z-20">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center"
              animate={{ boxShadow: ['0 0 20px rgba(201,169,89,0.3)', '0 0 40px rgba(201,169,89,0.5)', '0 0 20px rgba(201,169,89,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-void font-medium">YOU</span>
            </motion.div>
          </div>
          
          {/* Family members in orbit */}
          {family?.map((member: any, i: number) => {
            const angle = (i / (family.length || 1)) * 2 * Math.PI - Math.PI / 2;
            const radius = 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <motion.div
                key={member.id}
                className="absolute"
                style={{ x, y }}
                animate={{ y: [y - 5, y + 5, y - 5] }}
                transition={{ duration: 5 + i, repeat: Infinity }}
              >
                {/* Connection line */}
                <svg className="absolute w-[360px] h-[360px] pointer-events-none" style={{ top: -180, left: -180 }}>
                  <line x1={180} y1={180} x2={180 - x} y2={180 - y} stroke="rgba(201,169,89,0.15)" strokeWidth="1" />
                </svg>
                
                <button
                  onClick={() => navigate(`/family/${member.id}`)}
                  className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center group transition-all ${
                    id === member.id ? 'border-gold bg-gold/10' : 'border-gold/30 hover:border-gold'
                  }`}
                >
                  <div className="text-2xl text-gold">{member.name[0]}</div>
                  <div className="absolute -bottom-8 text-center">
                    <div className="text-paper text-sm">{member.name}</div>
                    <div className="text-paper/40 text-xs">{member.relationship}</div>
                  </div>
                </button>
              </motion.div>
            );
          })}
          
          {/* Add button */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="absolute w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center text-paper/30 hover:border-gold hover:text-gold transition-all"
            style={{ bottom: 0, right: 0 }}
            whileHover={{ scale: 1.1 }}
          >
            <Plus size={24} />
          </motion.button>
        </div>
        
        {/* Member detail panel */}
        <AnimatePresence>
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-24 right-0 bottom-0 w-96 bg-void-light border-l border-white/[0.04] p-8 overflow-y-auto"
            >
              <button onClick={() => navigate('/family')} className="absolute top-4 right-4 text-paper/40 hover:text-gold">
                <X size={20} />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/30 to-blood/20 flex items-center justify-center text-4xl text-gold mx-auto mb-4">
                  {selectedMember.name[0]}
                </div>
                <h2 className="text-2xl">{selectedMember.name}</h2>
                <p className="text-paper/50">{selectedMember.relationship}</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <div className="text-2xl text-gold">{selectedMember.stats?.memories || 0}</div>
                    <div className="text-paper/40 text-sm">Memories</div>
                  </div>
                  <div className="card">
                    <div className="text-2xl text-gold">{selectedMember.stats?.letters || 0}</div>
                    <div className="text-paper/40 text-sm">Letters</div>
                  </div>
                </div>
                
                {selectedMember.email && (
                  <div>
                    <div className="text-paper/40 text-sm mb-1">Email</div>
                    <div className="text-paper">{selectedMember.email}</div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/compose')}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Pen size={16} />
                    Write Letter
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm(`Remove ${selectedMember.name} from your family?`)) {
                      deleteMutation.mutate(selectedMember.id);
                    }
                  }}
                  className="w-full btn text-blood border border-blood/30 hover:bg-blood/10 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Add member modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-6"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-void-light border border-white/[0.04] p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl mb-6">Add Family Member</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Relationship</label>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn btn-primary flex-1">
                    {createMutation.isPending ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
