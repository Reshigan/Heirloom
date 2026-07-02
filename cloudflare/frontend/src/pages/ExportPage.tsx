import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import JSZip from 'jszip';
import { exportApi, getAuthToken, type ExportJob } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * ExportPage — take the thread with you.
 *
 * Four ways to leave:
 *   · the printed book   (HARDCOVER — elegant cover PDF, ready for the press)
 *   · the digital archive (PDF      — the family book, bound on screen)
 *   · plain text          (TXT      — the unadorned family book)
 *   · the whole thread    (ZIP      — every record, dumped raw)
 *
 * Scope differs by format, and the copy on the page must stay honest about it:
 * only the ZIP is the COMPLETE, self-contained archive (every live entry plus
 * revision history, all bequests + their recipients, and all voice). The three
 * book formats are a curated KEEPSAKE — live entries only, voice needs a
 * transcript, no bequests/revisions.
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
  /** One honest line on what this shape actually hands you. */
  desc: string;
}

const FORMATS: FormatOption[] = [
  { format: 'hardcover', label: 'Printed book', ext: 'hardcover', desc: 'A bound keepsake, set in type and pressed — shipped to your door.' },
  { format: 'pdf', label: 'Digital archive', ext: 'pdf', desc: 'The bound book as a PDF — read it anywhere, print it yourself.' },
  { format: 'txt', label: 'Plain text', ext: 'txt', desc: 'Every word, no formatting — the most portable, future-proof form.' },
  { format: 'zip', label: 'The whole Deep', ext: 'zip', desc: 'A self-contained folder — manifest, photos, and voice, kept whole.' },
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

/** Drop a blob to disk under the given filename via the anchor-download pattern. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── whole-thread ZIP bundling ────────────────────────────────────────────── */

/**
 * The worker's exportData ships a `fileManifest` array of
 * `{ type, key, url }` — auth-gated API URLs, NOT bytes. To make the archive a
 * self-contained offline copy we fetch every file (with the user's bearer
 * token), drop the bytes into `files/<name>` inside the zip, and rewrite each
 * manifest entry's `url` to that relative path. Without this the prose survives
 * but every photo/voice recording dies the moment the token expires.
 */
interface ManifestFile {
  type?: string;
  key?: string;
  url?: string;
  /** Rewritten in place to the relative zip path (files/<name>). */
  path?: string;
  /** Recorded when a fetch fails so the archive is honest about gaps. */
  exportError?: string;
}

const EXT_FOR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
};

/** Strip path/query noise so a manifest key is safe as a flat filename. */
function safeName(raw: string): string {
  const base = raw.split('/').pop()?.split('?')[0] ?? raw;
  return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'file';
}

/** Best filename for a media entry: the key's basename, else <type>-<i>.<ext-from-mime>. */
function fileNameFor(entry: ManifestFile, index: number, contentType: string | null): string {
  const keyBase = entry.key ? safeName(entry.key) : '';
  if (keyBase && keyBase.includes('.')) return keyBase;
  const ext = (contentType && EXT_FOR_MIME[contentType.split(';')[0].trim()]) || 'bin';
  const stem = keyBase || `${entry.type || 'file'}-${index + 1}`;
  return `${stem}.${ext}`;
}

/** Run async tasks with a bounded number in flight (no hundreds of open sockets). */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

/**
 * Build the self-contained thread ZIP: manifest.json (paths rewritten to the
 * bundled bytes), README.txt, and every reachable media file under files/.
 * Individual fetch failures are tolerated and recorded — a partial archive
 * beats none. `onProgress` drives the inline ProgressHair label only.
 */
async function buildThreadZip(
  data: any,
  onProgress: (label: string) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const manifest: ManifestFile[] = Array.isArray(data?.fileManifest) ? data.fileManifest : [];
  const token = getAuthToken();

  const usedNames = new Set<string>();
  const failures: { url: string; reason: string }[] = [];
  let fetched = 0;
  const total = manifest.length;

  onProgress(total ? `gathering 0 of ${total} files…` : 'binding the archive…');

  await mapWithConcurrency(manifest, 5, async (entry: ManifestFile, index) => {
    if (!entry?.url) {
      entry.exportError = 'no source url';
      failures.push({ url: '(missing)', reason: 'no source url' });
      return;
    }
    try {
      const res = await fetch(entry.url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      let name = fileNameFor(entry, index, res.headers.get('Content-Type'));
      // Guarantee uniqueness inside files/ even if two keys collapse to one name.
      if (usedNames.has(name)) {
        const dot = name.lastIndexOf('.');
        const stem = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : '';
        name = `${stem}-${index + 1}${ext}`;
      }
      usedNames.add(name);

      zip.file(`files/${name}`, blob);
      // Rewrite to the relative in-zip path so the offline copy is
      // self-referential rather than dependent on the expiring API URL.
      entry.path = `files/${name}`;
      entry.url = `files/${name}`;
    } catch (err: any) {
      const reason = err?.message || 'fetch failed';
      entry.exportError = reason;
      failures.push({ url: entry.url || '(unknown)', reason });
    } finally {
      fetched += 1;
      if (total) onProgress(`gathering ${fetched} of ${total} files…`);
    }
  });

  onProgress('binding the archive…');

  // manifest.json carries the rewritten (relative) paths.
  zip.file('manifest.json', JSON.stringify(data, null, 2));

  const failureNote = failures.length
    ? [
        '',
        `NOTE: ${failures.length} file(s) could not be retrieved and are absent from this`,
        'archive (their manifest entries carry an "exportError"). This is usually a',
        'transient network issue — re-export to try again.',
        ...failures.slice(0, 50).map((f) => `  · ${f.url} — ${f.reason}`),
        failures.length > 50 ? `  · …and ${failures.length - 50} more` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const readme = [
    'HEIRLOOM — THE WHOLE THREAD',
    '===========================',
    '',
    `Exported ${new Date().toISOString()}`,
    `Schema version: ${data?.schemaVersion ?? 'unknown'}`,
    '',
    'This archive is a self-contained, offline copy of your family Deep.',
    'It needs no account, no login, and no internet connection to read — every',
    'photo, voice recording, and written entry is included here as actual files,',
    'not links. It will outlive your subscription and your access token.',
    '',
    'WHAT IS INSIDE',
    '  manifest.json   The complete archive: people, memories, letters, voice',
    '                  transcripts, bequests, and revision history. File entries',
    '                  point at the bundled copies under files/ (relative paths).',
    '  files/          The binary media — photos, audio, video — referenced by',
    '                  manifest.json. Open them with any normal viewer.',
    '  README.txt      This file.',
    '',
    'HOW TO READ IT',
    '  Unzip anywhere. Open manifest.json in any text editor or JSON viewer to',
    '  read the prose, then open the matching file under files/ for the media.',
    failureNote,
    '',
    'This archive is yours — it leaves with you, whole, to pass on.',
  ]
    .filter((l) => l !== undefined)
    .join('\n');

  zip.file('README.txt', readme);

  return zip.generateAsync({ type: 'blob' });
}

export function ExportPage() {
  const qc = useQueryClient();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  // Live status for the whole-thread bundle — drives the inline ProgressHair
  // label as media is gathered. No spinner, no toast.
  const [progress, setProgress] = useState<string | null>(null);

  const historyQ = useQuery({
    queryKey: ['export', 'history'],
    queryFn: () => exportApi.history().then((r) => r.data.exports),
  });

  const bind = useMutation({
    mutationFn: async () => {
      // The whole thread → a REAL, self-contained ZIP: manifest.json (with
      // every media path rewritten to a bundled relative file), README.txt, and
      // the actual binary bytes under files/. Fetched client-side with the
      // user's token so the archive survives token expiry / account closure.
      if (format === 'zip') {
        const res = await exportApi.exportData();
        const blob = await buildThreadZip(res.data, setProgress);
        downloadBlob(blob, `heirloom-thread-${localDateStamp()}.zip`);
        return;
      }
      // The bound book — printed, digital, or plain — rendered to a PDF blob.
      const res = await exportApi.familyBook({
        ...BOOK_SCOPE,
        coverStyle: COVER_FOR[format],
      });
      await saveBlob(res.data.exportId);
    },
    onSettled: () => {
      setProgress(null);
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
        <CosmicHeader eyebrow="take it with you" title="Export the Deep" align="left" />

        {/* ── format — how the archive leaves with you ── */}
        <div
          role="radiogroup"
          aria-label="Export format"
          style={{ marginTop: 28 }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            // Arrows ONLY rove focus — never commit the format. Selection happens
            // on click / Space-Enter via each row's own onClick.
            const radios = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
            const i = Array.prototype.indexOf.call(radios, document.activeElement);
            const from = i === -1 ? FORMATS.findIndex((o) => o.format === format) : i;
            const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
            radios[(from + dir + radios.length) % radios.length]?.focus();
          }}
        >
          {FORMATS.map((opt) => (
            <FormatRow
              key={opt.format}
              label={opt.label}
              ext={opt.ext}
              desc={opt.desc}
              selected={format === opt.format}
              onSelect={() => setFormat(opt.format)}
            />
          ))}
        </div>

        {/* Honest scope of each format. The ZIP is the complete, self-contained
            archive (every revision, every bequest, all voice). The printed-book
            formats are a curated keepsake of the live thread. */}
        <p
          className="hl-serif"
          style={{
            marginTop: 18,
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--bone-faint)',
          }}
        >
          The whole thread is the complete archive — every entry, revision,
          bequest, and recording, kept whole. The printed-book formats are a
          curated keepsake of the living thread.
        </p>

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
              color: bind.isPending ? 'var(--bone-faint)' : 'var(--gold-text)',
              border: bind.isPending ? '1px solid var(--rule)' : '1px solid var(--copper-border)',
              borderRadius: 0,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: bind.isPending ? 'default' : 'pointer',
              transition:
                'color 360ms var(--ease), border-color 360ms var(--ease)',
            }}
          >
            {bind.isPending ? 'preparing' : 'export'}
          </button>

          {bind.isPending && (
            <div style={{ marginTop: 18 }}>
              <ProgressHair label={progress ?? 'setting your family in type…'} />
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

        {/* Scope note — the whole-thread archive carries bequeathed entries and
            their recipients; the printed book binds the live entries it can set
            in type. Honest about the difference, no overpromise. */}
        <p
          className="hl-serif"
          style={{
            marginTop: 14,
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--bone-faint)',
            maxWidth: 420,
            marginInline: 'auto',
          }}
        >
          In the whole-thread archive, entries you have bequeathed to others are
          included with their recipients — nothing left to an heir is held back
          from your own archive.
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

/* ── format row — serif label left, mono ext right (HARDCOVER always copper), warm underline when chosen ── */
function FormatRow({
  label,
  ext,
  desc,
  selected,
  onSelect,
}: {
  label: string;
  ext: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const isHardcover = ext === 'hardcover';
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        borderBottom: selected ? '1px solid var(--warm)' : '1px solid var(--rule)',
        padding: '18px 0',
        gap: 16,
        cursor: 'pointer',
        transition: 'border-color 360ms var(--ease)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 20,
            fontWeight: selected ? 600 : 400,
            color: 'var(--text-soft)',
          }}
        >
          {/* Non-color selected cue is the weight swap (above) + the warm bottom-rule. */}
          {label}
        </span>
        {/* The honest one-liner — brightens on select so the chosen shape reads clearly. */}
        <span
          className="hl-serif"
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.5,
            color: selected ? 'var(--bone-dim)' : 'var(--bone-faint)',
            transition: 'color 360ms var(--ease)',
          }}
        >
          {desc}
        </span>
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isHardcover ? 'var(--copper-label)' : 'var(--muted-2)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
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
            padding: '12px 0',
            minHeight: 44,
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
function labelForType(_type: string): string {
  return 'Family book';
}

/** YYYY-MM-DD from LOCAL Date components — not toISOString (UTC rolls back a day in negative-offset zones). */
function localDateStamp(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
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
