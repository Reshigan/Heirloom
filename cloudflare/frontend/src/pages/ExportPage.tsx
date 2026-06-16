import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportApi, type ExportJob } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * ExportPage — take the thread with you.
 *
 * Four ways to leave with the archive whole:
 *   · the printed book   (HARDCOVER — elegant cover PDF, ready for the press)
 *   · the digital archive (PDF      — the family book, bound on screen)
 *   · plain text          (TXT      — the unadorned family book)
 *   · the whole thread    (ZIP      — every record, dumped raw)
 *
 * The first three render through exportApi.familyBook (synchronous PDF
 * generation); the finished blob is fetched and saved straight to disk. The
 * whole-thread option pulls the full data export and saves it locally. Past
 * bindings list below.
 */

type CoverStyle = 'classic' | 'modern' | 'elegant';

/** The four shapes the archive can leave in. */
type ExportFormat = 'hardcover' | 'pdf' | 'txt' | 'zip';

interface FormatOption {
  format: ExportFormat;
  label: string;
  ext: string;
}

const FORMATS: FormatOption[] = [
  { format: 'hardcover', label: 'Printed book', ext: 'hardcover' },
  { format: 'pdf', label: 'Digital archive', ext: 'pdf' },
  { format: 'txt', label: 'Plain text', ext: 'txt' },
  { format: 'zip', label: 'The whole thread', ext: 'zip' },
];

/** familyBook payload — the full thread, bound. Cover follows the chosen format. */
const BOOK_SCOPE = {
  title: undefined,
  subtitle: undefined,
  dedication: undefined,
  includeMemories: true,
  includeLetters: true,
  includeVoiceTranscripts: true,
  includeFamilyTree: true,
} as const;

const COVER_FOR: Record<Exclude<ExportFormat, 'zip'>, CoverStyle> = {
  hardcover: 'elegant',
  pdf: 'classic',
  txt: 'modern',
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
  const [format, setFormat] = useState<ExportFormat>('pdf');

  const historyQ = useQuery({
    queryKey: ['export', 'history'],
    queryFn: () => exportApi.history().then((r) => r.data.exports),
  });

  const bind = useMutation({
    mutationFn: async () => {
      // The whole thread → the full raw data export, saved as JSON.
      if (format === 'zip') {
        const res = await exportApi.exportData();
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heirloom-thread-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      // The bound book — printed, digital, or plain — rendered to a PDF blob.
      const res = await exportApi.familyBook({
        ...BOOK_SCOPE,
        coverStyle: COVER_FOR[format],
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
        {/* ── header ── */}
        <CosmicHeader eyebrow="take it with you" title="Export the thread" align="center" />

        {/* ── format — how the archive leaves with you ── */}
        <div style={{ marginTop: 28 }}>
          {FORMATS.map((opt) => (
            <FormatRow
              key={opt.format}
              label={opt.label}
              ext={opt.ext}
              selected={format === opt.format}
              onSelect={() => setFormat(opt.format)}
            />
          ))}
        </div>

        {/* ── export action — the single warm pill ── */}
        <div style={{ marginTop: 48, marginBottom: 8 }}>
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
              transition:
                'color 360ms cubic-bezier(0.16,1,0.3,1), border-color 360ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {bind.isPending ? 'preparing' : 'export'}
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
                fontFamily: 'var(--mono)',
              }}
            >
              the binding faltered. try again.
            </p>
          )}
        </div>

        {/* ── ownership reassurance ── */}
        <p
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontFamily: 'var(--mono)',
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
        <SectionLabel>past bindings</SectionLabel>

        {historyQ.isLoading ? (
          <div style={{ paddingTop: 8 }}>
            <ProgressHair width={80} />
          </div>
        ) : exports.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              color: 'var(--bone-faint)',
              fontSize: 14,
              margin: '12px 0 0',
            }}
          >
            no bindings yet.
          </p>
        ) : (
          exports.map((job) => <HistoryRow key={job.id} job={job} />)
        )}

        {/* ── wax seal foot ── */}
        <div style={{ marginTop: 96 }}>
          <WaxSeal size={28} />
        </div>
      </div>
    </ClothShell>
  );
}

/* ── format row — serif label left (with em-dash), mono ext right, warm underline when chosen ── */
function FormatRow({
  label,
  ext,
  selected,
  onSelect,
}: {
  label: string;
  ext: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        borderBottom: selected ? '1px solid var(--warm)' : '1px solid var(--rule)',
        padding: '22px 0',
        gap: 16,
        cursor: 'pointer',
        transition: 'border-color 360ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 20,
          fontWeight: 400,
          color: selected ? 'var(--bone)' : 'var(--bone-dim)',
          transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {label}
        <span aria-hidden style={{ color: 'var(--bone-faint)', marginLeft: 10 }}>
          —
        </span>
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: selected ? 'var(--warm)' : 'var(--bone-faint)',
          transition: 'color 360ms cubic-bezier(0.16,1,0.3,1)',
          whiteSpace: 'nowrap',
        }}
      >
        {ext}
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
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>
          {labelForType(job.type)}
        </div>
        <div
          style={{
            fontFamily: 'var(--mono)',
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
        <button
          type="button"
          onClick={() => void saveBlob(job.id)}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--warm)',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            padding: 0,
            whiteSpace: 'nowrap',
          }}
        >
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
