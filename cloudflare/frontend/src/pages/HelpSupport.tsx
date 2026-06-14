import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { settingsApi } from '../services/api';

/**
 * Help & Support (§ support). Two surfaces in one room:
 *   • in-system help — concise, in-app answers to the questions new families ask
 *   • the support assistant — an AI chatbot grounded in Heirloom, with one-tap
 *     escalation to a person (which opens a ticket, emails the team + the user
 *     a reference number, and keeps the conversation history).
 * No icons, no cards — hairlines and type, per STITCH_BRIEF §2.
 */

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface PastConversation {
  id: string;
  title: string | null;
  ticket_number: string | null;
  status: string;
  updated_at: string;
  messages: Array<{ role: string; content: string }>;
}

const HELP_TOPICS: Array<{ q: string; a: string }> = [
  {
    q: 'What is the cloth?',
    a: 'The cloth is the whole of your family thread, woven from every entry. Each memory, letter, or voice recording becomes one thread in it. You read the cloth by hand rather than scrolling a feed — tap any thread to open what it holds.',
  },
  {
    q: 'How do I add a memory?',
    a: 'Tap "compose" (or the memory mark in the bottom bar), write freely, and weave it into the cloth. The Listener offers a quiet prompt if you want one. Entries are kept forever — they can be revised, never erased.',
  },
  {
    q: 'How do sealed letters work?',
    a: 'Write a letter, choose who it is for, and seal it with a delivery moment — a date, a birthday, or after you are gone. It waits in the cloth and is delivered at exactly that moment.',
  },
  {
    q: 'How do I invite my family?',
    a: 'Go to Settings → family and send an invitation. Each person who joins tends the same thread and is given their own natural-dye colour, which marks every thread they add.',
  },
  {
    q: 'Who can see our thread? Is it private?',
    a: 'Your thread is private to your family and encrypted. Heirloom is owned by your bloodline, never sold or mined. You can set the visibility of individual entries when you compose them.',
  },
  {
    q: 'What happens to the thread after I die?',
    a: 'You can name stewards and successors under /threads so the thread is inherited, not lost. Sealed letters set to deliver "after I go" are released to their recipients.',
  },
  {
    q: 'Can I use Heirloom offline / install it?',
    a: 'Yes. Heirloom is an installable app (PWA). Use your browser’s install prompt to add it to your home screen; it keeps working offline and syncs when you reconnect.',
  },
  {
    q: 'How do plans and billing work?',
    a: 'There is a free tier plus paid plans for larger families and more storage. Manage your plan any time under Settings → billing.',
  },
];

export function HelpSupport() {
  // ── in-system help ──────────────────────────────────────────────────────
  const [openTopic, setOpenTopic] = useState<number | null>(null);

  // ── the support assistant ─────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [past, setPast] = useState<PastConversation[]>([]);
  const [openPast, setOpenPast] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  // Load past support conversations (history).
  useEffect(() => {
    settingsApi.getSupportConversations()
      .then((r) => setPast(((r.data as any)?.conversations ?? []) as PastConversation[]))
      .catch(() => { /* history is best-effort */ });
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setReference(null);
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const { data } = await settingsApi.supportChat({ message: text, conversationId, history });
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: 'I could not reach the assistant just now. You can tap "talk to a human" and the Heirloom team will pick it up.',
      }]);
    } finally {
      setSending(false);
    }
  }

  async function escalate() {
    if (escalating) return;
    setEscalating(true);
    try {
      const transcript = messages.map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`).join('\n\n');
      const subject = messages.find((m) => m.role === 'user')?.content.slice(0, 80) || 'Support request';
      const { data } = await settingsApi.supportEscalate({ conversationId, transcript, subject });
      setReference(data.ticketNumber);
      setMessages((m) => [...m, {
        role: 'assistant',
        content: `I’ve passed this to a person. Your reference is ${data.ticketNumber} — we’ve emailed you a copy and the team will reply to your email.`,
      }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I couldn’t escalate just now. Please try again in a moment.' }]);
    } finally {
      setEscalating(false);
    }
  }

  const topbarLeft = (
    <Link to="/loom" style={{
      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
    }}>
      ← loom
    </Link>
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter="help & support">
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-prose)', margin: '0 auto' }}>

        {/* ── In-system help ─────────────────────────────────────────────── */}
        <div className="hl-eyebrow" style={{ marginBottom: 18 }}>
          the basics
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 56 }}>
          {HELP_TOPICS.map((t, i) => {
            const open = openTopic === i;
            return (
              <div key={i} style={{ borderBottom: '1px solid var(--rule)' }}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenTopic(open ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'transparent', border: 0,
                    padding: '16px 0', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'baseline', gap: 16,
                  }}
                >
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 300, color: 'var(--bone)', lineHeight: 1.4 }}>
                    {t.q}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--warm)', flexShrink: 0 }}>
                    {open ? '–' : '+'}
                  </span>
                </button>
                {open && (
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300,
                    lineHeight: 1.75, color: 'var(--bone-dim)', margin: '0 0 18px', maxWidth: '60ch',
                    animation: `hl-fade 360ms ${EASE}`,
                  }}>
                    {t.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── The support assistant ──────────────────────────────────────── */}
        <div className="hl-eyebrow" style={{ marginBottom: 8 }}>
          ask the assistant
        </div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-faint)', margin: '0 0 18px', lineHeight: 1.6 }}>
          Answers about using Heirloom. For anything a person needs to handle — a bug, billing, lost access — pass it to the team.
        </p>

        {/* chat thread */}
        <div
          ref={threadRef}
          style={{
            border: '1px solid var(--rule)', minHeight: 160, maxHeight: 380, overflowY: 'auto',
            padding: 16, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12,
          }}
        >
          {messages.length === 0 && !sending && (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-faint)', margin: 0, lineHeight: 1.7 }}>
              Ask anything — "how do I seal a letter?", "how do I invite my mum?", "how does inheritance work?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: m.role === 'user' ? 'var(--warm)' : 'var(--bone-faint)',
              }}>
                {m.role === 'user' ? 'you' : 'assistant'}
              </span>
              <p style={{
                fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300, lineHeight: 1.7,
                color: m.role === 'user' ? 'var(--bone)' : 'var(--bone-dim)',
                margin: 0, whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </p>
            </div>
          ))}
          {sending && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
              thinking…
            </span>
          )}
        </div>

        {/* input row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type your question…"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 2,
              color: 'var(--bone)', caretColor: 'var(--warm)', fontFamily: 'var(--serif)',
              fontSize: 16, fontWeight: 300, lineHeight: 1.6, padding: '12px 14px',
              outline: 'none', resize: 'none', boxSizing: 'border-box',
            }}
          />
          <button type="button" className="hl-btn" onClick={send} disabled={sending || !input.trim()}>
            send →
          </button>
        </div>

        {/* escalation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={escalate}
            disabled={escalating || messages.length === 0}
            style={{
              background: 'transparent', border: 0, borderLeft: '3px solid var(--warm)',
              padding: '8px 14px', cursor: messages.length === 0 ? 'default' : 'pointer',
              opacity: messages.length === 0 ? 0.4 : 1,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--warm)', touchAction: 'manipulation',
            }}
          >
            {escalating ? 'passing to a person…' : 'talk to a human →'}
          </button>
          {reference && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--bone-dim)' }}>
              reference {reference}
            </span>
          )}
        </div>

        {/* ── Conversation history ───────────────────────────────────────── */}
        {past.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div className="hl-eyebrow" style={{ marginBottom: 14 }}>
              your past conversations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {past.map((c) => {
                const open = openPast === c.id;
                return (
                  <div key={c.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenPast(open ? null : c.id)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'transparent', border: 0,
                        padding: '14px 0', cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'baseline', gap: 16,
                      }}
                    >
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300, color: 'var(--bone)', lineHeight: 1.4 }}>
                        {c.title || 'Support conversation'}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.ticket_number ? 'var(--warm)' : 'var(--bone-faint)', flexShrink: 0 }}>
                        {c.ticket_number ? `ref ${c.ticket_number}` : c.status.toLowerCase()}
                      </span>
                    </button>
                    {open && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 18px', animation: `hl-fade 360ms ${EASE}` }}>
                        {c.messages.map((m, i) => (
                          <div key={i}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: m.role === 'user' ? 'var(--warm)' : 'var(--bone-faint)' }}>
                              {m.role === 'user' ? 'you' : 'assistant'}
                            </span>
                            <p style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 300, lineHeight: 1.65, color: 'var(--bone-dim)', margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>
                              {m.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ClothShell>
  );
}
