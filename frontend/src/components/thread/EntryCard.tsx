import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { ThreadEntry } from '../../services/api';
import { TimeLockBadge } from './TimeLockBadge';

interface Props {
  entry: ThreadEntry;
  /** Index used for staggered fade-in */
  index?: number;
  authorName?: string;
}

const VISIBILITY_LABEL: Record<ThreadEntry['visibility'], string> = {
  PRIVATE: 'Private to author',
  FAMILY: 'Family-only',
  DESCENDANTS: 'Descendants only',
  HISTORIAN: 'Open to historians',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function parseTags(json: string | null): { type: string; label: string }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { type: string; label: string }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function EntryCard({ entry, index = 0, authorName }: Props) {
  const tags = useMemo(() => parseTags(entry.tags_json), [entry.tags_json]);
  const isLocked = !!entry.pending_lock;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
      className="group relative pl-8 pb-8 border-l border-paper/10"
      aria-labelledby={`entry-${entry.id}-title`}
    >
      {/* Date marker on the timeline rail */}
      <div className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-void border border-gold/40 group-hover:border-gold transition-colors" aria-hidden="true" />

      <header className="flex items-baseline gap-3 mb-3 flex-wrap">
        <time
          dateTime={entry.created_at}
          className="font-mono text-xs tracking-wider text-paper/40"
        >
          {formatDate(entry.created_at)}
        </time>
        {entry.era_label || entry.era_year ? (
          <span className="text-xs text-paper/50">
            {entry.era_label ?? entry.era_year}
          </span>
        ) : null}
        <span className="text-xs text-paper/30">{VISIBILITY_LABEL[entry.visibility]}</span>
        {authorName ? <span className="text-xs text-paper/50">— {authorName}</span> : null}
      </header>

      {entry.title ? (
        <h3
          id={`entry-${entry.id}-title`}
          className="font-serif text-2xl text-paper leading-tight mb-3"
        >
          {entry.title}
        </h3>
      ) : (
        <h3 id={`entry-${entry.id}-title`} className="sr-only">
          Entry from {formatDate(entry.created_at)}
        </h3>
      )}

      {isLocked ? (
        <div className="mb-3">
          <TimeLockBadge lockType={entry.pending_lock!} pulse />
        </div>
      ) : null}

      {entry.body_ciphertext && !isLocked ? (
        // The decrypted body is rendered server-side or client-side after key
        // unwrap — for now we surface the locked state explicitly. When we
        // wire encryption, replace this with the decrypted plaintext.
        <p className="text-paper/70 leading-relaxed whitespace-pre-wrap">
          <em className="text-paper/40">[Encrypted body — decryption layer pending]</em>
        </p>
      ) : null}

      {isLocked ? (
        <p className="text-paper/40 text-sm italic">
          The contents will appear here when the unlock condition is met.
        </p>
      ) : null}

      {entry.voice_recording_id ? (
        <p className="text-paper/60 text-sm mt-2">
          🔊 Voice recording attached
        </p>
      ) : null}

      {entry.memory_id ? (
        <p className="text-paper/60 text-sm mt-2">
          🖼 Photo attached
        </p>
      ) : null}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2 mt-4" aria-label="Tagged people, places, and topics">
          {tags.map((tag, i) => (
            <li
              key={`${tag.type}-${tag.label}-${i}`}
              className="text-xs px-2 py-1 rounded-full bg-paper/[0.04] text-paper/60"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      ) : null}
    </motion.article>
  );
}
