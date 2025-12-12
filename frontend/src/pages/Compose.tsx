import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Send } from 'lucide-react';
import { lettersApi, familyApi } from '../services/api';

type DeliveryTrigger = 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS';

export function Compose() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [letter, setLetter] = useState({
    salutation: 'My dearest',
    body: '',
    signature: 'With all my love',
    deliveryTrigger: 'IMMEDIATE' as DeliveryTrigger,
    scheduledDate: '',
    recipientIds: [] as string[],
  });
  
  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });
  
  const { data: existingLetter } = useQuery({
    queryKey: ['letter', id],
    queryFn: () => lettersApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });
  
  useEffect(() => {
    if (existingLetter) {
      setLetter({
        salutation: existingLetter.salutation || '',
        body: existingLetter.body,
        signature: existingLetter.signature || '',
        deliveryTrigger: existingLetter.deliveryTrigger,
        scheduledDate: existingLetter.scheduledDate?.split('T')[0] || '',
        recipientIds: existingLetter.recipients?.map((r: any) => r.id) || [],
      });
    }
  }, [existingLetter]);
  
  const saveMutation = useMutation({
    mutationFn: (data: typeof letter) => id ? lettersApi.update(id, data) : lettersApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      if (!id) navigate(`/compose/${res.data.id}`);
    },
  });
  
  const sealMutation = useMutation({
    mutationFn: () => lettersApi.seal(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      navigate('/dashboard');
    },
  });
  
  const wordCount = letter.body.trim().split(/\s+/).filter(Boolean).length;
  
  const toggleRecipient = (recipientId: string) => {
    setLetter(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(recipientId)
        ? prev.recipientIds.filter(id => id !== recipientId)
        : [...prev.recipientIds, recipientId],
    }));
  };
  
  return (
    <div className="min-h-screen px-6 md:px-12 py-12 relative">
      {/* Candle glow effect */}
      <div className="fixed top-24 right-12 pointer-events-none">
        <motion.div
          className="w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255, 179, 71, 0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>
      
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
        <ArrowLeft size={20} />
        Back to Vault
      </button>
      
      <div className="max-w-4xl mx-auto">
        {/* Recipients */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-paper/40 text-sm">To:</span>
          <div className="flex gap-2 flex-wrap">
            {family?.map((member: any) => (
              <button
                key={member.id}
                onClick={() => toggleRecipient(member.id)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-all ${
                  letter.recipientIds.includes(member.id)
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
        </div>
        
        {/* Letter paper */}
        <div
          className="relative bg-paper p-12 md:p-16 min-h-[600px] shadow-2xl"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, #e8e2d6 35px, #e8e2d6 36px)',
          }}
        >
          {/* Red margin line */}
          <div className="absolute top-0 bottom-0 left-16 w-px bg-blood/20" />
          
          {/* Salutation */}
          <input
            type="text"
            value={letter.salutation}
            onChange={(e) => setLetter({ ...letter, salutation: e.target.value })}
            className="w-full bg-transparent font-handwritten text-2xl text-ink border-none outline-none mb-8"
            placeholder="My dearest..."
          />
          
          {/* Body */}
          <textarea
            value={letter.body}
            onChange={(e) => setLetter({ ...letter, body: e.target.value })}
            className="w-full bg-transparent font-handwritten text-xl text-ink border-none outline-none resize-none min-h-[300px] leading-[36px]"
            placeholder="Write your letter here..."
          />
          
          {/* Signature */}
          <div className="text-right mt-12">
            <input
              type="text"
              value={letter.signature}
              onChange={(e) => setLetter({ ...letter, signature: e.target.value })}
              className="bg-transparent font-handwritten text-xl text-ink border-none outline-none text-right"
              placeholder="With love..."
            />
          </div>
          
          {/* Word count */}
          <div className="absolute bottom-4 right-4 text-ink/30 text-sm">{wordCount} words</div>
        </div>
        
        {/* Delivery options */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            {[
              { value: 'IMMEDIATE', label: 'Immediately', icon: Send },
              { value: 'SCHEDULED', label: 'On Date', icon: Calendar },
              { value: 'POSTHUMOUS', label: "After I'm Gone", icon: Clock },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setLetter({ ...letter, deliveryTrigger: value as DeliveryTrigger })}
                className={`flex items-center gap-2 px-4 py-2 border transition-all ${
                  letter.deliveryTrigger === value
                    ? 'border-gold text-gold'
                    : 'border-white/10 text-paper/40 hover:border-gold/30'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          
          {letter.deliveryTrigger === 'SCHEDULED' && (
            <input
              type="date"
              value={letter.scheduledDate}
              onChange={(e) => setLetter({ ...letter, scheduledDate: e.target.value })}
              className="input w-auto"
            />
          )}
        </div>
        
        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            onClick={() => saveMutation.mutate(letter)}
            disabled={saveMutation.isPending}
            className="btn btn-secondary"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          
          {id && !existingLetter?.sealedAt && (
            <button
              onClick={() => {
                if (confirm('Once sealed, this letter cannot be edited. Proceed?')) {
                  sealMutation.mutate();
                }
              }}
              disabled={sealMutation.isPending || letter.recipientIds.length === 0}
              className="btn bg-blood text-paper hover:bg-blood-light disabled:opacity-50 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full border border-paper/30 flex items-center justify-center text-xs">∞</div>
              Seal Letter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
