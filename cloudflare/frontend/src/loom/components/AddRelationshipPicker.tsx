import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../../services/api';
import { handleRadioArrowKeys } from '../../hooks/useRadioArrowKeys';
import type { FamilyMember, RelationshipType } from '../../types';

// Add a typed family-tree edge between two members (parent/child/spouse/sibling)
// with an optional freeform label. Shared by Family.tsx (member row) and
// PersonPage.tsx (kin section) so the two surfaces stay in lockstep.
//
// `selfId` is the member the picker was opened from — it is the implicit
// "from" of the edge and is excluded from the target list. The caller passes
// the full roster; soft-deleted members are filtered here.
//
// Design: bone-on-ink hairline fields, mono labels, 4-type radio with arrow-key
// roving (handleRadioArrowKeys). No icons, no fills, no swatches — the same
// quiet roster language as the rest of the Family page.
const TYPES: { key: RelationshipType; label: string }[] = [
  { key: 'parent', label: 'parent' },
  { key: 'child', label: 'child' },
  { key: 'spouse', label: 'spouse' },
  { key: 'sibling', label: 'sibling' },
];

export function AddRelationshipPicker({
  selfId,
  members,
  onClose,
}: {
  selfId: string;
  members: FamilyMember[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState<RelationshipType>('parent');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const targets = members.filter((m) => m.id !== selfId && !m.pendingDeletion);

  const add = useMutation({
    mutationFn: () =>
      familyApi.addRelationship({
        fromMemberId: selfId,
        toMemberId: targetId,
        type,
        label: label.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['family'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not add the link.');
    },
  });

  const submit = () => {
    setError(null);
    if (!targetId) {
      setError('Choose who this links to.');
      return;
    }
    add.mutate();
  };

  return (
    <div style={{ padding: '4px 0 18px 0', display: 'grid', gap: 10 }}>
      <label style={{ display: 'block' }}>
        <span className="hl-mono" style={{ display: 'block', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 8 }}>
          link to
        </span>
        <select
          value={targetId}
          onChange={(e) => { setTargetId(e.target.value); setError(null); }}
          aria-label="Link to"
          disabled={targets.length === 0}
          style={{
            width: '100%', background: 'transparent', border: 0,
            borderBottom: '1px solid var(--rule)', outline: 'none', padding: '6px 0',
            fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)',
            borderRadius: 0, boxSizing: 'border-box',
            appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          <option value="" disabled style={{ color: 'var(--bone-faint)', background: 'var(--ink)' }}>
            {targets.length === 0 ? 'no other members yet' : 'choose a name'}
          </option>
          {targets.map((m) => (
            <option key={m.id} value={m.id} style={{ color: 'var(--bone)', background: 'var(--ink)' }}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <div role="radiogroup" aria-label="relationship type" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', paddingTop: 4 }}>
        {TYPES.map((t, i, arr) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={type === t.key}
            tabIndex={type === t.key ? 0 : -1}
            onClick={() => { setType(t.key); setError(null); }}
            onKeyDown={(e) => handleRadioArrowKeys(e, i, arr.length, (next) => setType(arr[next].key))}
            style={{
              background: 'transparent', border: 0, padding: '4px 0', cursor: 'pointer',
              borderBottom: type === t.key ? '1px solid var(--warm)' : '1px solid transparent',
              fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: type === t.key ? 'var(--warm)' : 'var(--bone-dim)',
              transition: 'color 180ms var(--ease)', touchAction: 'manipulation', minHeight: 36,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label style={{ display: 'block' }}>
        <span className="hl-mono" style={{ display: 'block', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 8 }}>
          label — optional
        </span>
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(null); }}
          placeholder="mother · step-father · chosen sister"
          aria-label="Relationship label"
          style={{
            width: '100%', background: 'transparent', border: 0,
            borderBottom: '1px solid var(--rule)', outline: 'none', padding: '6px 0',
            fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
        />
      </label>

      {error && (
        <p role="alert" className="hl-mono" style={{ fontSize: 11, color: 'var(--warm)', letterSpacing: '0.14em', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 2 }}>
        <button
          type="button"
          className="hl-btn"
          onClick={submit}
          disabled={add.isPending}
          style={{ fontSize: 13, padding: '8px 16px', opacity: add.isPending ? 0.5 : 1 }}
        >
          {add.isPending ? 'linking…' : 'lower the link →'}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', padding: '8px 0', touchAction: 'manipulation' }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}

// Human-readable summary of one edge from the perspective of `memberId`.
// "mother of Ava", "spouse of Ben", "child of Sam" — the label wins when set.
export function relationshipLine(
  edge: { fromMemberId: string; toMemberId: string; fromName?: string | null; toName?: string | null; type: RelationshipType; label?: string | null },
  memberId: string,
): string {
  const isFrom = edge.fromMemberId === memberId;
  const otherName = (isFrom ? edge.toName : edge.fromName) ?? 'someone';
  if (edge.label?.trim()) return `${edge.label.trim()} of ${otherName}`;
  // No explicit label → derive from type + direction.
  switch (edge.type) {
    case 'parent': return isFrom ? `parent of ${otherName}` : `child of ${otherName}`;
    case 'child': return isFrom ? `child of ${otherName}` : `parent of ${otherName}`;
    case 'spouse': return `spouse of ${otherName}`;
    case 'sibling': return `sibling of ${otherName}`;
  }
}