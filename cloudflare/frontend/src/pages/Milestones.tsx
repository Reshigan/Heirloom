import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId } from '../loom/dye';
import { useFocusTrap } from '../lib/useFocusTrap';
import { milestonesApi } from '../services/api';

const milestoneTypes = [
  { id: 'birthday', name: 'Birthday' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'death_anniversary', name: 'Remembrance' },
  { id: 'wedding', name: 'Wedding' },
  { id: 'graduation', name: 'Graduation' },
  { id: 'custom', name: 'Custom' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--hairline-3)',
  borderRadius: 0,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'var(--copper-label)',
  marginBottom: 10,
};

// quiet mono text affordance — replaces every icon/button chrome on a row
const monoAffordance: React.CSSProperties = {
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--muted-2)',
  transition: 'color 180ms var(--ease)',
};

export function Milestones() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createModalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    type: 'birthday',
    name: '',
    date: '',
    recurring: true,
    reminderDays: 7,
    promptSuggestion: '',
  });

  // Create overlay = a modal: canonical focus trap, close on Escape, focus first field.
  useFocusTrap(createModalRef, () => setShowCreateModal(false), showCreateModal);

  const { data: milestones, isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => milestonesApi.getAll().then(r => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['upcomingMilestones'],
    queryFn: () => milestonesApi.getUpcoming().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => milestonesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
      setShowCreateModal(false);
      setFormData({ type: 'birthday', name: '', date: '', recurring: true, reminderDays: 7, promptSuggestion: '' });
    },
    onError: (err) => { setError(err instanceof Error ? err.message : 'Failed to add milestone'); },
  });

  const [error, setError] = useState<string | null>(null);
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const autoDetectMutation = useMutation({
    mutationFn: () => milestonesApi.autoDetect(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
      setAutoDetectMsg(`${response.data.created} new milestones detected`);
    },
    onError: (err) => { setError(err instanceof Error ? err.message : 'Auto-detect failed'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestonesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
    },
    onError: (err) => { setError(err instanceof Error ? err.message : 'Failed to remove milestone'); },
  });

  const getDaysUntil = (dateStr: string, recurring: boolean) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (recurring) {
      const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
      if (thisYear < now) thisYear.setFullYear(thisYear.getFullYear() + 1);
      return Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTypeInfo = (type: string) => milestoneTypes.find(t => t.id === type) || milestoneTypes[5];

  const milestoneList: any[] = milestones || [];
  const upcomingList: any[] = upcoming || [];

  const backLink = (
    <Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--muted-2)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>
  );

  const countEyebrow = `${milestoneList.length} ${milestoneList.length === 1 ? 'date held' : 'dates held'} in the thread`;

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="milestones">
      <div style={{ maxWidth: 'var(--page-max-wide)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>

        {/* Ledger header — mono eyebrow states the count, giant serif title */}
        <header style={{ marginBottom: 44, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <CosmicHeader eyebrow={countEyebrow} title="Milestones." sub="Dates the thread keeps." />
          <div style={{ display: 'flex', gap: 22, flexShrink: 0, paddingTop: 8, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            <button
              onClick={() => autoDetectMutation.mutate()}
              disabled={autoDetectMutation.isPending}
              style={{ ...monoAffordance, color: 'var(--bone-dim)' }}
              onMouseEnter={e => { if (!autoDetectMutation.isPending) e.currentTarget.style.color = 'var(--gold-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--bone-dim)'; }}
            >
              {autoDetectMutation.isPending ? 'detecting…' : 'auto-detect'}
            </button>
            <button
              onClick={() => { setShowCreateModal(true); setAutoDetectMsg(null); }}
              style={{ ...monoAffordance, color: 'var(--gold-text)' }}
            >
              add date →
            </button>
          </div>
        </header>

        {autoDetectMsg && (
          <p className="hl-mono" style={{ fontSize: 10, color: 'var(--gold-text)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {autoDetectMsg}
          </p>
        )}

        {error && (
          <p className="hl-mono" style={{ fontSize: 10, color: 'var(--gold-text)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {error}
          </p>
        )}

        {isLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ fontSize: 16, color: 'var(--bone-dim)', margin: 0 }}
          >
            Loading…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 48 }}>

            {/* Coming up — next 30 days */}
            <section>
              <SectionLabel>
                Coming up · next 30 days · {upcomingList.length} {upcomingList.length === 1 ? 'date' : 'dates'}
              </SectionLabel>

              {upcomingList.length > 0 ? (
                <div>
                  {upcomingList.map((milestone: any) => {
                    const typeInfo = getTypeInfo(milestone.milestone_type);
                    const daysUntil = getDaysUntil(milestone.milestone_date, milestone.recurring);
                    const when = new Date(milestone.milestone_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const dueLabel = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `${daysUntil} days`;
                    return (
                      <EntryRow
                        key={milestone.id}
                        title={milestone.milestone_name}
                        sub={milestone.family_member_name || milestone.prompt_suggestion || undefined}
                        italic={!milestone.family_member_name && !!milestone.prompt_suggestion}
                        year={`${when} · ${dueLabel}`}
                        author={typeInfo.name}
                        dye={dyeForId(milestone.id)}
                        onClick={() => { setAutoDetectMsg(null); navigate('/compose'); }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p
                  className="hl-serif hl-italic"
                  style={{ fontSize: 16, color: 'var(--bone-dim)', margin: '12px 0 0' }}
                >
                  Nothing approaching in the next 30 days.
                </p>
              )}
            </section>

            {/* All dates */}
            <section>
              <SectionLabel>All dates · {milestoneList.length} total</SectionLabel>

              {milestoneList.length > 0 ? (
                <div>
                  {milestoneList.map((milestone: any) => {
                    const typeInfo = getTypeInfo(milestone.milestone_type);
                    const when = new Date(milestone.milestone_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <div key={milestone.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                        <div style={{ borderBottom: 0, marginBottom: -1 }}>
                          <EntryRow
                            title={milestone.milestone_name}
                            sub={milestone.family_member_name || undefined}
                            year={`${when} · ${milestone.recurring ? 'yearly' : 'once'}`}
                            author={typeInfo.name}
                            dye={dyeForId(milestone.id)}
                          />
                        </div>
                        {/* quiet mono affordances under the row — same delete flow, no icon buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 18, padding: '0 0 12px' }}>
                          {confirmDeleteId === milestone.id ? (
                            <>
                              <button
                                onClick={() => { deleteMutation.mutate(milestone.id); setConfirmDeleteId(null); }}
                                style={{ ...monoAffordance, color: 'var(--gold-text)' }}
                                aria-label="Confirm remove date"
                              >
                                confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                style={monoAffordance}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}
                                aria-label="Cancel remove"
                              >
                                cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setConfirmDeleteId(milestone.id); setAutoDetectMsg(null); }}
                              style={monoAffordance}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-text)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}
                              aria-label="Remove date"
                            >
                              remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="hl-serif hl-italic"
                  style={{ fontSize: 16, color: 'var(--bone-dim)', margin: '12px 0 0' }}
                >
                  No dates recorded yet.
                </p>
              )}
            </section>

            <WaxSeal />

          </div>
        )}
      </div>

      {/* Create overlay */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, overflowY: 'auto',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            ref={createModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ms-create-title"
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 520,
              width: '100%',
              margin: 'auto',
              borderRadius: 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            <p id="ms-create-title" className="hl-eyebrow" style={{ marginBottom: 24 }}>Add a date</p>

            <div style={{ display: 'grid', gap: 22 }}>
              {/* Type */}
              <div>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {milestoneTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${formData.type === type.id ? 'var(--copper-border)' : 'var(--hairline-3)'}`,
                        borderRadius: 0,
                        color: formData.type === type.id ? 'var(--gold-text)' : 'var(--bone-dim)',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        transition: 'border-color 180ms var(--ease), color 180ms var(--ease)',
                      }}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle} htmlFor="ms-name">Name</label>
                <input
                  id="ms-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mother's birthday"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="ms-date">Date</label>
                <input
                  id="ms-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={fieldStyle}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="ms-recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  style={{ width: 14, height: 14, accentColor: 'var(--warm)', borderRadius: 0 }}
                />
                <label
                  htmlFor="ms-recurring"
                  className="hl-serif"
                  style={{ fontSize: 14, color: 'var(--bone-dim)', cursor: 'pointer' }}
                >
                  Repeat every year
                </label>
              </div>

              <div>
                <label style={labelStyle} htmlFor="ms-reminder">Remind me</label>
                <select
                  id="ms-reminder"
                  value={formData.reminderDays}
                  onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                  style={{ ...fieldStyle, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em' }}
                >
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>1 week before</option>
                  <option value={14}>2 weeks before</option>
                  <option value={30}>1 month before</option>
                </select>
              </div>

              <div>
                <label style={labelStyle} htmlFor="ms-prompt">Writing prompt (optional)</label>
                <textarea
                  id="ms-prompt"
                  value={formData.promptSuggestion}
                  onChange={(e) => setFormData({ ...formData, promptSuggestion: e.target.value })}
                  placeholder="e.g. Share a memory of her from childhood…"
                  rows={3}
                  style={{ ...fieldStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--hairline-3)',
                    color: 'var(--bone-dim)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'border-color 180ms var(--ease)',
                  }}
                >
                  cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.name.trim() || !formData.date || createMutation.isPending}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--warm)',
                    color: 'var(--warm)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 0,
                    opacity: (!formData.name.trim() || !formData.date || createMutation.isPending) ? 0.45 : 1,
                    transition: 'opacity 180ms var(--ease)',
                  }}
                >
                  {createMutation.isPending ? 'adding…' : 'add date'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}
