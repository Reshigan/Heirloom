import { useState } from 'react';
import { AppFrame } from '../loom/components/AppFrame';
import { Link } from 'react-router-dom';

interface Citation {
  entryDate: string;
  excerpt: string;
  entryId: string;
}

interface Answer {
  text: string;
  citations: Citation[];
}

async function askThread(question: string): Promise<Answer> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    text: `Based on what's been written in your thread, ${question.toLowerCase().replace('?', '')} touches on themes your family has returned to often. The thread holds many answers — search within it.`,
    citations: [
      { entryDate: '12 March 2019', excerpt: 'A memory about that very thing…', entryId: 'stub-1' },
    ],
  };
}

export function QA() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    const result = await askThread(question);
    setAnswer(result);
    setLoading(false);
  }

  return (
    <AppFrame left="ask the thread">
      <div style={{ maxWidth: 640, padding: '48px 0' }}>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 32, fontWeight: 300, color: 'var(--bone)', margin: '0 0 40px' }}>
          Ask your thread anything.
        </h1>

        <input
          className="hl-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="What did my grandfather do for work?"
          style={{ fontSize: 18, padding: '16px 18px', fontFamily: 'var(--serif)' }}
        />

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="hl-btn"
            onClick={handleAsk}
            disabled={loading || !question.trim()}
          >
            {loading ? 'searching the thread…' : 'ask →'}
          </button>
        </div>

        {loading && (
          <progress style={{ display: 'block', width: '100%', height: 1, margin: '24px 0', appearance: 'none', accentColor: 'var(--warm)' }} />
        )}

        {answer && (
          <div style={{ marginTop: 48 }}>
            <p className="hl-serif" style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--bone)', fontWeight: 300, margin: '0 0 32px' }}>
              {answer.text}
            </p>

            {answer.citations.length > 0 && (
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
                <div className="hl-eyebrow" style={{ marginBottom: 16 }}>from the thread</div>
                {answer.citations.map((c, i) => (
                  <div key={i} style={{ marginBottom: 16, paddingLeft: 12, borderLeft: '1px solid var(--rule)' }}>
                    <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', marginBottom: 6 }}>
                      {c.entryDate}
                    </div>
                    <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 6px', lineHeight: 1.6 }}>
                      {c.excerpt}
                    </p>
                    <Link to={`/loom/read?entry=${c.entryId}`} className="hl-btn text" style={{ fontSize: 12 }}>
                      read entry →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppFrame>
  );
}
