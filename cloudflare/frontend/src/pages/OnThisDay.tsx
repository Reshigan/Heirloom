import { useQuery } from '@tanstack/react-query';
import { Frame } from '../loom/components/Frame';
import { memoryCardsApi } from '../services/api';

// ── Dye swatch colours (10-stop natural-dye palette) ─────────────────────────
const DYE_VARS = [
  'var(--dye-madder)',
  'var(--dye-cochineal)',
  'var(--dye-kermes)',
  'var(--dye-saffron)',
  'var(--dye-weld)',
  'var(--dye-walnut)',
  'var(--dye-oakgall)',
  'var(--dye-woad)',
  'var(--dye-indigo)',
  'var(--dye-iron)',
] as const;

function dyeForType(type: string): string {
  const map: Record<string, string> = {
    memory:  DYE_VARS[0],  // madder
    voice:   DYE_VARS[7],  // woad
    letter:  DYE_VARS[3],  // saffron
  };
  return map[type] ?? DYE_VARS[6]; // oakgall fallback
}

// ── Types ────────────────────────────────────────────────────────────────────
interface OnThisDayMemory {
  id: string;
  type: string;
  title: string;
  description: string;
  photoUrl?: string | null;
  date: string;
  yearsAgo: number;
}

// ── Component ────────────────────────────────────────────────────────────────
export function OnThisDay() {
  const { data, isLoading } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => memoryCardsApi.getOnThisDay().then((r) => r.data).catch(() => null),
  });

  const memories: OnThisDayMemory[] = [
    ...((data as any)?.memoriesFromThisDay || []),
    ...((data as any)?.createdOnThisDay || []),
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <Frame left="on this day">
      <div
        style={{
          padding: '48px 48px 80px',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 36,
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 8px',
            lineHeight: 1.1,
          }}
        >
          On this day.
        </h1>

        <p
          className="hl-mono"
          style={{
            fontSize: 11,
            color: 'var(--bone-faint)',
            margin: '0 0 32px',
            letterSpacing: '0.04em',
          }}
        >
          {dateStr}
        </p>

        {/* ── States ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div
            style={{
              height: 1,
              background: 'var(--warm)',
              width: 120,
              opacity: 0.5,
              marginTop: 40,
            }}
          />
        ) : !memories.length ? (
          <p
            className="hl-prose hl-italic"
            style={{
              fontSize: 15,
              color: 'var(--bone-faint)',
              margin: 0,
            }}
          >
            nothing written on this date yet
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {memories.map((memory) => (
              <li
                key={memory.id}
                style={{
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 22,
                  marginBottom: 22,
                }}
              >
                {/* year label */}
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--warm)',
                    margin: '0 0 6px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {new Date(memory.date).getFullYear()}
                  {memory.yearsAgo > 0
                    ? ` · ${memory.yearsAgo === 1 ? '1 year ago' : `${memory.yearsAgo} years ago`}`
                    : ''}
                </p>

                {/* title */}
                <h2
                  className="hl-serif"
                  style={{
                    fontSize: 18,
                    fontWeight: 300,
                    color: 'var(--bone)',
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {memory.title}
                </h2>

                {/* excerpt */}
                {memory.description && (
                  <p
                    className="hl-prose"
                    style={{
                      fontSize: 15,
                      color: 'var(--bone-dim)',
                      margin: '8px 0 0',
                      lineHeight: 1.7,
                      maxWidth: '60ch',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {memory.description}
                  </p>
                )}

                {/* dye swatch 12×2 */}
                <div
                  aria-hidden
                  style={{
                    marginTop: 10,
                    width: 12,
                    height: 2,
                    background: dyeForType(memory.type),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  );
}

export default OnThisDay;
