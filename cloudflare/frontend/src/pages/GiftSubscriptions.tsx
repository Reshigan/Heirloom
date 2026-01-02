import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Calendar, Check, CreditCard } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { giftSubscriptionsApi } from '../services/api';

const giftStyles = [
  { id: 'classic', name: 'Classic', color: 'from-gold to-amber-600' },
  { id: 'elegant', name: 'Elegant', color: 'from-purple-500 to-violet-600' },
  { id: 'festive', name: 'Festive', color: 'from-red-500 to-pink-500' },
  { id: 'birthday', name: 'Birthday', color: 'from-blue-500 to-cyan-500' },
  { id: 'anniversary', name: 'Anniversary', color: 'from-rose-500 to-pink-500' },
];

export function GiftSubscriptions() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('classic');
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    purchaserName: '',
    purchaserEmail: '',
    personalMessage: '',
    scheduledDate: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [giftResult, setGiftResult] = useState<any>(null);

  const { data: pricing } = useQuery({
    queryKey: ['giftPricing'],
    queryFn: () => giftSubscriptionsApi.getPricing().then(r => r.data),
  });

  const { data: purchasedGifts } = useQuery({
    queryKey: ['purchasedGifts'],
    queryFn: () => giftSubscriptionsApi.getPurchased().then(r => r.data),
  });

  const purchaseMutation = useMutation({
    mutationFn: () => giftSubscriptionsApi.purchase({
      purchaserEmail: formData.purchaserEmail,
      purchaserName: formData.purchaserName,
      recipientEmail: formData.recipientEmail,
      recipientName: formData.recipientName,
      tier: selectedTier!,
      personalMessage: formData.personalMessage,
      style: selectedStyle,
      scheduledDeliveryDate: formData.scheduledDate || undefined,
    }),
    onSuccess: (response) => {
      setGiftResult(response.data);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['purchasedGifts'] });
    },
  });

  const tiers = pricing?.tiers || [
    { id: 'STARTER', name: 'Starter', price: 12, description: '1 year of Starter plan' },
    { id: 'FAMILY', name: 'Family', price: 24, description: '1 year of Family plan' },
    { id: 'FOREVER', name: 'Forever', price: 60, description: '1 year of Forever plan' },
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedTier;
      case 2: return formData.recipientName && formData.recipientEmail;
      case 3: return formData.purchaserName && formData.purchaserEmail;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="text-gold" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-2">Gift a Subscription</h1>
          <p className="text-paper/60">Give the gift of preserving memories</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                s === step ? 'bg-gold text-void' : s < step ? 'bg-green-500 text-white' : 'bg-paper/10 text-paper/50'
              }`}>
                {s < step ? <Check size={16} /> : s}
              </div>
              {s < 4 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-500' : 'bg-paper/10'}`} />}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card"
        >
          {/* Step 1: Choose Plan */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-medium mb-6">Choose a Plan</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {tiers.map((tier: any) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-6 rounded-xl text-left transition-all ${
                      selectedTier === tier.id
                        ? 'bg-gold/20 border-2 border-gold'
                        : 'bg-paper/5 border-2 border-transparent hover:border-paper/20'
                    }`}
                  >
                    <div className="text-lg font-medium mb-1">{tier.name}</div>
                    <div className="text-3xl font-light text-gold mb-2">${tier.price}</div>
                    <div className="text-sm text-paper/60">{tier.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-medium mb-3">Gift Card Style</h3>
                <div className="flex gap-3 flex-wrap">
                  {giftStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-4 py-2 rounded-lg bg-gradient-to-r ${style.color} text-white text-sm ${
                        selectedStyle === style.id ? 'ring-2 ring-white ring-offset-2 ring-offset-void' : ''
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Recipient Details */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-medium mb-6">Who's Receiving This Gift?</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Recipient's Name</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Mom, Dad, Grandma..."
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Recipient's Email</label>
                  <input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="recipient@example.com"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Personal Message (optional)</label>
                  <textarea
                    value={formData.personalMessage}
                    onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                    placeholder="Write a heartfelt message..."
                    className="input w-full h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Schedule Delivery (optional)</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input w-full"
                  />
                  <p className="text-xs text-paper/50 mt-1">Leave empty to send immediately</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Your Details */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-medium mb-6">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    placeholder="Your name"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Your Email</label>
                  <input
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                    placeholder="your@email.com"
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Pay */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-medium mb-6">Review Your Gift</h2>
              
              <div className="bg-paper/5 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-paper/50">Gift for</div>
                    <div className="text-lg font-medium">{formData.recipientName}</div>
                    <div className="text-sm text-paper/60">{formData.recipientEmail}</div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${
                    giftStyles.find(s => s.id === selectedStyle)?.color
                  } text-white text-sm`}>
                    {giftStyles.find(s => s.id === selectedStyle)?.name}
                  </div>
                </div>

                <div className="border-t border-paper/10 pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-paper/70">Plan</span>
                    <span>{tiers.find((t: any) => t.id === selectedTier)?.name} (1 Year)</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total</span>
                    <span className="text-gold">${tiers.find((t: any) => t.id === selectedTier)?.price}</span>
                  </div>
                </div>

                {formData.personalMessage && (
                  <div className="border-t border-paper/10 pt-4">
                    <div className="text-sm text-paper/50 mb-1">Your Message</div>
                    <p className="text-paper/80 italic">"{formData.personalMessage}"</p>
                  </div>
                )}

                {formData.scheduledDate && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-paper/60">
                    <Calendar size={14} />
                    <span>Scheduled for {new Date(formData.scheduledDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
                className="btn btn-primary w-full"
              >
                <CreditCard size={18} />
                <span>{purchaseMutation.isPending ? 'Processing...' : 'Complete Purchase'}</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-paper/10">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="btn btn-secondary"
            >
              Back
            </button>
            {step < 4 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn btn-primary"
              >
                Continue
              </button>
            )}
          </div>
        </motion.div>

        {/* Previous Gifts */}
        {purchasedGifts && purchasedGifts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 card"
          >
            <h3 className="text-lg font-medium mb-4">Your Gift History</h3>
            <div className="space-y-3">
              {purchasedGifts.map((gift: any) => (
                <div key={gift.id} className="flex items-center justify-between p-4 bg-paper/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${
                      giftStyles.find(s => s.id === gift.gift_card_style)?.color || 'from-gold to-amber-600'
                    } flex items-center justify-center`}>
                      <Gift size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{gift.recipient_name}</div>
                      <div className="text-sm text-paper/60">{gift.tier} Plan</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      gift.status === 'redeemed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : gift.status === 'delivered'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {gift.status}
                    </span>
                    <div className="text-xs text-paper/50 mt-1">
                      {new Date(gift.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && giftResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-md text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-400" size={40} />
              </div>
              <h3 className="text-2xl font-medium mb-2">Gift Sent!</h3>
              <p className="text-paper/60 mb-6">
                {formData.recipientName} will receive their gift {formData.scheduledDate ? `on ${new Date(formData.scheduledDate).toLocaleDateString()}` : 'shortly'}.
              </p>
              
              <div className="bg-paper/5 rounded-lg p-4 mb-6">
                <div className="text-sm text-paper/50 mb-1">Gift Code</div>
                <div className="text-lg font-mono text-gold">{giftResult.giftCode}</div>
              </div>

              <button
                onClick={() => {
                  setShowSuccess(false);
                  setStep(1);
                  setSelectedTier(null);
                  setFormData({
                    recipientName: '',
                    recipientEmail: '',
                    purchaserName: '',
                    purchaserEmail: '',
                    personalMessage: '',
                    scheduledDate: '',
                  });
                }}
                className="btn btn-primary"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
