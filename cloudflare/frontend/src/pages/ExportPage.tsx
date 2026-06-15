import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportApi, type ExportJob } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
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
          maxWidth: 560,
          margin: '0 auto',
        }}
      >
        {/* ── intro — mono eyebrow + serif title, generous space ── */}
        <header style={{ textAlign: 'center', marginBottom: 80 }}>
          <span
            className="hl-mono"
            style={{
              display: 'block',
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              marginBottom: 14,
            }}
          >
            take it with you
          </span>
          <h1
            className="hl-serif"
            style={{
              fontSize: 38,
              lineHeight: 1.1,
              fontWeight: 400,
              color: 'var(--bone)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Export the thread
          </h1>
        </header>

        {/* ── what goes inside — the scope rows, selectable cosmic list ── */}
        <div style={{ marginBottom: 72 }}>
          <ScopeRow
            label="The whole thread"
            meta="memories"
            on={form.includeMemories}
            onToggle={() => setForm((f) => ({ ...f, includeMemories: !f.includeMemories }))}
          />
          <ScopeRow
            label="Letters"
            meta="sealed & open"
            on={form.includeLetters}
            onToggle={() => setForm((f) => ({ ...f, includeLetters: !f.includeLetters }))}
          />
          <ScopeRow
            label="Voices"
            meta="transcripts"
            on={form.includeVoiceTranscripts}
            onToggle={() =>
              setForm((f) => ({ ...f, includeVoiceTranscripts: !f.includeVoiceTranscripts }))
            }
          />
          <ScopeRow
            label="The bloodline"
            meta="family tree"
            on={form.includeFamilyTree}
            onToggle={() => setForm((f) => ({ ...f, includeFamilyTree: !f.includeFamilyTree }))}
          />
        </div>

        {/* ── the book — title, subtitle, dedication, cover ── */}
        <div style={{ display: 'grid', gap: 30, marginBottom: 56 }}>
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

        {/* ── export action — the single outlined amber pill ── */}
        <button
          type="button"
          disabled={bind.isPending}
          onClick={() => bind.mutate()}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            color: bind.isPending ? 'var(--bone-faint)' : 'var(--warm)',
            border: bind.isPending ? '1px solid var(--rule)' : '1px solid var(--warm)',
            borderRadius: 999,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            cursor: bind.isPending ? 'default' : 'pointer',
            transition: 'color 360ms cubic-bezier(0.16,1,0.3,1), border-color 360ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {bind.isPending ? 'preparing' : 'prepare export'}
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

        {/* ── ownership / inheritance reassurance ── */}
        <p
          className="hl-mono"
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 1.7,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          this archive is yours — it leaves with you, whole, to pass on.
        </p>

        {/* ── past bindings ── */}
        <div style={{ marginTop: 80 }}>
          <span
            className="hl-mono"
            style={{
              display: 'block',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginBottom: 18,
            }}
          >
            past bindings
          </span>
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
        </div>
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

/* ── scope row — serif label left, mono meta/toggle right ───────────────── */
function ScopeRow({
  label,
  meta,
  on,
  onToggle,
}: {
  label: string;
  meta: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        borderBottom: on ? '1px solid var(--warm)' : '1px solid var(--rule)',
        padding: '22px 0',
        gap: 16,
        cursor: 'pointer',
        transition: 'border-color 360ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <span
        className="hl-serif"
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: on ? 'var(--bone)' : 'var(--bone-dim)',
          transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {label}
        <span aria-hidden style={{ color: 'var(--bone-faint)', marginLeft: 10 }}>
          —
        </span>
      </span>
      <span
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: on ? 'var(--warm)' : 'var(--bone-faint)',
          transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
          whiteSpace: 'nowrap',
        }}
      >
        {on ? meta : 'left out'}
      </span>
    </button>
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
