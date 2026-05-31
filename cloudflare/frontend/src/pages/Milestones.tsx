import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
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
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  marginBottom: 10,
};

export function Milestones() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'birthday',
    name: '',
    date: '',
    recurring: true,
    reminderDays: 7,
    promptSuggestion: '',
  });

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
  });

  const autoDetectMutation = useMutation({
    mutationFn: () => milestonesApi.autoDetect(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
      alert(`Auto-detected ${response.data.created} new milestones!`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milestonesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMilestones'] });
    },
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

  return (
    <AppFrame>
      <header style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Dates in the thread</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Dates that recur.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
          >
            Birthdays, anniversaries, remembrances. The thread surfaces them before they arrive.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 8 }}>
          <button
            onClick={() => autoDetectMutation.mutate()}
            disabled={autoDetectMutation.isPending}
            className="loom-btn-ghost"
          >
            {autoDetectMutation.isPending ? 'detecting…' : 'auto-detect'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="loom-btn">
            add date
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 48 }}>

          {/* Coming up */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <p className="loom-eyebrow">Coming up · next 30 days</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
              <span className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                {upcomingList.length} {upcomingList.length === 1 ? 'date' : 'dates'}
              </span>
            </div>

            {upcomingList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {upcomingList.map((milestone: any) => {
                  const typeInfo = getTypeInfo(milestone.milestone_type);
                  const daysUntil = getDaysUntil(milestone.milestone_date, milestone.recurring);
                  return (
                    <li
                      key={milestone.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr auto',
                        gap: 28,
                        alignItems: 'baseline',
                        padding: '18px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                      }}
                    >
                      <div>
                        <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-warm)', letterSpacing: '0.04em' }}>
                          {new Date(milestone.milestone_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                        </p>
                        <p className="loom-mono" style={{ margin: '4px 0 0', fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                          {typeInfo.name}
                        </p>
                      </div>
                      <div>
                        <p className="loom-serif" style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', lineHeight: 1.25 }}>
                          {milestone.milestone_name}
                        </p>
                        {milestone.family_member_name && (
                          <p className="loom-body" style={{ margin: 0, fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                            {milestone.family_member_name}
                          </p>
                        )}
                        {milestone.prompt_suggestion && (
                          <p className="loom-body" style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
                            {milestone.prompt_suggestion}
                          </p>
                        )}
                      </div>
                      <p
                        className="loom-mono"
                        style={{
                          margin: 0,
                          fontSize: 12,
                          letterSpacing: '0.04em',
                          color: daysUntil <= 7 ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `${daysUntil} days`}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
                No dates approaching in the next 30 days.
              </p>
            )}
          </section>

          {/* All dates */}
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <p className="loom-eyebrow">All dates</p>
              <hr className="loom-hairline" style={{ flex: 1 }} />
              <span className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                {milestoneList.length} total
              </span>
            </div>

            {milestoneList.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {milestoneList.map((milestone: any) => {
                  const typeInfo = getTypeInfo(milestone.milestone_type);
                  return (
                    <li
                      key={milestone.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 80px 80px auto',
                        gap: 20,
                        alignItems: 'baseline',
                        padding: '16px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                      }}
                    >
                      <div>
                        <p className="loom-serif" style={{ margin: 0, fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)', lineHeight: 1.2 }}>
                          {milestone.milestone_name}
                        </p>
                        {milestone.family_member_name && (
                          <p className="loom-mono" style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                            {milestone.family_member_name}
                          </p>
                        )}
                      </div>
                      <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {typeInfo.name}
                      </p>
                      <p className="loom-mono" style={{ margin: 0, fontSize: 11, color: 'var(--loom-bone-dim)' }}>
                        {new Date(milestone.milestone_date).toLocaleDateString()}
                      </p>
                      <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: milestone.recurring ? 'var(--loom-warm)' : 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}>
                        {milestone.recurring ? 'yearly' : 'once'}
                      </p>
                      <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>
                        <button
                          onClick={() => deleteMutation.mutate(milestone.id)}
                          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', color: 'var(--loom-bone-faint)' }}
                          aria-label="Remove date"
                        >
                          remove
                        </button>
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div style={{ padding: '48px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
                <p className="loom-eyebrow" style={{ marginBottom: 14 }}>No dates yet</p>
                <h2 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: '0 0 20px' }}>
                  Dates give the thread a rhythm.
                </h2>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => autoDetectMutation.mutate()}
                    disabled={autoDetectMutation.isPending}
                    className="loom-btn-ghost"
                  >
                    {autoDetectMutation.isPending ? 'detecting…' : 'auto-detect from family'}
                  </button>
                  <button onClick={() => setShowCreateModal(true)} className="loom-btn">
                    add manually
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Reminder notes */}
          <section style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 28 }}>
            <p className="loom-eyebrow" style={{ marginBottom: 12 }}>When reminders arrive</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {['7 days before each date', 'On the day itself', 'With a prompt to help you write into the thread'].map(t => (
                <li key={t}>
                  <p className="loom-body" style={{ margin: 0, fontSize: 14, color: 'var(--loom-bone-faint)' }}>— {t}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Create overlay */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, overflowY: 'auto',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 520,
              width: '100%',
              margin: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 20 }}>Add a date</p>

            <div style={{ display: 'grid', gap: 20 }}>
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
                        border: `1px solid ${formData.type === type.id ? 'var(--loom-warm)' : 'var(--loom-rule)'}`,
                        borderRadius: 0,
                        color: formData.type === type.id ? 'var(--loom-warm)' : 'var(--loom-bone-dim)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
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
                  style={{ width: 14, height: 14, accentColor: 'var(--loom-warm)' }}
                />
                <label
                  htmlFor="ms-recurring"
                  className="loom-body"
                  style={{ fontSize: 14, color: 'var(--loom-bone-dim)', cursor: 'pointer' }}
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
                  style={{ ...fieldStyle, fontFamily: "'Inter', sans-serif", fontSize: 13 }}
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
                <button onClick={() => setShowCreateModal(false)} className="loom-btn-ghost" style={{ flex: 1 }}>
                  cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.name.trim() || !formData.date || createMutation.isPending}
                  className="loom-btn"
                  style={{ flex: 1 }}
                >
                  {createMutation.isPending ? 'adding…' : 'add date'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
