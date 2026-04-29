import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Users, ChevronDown } from 'lucide-react';
import { threadsApi, type ThreadMember, type ThreadRole } from '../../services/api';

interface Props {
  threadId: string;
  members: ThreadMember[];
  callerRole: ThreadRole | null;
  onChanged: () => void;
}

const ROLE_LABEL: Record<ThreadRole, string> = {
  FOUNDER: 'Founder',
  SUCCESSOR: 'Successor',
  AUTHOR: 'Author',
  READER: 'Reader',
  PLACEHOLDER: 'Placeholder',
};

const ROLE_HELP: Record<Exclude<ThreadRole, 'FOUNDER'>, string> = {
  SUCCESSOR: 'Inherits administrative authority on the Founder\'s passing. Can grant authorship, designate successors.',
  AUTHOR: 'Can write into the Thread. Cannot grant membership.',
  READER: 'Can read entries within their visibility level. Cannot write.',
  PLACEHOLDER: 'A future member — child not yet of age, descendant not yet born. Auto-promotes when conditions are met.',
};

export function MembersPanel({ threadId, members, callerRole, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    relation_label: '',
    role: 'AUTHOR' as Exclude<ThreadRole, 'FOUNDER'>,
    age_gate_years: '',
    target_role: 'AUTHOR' as 'AUTHOR' | 'READER',
    birth_date: '',
  });

  const canInvite = callerRole === 'FOUNDER' || callerRole === 'SUCCESSOR';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await threadsApi.addMember(threadId, {
        display_name: form.display_name.trim(),
        email: form.email.trim() || undefined,
        relation_label: form.relation_label.trim() || undefined,
        role: form.role,
        age_gate_years: form.role === 'PLACEHOLDER' && form.age_gate_years
          ? parseInt(form.age_gate_years, 10)
          : undefined,
        target_role: form.role === 'PLACEHOLDER' ? form.target_role : undefined,
        birth_date: form.birth_date || undefined,
      });
      setForm({
        display_name: '',
        email: '',
        relation_label: '',
        role: 'AUTHOR',
        age_gate_years: '',
        target_role: 'AUTHOR',
        birth_date: '',
      });
      setInviting(false);
      onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border border-rule rounded-xl" aria-label="Thread members">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <Users size={16} className="text-paper/40" />
          <span className="font-serif text-xl">Members</span>
          <span className="font-mono text-xs text-paper/40 ml-2">
            {members.length} active
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-paper/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-rule">
              <ul className="divide-y divide-rule mt-4">
                {members.map((m) => (
                  <li key={m.id} className="py-4 flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-paper">
                        {m.display_name}
                        {m.relation_label ? (
                          <span className="text-paper/45 text-sm font-sans ml-2 italic">— {m.relation_label}</span>
                        ) : null}
                      </p>
                      {m.email ? (
                        <p className="text-paper/50 text-sm font-mono">{m.email}</p>
                      ) : null}
                      {m.role === 'PLACEHOLDER' && m.age_gate_years ? (
                        <p className="text-paper/45 text-xs mt-1 italic">
                          Auto-promotes to {m.target_role?.toLowerCase() ?? 'reader'} at age {m.age_gate_years}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[0.65rem] tracking-[0.28em] uppercase text-gold/75 whitespace-nowrap">
                      {ROLE_LABEL[m.role]}
                    </span>
                  </li>
                ))}
              </ul>

              {canInvite ? (
                <div className="mt-6 pt-6 border-t border-rule">
                  {inviting ? (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={submit}
                      className="space-y-5"
                      aria-label="Invite a member"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="Name"
                          id="m-name"
                          required
                          value={form.display_name}
                          onChange={(v) => setForm({ ...form, display_name: v })}
                          placeholder="Maya Mahmood"
                        />
                        <Field
                          label="Email — optional"
                          id="m-email"
                          type="email"
                          value={form.email}
                          onChange={(v) => setForm({ ...form, email: v })}
                          placeholder="maya@example.com"
                        />
                      </div>
                      <Field
                        label="Relation — optional"
                        id="m-rel"
                        value={form.relation_label}
                        onChange={(v) => setForm({ ...form, relation_label: v })}
                        placeholder="daughter, brother, granddaughter…"
                      />
                      <fieldset>
                        <legend className="text-xs uppercase tracking-[0.22em] text-paper/45 mb-2.5">Role</legend>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {(['AUTHOR', 'SUCCESSOR', 'READER', 'PLACEHOLDER'] as const).map((r) => {
                            const selected = form.role === r;
                            return (
                              <label
                                key={r}
                                className={`cursor-pointer rounded-lg border px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-gold/40 transition-colors ${
                                  selected
                                    ? 'border-gold/55 bg-gold/[0.05]'
                                    : 'border-rule bg-paper/[0.015] hover:border-rule-strong'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="role"
                                  className="sr-only"
                                  checked={selected}
                                  onChange={() => setForm({ ...form, role: r })}
                                />
                                <span className="block font-medium text-paper">{ROLE_LABEL[r]}</span>
                                <span className="block text-xs text-paper/45 mt-1 leading-snug">{ROLE_HELP[r]}</span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      {form.role === 'PLACEHOLDER' ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field
                            label="Auto-promote at age"
                            id="m-age"
                            type="number"
                            value={form.age_gate_years}
                            onChange={(v) => setForm({ ...form, age_gate_years: v })}
                            placeholder="18"
                          />
                          <Field
                            label="Birth date"
                            id="m-birth"
                            type="date"
                            value={form.birth_date}
                            onChange={(v) => setForm({ ...form, birth_date: v })}
                          />
                        </div>
                      ) : null}

                      {error ? <p role="alert" className="text-blood-light text-sm">{error}</p> : null}

                      <div className="flex justify-end gap-3 pt-4 border-t border-rule">
                        <button type="button" onClick={() => setInviting(false)} className="btn btn-ghost">
                          Cancel
                        </button>
                        <button type="submit" disabled={submitting || !form.display_name.trim()} className="btn btn-primary">
                          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                          {submitting ? 'Adding…' : 'Add to thread'}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <button type="button" onClick={() => setInviting(true)} className="btn btn-secondary">
                      <Plus size={16} /> Add a member
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.22em] text-paper/45 mb-2.5">
        {label}
        {required ? <span className="text-blood-light/70 ml-1" aria-hidden>*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}
