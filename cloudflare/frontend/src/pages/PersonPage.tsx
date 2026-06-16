import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { familyApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { type FamilyMember } from '../types';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeColor, dyeFromMetadata, type Dye } from '../loom/dye';

interface RecentEntry {
  id: string;
  content?: string;
  title?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface PersonMember extends FamilyMember {
  recentMemories: RecentEntry[];
  recentLetters: RecentEntry[];
  recentVoiceRecordings: RecentEntry[];
}

interface PersonPrompt {
  id: string;
  prompt: string;
  category: string;
}

function entryTo(kind: string, id: string): string {
  if (kind === 'voice') return `/loom/voice?id=${id}`;
  if (kind === 'letter') return `/loom/letter?id=${id}`;
  return `/loom/read?entry=${id}`;
}

const PAGE_WRAP: React.CSSProperties = {
  padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
  maxWidth: 'var(--page-max)',
  margin: '0 auto',
};

const BACK_LINK: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--warm)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 32,
};

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const { data: member, isLoading } = useQuery<PersonMember>({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const updateMember = useMutation({
    mutationFn: () =>
      familyApi.update(id!, {
        name: editName.trim(),
        relationship: editRelationship.trim(),
        email: editEmail.trim() || undefined,
        notes: editNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      queryClient.invalidateQueries({ queryKey: ['family'] });
      setIsEditing(false);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error ?? 'Could not save changes.');
    },
  });

  const openEdit = () => {
    if (!member) return;
    setEditName(member.name ?? '');
    setEditRelationship(member.relationship ?? '');
    setEditEmail(member.email ?? '');
    setEditNotes(member.notes ?? '');
    setEditError(null);
    setIsEditing(true);
  };

  const { data: prompts } = useQuery<{ prompts: PersonPrompt[] }>({
    queryKey: ['person-prompts', id],
    queryFn: () => api.get(`/api/ai/person-prompts/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

  // Combine all entries into a unified flat list, newest first.
  const allEntries: Array<{ id: string; title: string; date: string; dye: Dye; kind: string }> = [
    ...(member?.recentLetters ?? []).map((l) => ({
      id: l.id,
      title: (l.title as string | undefined) || 'Untitled letter',
      date: l.createdAt,
      dye: (dyeFromMetadata(l.metadata) ?? (member?.dye as Dye | undefined)) as Dye,
      kind: 'letter',
    })),
    ...(member?.recentMemories ?? []).map((m) => ({
      id: m.id,
      title: (m.title as string | undefined) || 'Memory',
      date: m.createdAt,
      dye: (dyeFromMetadata(m.metadata) ?? (member?.dye as Dye | undefined)) as Dye,
      kind: 'memory',
    })),
    ...(member?.recentVoiceRecordings ?? []).map((v) => ({
      id: v.id,
      title: (v.title as string | undefined) || 'Voice recording',
      date: v.createdAt,
      dye: (dyeFromMetadata(v.metadata) ?? (member?.dye as Dye | undefined)) as Dye,
      kind: 'voice',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── LOADING ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: 'person' }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
        <div style={PAGE_WRAP}>
          <p
            style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}
          >
            reading the thread…
          </p>
        </div>
      </ClothShell>
    );
  }

  // ── NOT FOUND ────────────────────────────────────────────
  if (!member) {
    return (
      <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: 'person' }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
        <div style={PAGE_WRAP}>
          <Link to="/family" style={BACK_LINK}>
            ← back to family
          </Link>
          <p
            style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 17, lineHeight: 1.55, color: 'var(--bone-dim)', margin: 0, maxWidth: '30em' }}
          >
            That person is not in this thread.
          </p>
        </div>
      </ClothShell>
    );
  }

  const personDye = (member.dye as Dye | undefined) ?? undefined;
  const dyeStroke = personDye ? dyeColor(member.id, { dye: personDye }) : 'var(--rule)';
  const roleLabel = member.role ?? member.status ?? null;

  // BORN <year> / role / relationship subline
  const subParts: string[] = [];
  if (member.relationship) subParts.push(member.relationship);
  if (roleLabel) subParts.push(String(roleLabel));
  if (member.email) subParts.push(member.email);
  const headerSub = subParts.length ? subParts.join('  ·  ') : undefined;

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'family', to: '/family' }, { label: member.name }]} />} topbarCenter="person" topbarRight={<UserMenu />}>
      <div style={PAGE_WRAP}>
        <Link to="/family" style={BACK_LINK}>
          ← back to family
        </Link>

        {/* ── HEADER (READING) ── dye margin thread + serif name + mono warm subline + serif-italic bio ── */}
        {isEditing ? (
          <div style={{ borderLeft: `3px solid ${dyeStroke}`, paddingLeft: 24, marginBottom: 8 }}>
            <input
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
              placeholder="name"
              aria-label="Name"
              autoFocus
              style={{
                display: 'block', width: '100%', background: 'transparent',
                border: 0, borderBottom: '1px solid var(--rule)', outline: 'none',
                fontFamily: 'var(--serif)', fontSize: 'clamp(30px, 6vw, 44px)', color: 'var(--bone)',
                fontWeight: 400, padding: '4px 0 8px', boxSizing: 'border-box',
                lineHeight: 1.1, caretColor: 'var(--warm)',
              }}
            />
            <input
              value={editRelationship}
              onChange={(e) => { setEditRelationship(e.target.value); setEditError(null); }}
              placeholder="relationship"
              aria-label="Relationship"
              style={{
                display: 'block', width: '100%', background: 'transparent',
                border: 0, borderBottom: '1px solid var(--rule)', outline: 'none',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-faint)',
                letterSpacing: '0.26em', textTransform: 'uppercase',
                padding: '10px 0 8px', boxSizing: 'border-box', marginTop: 16,
                caretColor: 'var(--warm)',
              }}
            />
            <input
              type="email"
              value={editEmail}
              onChange={(e) => { setEditEmail(e.target.value); setEditError(null); }}
              placeholder="email — optional"
              aria-label="Email (optional)"
              style={{
                display: 'block', width: '100%', background: 'transparent',
                border: 0, borderBottom: '1px solid var(--rule)', outline: 'none',
                fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)',
                padding: '10px 0 8px', boxSizing: 'border-box', marginTop: 14,
                caretColor: 'var(--warm)',
              }}
            />
            <textarea
              value={editNotes}
              onChange={(e) => { setEditNotes(e.target.value); setEditError(null); }}
              placeholder="notes — optional"
              aria-label="Notes (optional)"
              rows={3}
              style={{
                display: 'block', width: '100%', background: 'transparent',
                border: 0, borderBottom: '1px solid var(--rule)', outline: 'none',
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)',
                padding: '10px 0 8px', boxSizing: 'border-box', marginTop: 14,
                resize: 'none', lineHeight: 1.6, caretColor: 'var(--warm)',
              }}
            />
            {editError && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)', letterSpacing: '0.14em', margin: '12px 0 0' }}>
                {editError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => updateMember.mutate()}
                disabled={!editName.trim() || !editRelationship.trim() || updateMember.isPending}
                style={{
                  background: 'transparent', border: 0, padding: 0,
                  cursor: (!editName.trim() || !editRelationship.trim() || updateMember.isPending) ? 'default' : 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--warm)',
                  letterSpacing: '0.26em', textTransform: 'uppercase', minHeight: 44,
                  opacity: (!editName.trim() || !editRelationship.trim() || updateMember.isPending) ? 0.4 : 1,
                }}
              >
                {updateMember.isPending ? 'holding…' : 'hold changes →'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditError(null); }}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-faint)',
                  letterSpacing: '0.26em', textTransform: 'uppercase', minHeight: 44,
                }}
              >
                cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderLeft: `3px solid ${dyeStroke}`, paddingLeft: 24, marginBottom: 8 }}>
            <CosmicHeader
              eyebrow={headerSub}
              title={member.name}
              sub={member.notes || undefined}
            />
            <button
              type="button"
              onClick={openEdit}
              style={{
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--bone-faint)',
                letterSpacing: '0.26em', textTransform: 'uppercase',
                marginTop: 4, display: 'inline-block', minHeight: 44,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warm)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-faint)'; }}
            >
              edit profile →
            </button>
          </div>
        )}

        {/* ── LEDGER (their entries) ── */}
        <div style={{ marginTop: 52 }}>
          <SectionLabel>their entries</SectionLabel>
          {allEntries.length > 0 ? (
            <div>
              {allEntries.map((entry) => (
                <EntryRow
                  key={`${entry.kind}-${entry.id}`}
                  title={entry.title}
                  dye={entry.dye}
                  year={entry.date ? new Date(entry.date).getFullYear() : undefined}
                  author={entry.kind.toUpperCase()}
                  onClick={() => navigate(entryTo(entry.kind, entry.id))}
                />
              ))}
            </div>
          ) : (
            <p
              style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 300, fontSize: 16, color: 'var(--bone-dim)', margin: '24px 0 0', maxWidth: '30em' }}
            >
              No entries woven yet — this thread is waiting to be written.
            </p>
          )}

          {/* Suggested starts — preserved AI prompt data */}
          {prompts?.prompts?.length ? (
            <div style={{ marginTop: 48 }}>
              <SectionLabel>suggested starts</SectionLabel>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {prompts.prompts.slice(0, 3).map((prompt) => (
                  <li
                    key={prompt.id}
                    style={{ borderBottom: '1px solid var(--rule)', padding: '15px 0' }}
                  >
                    <p
                      style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--bone-dim)', margin: 0, lineHeight: 1.5 }}
                    >
                      “{prompt.prompt}”
                      <Link
                        to={`/compose?prompt=${encodeURIComponent(prompt.prompt)}&recipientId=${id}`}
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          textDecoration: 'none',
                          marginLeft: 12,
                          whiteSpace: 'nowrap',
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

        <div style={{ marginTop: 64 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}
