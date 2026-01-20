/**
 * Export Routes - PDF and Book Generation
 * Generate PDFs of memories, letters, and family books
 */

import { Hono } from 'hono';
import type { AppEnv } from '../index';

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
  let query = `SELECT * FROM memories WHERE user_id = ?`;
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
  
  // Get letters if requested
  let letters: any[] = [];
  if (includeLetters) {
    const lettersResult = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();
    letters = lettersResult.results;
  }
  
  // Get voice transcripts if requested
  let voiceRecordings: any[] = [];
  if (includeVoiceTranscripts) {
    const voiceResult = await c.env.DB.prepare(`
      SELECT * FROM voice_recordings WHERE user_id = ? AND transcript IS NOT NULL ORDER BY created_at DESC
    `).bind(userId).all();
    voiceRecordings = voiceResult.results;
  }
  
  // Generate PDF HTML content
  const pdfHtml = generateMemoriesPdfHtml({
    title: title || 'My Memories',
    memories: memories.results,
    letters,
    voiceRecordings,
    style: style || 'classic',
  });
  
  // Store the HTML for now (PDF generation would require a service like Puppeteer/Playwright)
  const fileKey = `exports/${userId}/${exportId}.html`;
  await c.env.STORAGE.put(fileKey, pdfHtml, {
    httpMetadata: { contentType: 'text/html' },
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
    message: 'Export ready for download',
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
      SELECT * FROM letters WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();
    letters = result.results;
  } else {
    const placeholders = letterIds.map(() => '?').join(',');
    const result = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? AND id IN (${placeholders}) ORDER BY created_at DESC
    `).bind(userId, ...letterIds).all();
    letters = result.results;
  }
  
  // Generate PDF HTML content
  const pdfHtml = generateLettersPdfHtml({
    letters,
    style: style || 'classic',
  });
  
  // Store the HTML
  const fileKey = `exports/${userId}/${exportId}.html`;
  await c.env.STORAGE.put(fileKey, pdfHtml, {
    httpMetadata: { contentType: 'text/html' },
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
      SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();
    content.memories = memoriesResult.results;
  }
  
  // Get letters
  if (includeLetters !== false) {
    const lettersResult = await c.env.DB.prepare(`
      SELECT * FROM letters WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();
    content.letters = lettersResult.results;
  }
  
  // Get voice transcripts
  if (includeVoiceTranscripts) {
    const voiceResult = await c.env.DB.prepare(`
      SELECT * FROM voice_recordings WHERE user_id = ? AND transcript IS NOT NULL ORDER BY created_at DESC
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
  
  // Generate book HTML
  const bookHtml = generateFamilyBookHtml(content);
  
  // Store the HTML
  const fileKey = `exports/${userId}/${exportId}.html`;
  await c.env.STORAGE.put(fileKey, bookHtml, {
    httpMetadata: { contentType: 'text/html' },
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
  headers.set('Content-Type', file.httpMetadata?.contentType || 'text/html');
  headers.set('Content-Disposition', `attachment; filename="${job.type}-${exportId}.html"`);
  
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

// ============================================
// HTML GENERATION HELPERS
// ============================================

function generateMemoriesPdfHtml(data: { title: string; memories: any[]; letters: any[]; voiceRecordings: any[]; style: string }) {
  const styleColors = {
    classic: { primary: '#8B4513', secondary: '#D2691E', bg: '#FDF5E6' },
    modern: { primary: '#1a1a2e', secondary: '#D4AF37', bg: '#f5f5f0' },
    elegant: { primary: '#2C3E50', secondary: '#C0A080', bg: '#FAFAFA' },
  };
  const colors = styleColors[data.style as keyof typeof styleColors] || styleColors.classic;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.title)}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Georgia, serif; background: ${colors.bg}; color: #333; line-height: 1.6; }
    .cover { text-align: center; padding: 100px 0; page-break-after: always; }
    .cover h1 { color: ${colors.primary}; font-size: 48px; margin-bottom: 20px; }
    .cover .subtitle { color: ${colors.secondary}; font-size: 24px; }
    .section { page-break-before: always; }
    .section h2 { color: ${colors.primary}; border-bottom: 2px solid ${colors.secondary}; padding-bottom: 10px; }
    .memory { margin: 30px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .memory h3 { color: ${colors.primary}; margin-bottom: 10px; }
    .memory .date { color: #666; font-size: 14px; }
    .memory .description { margin-top: 10px; }
    .letter { margin: 30px 0; padding: 30px; background: white; border-left: 4px solid ${colors.secondary}; }
    .letter .salutation { font-style: italic; margin-bottom: 15px; }
    .letter .body { white-space: pre-wrap; }
    .letter .signature { margin-top: 20px; font-style: italic; text-align: right; }
    .voice { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .voice h4 { color: ${colors.primary}; }
    .voice .transcript { font-style: italic; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(data.title)}</h1>
    <div class="subtitle">A Collection of Precious Memories</div>
    <div style="margin-top: 50px; color: #666;">Generated on ${new Date().toLocaleDateString()}</div>
  </div>
  
  ${data.memories.length > 0 ? `
  <div class="section">
    <h2>Memories</h2>
    ${data.memories.map((m: any) => `
      <div class="memory">
        <h3>${escapeHtml(m.title)}</h3>
        <div class="date">${new Date(m.created_at).toLocaleDateString()}</div>
        ${m.description ? `<div class="description">${escapeHtml(m.description)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.letters.length > 0 ? `
  <div class="section">
    <h2>Letters</h2>
    ${data.letters.map((l: any) => `
      <div class="letter">
        <h3>${escapeHtml(l.title)}</h3>
        ${l.salutation ? `<div class="salutation">${escapeHtml(l.salutation)}</div>` : ''}
        <div class="body">${escapeHtml(l.body)}</div>
        ${l.signature ? `<div class="signature">${escapeHtml(l.signature)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.voiceRecordings.length > 0 ? `
  <div class="section">
    <h2>Voice Recordings</h2>
    ${data.voiceRecordings.map((v: any) => `
      <div class="voice">
        <h4>${escapeHtml(v.title)}</h4>
        <div class="date">${new Date(v.created_at).toLocaleDateString()}</div>
        ${v.transcript ? `<div class="transcript">"${escapeHtml(v.transcript)}"</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>`;
}

function generateLettersPdfHtml(data: { letters: any[]; style: string }) {
  const styleColors = {
    classic: { primary: '#8B4513', secondary: '#D2691E', bg: '#FDF5E6' },
    modern: { primary: '#1a1a2e', secondary: '#D4AF37', bg: '#f5f5f0' },
    elegant: { primary: '#2C3E50', secondary: '#C0A080', bg: '#FAFAFA' },
  };
  const colors = styleColors[data.style as keyof typeof styleColors] || styleColors.classic;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Letters</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Georgia, serif; background: ${colors.bg}; color: #333; line-height: 1.8; }
    .letter { page-break-after: always; padding: 40px; }
    .letter:last-child { page-break-after: auto; }
    .letter h2 { color: ${colors.primary}; text-align: center; margin-bottom: 30px; }
    .letter .salutation { font-style: italic; margin-bottom: 20px; font-size: 18px; }
    .letter .body { white-space: pre-wrap; text-align: justify; }
    .letter .signature { margin-top: 40px; font-style: italic; text-align: right; font-size: 18px; }
    .letter .date { text-align: right; color: #666; margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  ${data.letters.map((l: any) => `
    <div class="letter">
      <h2>${escapeHtml(l.title)}</h2>
      ${l.salutation ? `<div class="salutation">${escapeHtml(l.salutation)}</div>` : ''}
      <div class="body">${escapeHtml(l.body)}</div>
      ${l.signature ? `<div class="signature">${escapeHtml(l.signature)}</div>` : ''}
      <div class="date">${new Date(l.created_at).toLocaleDateString()}</div>
    </div>
  `).join('')}
</body>
</html>`;
}

function generateFamilyBookHtml(data: any) {
  const styleColors = {
    classic: { primary: '#8B4513', secondary: '#D2691E', bg: '#FDF5E6' },
    modern: { primary: '#1a1a2e', secondary: '#D4AF37', bg: '#f5f5f0' },
    elegant: { primary: '#2C3E50', secondary: '#C0A080', bg: '#FAFAFA' },
  };
  const colors = styleColors[data.coverStyle as keyof typeof styleColors] || styleColors.classic;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.title)}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Georgia, serif; background: ${colors.bg}; color: #333; line-height: 1.6; }
    .cover { text-align: center; padding: 150px 0; page-break-after: always; }
    .cover h1 { color: ${colors.primary}; font-size: 56px; margin-bottom: 20px; }
    .cover .subtitle { color: ${colors.secondary}; font-size: 28px; margin-bottom: 40px; }
    .cover .dedication { font-style: italic; margin-top: 60px; padding: 20px; border-top: 1px solid ${colors.secondary}; border-bottom: 1px solid ${colors.secondary}; }
    .toc { page-break-after: always; }
    .toc h2 { color: ${colors.primary}; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { padding: 10px 0; border-bottom: 1px dotted #ccc; }
    .section { page-break-before: always; }
    .section h2 { color: ${colors.primary}; border-bottom: 3px solid ${colors.secondary}; padding-bottom: 15px; font-size: 32px; }
    .family-tree { display: flex; flex-wrap: wrap; gap: 20px; }
    .family-member { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); min-width: 200px; }
    .family-member h4 { color: ${colors.primary}; margin-bottom: 5px; }
    .family-member .relationship { color: ${colors.secondary}; font-size: 14px; }
    .memory { margin: 30px 0; padding: 25px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .memory h3 { color: ${colors.primary}; margin-bottom: 10px; }
    .memory .date { color: #666; font-size: 14px; }
    .letter { margin: 30px 0; padding: 30px; background: white; border-left: 4px solid ${colors.secondary}; }
    .voice { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(data.title)}</h1>
    ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ''}
    ${data.dedication ? `<div class="dedication">${escapeHtml(data.dedication)}</div>` : ''}
    <div style="margin-top: 80px; color: #666;">Created with Heirloom</div>
  </div>
  
  <div class="toc">
    <h2>Table of Contents</h2>
    <ul>
      ${data.familyMembers?.length > 0 ? '<li>Our Family</li>' : ''}
      ${data.memories?.length > 0 ? '<li>Memories</li>' : ''}
      ${data.letters?.length > 0 ? '<li>Letters</li>' : ''}
      ${data.voiceRecordings?.length > 0 ? '<li>Voice Recordings</li>' : ''}
    </ul>
  </div>
  
  ${data.familyMembers?.length > 0 ? `
  <div class="section">
    <h2>Our Family</h2>
    <div class="family-tree">
      ${data.familyMembers.map((m: any) => `
        <div class="family-member">
          <h4>${escapeHtml(m.name)}</h4>
          <div class="relationship">${escapeHtml(m.relationship)}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}
  
  ${data.memories?.length > 0 ? `
  <div class="section">
    <h2>Memories</h2>
    ${data.memories.map((m: any) => `
      <div class="memory">
        <h3>${escapeHtml(m.title)}</h3>
        <div class="date">${new Date(m.created_at).toLocaleDateString()}</div>
        ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.letters?.length > 0 ? `
  <div class="section">
    <h2>Letters</h2>
    ${data.letters.map((l: any) => `
      <div class="letter">
        <h3>${escapeHtml(l.title)}</h3>
        ${l.salutation ? `<p><em>${escapeHtml(l.salutation)}</em></p>` : ''}
        <div style="white-space: pre-wrap;">${escapeHtml(l.body)}</div>
        ${l.signature ? `<p style="text-align: right; font-style: italic;">${escapeHtml(l.signature)}</p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${data.voiceRecordings?.length > 0 ? `
  <div class="section">
    <h2>Voice Recordings</h2>
    ${data.voiceRecordings.map((v: any) => `
      <div class="voice">
        <h4>${escapeHtml(v.title)}</h4>
        ${v.transcript ? `<p><em>"${escapeHtml(v.transcript)}"</em></p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="footer">
    <p>This family book was created with love using Heirloom</p>
    <p>Generated on ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default exportRoutes;
