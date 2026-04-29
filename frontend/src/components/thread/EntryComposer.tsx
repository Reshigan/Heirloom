import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Send, Loader2, Sparkles } from 'lucide-react';
import { threadsApi, type CreateEntryInput, type LockType, type ThreadMember } from '../../services/api';
import { encryptEntryBody } from '../../utils/threadCrypto';

interface Props {
  threadId: string;
  members: ThreadMember[];
  onCreated: () => void;
}

const LOCK_OPTIONS: { value: 'NONE' | LockType; label: string; help: string }[] = [
  { value: 'NONE', label: 'Open to family now', help: 'Visible to current Thread members immediately.' },
  { value: 'DATE', label: 'Open on a date', help: 'Releases at midnight UTC on the date you choose.' },
  { value: 'AGE', label: "Open at someone's age", help: 'Releases when a Thread member reaches the age you set.' },
  { value: 'AUTHOR_DEATH', label: 'Open after my passing', help: 'Releases after legacy contacts verify, with a 60-day grace period.' },
  { value: 'GENERATION', label: 'Open for a future generation', help: 'Releases once a descendant exists in the Thread.' },
];

export function EntryComposer({ threadId, members, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eraYear, setEraYear] = useState<string>('');
  const [lockKind, setLockKind] = useState<'NONE' | LockType>('NONE');
  const [unlockDate, setUnlockDate] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [targetMemberId, setTargetMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<{ id: string; prompt_text: string }[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);

  useEffect(() => {
    if (showPrompts && prompts.length === 0) {
      threadsApi
        .starterPrompts({ audience: 'parent' })
        .then((res) => setPrompts(res.data.prompts.slice(0, 6)))
        .catch(() => setPrompts([]));
    }
  }, [showPrompts, prompts.length]);

  const reset = () => {
    setTitle('');
    setBody('');
    setEraYear('');
    setLockKind('NONE');
    setUnlockDate('');
    setAgeYears('');
    setTargetMemberId('');
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError('An entry needs a body. Even one sentence.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // AES-GCM encrypt the body under the thread's family key (see
      // utils/threadCrypto.ts). MVP stores the key in localStorage; the
      // production design escrows it under each member's account-derived
      // public key. Cipher + IV + auth tag travel as base64 strings.
      const envelope = await encryptEntryBody(threadId, body.trim());
      const payload: CreateEntryInput = {
        title: title.trim() || undefined,
        body_ciphertext: envelope.body_ciphertext,
        body_iv: envelope.body_iv,
        body_auth_tag: envelope.body_auth_tag,
        era_year: eraYear ? parseInt(eraYear, 10) : undefined,
      };

      if (lockKind !== 'NONE') {
        // Same encryption note: encrypted_key will be the actual escrowed
        // wrap once the keystore is wired. Placeholder for now so the
        // schema constraints don't fail.
        payload.unlock = {
          lock_type: lockKind,
          encrypted_key: 'pending',
        };
        if (lockKind === 'DATE' && unlockDate) payload.unlock.unlock_date = new Date(unlockDate).toISOString();
        if (lockKind === 'AGE') {
          payload.unlock.age_years = parseInt(ageYears, 10) || undefined;
          payload.unlock.target_member_id = targetMemberId || undefined;
        }
      }

      await threadsApi.createEntry(threadId, payload);
      reset();
      setOpen(false);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not save entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left px-6 py-5 rounded-xl border border-paper/10 hover:border-gold/30 bg-paper/[0.02] hover:bg-paper/[0.04] transition-colors group focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-void"
      >
        <span className="font-serif text-xl text-paper/80 group-hover:text-paper transition-colors">
          Add an entry
        </span>
        <span className="block text-paper/40 text-sm mt-1">
          The first one is the hardest. Write one sentence and it gets easier.
        </span>
      </button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onSubmit={submit}
      className="rounded-xl border border-paper/10 bg-paper/[0.02] p-6 space-y-5"
      aria-label="Compose a new thread entry"
    >
      <div>
        <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2" htmlFor="entry-title">
          Title — optional
        </label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="The night the power went out"
          className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40" htmlFor="entry-body">
            What you want to say
          </label>
          <button
            type="button"
            onClick={() => setShowPrompts((v) => !v)}
            className="text-xs text-gold/70 hover:text-gold flex items-center gap-1.5"
          >
            <Sparkles size={12} /> {showPrompts ? 'Hide prompts' : 'Need a prompt?'}
          </button>
        </div>
        <AnimatePresence>
          {showPrompts && prompts.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 grid sm:grid-cols-2 gap-2 overflow-hidden"
            >
              {prompts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setBody((current) => current ? `${current}\n\n${p.prompt_text}` : p.prompt_text)}
                    className="w-full text-left text-sm text-paper/60 hover:text-paper bg-paper/[0.03] hover:bg-paper/[0.06] rounded-lg px-3 py-2 transition-colors"
                  >
                    {p.prompt_text}
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
        <textarea
          id="entry-body"
          required
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start anywhere. A meal you remember. The first time you held your child. A story your grandfather told you that nobody else would have remembered."
          className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition resize-y leading-relaxed"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2" htmlFor="entry-era">
            Era — optional
          </label>
          <input
            id="entry-era"
            type="number"
            inputMode="numeric"
            min={1800}
            max={new Date().getFullYear()}
            value={eraYear}
            onChange={(e) => setEraYear(e.target.value)}
            placeholder="1962"
            className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-[0.2em] text-paper/40 flex items-center gap-2">
          <Lock size={12} /> When does it unlock?
        </legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LOCK_OPTIONS.map((opt) => {
            const selected = lockKind === opt.value;
            return (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-lg border px-4 py-3 transition-colors text-sm focus-within:ring-2 focus-within:ring-gold/40 ${
                  selected
                    ? 'border-gold/50 bg-gold/[0.06] text-paper'
                    : 'border-paper/10 bg-paper/[0.02] text-paper/70 hover:border-paper/20'
                }`}
              >
                <input
                  type="radio"
                  name="lock"
                  value={opt.value}
                  checked={selected}
                  onChange={() => setLockKind(opt.value)}
                  className="sr-only"
                />
                <span className="block font-medium">{opt.label}</span>
                <span className="block text-xs text-paper/40 mt-1">{opt.help}</span>
              </label>
            );
          })}
        </div>

        {lockKind === 'DATE' ? (
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2" htmlFor="lock-date">
              Unlock date
            </label>
            <input
              id="lock-date"
              type="date"
              required
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
              className="bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
            />
          </div>
        ) : null}

        {lockKind === 'AGE' ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2" htmlFor="lock-age-member">
                For whom
              </label>
              <select
                id="lock-age-member"
                required
                value={targetMemberId}
                onChange={(e) => setTargetMemberId(e.target.value)}
                className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
              >
                <option value="">Choose a member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} {m.relation_label ? `(${m.relation_label})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-paper/40 mb-2" htmlFor="lock-age-years">
                When they turn
              </label>
              <input
                id="lock-age-years"
                type="number"
                required
                min={1}
                max={120}
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                placeholder="18"
                className="w-full bg-void/40 border border-paper/10 rounded-lg px-4 py-3 text-paper focus:outline-none focus:border-gold/40 focus:ring-2 focus:ring-gold/20 transition"
              />
            </div>
          </div>
        ) : null}
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-blood">{error}</p>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="px-5 py-3 text-paper/60 hover:text-paper transition-colors focus:outline-none focus:ring-2 focus:ring-paper/30 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-void font-medium rounded-lg hover:bg-gold-bright transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-void"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {submitting ? 'Saving…' : 'Add to thread'}
        </button>
      </div>
    </motion.form>
  );
}
