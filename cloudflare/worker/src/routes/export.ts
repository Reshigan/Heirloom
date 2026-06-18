/**
 * Export Routes - PDF and Book Generation
 * Generate true PDFs of memories, letters, and family books using pdf-lib
 */

import { Hono } from 'hono';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import type { AppEnv } from '../index';
import { readDescription } from '../lib/legacyArchive';

// Heirloom brand colors
const COLORS = {
  gold: rgb(0.79, 0.66, 0.35), // #C9A959
  goldLight: rgb(0.94, 0.84, 0.55), // #F0D78C
  goldDark: rgb(0.63, 0.51, 0.21), // #A08335
  void: rgb(0.04, 0.05, 0.06), // #0A0C10
  paper: rgb(0.96, 0.95, 0.93), // #F5F3ED
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
};

// Style configurations
const STYLES = {
  classic: {
    primary: rgb(0.55, 0.27, 0.07), // #8B4513
    secondary: rgb(0.82, 0.41, 0.12), // #D2691E
  },
  modern: {
    primary: rgb(0.10, 0.10, 0.18), // #1a1a2e
    secondary: rgb(0.83, 0.69, 0.22), // #D4AF37
  },
  elegant: {
    primary: rgb(0.17, 0.24, 0.31), // #2C3E50
    secondary: rgb(0.75, 0.63, 0.50), // #C0A080
  },
};

// Helper to draw the Heirloom logo (infinity symbol) on a page
function drawHeirloomLogo(page: PDFPage, x: number, y: number, width: number = 100) {
  const scale = width / 160;
  
  // Left loop of infinity
  page.drawEllipse({
    x: x + 40 * scale,
    y: y,
    xScale: 35 * scale,
    yScale: 25 * scale,
    borderColor: COLORS.gold,
    borderWidth: 4 * scale,
  });
  
  // Right loop of infinity
  page.drawEllipse({
    x: x + 120 * scale,
    y: y,
    xScale: 35 * scale,
    yScale: 25 * scale,
    borderColor: COLORS.gold,
    borderWidth: 4 * scale,
  });
  
  // Cover the overlap in the middle with a small rectangle
  page.drawRectangle({
    x: x + 75 * scale,
    y: y - 10 * scale,
    width: 10 * scale,
    height: 20 * scale,
    color: COLORS.white,
  });
}

// Helper to draw header with logo on each page
function drawPageHeader(page: PDFPage, font: PDFFont) {
  const { width, height } = page.getSize();
  
  // Draw logo at top center
  drawHeirloomLogo(page, width / 2 - 50, height - 40, 100);
  
  // Draw "HEIRLOOM" text below logo
  const logoText = 'HEIRLOOM';
  const logoTextWidth = font.widthOfTextAtSize(logoText, 12);
  page.drawText(logoText, {
    x: width / 2 - logoTextWidth / 2,
    y: height - 65,
    size: 12,
    font,
    color: COLORS.gold,
  });
  
  // Draw horizontal line
  page.drawLine({
    start: { x: 50, y: height - 80 },
    end: { x: width - 50, y: height - 80 },
    thickness: 1,
    color: COLORS.goldLight,
  });
}

// Helper to draw footer with page number
function drawPageFooter(page: PDFPage, font: PDFFont, pageNum: number, totalPages: number) {
  const { width } = page.getSize();
  
  // Draw page number
  const pageText = `Page ${pageNum} of ${totalPages}`;
  const textWidth = font.widthOfTextAtSize(pageText, 10);
  page.drawText(pageText, {
    x: width / 2 - textWidth / 2,
    y: 30,
    size: 10,
    font,
    color: COLORS.gray,
  });
  
  // Draw footer line
  page.drawLine({
    start: { x: 50, y: 45 },
    end: { x: width - 50, y: 45 },
    thickness: 0.5,
    color: COLORS.goldLight,
  });
}

// Helper to wrap text to fit within a given width
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export const exportRoutes = new Hono<AppEnv>();

// ============================================
// GENERATE MEMORIES PDF
// ============================================

exportRoutes.post('/memories-pdf', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { title, includePhotos, includeLetters, includeVoiceTranscripts, dateRange, familyMemberIds, style } = body;
  
  const now = new Date().toISOString();
  const exportId = crypto.randomUUID();
  
  // Create export job record
  await c.env.DB.prepare(`
    INSERT INTO export_jobs (id, user_id, type, status, config, created_at, updated_at)
    VALUES (?, ?, 'MEMORIES_PDF', 'PENDING', ?, ?, ?)
  `).bind(
    exportId,
    userId,
    JSON.stringify({ title, includePhotos, includeLetters, includeVoiceTranscripts, dateRange, familyMemberIds, style }),
    now,
    now
  ).run();
  
  // Build query for memories
  let query = `SELECT * FROM memories WHERE user_id = ? AND deleted_at IS NULL`;
  const params: any[] = [userId];

  if (dateRange?.start) {
    query += ` AND created_at >= ?`;
    params.push(dateRange.start);
  }
  if (dateRange?.end) {
    query += ` AND created_at <= ?`;
    params.push(dateRange.end);
  }
  
  // Filter by type
  const types: string[] = [];
  if (includePhotos !== false) types.push('PHOTO', 'VIDEO');
  if (includeVoiceTranscripts) types.push('VOICE');
  if (types.length > 0) {
    query += ` AND type IN (${types.map(() => '?').join(',')})`;
    params.push(...types);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const memories = await c.env.DB.prepare(query).bind(...params).all();
  // Normalize at-rest-encrypted descriptions to plaintext for rendering.
  for (const m of memories.results as any[]) {
    m.description = await readDescription(c.env, m);
  }

  // Get letters if requested
  let letters: any[] = [];
  if (includeLetters) {
    const lettersResult = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).bind(userId).all();
    letters = lettersResult.results;
  }

  // Get voice transcripts if requested
  let voiceRecordings: any[] = [];
  if (includeVoiceTranscripts) {
    const voiceResult = await c.env.DB.prepare(`
      SELECT * FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL AND transcript IS NOT NULL ORDER BY created_at DESC
    `).bind(userId).all();
    voiceRecordings = voiceResult.results;
  }
  
  // Generate true PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const styleConfig = STYLES[style as keyof typeof STYLES] || STYLES.classic;
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  
  // Cover page
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Draw logo on cover
  drawHeirloomLogo(coverPage, pageWidth / 2 - 75, pageHeight - 200, 150);
  
  // Draw "HEIRLOOM" text
  const heirloomText = 'HEIRLOOM';
  const heirloomWidth = timesRomanBold.widthOfTextAtSize(heirloomText, 24);
  coverPage.drawText(heirloomText, {
    x: pageWidth / 2 - heirloomWidth / 2,
    y: pageHeight - 250,
    size: 24,
    font: timesRomanBold,
    color: COLORS.gold,
  });
  
  // Draw title
  const pdfTitle = title || 'My Memories';
  const titleLines = wrapText(pdfTitle, timesRomanBold, 36, contentWidth);
  let titleY = pageHeight / 2 + 50;
  for (const line of titleLines) {
    const lineWidth = timesRomanBold.widthOfTextAtSize(line, 36);
    coverPage.drawText(line, {
      x: pageWidth / 2 - lineWidth / 2,
      y: titleY,
      size: 36,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    titleY -= 45;
  }
  
  // Draw subtitle
  const subtitle = 'A Collection of Precious Memories';
  const subtitleWidth = timesRomanItalic.widthOfTextAtSize(subtitle, 18);
  coverPage.drawText(subtitle, {
    x: pageWidth / 2 - subtitleWidth / 2,
    y: titleY - 20,
    size: 18,
    font: timesRomanItalic,
    color: styleConfig.secondary,
  });
  
  // Draw date
  const dateText = `Generated on ${new Date().toLocaleDateString()}`;
  const dateWidth = timesRoman.widthOfTextAtSize(dateText, 12);
  coverPage.drawText(dateText, {
    x: pageWidth / 2 - dateWidth / 2,
    y: 100,
    size: 12,
    font: timesRoman,
    color: COLORS.gray,
  });
  
  // Memories section
  if (memories.results.length > 0) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(currentPage, timesRoman);
    let yPosition = pageHeight - 120;
    
    // Section title
    currentPage.drawText('Memories', {
      x: margin,
      y: yPosition,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPosition -= 40;
    
    // Draw line under section title
    currentPage.drawLine({
      start: { x: margin, y: yPosition + 10 },
      end: { x: pageWidth - margin, y: yPosition + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPosition -= 30;
    
    for (const memory of memories.results as any[]) {
      // Check if we need a new page
      if (yPosition < 150) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageHeader(currentPage, timesRoman);
        yPosition = pageHeight - 120;
      }
      
      // Memory title
      const memoryTitle = memory.title || 'Untitled Memory';
      currentPage.drawText(memoryTitle, {
        x: margin,
        y: yPosition,
        size: 16,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPosition -= 20;
      
      // Memory date
      const memoryDate = new Date(memory.created_at).toLocaleDateString();
      currentPage.drawText(memoryDate, {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanItalic,
        color: COLORS.gray,
      });
      yPosition -= 20;
      
      // Memory description
      if (memory.description) {
        const descLines = wrapText(memory.description, timesRoman, 12, contentWidth);
        for (const line of descLines) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(currentPage, timesRoman);
            yPosition = pageHeight - 120;
          }
          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
          yPosition -= 18;
        }
      }
      
      yPosition -= 30; // Space between memories
    }
  }
  
  // Letters section
  if (letters.length > 0) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(currentPage, timesRoman);
    let yPosition = pageHeight - 120;
    
    // Section title
    currentPage.drawText('Letters', {
      x: margin,
      y: yPosition,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPosition -= 40;
    
    currentPage.drawLine({
      start: { x: margin, y: yPosition + 10 },
      end: { x: pageWidth - margin, y: yPosition + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPosition -= 30;
    
    for (const letter of letters as any[]) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageHeader(currentPage, timesRoman);
      yPosition = pageHeight - 120;
      
      const letterTitle = letter.title || 'Untitled Letter';
      const letterTitleWidth = timesRomanBold.widthOfTextAtSize(letterTitle, 20);
      currentPage.drawText(letterTitle, {
        x: pageWidth / 2 - letterTitleWidth / 2,
        y: yPosition,
        size: 20,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPosition -= 40;
      
      if (letter.salutation) {
        currentPage.drawText(letter.salutation, {
          x: margin,
          y: yPosition,
          size: 14,
          font: timesRomanItalic,
          color: COLORS.black,
        });
        yPosition -= 30;
      }
      
      if (letter.body) {
        const bodyLines = wrapText(letter.body, timesRoman, 12, contentWidth);
        for (const line of bodyLines) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(currentPage, timesRoman);
            yPosition = pageHeight - 120;
          }
          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
          yPosition -= 18;
        }
      }
      
      if (letter.signature) {
        yPosition -= 20;
        const sigWidth = timesRomanItalic.widthOfTextAtSize(letter.signature, 14);
        currentPage.drawText(letter.signature, {
          x: pageWidth - margin - sigWidth,
          y: yPosition,
          size: 14,
          font: timesRomanItalic,
          color: COLORS.black,
        });
      }
    }
  }
  
  // Voice recordings section
  if (voiceRecordings.length > 0) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(currentPage, timesRoman);
    let yPosition = pageHeight - 120;
    
    currentPage.drawText('Voice Recordings', {
      x: margin,
      y: yPosition,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPosition -= 40;
    
    currentPage.drawLine({
      start: { x: margin, y: yPosition + 10 },
      end: { x: pageWidth - margin, y: yPosition + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPosition -= 30;
    
    for (const voice of voiceRecordings as any[]) {
      if (yPosition < 150) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageHeader(currentPage, timesRoman);
        yPosition = pageHeight - 120;
      }
      
      const voiceTitle = voice.title || 'Untitled Recording';
      currentPage.drawText(voiceTitle, {
        x: margin,
        y: yPosition,
        size: 16,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPosition -= 20;
      
      const voiceDate = new Date(voice.created_at).toLocaleDateString();
      currentPage.drawText(voiceDate, {
        x: margin,
        y: yPosition,
        size: 11,
        font: timesRomanItalic,
        color: COLORS.gray,
      });
      yPosition -= 25;
      
      if (voice.transcript) {
        const transcriptLines = wrapText(`"${voice.transcript}"`, timesRomanItalic, 12, contentWidth - 20);
        for (const line of transcriptLines) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(currentPage, timesRoman);
            yPosition = pageHeight - 120;
          }
          currentPage.drawText(line, {
            x: margin + 15,
            y: yPosition,
            size: 12,
            font: timesRomanItalic,
            color: COLORS.black,
          });
          yPosition -= 18;
        }
      }
      
      yPosition -= 30;
    }
  }
  
  // Add page numbers to all pages
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    drawPageFooter(pages[i], timesRoman, i + 1, pages.length);
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  // Store the PDF
  const fileKey = `exports/${userId}/${exportId}.pdf`;
  await c.env.STORAGE.put(fileKey, pdfBytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });
  
  // Update export job
  await c.env.DB.prepare(`
    UPDATE export_jobs SET status = 'COMPLETED', file_key = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(fileKey, now, now, exportId).run();
  
  return c.json({
    exportId,
    status: 'COMPLETED',
    downloadUrl: `${c.env.API_URL}/api/export/${exportId}/download`,
    message: 'PDF export ready for download',
  });
});

// ============================================
// GENERATE LETTERS PDF
// ============================================

exportRoutes.post('/letters-pdf', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { letterIds, includeAll, style } = body;
  
  const now = new Date().toISOString();
  const exportId = crypto.randomUUID();
  
  // Create export job record
  await c.env.DB.prepare(`
    INSERT INTO export_jobs (id, user_id, type, status, config, created_at, updated_at)
    VALUES (?, ?, 'LETTERS_PDF', 'PENDING', ?, ?, ?)
  `).bind(
    exportId,
    userId,
    JSON.stringify({ letterIds, includeAll, style }),
    now,
    now
  ).run();
  
  // Get letters
  let letters: any[];
  if (includeAll || !letterIds || letterIds.length === 0) {
    const result = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).bind(userId).all();
    letters = result.results;
  } else {
    const placeholders = letterIds.map(() => '?').join(',');
    const result = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? AND deleted_at IS NULL AND id IN (${placeholders}) ORDER BY created_at DESC
    `).bind(userId, ...letterIds).all();
    letters = result.results;
  }
  
  // Generate true PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const styleConfig = STYLES[style as keyof typeof STYLES] || STYLES.classic;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  
  // Cover page
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Draw logo on cover
  drawHeirloomLogo(coverPage, pageWidth / 2 - 75, pageHeight - 200, 150);
  
  // Draw "HEIRLOOM" text
  const heirloomText = 'HEIRLOOM';
  const heirloomWidth = timesRomanBold.widthOfTextAtSize(heirloomText, 24);
  coverPage.drawText(heirloomText, {
    x: pageWidth / 2 - heirloomWidth / 2,
    y: pageHeight - 250,
    size: 24,
    font: timesRomanBold,
    color: COLORS.gold,
  });
  
  // Draw title
  const pdfTitle = 'My Letters';
  const titleWidth = timesRomanBold.widthOfTextAtSize(pdfTitle, 36);
  coverPage.drawText(pdfTitle, {
    x: pageWidth / 2 - titleWidth / 2,
    y: pageHeight / 2 + 50,
    size: 36,
    font: timesRomanBold,
    color: styleConfig.primary,
  });
  
  // Draw subtitle
  const subtitle = 'Words from the Heart';
  const subtitleWidth = timesRomanItalic.widthOfTextAtSize(subtitle, 18);
  coverPage.drawText(subtitle, {
    x: pageWidth / 2 - subtitleWidth / 2,
    y: pageHeight / 2,
    size: 18,
    font: timesRomanItalic,
    color: styleConfig.secondary,
  });
  
  // Draw date
  const dateText = `Generated on ${new Date().toLocaleDateString()}`;
  const dateWidth = timesRoman.widthOfTextAtSize(dateText, 12);
  coverPage.drawText(dateText, {
    x: pageWidth / 2 - dateWidth / 2,
    y: 100,
    size: 12,
    font: timesRoman,
    color: COLORS.gray,
  });
  
  // Each letter on its own page
  for (const letter of letters as any[]) {
    const letterPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(letterPage, timesRoman);
    let yPosition = pageHeight - 120;
    
    // Letter title
    const letterTitle = letter.title || 'Untitled Letter';
    const letterTitleWidth = timesRomanBold.widthOfTextAtSize(letterTitle, 24);
    letterPage.drawText(letterTitle, {
      x: pageWidth / 2 - letterTitleWidth / 2,
      y: yPosition,
      size: 24,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPosition -= 50;
    
    // Salutation
    if (letter.salutation) {
      letterPage.drawText(letter.salutation, {
        x: margin,
        y: yPosition,
        size: 14,
        font: timesRomanItalic,
        color: COLORS.black,
      });
      yPosition -= 30;
    }
    
    // Letter body
    if (letter.body) {
      const bodyLines = wrapText(letter.body, timesRoman, 12, contentWidth);
      for (const line of bodyLines) {
        if (yPosition < 100) {
          const continuePage = pdfDoc.addPage([pageWidth, pageHeight]);
          drawPageHeader(continuePage, timesRoman);
          yPosition = pageHeight - 120;
          continuePage.drawText(line, {
            x: margin,
            y: yPosition,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
        } else {
          letterPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
        }
        yPosition -= 20;
      }
    }
    
    // Signature
    if (letter.signature) {
      yPosition -= 30;
      const sigWidth = timesRomanItalic.widthOfTextAtSize(letter.signature, 16);
      letterPage.drawText(letter.signature, {
        x: pageWidth - margin - sigWidth,
        y: Math.max(yPosition, 80),
        size: 16,
        font: timesRomanItalic,
        color: COLORS.black,
      });
    }
    
    // Date at bottom
    const letterDate = new Date(letter.created_at).toLocaleDateString();
    const letterDateWidth = timesRoman.widthOfTextAtSize(letterDate, 10);
    letterPage.drawText(letterDate, {
      x: pageWidth - margin - letterDateWidth,
      y: 60,
      size: 10,
      font: timesRoman,
      color: COLORS.gray,
    });
  }
  
  // Add page numbers
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    drawPageFooter(pages[i], timesRoman, i + 1, pages.length);
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  // Store the PDF
  const fileKey = `exports/${userId}/${exportId}.pdf`;
  await c.env.STORAGE.put(fileKey, pdfBytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });
  
  // Update export job
  await c.env.DB.prepare(`
    UPDATE export_jobs SET status = 'COMPLETED', file_key = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(fileKey, now, now, exportId).run();
  
  return c.json({
    exportId,
    status: 'COMPLETED',
    downloadUrl: `${c.env.API_URL}/api/export/${exportId}/download`,
  });
});

// ============================================
// GENERATE FAMILY BOOK
// ============================================

exportRoutes.post('/family-book', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { 
    title, 
    subtitle, 
    includeMemories, 
    includeLetters, 
    includeVoiceTranscripts, 
    includeFamilyTree, 
    coverStyle, 
    dedication 
  } = body;
  
  const now = new Date().toISOString();
  const exportId = crypto.randomUUID();
  
  // Create export job record
  await c.env.DB.prepare(`
    INSERT INTO export_jobs (id, user_id, type, status, config, created_at, updated_at)
    VALUES (?, ?, 'FAMILY_BOOK', 'PENDING', ?, ?, ?)
  `).bind(
    exportId,
    userId,
    JSON.stringify(body),
    now,
    now
  ).run();
  
  // Gather all content
  const content: any = {
    title: title || 'Our Family Story',
    subtitle,
    dedication,
    coverStyle: coverStyle || 'classic',
  };
  
  // Get memories
  if (includeMemories !== false) {
    const memoriesResult = await c.env.DB.prepare(`
      SELECT * FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).bind(userId).all();
    // Normalize at-rest-encrypted descriptions to plaintext for rendering.
    for (const m of memoriesResult.results as any[]) {
      m.description = await readDescription(c.env, m);
    }
    content.memories = memoriesResult.results;
  }

  // Get letters
  if (includeLetters !== false) {
    const lettersResult = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).bind(userId).all();
    content.letters = lettersResult.results;
  }

  // Get voice transcripts
  if (includeVoiceTranscripts) {
    const voiceResult = await c.env.DB.prepare(`
      SELECT * FROM voice_recordings WHERE user_id = ? AND deleted_at IS NULL AND transcript IS NOT NULL ORDER BY created_at DESC
    `).bind(userId).all();
    content.voiceRecordings = voiceResult.results;
  }
  
  // Get family members for tree
  if (includeFamilyTree !== false) {
    const familyResult = await c.env.DB.prepare(`
      SELECT * FROM family_members WHERE user_id = ? ORDER BY name
    `).bind(userId).all();
    content.familyMembers = familyResult.results;
  }
  
  // Generate true PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  
  const styleConfig = STYLES[coverStyle as keyof typeof STYLES] || STYLES.classic;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  
  const memories = content.memories || [];
  const letters = content.letters || [];
  const voiceRecordings = content.voiceRecordings || [];
  const familyMembers = content.familyMembers || [];
  
  // ===== COVER PAGE =====
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Draw large logo on cover
  drawHeirloomLogo(coverPage, pageWidth / 2 - 100, pageHeight - 180, 200);
  
  // Draw "HEIRLOOM" text
  const heirloomText = 'HEIRLOOM';
  const heirloomWidth = timesRomanBold.widthOfTextAtSize(heirloomText, 28);
  coverPage.drawText(heirloomText, {
    x: pageWidth / 2 - heirloomWidth / 2,
    y: pageHeight - 240,
    size: 28,
    font: timesRomanBold,
    color: COLORS.gold,
  });
  
  // Decorative line
  coverPage.drawLine({
    start: { x: pageWidth / 2 - 100, y: pageHeight - 260 },
    end: { x: pageWidth / 2 + 100, y: pageHeight - 260 },
    thickness: 2,
    color: COLORS.goldLight,
  });
  
  // Book title
  const bookTitle = title || 'Our Family Story';
  const titleLines = wrapText(bookTitle, timesRomanBold, 42, contentWidth);
  let titleY = pageHeight / 2 + 80;
  for (const line of titleLines) {
    const lineWidth = timesRomanBold.widthOfTextAtSize(line, 42);
    coverPage.drawText(line, {
      x: pageWidth / 2 - lineWidth / 2,
      y: titleY,
      size: 42,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    titleY -= 50;
  }
  
  // Subtitle
  if (subtitle) {
    const subtitleWidth = timesRomanItalic.widthOfTextAtSize(subtitle, 20);
    coverPage.drawText(subtitle, {
      x: pageWidth / 2 - subtitleWidth / 2,
      y: titleY - 10,
      size: 20,
      font: timesRomanItalic,
      color: styleConfig.secondary,
    });
  }
  
  // Date at bottom
  const dateText = new Date().getFullYear().toString();
  const dateWidth = timesRoman.widthOfTextAtSize(dateText, 16);
  coverPage.drawText(dateText, {
    x: pageWidth / 2 - dateWidth / 2,
    y: 80,
    size: 16,
    font: timesRoman,
    color: COLORS.gray,
  });
  
  // ===== DEDICATION PAGE =====
  if (dedication) {
    const dedicationPage = pdfDoc.addPage([pageWidth, pageHeight]);
    
    const dedicationTitle = 'Dedication';
    const dedicationTitleWidth = timesRomanItalic.widthOfTextAtSize(dedicationTitle, 24);
    dedicationPage.drawText(dedicationTitle, {
      x: pageWidth / 2 - dedicationTitleWidth / 2,
      y: pageHeight - 200,
      size: 24,
      font: timesRomanItalic,
      color: styleConfig.secondary,
    });
    
    const dedicationLines = wrapText(dedication, timesRomanItalic, 16, contentWidth - 100);
    let dedY = pageHeight / 2 + dedicationLines.length * 12;
    for (const line of dedicationLines) {
      const lineWidth = timesRomanItalic.widthOfTextAtSize(line, 16);
      dedicationPage.drawText(line, {
        x: pageWidth / 2 - lineWidth / 2,
        y: dedY,
        size: 16,
        font: timesRomanItalic,
        color: COLORS.black,
      });
      dedY -= 28;
    }
  }
  
  // ===== TABLE OF CONTENTS =====
  const tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPageHeader(tocPage, timesRoman);
  
  const tocTitle = 'Table of Contents';
  const tocTitleWidth = timesRomanBold.widthOfTextAtSize(tocTitle, 28);
  tocPage.drawText(tocTitle, {
    x: pageWidth / 2 - tocTitleWidth / 2,
    y: pageHeight - 150,
    size: 28,
    font: timesRomanBold,
    color: styleConfig.primary,
  });
  
  let tocY = pageHeight - 220;
  const tocItems: string[] = [];
  if (familyMembers.length > 0) tocItems.push('Family Tree');
  if (memories.length > 0) tocItems.push('Memories');
  if (letters.length > 0) tocItems.push('Letters');
  if (voiceRecordings.length > 0) tocItems.push('Voice Recordings');
  
  for (let i = 0; i < tocItems.length; i++) {
    tocPage.drawText(`${i + 1}. ${tocItems[i]}`, {
      x: margin + 50,
      y: tocY,
      size: 16,
      font: timesRoman,
      color: COLORS.black,
    });
    tocY -= 35;
  }
  
  // ===== FAMILY TREE SECTION =====
  if (familyMembers.length > 0) {
    let familyPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(familyPage, timesRoman);
    let yPos = pageHeight - 120;
    
    familyPage.drawText('Family Tree', {
      x: margin,
      y: yPos,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPos -= 40;
    
    familyPage.drawLine({
      start: { x: margin, y: yPos + 10 },
      end: { x: pageWidth - margin, y: yPos + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPos -= 40;
    
    for (const member of familyMembers as any[]) {
      if (yPos < 100) {
        familyPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageHeader(familyPage, timesRoman);
        yPos = pageHeight - 120;
      }
      
      const memberName = member.name || 'Unknown';
      familyPage.drawText(memberName, {
        x: margin,
        y: yPos,
        size: 16,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      
      if (member.relationship) {
        familyPage.drawText(` - ${member.relationship}`, {
          x: margin + timesRomanBold.widthOfTextAtSize(memberName, 16),
          y: yPos,
          size: 14,
          font: timesRomanItalic,
          color: COLORS.gray,
        });
      }
      
      yPos -= 30;
    }
  }
  
  // ===== MEMORIES SECTION =====
  if (memories.length > 0) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(currentPage, timesRoman);
    let yPos = pageHeight - 120;
    
    currentPage.drawText('Memories', {
      x: margin,
      y: yPos,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPos -= 40;
    
    currentPage.drawLine({
      start: { x: margin, y: yPos + 10 },
      end: { x: pageWidth - margin, y: yPos + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPos -= 30;
    
    for (const memory of memories as any[]) {
      if (yPos < 150) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageHeader(currentPage, timesRoman);
        yPos = pageHeight - 120;
      }
      
      currentPage.drawText(memory.title || 'Untitled', {
        x: margin,
        y: yPos,
        size: 16,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPos -= 20;
      
      currentPage.drawText(new Date(memory.created_at).toLocaleDateString(), {
        x: margin,
        y: yPos,
        size: 11,
        font: timesRomanItalic,
        color: COLORS.gray,
      });
      yPos -= 20;
      
      if (memory.description) {
        const descLines = wrapText(memory.description, timesRoman, 12, contentWidth);
        for (const line of descLines) {
          if (yPos < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(currentPage, timesRoman);
            yPos = pageHeight - 120;
          }
          currentPage.drawText(line, {
            x: margin,
            y: yPos,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
          yPos -= 18;
        }
      }
      
      yPos -= 25;
    }
  }
  
  // ===== LETTERS SECTION =====
  if (letters.length > 0) {
    for (const letter of letters as any[]) {
      const letterPage = pdfDoc.addPage([pageWidth, pageHeight]);
      drawPageHeader(letterPage, timesRoman);
      let yPos = pageHeight - 120;
      
      const letterTitle = letter.title || 'Untitled Letter';
      const letterTitleWidth = timesRomanBold.widthOfTextAtSize(letterTitle, 22);
      letterPage.drawText(letterTitle, {
        x: pageWidth / 2 - letterTitleWidth / 2,
        y: yPos,
        size: 22,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPos -= 45;
      
      if (letter.salutation) {
        letterPage.drawText(letter.salutation, {
          x: margin,
          y: yPos,
          size: 14,
          font: timesRomanItalic,
          color: COLORS.black,
        });
        yPos -= 30;
      }
      
      if (letter.body) {
        const bodyLines = wrapText(letter.body, timesRoman, 12, contentWidth);
        for (const line of bodyLines) {
          if (yPos < 100) {
            const contPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(contPage, timesRoman);
            yPos = pageHeight - 120;
          }
          letterPage.drawText(line, {
            x: margin,
            y: yPos,
            size: 12,
            font: timesRoman,
            color: COLORS.black,
          });
          yPos -= 18;
        }
      }
      
      if (letter.signature) {
        yPos -= 25;
        const sigWidth = timesRomanItalic.widthOfTextAtSize(letter.signature, 14);
        letterPage.drawText(letter.signature, {
          x: pageWidth - margin - sigWidth,
          y: Math.max(yPos, 80),
          size: 14,
          font: timesRomanItalic,
          color: COLORS.black,
        });
      }
    }
  }
  
  // ===== VOICE RECORDINGS SECTION =====
  if (voiceRecordings.length > 0) {
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    drawPageHeader(currentPage, timesRoman);
    let yPos = pageHeight - 120;
    
    currentPage.drawText('Voice Recordings', {
      x: margin,
      y: yPos,
      size: 28,
      font: timesRomanBold,
      color: styleConfig.primary,
    });
    yPos -= 40;
    
    currentPage.drawLine({
      start: { x: margin, y: yPos + 10 },
      end: { x: pageWidth - margin, y: yPos + 10 },
      thickness: 2,
      color: styleConfig.secondary,
    });
    yPos -= 30;
    
    for (const voice of voiceRecordings as any[]) {
      if (yPos < 150) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        drawPageHeader(currentPage, timesRoman);
        yPos = pageHeight - 120;
      }
      
      currentPage.drawText(voice.title || 'Untitled Recording', {
        x: margin,
        y: yPos,
        size: 16,
        font: timesRomanBold,
        color: styleConfig.primary,
      });
      yPos -= 20;
      
      currentPage.drawText(new Date(voice.created_at).toLocaleDateString(), {
        x: margin,
        y: yPos,
        size: 11,
        font: timesRomanItalic,
        color: COLORS.gray,
      });
      yPos -= 25;
      
      if (voice.transcript) {
        const transcriptLines = wrapText(`"${voice.transcript}"`, timesRomanItalic, 12, contentWidth);
        for (const line of transcriptLines) {
          if (yPos < 100) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            drawPageHeader(currentPage, timesRoman);
            yPos = pageHeight - 120;
          }
          currentPage.drawText(line, {
            x: margin + 10,
            y: yPos,
            size: 12,
            font: timesRomanItalic,
            color: COLORS.black,
          });
          yPos -= 18;
        }
      }
      
      yPos -= 25;
    }
  }
  
  // Add page numbers to all pages (skip cover)
  const pages = pdfDoc.getPages();
  for (let i = 1; i < pages.length; i++) {
    drawPageFooter(pages[i], timesRoman, i, pages.length - 1);
  }
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  // Store the PDF
  const fileKey = `exports/${userId}/${exportId}.pdf`;
  await c.env.STORAGE.put(fileKey, pdfBytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });
  
  // Update export job
  await c.env.DB.prepare(`
    UPDATE export_jobs SET status = 'COMPLETED', file_key = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(fileKey, now, now, exportId).run();
  
  return c.json({
    exportId,
    status: 'COMPLETED',
    downloadUrl: `${c.env.API_URL}/api/export/${exportId}/download`,
  });
});

// ============================================
// BOOK PREVIEW — estimate page count and queue a preview job
// ============================================

exportRoutes.post('/book/preview', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => ({}));

  const now = new Date().toISOString();
  const jobId = crypto.randomUUID();

  try {
    // Create a PENDING export job so the client can poll status
    // type must be 'FAMILY_BOOK' — the DB CHECK only allows MEMORIES_PDF, LETTERS_PDF, FAMILY_BOOK
    await c.env.DB.prepare(`
      INSERT INTO export_jobs (id, user_id, type, status, config, created_at, updated_at)
      VALUES (?, ?, 'FAMILY_BOOK', 'PENDING', ?, ?, ?)
    `).bind(jobId, userId, JSON.stringify({ ...body, subtype: 'BOOK_PREVIEW' }), now, now).run();
  } catch (err) {
    console.error('Failed to queue preview job:', err);
    return c.json({ error: 'Failed to queue preview job' }, 500);
  }

  // Rough page estimate: 1 cover + ~1 page per 3 memories/letters
  const estimatedItems = (body.memoryCount ?? 0) + (body.letterCount ?? 0);
  const estimatedPages = Math.max(10, 1 + Math.ceil(estimatedItems / 3));

  return c.json({
    job_id: jobId,
    preview_url: null,
    estimated_pages: estimatedPages,
    message: 'Preview generation queued',
    status: 'queued',
  });
});

// ============================================
// BOOK ORDER — create a print-on-demand order job
// ============================================

exportRoutes.post('/book/order', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => ({}));

  const now = new Date().toISOString();
  const jobId = crypto.randomUUID();

  try {
    // type must be 'FAMILY_BOOK' — the DB CHECK only allows MEMORIES_PDF, LETTERS_PDF, FAMILY_BOOK
    await c.env.DB.prepare(`
      INSERT INTO export_jobs (id, user_id, type, status, config, created_at, updated_at)
      VALUES (?, ?, 'FAMILY_BOOK', 'PENDING', ?, ?, ?)
    `).bind(jobId, userId, JSON.stringify({ ...body, subtype: 'BOOK_ORDER' }), now, now).run();
  } catch (err) {
    console.error('Failed to queue order job:', err);
    return c.json({ error: 'Failed to queue order job' }, 500);
  }

  return c.json({
    job_id: jobId,
    status: 'queued',
    message: 'Book order received and queued for processing',
    created_at: now,
  });
});

// ============================================
// GET EXPORT STATUS
// ============================================

exportRoutes.get('/:id/status', async (c) => {
  const userId = c.get('userId');
  const exportId = c.req.param('id');
  
  const job = await c.env.DB.prepare(`
    SELECT * FROM export_jobs WHERE id = ? AND user_id = ?
  `).bind(exportId, userId).first();
  
  if (!job) {
    return c.json({ error: 'Export not found' }, 404);
  }
  
  return c.json({
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.created_at,
    completedAt: job.completed_at,
    downloadUrl: job.status === 'COMPLETED' ? `${c.env.API_URL}/api/export/${exportId}/download` : null,
  });
});

// ============================================
// DOWNLOAD EXPORT
// ============================================

exportRoutes.get('/:id/download', async (c) => {
  const userId = c.get('userId');
  const exportId = c.req.param('id');
  
  const job = await c.env.DB.prepare(`
    SELECT * FROM export_jobs WHERE id = ? AND user_id = ?
  `).bind(exportId, userId).first();
  
  if (!job) {
    return c.json({ error: 'Export not found' }, 404);
  }
  
  if (job.status !== 'COMPLETED') {
    return c.json({ error: 'Export not ready' }, 400);
  }
  
  const file = await c.env.STORAGE.get(job.file_key as string);
  if (!file) {
    return c.json({ error: 'Export file not found' }, 404);
  }
  
  const headers = new Headers();
  headers.set('Content-Type', file.httpMetadata?.contentType || 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${job.type}-${exportId}.pdf"`);
  
  return new Response(file.body, { headers });
});

// ============================================
// GET EXPORT HISTORY
// ============================================

exportRoutes.get('/history', async (c) => {
  const userId = c.get('userId');
  
  const result = await c.env.DB.prepare(`
    SELECT id, type, status, created_at, completed_at FROM export_jobs 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).bind(userId).all();
  
  return c.json({
    exports: result.results.map((job: any) => ({
      id: job.id,
      type: job.type,
      status: job.status,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      downloadUrl: job.status === 'COMPLETED' ? `${c.env.API_URL}/api/export/${job.id}/download` : null,
    })),
  });
});

export default exportRoutes;
