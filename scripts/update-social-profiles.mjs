/**
 * update-social-profiles.mjs
 * Updates brand avatar/profile across social platforms.
 * Run via GitHub Actions (uses repo secrets) or locally with env vars set.
 *
 * Platforms automated here: Bluesky, Facebook Page
 * Platforms requiring manual update: Instagram, Pinterest, LinkedIn
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICON_PATH   = resolve(__dirname, '../cloudflare/frontend/public/icons/icon-512.png');
const BANNER_PATH = resolve(__dirname, '../cloudflare/frontend/public/og-image.png');

// ── Bluesky ───────────────────────────────────────────────────────────────────

async function updateBluesky() {
  const handle   = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) {
    console.log('⚠  Bluesky: env vars missing — skipping');
    return;
  }

  console.log(`Bluesky: authenticating as ${handle}…`);
  const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
  });
  if (!sessionRes.ok) throw new Error(`auth: ${await sessionRes.text()}`);
  const session = await sessionRes.json();
  console.log(`   authenticated as ${session.handle} (${session.did})`);

  async function uploadBlob(filePath, mimeType) {
    const data = readFileSync(filePath);
    const res  = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
      method: 'POST',
      headers: { 'Content-Type': mimeType, 'Authorization': `Bearer ${session.accessJwt}` },
      body: data,
    });
    if (!res.ok) throw new Error(`blob upload: ${await res.text()}`);
    const { blob } = await res.json();
    console.log(`   uploaded blob (${blob.size} bytes, ${mimeType})`);
    return blob;
  }

  const avatarBlob = await uploadBlob(ICON_PATH, 'image/png');
  const bannerBlob = await uploadBlob(BANNER_PATH, 'image/png');

  // Preserve existing profile fields
  const profileRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(session.did)}&collection=app.bsky.actor.profile&rkey=self`,
  );
  const current = profileRes.ok ? ((await profileRes.json()).value ?? {}) : {};

  const putRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.putRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessJwt}` },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.actor.profile',
      rkey: 'self',
      record: {
        ...current,
        $type: 'app.bsky.actor.profile',
        displayName: 'Heirloom',
        description: "Some things only get deeper. A perpetual family archive — owned by a bloodline, not a login. heirloom.blue",
        avatar: avatarBlob,
        banner: bannerBlob,
      },
    }),
  });
  if (!putRes.ok) throw new Error(`profile update: ${await putRes.text()}`);

  console.log('✓  Bluesky: avatar + banner + bio updated');
}

// ── Facebook Page ─────────────────────────────────────────────────────────────

async function updateFacebook() {
  const token  = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) {
    console.log('⚠  Facebook: env vars missing — skipping');
    return;
  }

  console.log(`Facebook: uploading profile photo for page ${pageId}…`);
  const iconData = readFileSync(ICON_PATH);
  const blob     = new Blob([iconData], { type: 'image/png' });
  const form     = new FormData();
  form.append('source', blob, 'heirloom-icon.png');
  form.append('is_profile_photo', 'true');
  form.append('published', 'true');
  form.append('access_token', token);

  const res  = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
    method: 'POST', body: form,
  });
  const json = await res.json();

  if (!res.ok || json.error) {
    // If profile-photo scope is missing, fall back to a clear error rather than
    // silently failing. The page will need a manual update in Business Suite.
    console.error(`✗  Facebook profile photo: ${JSON.stringify(json.error ?? json)}`);
    console.log('   → update manually: Business Suite → Page → Edit Profile');
    return;
  }
  console.log(`✓  Facebook: profile photo updated (photo_id: ${json.id})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n=== Heirloom — Social Profile Update ===\n');

await updateBluesky().catch(e => console.error('✗  Bluesky:', e.message));
await updateFacebook().catch(e => console.error('✗  Facebook:', e.message));

console.log('\n=== Platforms requiring manual upload ===');
console.log('Image to upload everywhere: cloudflare/frontend/public/icons/icon-512.png');
console.log('');
console.log('Instagram  → instagram.com → Edit Profile → Change Profile Photo');
console.log('Pinterest  → pinterest.com → Settings → Edit Profile → Change Photo');
console.log('LinkedIn   → linkedin.com/company/heirloom-blue → Edit Page → Logo');
console.log('           (also needs LINKEDIN_ACCESS_TOKEN once CMA approved for automation)');
console.log('');
