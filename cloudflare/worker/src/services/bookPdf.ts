/**
 * Book PDF renderer — generates interior + cover PDFs for a book_order
 * using pdf-lib (pure JS, works in Cloudflare Workers).
 *
 * Call renderBookPdf() after a book_order row is created with status
 * 'COMPILING'. It will:
 *   1. Read the order + its entry filter from D1
 *   2. Query memories + letters for that user/thread
 *   3. Render interior PDF (title page, entries in date order)
 *   4. Render cover PDF (front cover only)
 *   5. Upload both to R2 under books/{orderId}/
 *   6. Call attachPdfsAndSubmit() → Lulu print job
 *
 * Typography: StandardFonts only (no external font fetching).
 *   - TimesRoman / TimesRomanBold → body + headings
 *   - Helvetica / HelveticaBold → labels, eyebrows
 * Color: printed B&W — the warm accent (#b07a4a) maps to ~40% gray.
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import type { AppEnv } from '../index';
import { attachPdfsAndSubmit } from './book';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Letter (8.5 × 11 in) in points
const W = 612;
const H = 792;

// Page margins
const MARGIN_X = 72; // 1 in
const MARGIN_Y = 72; // 1 in
const CONTENT_W = W - MARGIN_X * 2;

// Ink colors
const INK  = rgb(0.055, 0.055, 0.047);
const DIM  = rgb(0.38, 0.38, 0.36);
const WARM = rgb(0.69, 0.478, 0.29);

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

function wrapWords(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue; }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    lines.push(''); // paragraph break
  }
  // Remove trailing blank line
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines;
}

/**
 * Draw wrapped text. Returns the y position after the last line drawn.
 * If a line doesn't fit on the current page, returns null to signal
 * the caller to add a new page.
 */
function drawText(
  page: PDFPage,
  lines: string[],
  opts: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    color?: ReturnType<typeof rgb>;
    lineHeight: number;
    minY: number;
  },
): { y: number; overflow: string[] } {
  let y = opts.y;
  const color = opts.color ?? INK;

  for (let i = 0; i < lines.length; i++) {
    if (y < opts.minY) {
      return { y, overflow: lines.slice(i) };
    }
    if (lines[i]) {
      page.drawText(lines[i], { x: opts.x, y, size: opts.size, font: opts.font, color });
    }
    y -= opts.lineHeight;
  }
  return { y, overflow: [] };
}

// ---------------------------------------------------------------------------
// Page builders
// ---------------------------------------------------------------------------

async function buildTitlePage(
  doc: PDFDocument,
  title: string,
  familyName: string,
  subtitle: string,
): Promise<void> {
  const page = doc.addPage([W, H]);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif     = await doc.embedFont(StandardFonts.TimesRoman);
  const mono      = await doc.embedFont(StandardFonts.Helvetica);

  // Top warm rule
  page.drawRectangle({ x: MARGIN_X, y: H - 48, width: CONTENT_W, height: 1, color: WARM });

  // Title — centered large
  const titleSize = 36;
  const titleLines = wrapWords(title, serifBold, titleSize, CONTENT_W);
  let y = H / 2 + 60;
  for (const line of titleLines) {
    const tw = serifBold.widthOfTextAtSize(line, titleSize);
    page.drawText(line, { x: (W - tw) / 2, y, size: titleSize, font: serifBold, color: INK });
    y -= titleSize * 1.3;
  }

  // Subtitle
  if (subtitle) {
    const subSize = 16;
    const subW = serif.widthOfTextAtSize(subtitle, subSize);
    page.drawText(subtitle, { x: (W - subW) / 2, y: y - 12, size: subSize, font: serif, color: DIM });
    y -= subSize * 1.4 + 12;
  }

  // Divider
  page.drawRectangle({ x: W / 2 - 40, y: y - 16, width: 80, height: 1, color: WARM });

  // Family name / date
  const tagLine = familyName ? `${familyName} · Heirloom` : 'Heirloom';
  const tagSize = 10;
  const tagW = mono.widthOfTextAtSize(tagLine.toUpperCase(), tagSize);
  page.drawText(tagLine.toUpperCase(), {
    x: (W - tagW) / 2,
    y: y - 36,
    size: tagSize,
    font: mono,
    color: DIM,
  });

  // Bottom warm rule
  page.drawRectangle({ x: MARGIN_X, y: 48, width: CONTENT_W, height: 1, color: WARM });
}

async function buildDedicationPage(doc: PDFDocument, dedication: string): Promise<void> {
  const page = doc.addPage([W, H]);
  const serif = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const mono  = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('DEDICATION', {
    x: MARGIN_X, y: H - MARGIN_Y - 12, size: 9, font: mono, color: WARM,
  });
  page.drawRectangle({ x: MARGIN_X, y: H - MARGIN_Y - 20, width: CONTENT_W, height: 1, color: WARM });

  const lines = wrapWords(dedication, serif, 14, CONTENT_W);
  drawText(page, lines, {
    x: MARGIN_X, y: H - MARGIN_Y - 44,
    font: serif, size: 14, lineHeight: 22, minY: MARGIN_Y, color: DIM,
  });
}

interface Entry {
  kind: 'memory' | 'letter';
  id: string;
  date: string;
  title: string | null;
  body: string | null;
  // memory-specific
  type?: string;
  // letter-specific
  salutation?: string | null;
  signature?: string | null;
  sealed?: boolean;
  recipientName?: string | null;
  authorName?: string;
}

async function buildEntryPages(doc: PDFDocument, entry: Entry): Promise<number> {
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif     = await doc.embedFont(StandardFonts.TimesRoman);
  const serifItal = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const mono      = await doc.embedFont(StandardFonts.Helvetica);

  // Format date eyebrow
  let eyebrow = '';
  if (entry.date) {
    try {
      eyebrow = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { eyebrow = entry.date; }
  }
  if (entry.kind === 'letter' && entry.sealed) {
    eyebrow = `SEALED LETTER · ${eyebrow}`;
  } else if (entry.kind === 'letter') {
    eyebrow = `LETTER · ${eyebrow}`;
  } else {
    const t = (entry.type ?? 'MEMORY').toUpperCase();
    eyebrow = `${t} · ${eyebrow}`;
  }

  const body = entry.kind === 'letter'
    ? [entry.salutation, entry.body, entry.signature].filter(Boolean).join('\n\n')
    : (entry.body ?? '');

  const titleText = entry.title ?? (entry.kind === 'letter' ? 'Untitled Letter' : 'Untitled Memory');

  let pagesAdded = 0;
  let remaining = body;

  const addPage = () => {
    const p = doc.addPage([W, H]);
    pagesAdded++;
    return p;
  };

  let page = addPage();
  let y = H - MARGIN_Y - 20;

  // Eyebrow
  page.drawText(eyebrow, { x: MARGIN_X, y, size: 9, font: mono, color: WARM });
  y -= 20;
  // Rule
  page.drawRectangle({ x: MARGIN_X, y, width: CONTENT_W, height: 1, color: WARM });
  y -= 28;

  // Title
  const titleLines = wrapWords(titleText, serifBold, 22, CONTENT_W);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN_X, y, size: 22, font: serifBold, color: INK });
    y -= 30;
  }
  y -= 8;

  // Recipient (letters)
  if (entry.kind === 'letter' && entry.recipientName) {
    page.drawText(`To: ${entry.recipientName}`, { x: MARGIN_X, y, size: 12, font: serifItal, color: DIM });
    y -= 22;
  }
  if (entry.authorName) {
    page.drawText(`By: ${entry.authorName}`, { x: MARGIN_X, y, size: 10, font: mono, color: DIM });
    y -= 18;
  }
  y -= 8;

  // Body — wrap and flow across pages
  while (remaining) {
    const lines = wrapWords(remaining, serif, 12, CONTENT_W);
    const { overflow } = drawText(page, lines, {
      x: MARGIN_X, y,
      font: serif, size: 12, lineHeight: 19, minY: MARGIN_Y + 20, color: INK,
    });

    if (overflow.length) {
      // Start continuation page
      page = addPage();
      y = H - MARGIN_Y - 20;
      // Continuation eyebrow
      page.drawText(`${eyebrow} (cont.)`, { x: MARGIN_X, y, size: 9, font: mono, color: DIM });
      y -= 20;
      page.drawRectangle({ x: MARGIN_X, y, width: CONTENT_W, height: 1, color: rgb(0.85, 0.85, 0.83) });
      y -= 24;
      remaining = overflow.join('\n');
    } else {
      break;
    }
  }

  // Page numbers (bottom center)
  const pageCount = doc.getPageCount();
  for (let i = pageCount - pagesAdded + 1; i <= pageCount; i++) {
    const p = doc.getPage(i - 1);
    const numStr = String(i);
    const numW = mono.widthOfTextAtSize(numStr, 9);
    p.drawText(numStr, { x: (W - numW) / 2, y: MARGIN_Y - 28, size: 9, font: mono, color: DIM });
  }

  return pagesAdded;
}

async function buildCoverPdf(title: string, familyName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);

  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const mono      = await doc.embedFont(StandardFonts.Helvetica);

  // Full ink background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: INK });

  // Top warm rule
  page.drawRectangle({ x: MARGIN_X, y: H - 52, width: CONTENT_W, height: 2, color: WARM });

  // Title — large, centered, bone
  const bone = rgb(0.957, 0.925, 0.847);
  const titleSize = 42;
  const titleLines = wrapWords(title, serifBold, titleSize, CONTENT_W);
  let y = H / 2 + 60 + (titleLines.length * titleSize * 0.65) / 2;
  for (const line of titleLines) {
    const tw = serifBold.widthOfTextAtSize(line, titleSize);
    page.drawText(line, { x: (W - tw) / 2, y, size: titleSize, font: serifBold, color: bone });
    y -= titleSize * 1.3;
  }

  // Divider
  page.drawRectangle({ x: W / 2 - 30, y: y - 14, width: 60, height: 1, color: WARM });

  // Family name
  if (familyName) {
    const fnSize = 13;
    const fnW = mono.widthOfTextAtSize(familyName.toUpperCase(), fnSize);
    page.drawText(familyName.toUpperCase(), {
      x: (W - fnW) / 2, y: y - 36,
      size: fnSize, font: mono, color: rgb(0.6, 0.58, 0.55),
    });
  }

  // Bottom mark
  const mark = '∞';
  const markSize = 28;
  const markW = serifBold.widthOfTextAtSize(mark, markSize);
  page.drawText(mark, { x: (W - markW) / 2, y: 56, size: markSize, font: serifBold, color: WARM });

  // Bottom warm rule
  page.drawRectangle({ x: MARGIN_X, y: 48, width: CONTENT_W, height: 2, color: WARM });

  return doc.save();
}

// ---------------------------------------------------------------------------
// DB types
// ---------------------------------------------------------------------------

interface BookOrder {
  id: string;
  purchaser_user_id: string;
  ship_to_name: string;
  thread_id: string | null;
  entry_filter_json: string | null;
}

interface MemoryRow {
  id: string;
  title: string | null;
  description: string | null;
  type: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
}

interface LetterRow {
  id: string;
  title: string | null;
  salutation: string | null;
  body: string | null;
  signature: string | null;
  sealed_at: string | null;
  delivery_trigger: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  recipient_name: string | null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function renderBookPdf(
  env: AppEnv['Bindings'],
  bookOrderId: string,
): Promise<void> {
  // 1. Load the order
  const order = await env.DB.prepare(
    `SELECT id, purchaser_user_id, ship_to_name, thread_id, entry_filter_json
     FROM book_orders WHERE id = ?`,
  ).bind(bookOrderId).first<BookOrder>();

  if (!order) {
    await env.DB.prepare(
      `UPDATE book_orders SET status = 'FAILED', error = 'order not found', updated_at = datetime('now') WHERE id = ?`,
    ).bind(bookOrderId).run();
    return;
  }

  let filter: { from?: string; to?: string; member_ids?: string[] } = {};
  try {
    if (order.entry_filter_json) filter = JSON.parse(order.entry_filter_json);
  } catch { /* ignore */ }

  // 2. Query entries
  const userId = order.purchaser_user_id;

  // Memories — join author name, filter by date if provided
  let memSql = `SELECT m.id, m.title, m.description, m.type, m.created_at,
                       u.first_name, u.last_name
                FROM memories m
                JOIN users u ON u.id = m.user_id
                WHERE m.user_id = ? AND m.deleted_at IS NULL`;
  const memParams: unknown[] = [userId];
  if (filter.from) { memSql += ' AND m.created_at >= ?'; memParams.push(filter.from); }
  if (filter.to)   { memSql += ' AND m.created_at <= ?'; memParams.push(filter.to); }
  memSql += ' ORDER BY m.created_at ASC LIMIT 500';

  const memResult = await env.DB.prepare(memSql).bind(...memParams).all<MemoryRow>();

  // Letters (unsealed or scheduled — skip sealed+posthumous for privacy)
  let letSql = `SELECT l.id, l.title, l.salutation, l.body, l.signature,
                       l.sealed_at, l.delivery_trigger, l.created_at,
                       u.first_name, u.last_name,
                       (SELECT fm.name FROM family_members fm
                        JOIN letter_recipients lr ON lr.family_member_id = fm.id
                        WHERE lr.letter_id = l.id LIMIT 1) AS recipient_name
                FROM letters l
                JOIN users u ON u.id = l.user_id
                WHERE l.user_id = ? AND l.deleted_at IS NULL
                  AND l.delivery_trigger != 'POSTHUMOUS'`;
  const letParams: unknown[] = [userId];
  if (filter.from) { letSql += ' AND l.created_at >= ?'; letParams.push(filter.from); }
  if (filter.to)   { letSql += ' AND l.created_at <= ?'; letParams.push(filter.to); }
  letSql += ' ORDER BY l.created_at ASC LIMIT 200';

  const letResult = await env.DB.prepare(letSql).bind(...letParams).all<LetterRow>();

  // 3. Merge and sort by date
  const entries: Entry[] = [
    ...(memResult.results ?? []).map((m): Entry => ({
      kind: 'memory',
      id: m.id,
      date: m.created_at,
      title: m.title,
      body: m.description,
      type: m.type,
      authorName: [m.first_name, m.last_name].filter(Boolean).join(' ') || undefined,
    })),
    ...(letResult.results ?? []).map((l): Entry => ({
      kind: 'letter',
      id: l.id,
      date: l.created_at,
      title: l.title,
      body: l.body,
      salutation: l.salutation,
      signature: l.signature,
      sealed: Boolean(l.sealed_at),
      recipientName: l.recipient_name,
      authorName: [l.first_name, l.last_name].filter(Boolean).join(' ') || undefined,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // 4. Build interior PDF
  const doc = await PDFDocument.create();
  doc.setTitle(order.ship_to_name);
  doc.setAuthor('Heirloom');
  doc.setCreator('Heirloom · heirloom.blue');

  // Title is derived from the family name embedded in ship_to_name
  const familyName = order.ship_to_name.replace(/^The /, '').replace(/ Thread$/, '') || order.ship_to_name;
  const bookTitle = `The ${familyName} Thread`;

  await buildTitlePage(doc, bookTitle, familyName, 'A permanent family record');

  // Dedication page (placeholder for first version — content comes from entry_filter or config)
  await buildDedicationPage(
    doc,
    `This book belongs to the ${familyName} family.\nEvery entry is permanent. Nothing has been deleted.\nWeave yours into the cloth.`,
  );

  if (entries.length === 0) {
    // Blank interior page so Lulu doesn't reject a 2-page book
    doc.addPage([W, H]);
  } else {
    for (const entry of entries) {
      await buildEntryPages(doc, entry);
    }
  }

  const interiorBytes = await doc.save();

  // 5. Build cover PDF
  const coverBytes = await buildCoverPdf(bookTitle, familyName);

  // 6. Upload to R2
  const interiorKey = `books/${bookOrderId}/interior.pdf`;
  const coverKey    = `books/${bookOrderId}/cover.pdf`;

  await env.STORAGE.put(interiorKey, interiorBytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });
  await env.STORAGE.put(coverKey, coverBytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });

  // 7. Submit to Lulu
  await attachPdfsAndSubmit(env, bookOrderId, interiorKey, coverKey, doc.getPageCount());
}
