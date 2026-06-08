import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { familyApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  notes?: string;
  dye?: string;
  role?: string;
  status?: string;
  recentMemories: any[];
  recentLetters: any[];
  recentVoiceRecordings: any[];
}

interface PersonPrompt {
  id: string;
  prompt: string;
  category: string;
}

const DYE_VARS: Record<string, string> = {
  madder:    'var(--dye-madder)',
  cochineal: 'var(--dye-cochineal)',
  kermes:    'var(--dye-kermes)',
  saffron:   'var(--dye-saffron)',
  weld:      'var(--dye-weld)',
  walnut:    'var(--dye-walnut)',
  oakgall:   'var(--dye-oakgall)',
  woad:      'var(--dye-woad)',
  indigo:    'var(--dye-indigo)',
  iron:      'var(--dye-iron)',
};

function entryTo(kind: string, id: string): string {
  if (kind === 'voice') return `/loom/voice?id=${id}`;
  if (kind === 'letter') return `/loom/letter?id=${id}`;
  return `/loom/read?entry=${id}`;
}

/** 12×2 dye swatch used in the entries list */
function DyeSwatch({ dye }: { dye?: string }) {
  const color = dye ? (DYE_VARS[dye] ?? 'var(--rule-strong)') : 'var(--rule-strong)';
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 12,
        height: 2,
        background: color,
        flexShrink: 0,
        alignSelf: 'center',
      }}
    />
  );
}

export function PersonPage() {
  const { id } = useParams<{ id: string }>();

  const { data: member, isLoading } = useQuery<FamilyMember>({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: prompts } = useQuery<{ prompts: PersonPrompt[] }>({
    queryKey: ['person-prompts', id],
    queryFn: () => api.get(`/api/ai/person-prompts/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  // Combine all entries into a unified flat list for the right column
  const allEntries: Array<{ id: string; title: string; date: string; dye?: string; kind: string }> = [
    ...(member?.recentLetters ?? []).map((l: any) => ({
      id: l.id,
      title: l.title || 'Untitled letter',
      date: l.created_at,
      dye: member?.dye ?? undefined,
      kind: 'letter',
    })),
    ...(member?.recentMemories ?? []).map((m: any) => ({
      id: m.id,
      title: m.title || 'Memory',
      date: m.created_at,
      dye: member?.dye ?? undefined,
      kind: 'memory',
    })),
    ...(member?.recentVoiceRecordings ?? []).map((v: any) => ({
      id: v.id,
      title: v.title || 'Voice recording',
      date: v.created_at,
      dye: member?.dye ?? undefined,
      kind: 'voice',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: 'person' }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
        <div
          style={{
            paddingTop: 80,
            paddingBottom: 36,
            paddingLeft: 56,
            paddingRight: 56,
          }}
        >
          <p
            className="hl-mono"
            style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            loading…
          </p>
        </div>
      </ClothShell>
    );
  }

  if (!member) {
    return (
      <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: 'person' }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
        <div
          style={{
            paddingTop: 80,
            paddingBottom: 36,
            paddingLeft: 56,
            paddingRight: 56,
          }}
        >
          <Link
            to="/family"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 28,
            }}
          >
            ← back to family
          </Link>
          <p
            className="hl-serif hl-italic"
            style={{ fontSize: 16, color: 'var(--bone-faint)' }}
          >
            person not found.
          </p>
        </div>
      </ClothShell>
    );
  }

  const dyeColor = member.dye ? (DYE_VARS[member.dye] ?? null) : null;
  const roleLabel = member.role ?? member.status ?? null;

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: member.name }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
      <div
        style={{
          paddingTop: 80,
          paddingBottom: 36,
          paddingLeft: 'clamp(20px, 5vw, 56px)',
          paddingRight: 'clamp(20px, 5vw, 56px)',
        }}
      >
        {/* Two-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 56,
            alignItems: 'start',
          }}
        >
          {/* ── LEFT COLUMN ────────────────────────────────────── */}
          <div>
            {/* Back link */}
            <Link
              to="/family"
              className="hl-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--warm)',
                textDecoration: 'none',
                display: 'inline-block',
                marginBottom: 28,
              }}
            >
              ← back to family
            </Link>

            {/* Name */}
            <h1
              className="hl-serif"
              style={{
                fontSize: 38,
                fontWeight: 300,
                margin: 0,
                color: 'var(--bone)',
                lineHeight: 1.1,
              }}
            >
              {member.name}
            </h1>

            {/* Relationship */}
            <p
              className="hl-mono"
              style={{
                fontSize: 10.5,
                color: 'var(--bone-faint)',
                marginTop: 6,
                marginBottom: 0,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {member.relationship}
            </p>

            {/* Bio / notes */}
            {member.notes && (
              <p
                className="hl-prose"
                style={{
                  fontSize: 16,
                  marginTop: 20,
                  marginBottom: 0,
                  color: 'var(--bone-dim)',
                }}
              >
                {member.notes}
              </p>
            )}

            {/* Dye signature */}
            {member.dye && dyeColor && (
              <div
                style={{
                  marginTop: 28,
                  borderLeft: `1px solid ${dyeColor}`,
                  paddingLeft: 16,
                }}
              >
                <p
                  className="hl-serif hl-italic"
                  style={{
                    fontSize: 14,
                    color: 'var(--bone-dim)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  assigned dye: {member.dye}
                </p>
              </div>
            )}

            {/* Role / status badge */}
            {roleLabel && (
              <span
                className="hl-mono"
                style={{
                  display: 'inline-block',
                  fontSize: 9.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-low)',
                  border: '1px solid var(--rule)',
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                  marginTop: 12,
                }}
              >
                {roleLabel}
              </span>
            )}
          </div>

          {/* ── RIGHT COLUMN ───────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <p
              className="hl-eyebrow"
              style={{ marginBottom: 16, marginTop: 0 }}
            >
              their entries
            </p>

            {/* Entry list */}
            {allEntries.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allEntries.map((entry) => (
                  <li
                    key={`${entry.kind}-${entry.id}`}
                    style={{
                      borderBottom: '1px solid var(--rule)',
                    }}
                  >
                    <Link
                      to={entryTo(entry.kind, entry.id)}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        paddingTop: 14,
                        paddingBottom: 14,
                      }}
                    >
                      <DyeSwatch dye={entry.dye} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="hl-serif"
                          style={{
                            fontSize: 15,
                            fontWeight: 300,
                            color: 'var(--bone)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.title}
                        </p>
                        <p
                          className="hl-mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--bone-faint)',
                            margin: '3px 0 0',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {entry.date
                            ? new Date(entry.date).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="hl-serif hl-italic"
                style={{
                  fontSize: 15,
                  color: 'var(--bone-faint)',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                no entries visible
              </p>
            )}

            {/* Prompt suggestions — preserved API data, rendered quietly */}
            {prompts?.prompts?.length ? (
              <div style={{ marginTop: 40 }}>
                <p className="hl-eyebrow" style={{ marginBottom: 16 }}>
                  suggested starts
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {prompts.prompts.slice(0, 3).map((prompt) => (
                    <li
                      key={prompt.id}
                      style={{
                        borderBottom: '1px solid var(--rule)',
                        paddingTop: 14,
                        paddingBottom: 14,
                      }}
                    >
                      <p
                        className="hl-serif hl-italic"
                        style={{
                          fontSize: 14,
                          color: 'var(--bone-dim)',
                          margin: 0,
                          fontStyle: 'italic',
                        }}
                      >
                        "{prompt.prompt}"
                        <Link
                          to={`/compose?prompt=${encodeURIComponent(prompt.prompt)}&recipientId=${id}`}
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 9,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
                            textDecoration: 'none',
                            borderBottom: '1px solid var(--rule)',
                            paddingBottom: 1,
                            marginLeft: 8,
                          }}
                        >
                          write this →
                        </Link>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
