import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Share2, Check, Clock, Heart } from '../components/Icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { Navigation } from '../components/Navigation';

export function FutureLetter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    currentAge: 30,
    values: '',
    hopes: '',
    fears: '',
    lovedOnes: '',
  });
  const [generatedLetter, setGeneratedLetter] = useState<{ id: string; content: string; shareText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: previousLetters } = useQuery({
    queryKey: ['future-letters'],
    queryFn: () => aiApi.getFutureLetters().then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => aiApi.generateFutureLetter(formData),
    onSuccess: (response) => {
      setGeneratedLetter({
        id: response.data.id,
        content: response.data.letterContent,
        shareText: response.data.shareText,
      });
      queryClient.invalidateQueries({ queryKey: ['future-letters'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (id: string) => aiApi.markFutureLetterShared(id),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const handleShare = async () => {
    if (generatedLetter) {
      try {
        await navigator.clipboard.writeText(generatedLetter.shareText);
        setCopied(true);
        shareMutation.mutate(generatedLetter.id);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = generatedLetter.shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        shareMutation.mutate(generatedLetter.id);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

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
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
          <ArrowLeft size={20} />
          Back to Vault
        </button>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles size={32} className="text-gold" />
              <h1 className="text-4xl font-light">Letter from Your Future Self</h1>
            </div>
            <p className="text-paper/60 max-w-2xl mx-auto">
              AI will write a letter from your 80-year-old self, reflecting on the values, 
              hopes, and fears you share today. A powerful reminder of what truly matters.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <form onSubmit={handleSubmit} className="card space-y-6">
                <h2 className="text-xl font-medium flex items-center gap-2">
                  <Heart size={20} className="text-gold" />
                  Tell Us About Yourself
                </h2>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Your Current Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.currentAge}
                    onChange={(e) => setFormData({ ...formData, currentAge: parseInt(e.target.value) || 30 })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">What do you value most?</label>
                  <textarea
                    value={formData.values}
                    onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                    placeholder="Family, creativity, adventure, helping others..."
                    className="input min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">What are your hopes for the future?</label>
                  <textarea
                    value={formData.hopes}
                    onChange={(e) => setFormData({ ...formData, hopes: e.target.value })}
                    placeholder="To see my children grow, to travel the world..."
                    className="input min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">What are your fears?</label>
                  <textarea
                    value={formData.fears}
                    onChange={(e) => setFormData({ ...formData, fears: e.target.value })}
                    placeholder="Not having enough time, losing loved ones..."
                    className="input min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Who are your loved ones?</label>
                  <textarea
                    value={formData.lovedOnes}
                    onChange={(e) => setFormData({ ...formData, lovedOnes: e.target.value })}
                    placeholder="My partner Sarah, my kids Emma and Jack, my best friend Mike..."
                    className="input min-h-[80px]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="btn btn-primary w-full py-4"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating Letter...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate My Letter
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {generatedLetter ? (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-medium">Your Letter</h2>
                    <button
                      onClick={handleShare}
                      className="btn btn-secondary p-2"
                      title="Copy shareable text"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                    </button>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-paper/80 leading-relaxed">
                      {generatedLetter.content}
                    </div>
                  </div>

                  {copied && (
                    <p className="text-emerald-500 text-sm mt-4">Shareable text copied to clipboard!</p>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Clock size={48} className="text-paper/30 mx-auto mb-4" />
                  <p className="text-paper/50">
                    Fill out the form to receive a letter from your future self
                  </p>
                </div>
              )}

              {previousLetters?.letters && previousLetters.letters.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-medium mb-4">Previous Letters</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {previousLetters.letters.map((letter: any) => (
                      <div key={letter.id} className="p-4 bg-void/30 rounded-lg">
                        <p className="text-paper/60 text-sm mb-2">
                          Generated {new Date(letter.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-paper/80 line-clamp-3">
                          {letter.letterContent}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
