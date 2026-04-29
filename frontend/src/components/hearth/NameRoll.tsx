/**
 * NameRoll — the family, set as type.
 *
 * Replaces Stone.tsx. Members are not graphic objects; they are names
 * on a list. Newsreader Display, set right-aligned in two columns:
 * the name, and life dates (or "—" for living).
 *
 * State semantics:
 *   - dim:  bone-faint, no underdot
 *   - warm: bone-dim, with a single underdot (a recent contribution)
 *   - lit:  warmth color, no underdot (currently being read)
 *
 * No glow. No halo. No animation other than a 180ms color transition
 * on hover/focus. The list reads as a memorial inscription, not a UI.
 */

export interface RollMember {
  id: string;
  name: string;
  /** "1962-2027" or "1989-" or undefined to omit dates. */
  dates?: string;
  state: 'dim' | 'warm' | 'lit';
  onSelect?: () => void;
}

interface Props {
  members: RollMember[];
  /** Optional title, e.g. the family name. */
  title?: string;
}

export function NameRoll({ members, title }: Props) {
  return (
    <section aria-label={title ? `${title} members` : 'family members'} className="font-serif">
      {title ? (
        <p className="font-mono text-[0.65rem] tracking-[0.32em] uppercase text-[rgba(244,236,216,0.45)] mb-5">
          {title}
        </p>
      ) : null}
      <ul className="space-y-2.5">
        {members.map((m) => {
          const color =
            m.state === 'lit'
              ? '#b07a4a'
              : m.state === 'warm'
                ? 'rgba(244,236,216,0.85)'
                : 'rgba(244,236,216,0.42)';
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={m.onSelect}
                className="w-full grid grid-cols-[1fr_auto] gap-6 items-baseline text-left transition-colors duration-[180ms] focus:outline-none focus-visible:underline underline-offset-4"
                style={{ color }}
              >
                <span
                  className="text-xl md:text-2xl tracking-[-0.008em] relative pb-0.5"
                  style={{
                    fontVariationSettings: '"opsz" 28',
                    fontWeight: 400,
                  }}
                >
                  {m.name}
                  {m.state === 'warm' ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 left-0 inline-block w-1 h-1 rounded-full"
                      style={{ background: 'currentColor', opacity: 0.7 }}
                    />
                  ) : null}
                </span>
                <span
                  className="font-mono text-[0.78rem] tracking-[0.04em] tabular-nums"
                  style={{ color: 'inherit', opacity: 0.55 }}
                >
                  {m.dates ?? ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
