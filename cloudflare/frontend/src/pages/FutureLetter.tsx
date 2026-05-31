import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';

const fieldClass =
  'w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors font-body text-base leading-[1.7]';

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
      } catch (clipboardError) {
        // Clipboard API not available, use fallback
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
    <main className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <div className="px-6 md:px-12 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-paper-50 hover:text-gold transition-colors text-sm mb-10"
        >
          <span aria-hidden>←</span> Back to the Tapestry
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">A letter across time</p>
            <h1
              className="font-body font-light leading-[1.1] tracking-[-0.018em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              Letter from your future self.
            </h1>
            <p className="mt-6 text-paper-70 max-w-2xl mx-auto leading-relaxed font-light">
              A letter written from your 80-year-old self, reflecting on the values,
              hopes, and fears you share today. A quiet reminder of what truly matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="font-body font-light text-xl tracking-[-0.012em]">Tell us about yourself</h2>

                <div>
                  <label htmlFor="fl-age" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Your current age</label>
                  <input
                    id="fl-age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.currentAge}
                    onChange={(e) => setFormData({ ...formData, currentAge: parseInt(e.target.value) || 30 })}
                    className={fieldClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fl-values" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">What do you value most?</label>
                  <textarea
                    id="fl-values"
                    value={formData.values}
                    onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                    placeholder="Family, creativity, adventure, helping others…"
                    className={`${fieldClass} min-h-[80px] resize-y`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fl-hopes" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">What are your hopes for the future?</label>
                  <textarea
                    id="fl-hopes"
                    value={formData.hopes}
                    onChange={(e) => setFormData({ ...formData, hopes: e.target.value })}
                    placeholder="To see my children grow, to travel the world…"
                    className={`${fieldClass} min-h-[80px] resize-y`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fl-fears" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">What are your fears?</label>
                  <textarea
                    id="fl-fears"
                    value={formData.fears}
                    onChange={(e) => setFormData({ ...formData, fears: e.target.value })}
                    placeholder="Not having enough time, losing loved ones…"
                    className={`${fieldClass} min-h-[80px] resize-y`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fl-loved" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Who are your loved ones?</label>
                  <textarea
                    id="fl-loved"
                    value={formData.lovedOnes}
                    onChange={(e) => setFormData({ ...formData, lovedOnes: e.target.value })}
                    placeholder="My partner Sarah, my kids Emma and Jack, my best friend Mike…"
                    className={`${fieldClass} min-h-[80px] resize-y`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="btn btn-primary w-full"
                >
                  {generateMutation.isPending ? 'Generating letter…' : (
                    <>
                      Generate my letter <span aria-hidden>→</span>
                    </>
                  )}
                </button>

                {generateMutation.isPending && (
                  <ProgressHair label="writing across time…" />
                )}
              </form>
            </div>

            <div className="space-y-6">
              {generatedLetter ? (
                <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-body font-light text-xl tracking-[-0.012em]">Your letter</h2>
                    <button
                      onClick={handleShare}
                      className="text-paper-50 hover:text-gold transition-colors text-sm"
                      title="Copy shareable text"
                    >
                      {copied ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  <div className="whitespace-pre-wrap text-paper-70 leading-[1.8] font-body">
                    {generatedLetter.content}
                  </div>

                  {copied && (
                    <p className="text-gold text-sm mt-5">Shareable text copied to clipboard.</p>
                  )}
                </div>
              ) : (
                <div className="bg-void-surface border border-paper-15 rounded-[2px] text-center py-16 px-6">
                  <p className="font-body text-3xl text-paper-30 mb-5" aria-hidden>∞</p>
                  <p className="text-paper-50 leading-relaxed">
                    Fill out the form to receive a letter from your future self.
                  </p>
                </div>
              )}

              {previousLetters?.letters && previousLetters.letters.length > 0 && (
                <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                  <h3 className="font-body font-light text-lg mb-5 tracking-[-0.012em]">Previous letters</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {previousLetters.letters.map((letter: any) => (
                      <div key={letter.id} className="border-l border-paper-15 pl-4 py-1">
                        <p className="text-paper-50 text-xs font-mono mb-2">
                          Generated {new Date(letter.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-paper-70 line-clamp-3 leading-relaxed">
                          {letter.letterContent}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
