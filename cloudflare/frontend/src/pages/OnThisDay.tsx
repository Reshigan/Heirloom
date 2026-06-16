import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ClothShell } from '../loom/components/ClothShell';
import { memoryCardsApi, aiApi } from '../services/api';
import { CosmicHeader, EntryRow, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId } from '../loom/dye';
import type { Dye } from '../loom/dye';

// ── Dye resolution — map entry type to a canonical dye name ──────────────────
const TYPE_DYE: Record<string, Dye> = {
  memory: 'madder',
  voice:  'woad',
  letter: 'saffron',
};

function dyeForType(type: string): Dye {
  return TYPE_DYE[type] ?? 'oakgall';
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

function memoryTo(memory: OnThisDayMemory): string {
  if (memory.type === 'voice') return `/loom/voice?id=${memory.id}`;
  if (memory.type === 'letter') return `/loom/letter?id=${memory.id}`;
  return `/loom/read?entry=${memory.id}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export function OnThisDay() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => memoryCardsApi.getOnThisDay().then((r) => r.data).catch(() => null),
  });

  const memories: OnThisDayMemory[] = [
    ...((data as any)?.memoriesFromThisDay || []),
    ...((data as any)?.createdOnThisDay || []),
  ];

  const { data: narrationData } = useQuery({
    queryKey: ['on-this-day-narration', memories.map((m) => m.id).join(',')],
    enabled: memories.length > 0,
    queryFn: () =>
      aiApi
        .onThisDayNarration(
          memories.slice(0, 5).map((m) => ({
            title: m.title,
            description: m.description,
            yearsAgo: m.yearsAgo,
            type: m.type,
          }))
        )
        .then((r) => (r.data as any)?.narration as string | null)
        .catch(() => null),
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  // Eyebrow: count + date
  const eyebrow = isLoading
    ? dateStr.toUpperCase()
    : memories.length > 0
    ? `${memories.length} ${memories.length === 1 ? 'MEMORY' : 'MEMORIES'} · ${dateStr.toUpperCase()}`
    : dateStr.toUpperCase();

  return (
    <ClothShell
      topbarLeft={
        <Link
          to="/loom/index"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          ← heirloom
        </Link>
      }
      topbarCenter="on this day"
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
        }}
      >
        {/* ── CosmicHeader ─────────────────────────────────────────────── */}
        <CosmicHeader
          eyebrow={eyebrow}
          title="On this day."
          sub={narrationData ?? undefined}
        />

        {/* ── Loading state ────────────────────────────────────────────── */}
        {isLoading && (
          <progress
            aria-label="Loading"
            style={{
              display: 'block',
              width: 120,
              height: 1,
              appearance: 'none',
              WebkitAppearance: 'none',
              border: 'none',
              background: 'var(--rule)',
              color: 'var(--warm)',
              opacity: 0.6,
              marginTop: 40,
            }}
          />
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!isLoading && !memories.length && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 17,
                color: 'var(--bone-dim)',
                margin: '0 0 24px',
                lineHeight: 1.6,
              }}
            >
              nothing written on this date yet
            </p>
            <Link
              to="/compose"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--bone-dim)',
                textDecoration: 'none',
                transition: 'color 180ms var(--ease)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--warm)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
            >
              write one →
            </Link>
          </div>
        )}

        {/* ── Ledger rows ──────────────────────────────────────────────── */}
        {!isLoading && memories.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {memories.map((memory) => {
              const year = new Date(memory.date).getFullYear();
              const yearsAgoLabel =
                memory.yearsAgo > 0
                  ? `${memory.yearsAgo === 1 ? '1 yr ago' : `${memory.yearsAgo} yrs ago`}`
                  : undefined;
              const dye = dyeForType(memory.type) ?? dyeForId(memory.id);

              return (
                <EntryRow
                  key={memory.id}
                  title={memory.title}
                  sub={memory.description || undefined}
                  year={yearsAgoLabel ? `${year} · ${yearsAgoLabel}` : String(year)}
                  author={memory.type.toUpperCase()}
                  dye={dye}
                  onClick={() => navigate(memoryTo(memory))}
                />
              );
            })}
          </div>
        )}

        {/* ── WaxSeal foot ─────────────────────────────────────────────── */}
        {!isLoading && (
          <div style={{ marginTop: 72, marginBottom: 16 }}>
            <WaxSeal size={28} />
          </div>
        )}
      </div>
    </ClothShell>
  );
}

export default OnThisDay;
