import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportApi, type ExportJob } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { RoomHeader, RoomSection } from '../loom/components/room';

/**
 * ExportPage — bind the bloodline into a single book.
 *
 * Gathers every memory, letter, and voice transcript into one PDF via
 * exportApi.familyBook (synchronous generation). On success the finished
 * blob is fetched and saved straight to disk. Past bindings list below.
 */

type CoverStyle = 'classic' | 'modern' | 'elegant';

interface ExportForm {
  title: string;
  subtitle: string;
  dedication: string;
  coverStyle: CoverStyle;
  includeMemories: boolean;
  includeLetters: boolean;
  includeVoiceTranscripts: boolean;
  includeFamilyTree: boolean;
}

const INITIAL_FORM: ExportForm = {
  title: '',
  subtitle: '',
  dedication: '',
  coverStyle: 'classic',
  includeMemories: true,
  includeLetters: true,
  includeVoiceTranscripts: false,
  includeFamilyTree: true,
};

const COVER_STYLES: CoverStyle[] = ['classic', 'modern', 'elegant'];

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  outline: 'none',
  color: 'var(--bone)',
  fontFamily: 'var(--serif)',
  fontSize: 15,
  padding: '6px 0',
  width: '100%',
  boxSizing: 'border-box',
};

async function saveBlob(exportId: string): Promise<void> {
  const blob = (await exportApi.download(exportId)).data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heirloom-${exportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<ExportForm>(INITIAL_FORM);

  const historyQ = useQuery({
    queryKey: ['export', 'history'],
    queryFn: () => exportApi.history().then((r) => r.data.exports),
  });

  const bind = useMutation({
    mutationFn: async () => {
      const res = await exportApi.familyBook({
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        dedication: form.dedication || undefined,
        coverStyle: form.coverStyle,
        includeMemories: form.includeMemories,
        includeLetters: form.includeLetters,
        includeVoiceTranscripts: form.includeVoiceTranscripts,
        includeFamilyTree: form.includeFamilyTree,
      });
      await saveBlob(res.data.exportId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['export', 'history'] });
    },
  });

  const exports: ExportJob[] = historyQ.data ?? [];

  return (
    <ClothShell
      topbarLeft={
        <Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'export' }]} />
      }
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          overflowX: 'hidden',
          maxWidth: 680,
          margin: '0 auto',
        }}
      >
        {/* ── intro ── */}
        <RoomHeader
          eyebrow="the bloodline, bound"
          title="Bind your bloodline into a book."
          lede="Gather your family's thread into a single book — every memory, letter, and recorded voice, set in type and bound as one PDF you can hold or print."
        />

        {/* ── form ── */}
        <RoomSection label="the book" flush>
          <div style={{ display: 'grid', gap: 28 }}>
          <Field label="title">
            <input
              type="text"
              style={inputStyle}
              placeholder="Our Family Story"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>

          <Field label="subtitle">
            <input
              type="text"
              style={inputStyle}
              placeholder="a subtitle — optional"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
          </Field>

          <Field label="dedication">
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              placeholder="a dedication — optional"
              value={form.dedication}
              onChange={(e) => setForm((f) => ({ ...f, dedication: e.target.value }))}
            />
          </Field>

          {/* cover style */}
          <Field label="cover style">
            <div style={{ display: 'flex', gap: 22, paddingTop: 8 }}>
              {COVER_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  className="hl-btn text"
                  onClick={() => setForm((f) => ({ ...f, coverStyle: style }))}
                  style={{
                    color: form.coverStyle === style ? 'var(--warm)' : 'var(--bone-dim)',
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </Field>
          </div>
        </RoomSection>

        {/* ── includes ── */}
        <RoomSection label="what goes inside">
          <div style={{ display: 'grid', gap: 0 }}>
            <ToggleRow
              label="include memories"
              on={form.includeMemories}
              onToggle={() => setForm((f) => ({ ...f, includeMemories: !f.includeMemories }))}
            />
            <ToggleRow
              label="include letters"
              on={form.includeLetters}
              onToggle={() => setForm((f) => ({ ...f, includeLetters: !f.includeLetters }))}
            />
            <ToggleRow
              label="include voice transcripts"
              on={form.includeVoiceTranscripts}
              onToggle={() =>
                setForm((f) => ({ ...f, includeVoiceTranscripts: !f.includeVoiceTranscripts }))
              }
            />
            <ToggleRow
              label="include family tree"
              on={form.includeFamilyTree}
              onToggle={() => setForm((f) => ({ ...f, includeFamilyTree: !f.includeFamilyTree }))}
            />
          </div>
        </RoomSection>

        {/* ── bind action — the single warm CTA ── */}
        <RoomSection>
          <div>
            <button
              type="button"
              className="hl-btn"
              disabled={bind.isPending}
              onClick={() => bind.mutate()}
            >
              bind the book →
            </button>
            {bind.isPending && (
              <div style={{ marginTop: 18 }}>
                <ProgressHair label="setting your family in type…" />
              </div>
            )}
            {bind.isError && (
              <p
                className="hl-mono"
                style={{
                  marginTop: 16,
                  color: 'var(--warm)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                }}
              >
                the binding faltered. try again.
              </p>
            )}
          </div>
        </RoomSection>

        {/* ── past bindings ── */}
        <RoomSection label="past bindings">
          {historyQ.isLoading ? (
            <ProgressHair width={80} />
          ) : exports.length === 0 ? (
            <p
              className="hl-serif"
              style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 14 }}
            >
              no bindings yet.
            </p>
          ) : (
            exports.map((job) => <HistoryRow key={job.id} job={job} />)
          )}
        </RoomSection>
      </div>
    </ClothShell>
  );
}

/* ── form field wrapper ─────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        className="hl-mono"
        style={{
          display: 'block',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/* ── include toggle row ─────────────────────────────────────────────────── */
function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--rule)',
        padding: '14px 0',
        gap: 16,
      }}
    >
      <span className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)' }}>
        {label}
      </span>
      <button
        type="button"
        className="hl-btn text"
        onClick={onToggle}
        style={{ color: on ? 'var(--warm)' : 'var(--bone-faint)' }}
      >
        {on ? 'included' : 'left out'}
      </button>
    </div>
  );
}

/* ── past-binding row ───────────────────────────────────────────────────── */
function HistoryRow({ job }: { job: ExportJob }) {
  const done = job.status === 'COMPLETED';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--rule)',
        padding: '14px 0',
        gap: 16,
      }}
    >
      <div>
        <div className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>
          {labelForType(job.type)}
        </div>
        <div
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'var(--bone-faint)',
            marginTop: 3,
          }}
        >
          {formatDate(job.createdAt)} · {job.status.toLowerCase()}
        </div>
      </div>
      {done && (
        <button type="button" className="hl-btn text" onClick={() => void saveBlob(job.id)}>
          download →
        </button>
      )}
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function labelForType(type: string): string {
  if (type === 'family-book' || type === 'FAMILY_BOOK') return 'Family book';
  return 'Family book';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
