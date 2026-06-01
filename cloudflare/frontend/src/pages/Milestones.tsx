import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Frame } from '../loom/components/Frame';
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
  border: '1px solid var(--rule)',
  borderRadius: 2,
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
  color: 'var(--bone-faint)',
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
    <Frame left="milestones">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '52px 40px 80px' }}>

        {/* Page header */}
        <header style={{ marginBottom: 52, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <h1
              className="hl-serif"
              style={{ fontSize: 36, fontWeight: 300, margin: '0 0 28px', color: 'var(--bone)', lineHeight: 1.15 }}
            >
              Your milestones.
            </h1>
            <p
              className="hl-eyebrow"
              style={{ margin: 0 }}
            >
              Dates in the thread
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 6 }}>
            <button
              onClick={() => autoDetectMutation.mutate()}
              disabled={autoDetectMutation.isPending}
              className="hl-btn"
              style={{
                background: 'transparent',
                border: '1px solid var(--rule)',
                color: 'var(--bone-dim)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: 0,
                transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--warm)'; e.currentTarget.style.color = 'var(--warm)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.color = 'var(--bone-dim)'; }}
            >
              {autoDetectMutation.isPending ? 'detecting…' : 'auto-detect'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="hl-btn"
              style={{
                background: 'var(--warm)',
                border: '1px solid var(--warm)',
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              add date
            </button>
          </div>
        </header>

        {isLoading ? (
          <p
            className="hl-serif hl-italic"
            style={{ fontSize: 16, color: 'var(--bone-dim)', margin: 0 }}
          >
            Loading…
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 56 }}>

            {/* Coming up */}
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <span className="hl-eyebrow">Coming up · next 30 days</span>
                <hr className="hl-rule" style={{ flex: 1, margin: 0 }} />
                <span
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}
                >
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
                          gridTemplateColumns: '80px 1fr auto',
                          gap: 24,
                          alignItems: 'baseline',
                          padding: '18px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        {/* date col */}
                        <div>
                          <p
                            className="hl-mono"
                            style={{ margin: 0, fontSize: 10, color: 'var(--warm)', letterSpacing: '0.04em' }}
                          >
                            {new Date(milestone.milestone_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          <p
                            className="hl-mono"
                            style={{ margin: '3px 0 0', fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                          >
                            {typeInfo.name}
                          </p>
                        </div>
                        {/* title + description col */}
                        <div>
                          <p
                            className="hl-serif"
                            style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 300, color: 'var(--bone)', lineHeight: 1.25 }}
                          >
                            {milestone.milestone_name}
                          </p>
                          {(milestone.family_member_name || milestone.prompt_suggestion) && (
                            <p
                              className="hl-serif hl-italic"
                              style={{ margin: 0, fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.5 }}
                            >
                              {milestone.family_member_name || milestone.prompt_suggestion}
                            </p>
                          )}
                        </div>
                        {/* status col */}
                        <p
                          className="hl-mono"
                          style={{
                            margin: 0,
                            fontSize: 9.5,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
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
                <p
                  className="hl-serif hl-italic"
                  style={{ fontSize: 16, color: 'var(--bone-dim)', margin: 0 }}
                >
                  Nothing approaching in the next 30 days.
                </p>
              )}
            </section>

            {/* All dates */}
            <section>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
                <span className="hl-eyebrow">All dates</span>
                <hr className="hl-rule" style={{ flex: 1, margin: 0 }} />
                <span
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}
                >
                  {milestoneList.length} total
                </span>
              </div>

              {milestoneList.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {milestoneList.map((milestone: any) => {
                    return (
                      <li
                        key={milestone.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 1fr auto',
                          gap: 24,
                          alignItems: 'baseline',
                          padding: '18px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        {/* date col */}
                        <p
                          className="hl-mono"
                          style={{ margin: 0, fontSize: 10, color: 'var(--warm)', letterSpacing: '0.04em' }}
                        >
                          {new Date(milestone.milestone_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {/* title + description col */}
                        <div>
                          <p
                            className="hl-serif"
                            style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 300, color: 'var(--bone)', lineHeight: 1.25 }}
                          >
                            {milestone.milestone_name}
                          </p>
                          {milestone.family_member_name && (
                            <p
                              className="hl-serif hl-italic"
                              style={{ margin: 0, fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.5 }}
                            >
                              {milestone.family_member_name}
                            </p>
                          )}
                        </div>
                        {/* status col */}
                        <p
                          className="hl-mono"
                          style={{
                            margin: 0,
                            fontSize: 9.5,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--bone-faint)',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {milestone.recurring ? 'yearly' : 'once'}
                          {' · '}
                          <button
                            onClick={() => deleteMutation.mutate(milestone.id)}
                            style={{
                              background: 'none',
                              border: 0,
                              padding: 0,
                              cursor: 'pointer',
                              fontFamily: 'var(--mono)',
                              fontSize: 9.5,
                              letterSpacing: '0.22em',
                              textTransform: 'uppercase',
                              color: 'var(--bone-faint)',
                              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
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
                <p
                  className="hl-serif hl-italic"
                  style={{ fontSize: 16, color: 'var(--bone-dim)', margin: 0 }}
                >
                  No dates recorded yet.
                </p>
              )}
            </section>

            {/* Reminder notes */}
            <section style={{ borderTop: '1px solid var(--rule)', paddingTop: 28 }}>
              <p className="hl-eyebrow" style={{ marginBottom: 14 }}>When reminders arrive</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                {[
                  '7 days before each date',
                  'On the day itself',
                  'With a prompt to help you write into the thread',
                ].map(t => (
                  <li key={t}>
                    <p
                      className="hl-serif"
                      style={{ margin: 0, fontSize: 14, color: 'var(--bone-faint)' }}
                    >
                      — {t}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
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
            style={{
              background: '#0e0e0c',
              border: '1px solid var(--rule)',
              padding: 40,
              maxWidth: 520,
              width: '100%',
              margin: 'auto',
              borderRadius: 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="hl-eyebrow" style={{ marginBottom: 24 }}>Add a date</p>

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
                        border: `1px solid ${formData.type === type.id ? 'var(--warm)' : 'var(--rule)'}`,
                        borderRadius: 0,
                        color: formData.type === type.id ? 'var(--warm)' : 'var(--bone-dim)',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.22em',
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
                    border: '1px solid var(--rule)',
                    color: 'var(--bone-dim)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.name.trim() || !formData.date || createMutation.isPending}
                  style={{
                    flex: 1,
                    background: 'var(--warm)',
                    border: '1px solid var(--warm)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderRadius: 0,
                    opacity: (!formData.name.trim() || !formData.date || createMutation.isPending) ? 0.45 : 1,
                    transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {createMutation.isPending ? 'adding…' : 'add date'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}
