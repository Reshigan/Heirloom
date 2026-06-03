/**
 * social-launch.ts — Full platform promo launch
 *
 * Actions:
 *  1. Bluesky: update profile picture + post 3-post promo thread (max hashtags)
 *  2. Facebook: update Page profile picture + post promo with image
 *  3. Instagram: post promo with branded square image
 *  4. Pinterest: pin promo image to board with keyword-rich description
 *
 * Offer: 30% off monthly plan for 1 year  |  Code: THREAD30  |  Ends: June 30
 *
 * Run: cd marketing/automation && npx tsx scripts/social-launch.ts
 */

const PROMO_URL     = 'https://heirloom.blue/?promo=THREAD30&ref=social';
const PROMO_URL_BSK = 'https://heirloom.blue/?promo=THREAD30&ref=bsky';
const PROMO_URL_FB  = 'https://heirloom.blue/?promo=THREAD30&ref=fb';
const PROMO_URL_IG  = 'https://heirloom.blue/?promo=THREAD30&ref=ig';
const PROMO_URL_PIN = 'https://heirloom.blue/?promo=THREAD30&ref=pinterest';
const PROMO_CODE    = 'THREAD30';
const AVATAR_URL    = 'https://heirloom.blue/icons/icon-512.png';
const SQUARE_URL    = 'https://heirloom.blue/social-square.png';
const QR_URL        = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&color=0e0e0c&bgcolor=f4ecd8&data=${encodeURIComponent(PROMO_URL_BSK)}`;

// Platform-optimised tag sets — mix: broad (reach) + mid (category authority) + niche (community)
// Bluesky: indie-tech + genealogy community; threads reward topic clustering
const BSKY_TAGS = '#genealogy #familyhistory #familytree #ancestors #heritage #heirloom #legacy #memorypreservation #digitallegacy #legacyplanning #familystories #generations #preservation #indieapp #buildinpublic #pkm #lifelogging #personalarchive #slowtech #thoughtfultech';

// Facebook: broad reach via groups audience + engagement-friendly CamelCase for readability
const FB_TAGS   = '#FamilyHistory #Genealogy #FamilyTree #Ancestors #Heritage #Legacy #FamilyMemories #LegacyPlanning #MemoryPreservation #DigitalHeritage #FamilyStories #Generations #Heirloom #AncestralHeritage #LifeStories #FamilyArchive #RootsAndBranches #KeepingMemoriesAlive #FamilyFirst #GenerationalWealth #FamilyLove #RememberThem #AncestryResearch #FamilyReunion #FamilyTraditions';

// Instagram: tier-mix (5 broad 1M+ / 10 mid 100k–1M / 15 niche <100k) for max discovery
const IG_TAGS   = '#family #memories #genealogy #heritage #ancestors #familyhistory #familytree #legacy #heirloom #ancestry #familylove #rememberance #legacyplanning #memorypreservation #familymemories #familystories #digitallegacy #keepingmemories #ancestralheritage #familyfirst #generationalgift #familyarchive #ancestryresearch #familytraditions #memoriesforever #rootsandbranches #familybond #neverforget #lifestories #digitalheritage';

// Pinterest: comma-separated keyword phrases (Pinterest SEO, not hashtags)
const PIN_TAGS  = 'genealogy ideas, family history project, family tree research, ancestors photos, heritage preservation, legacy planning for families, memory preservation ideas, family memories keepsake, digital legacy app, heirloom family archive, generations storytelling, family stories ideas, preserve family history, family archive digital, ancestry research, family records organizer, historical family photos, family traditions ideas, remembrance gift, generational gift ideas, life stories for grandparents, family reunion ideas, ancestral heritage project';

// ─── Bluesky ────────────────────────────────────────────────────────────────

async function bskySession(handle: string, password: string) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const j = await res.json() as { accessJwt?: string; did?: string; error?: string };
  if (!res.ok || !j.accessJwt || !j.did) throw new Error(`Bluesky auth: ${j.error ?? res.status}`);
  return j as { accessJwt: string; did: string };
}

async function bskyUploadBlob(imageUrl: string, jwt: string) {
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error(`Fetch image failed: ${img.status}`);
  const buf = await img.arrayBuffer();
  const ct  = img.headers.get('content-type') ?? 'image/png';
  const up  = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': ct },
    body: buf,
  });
  const j = await up.json() as { blob?: unknown };
  if (!up.ok || !j.blob) throw new Error(`Blob upload failed: ${up.status}`);
  return j.blob;
}

async function bskyUpdateAvatar(handle: string, password: string) {
  console.log('[bsky] Updating profile picture…');
  const s    = await bskySession(handle, password);
  const blob = await bskyUploadBlob(AVATAR_URL, s.accessJwt);

  const cur  = await fetch(`https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${s.did}&collection=app.bsky.actor.profile&rkey=self`);
  const curJ = await cur.json() as { value?: Record<string, unknown> };
  const record = { ...(curJ.value ?? {}), avatar: blob };

  const put = await fetch('https://bsky.social/xrpc/com.atproto.repo.putRecord', {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: s.did, collection: 'app.bsky.actor.profile', rkey: 'self', record }),
  });
  if (!put.ok) {
    const err = await put.json() as { error?: string };
    throw new Error(`Profile update: ${err.error ?? put.status}`);
  }
  console.log('[bsky] ✓ Profile picture updated');
}

async function bskyPostPromo(handle: string, password: string) {
  console.log('[bsky] Posting promo thread…');
  const s      = await bskySession(handle, password);
  const qrBlob = await bskyUploadBlob(QR_URL, s.accessJwt);

  const thread = [
    {
      text: `What happens to your family's memories when you're gone?\n\nNot the big moments — the voice of your grandmother. The letters your parents wrote. The stories that only you know.\n\nHeirloom archives them forever. 30% off for one full year. Code: ${PROMO_CODE}\n\nOffer ends June 30.`,
      embed: { $type: 'app.bsky.embed.images', images: [{ image: qrBlob, alt: `QR code — use ${PROMO_CODE} for 30% off Heirloom` }] },
    },
    {
      text: `Heirloom is a perpetual family archive — not a social feed, not a backup drive.\n\nEvery entry is woven into a permanent thread. Append-only. Multi-generational. Built to outlast any single lifetime.\n\nOwned by your bloodline, not a platform.\n\nMonthly plan. 30% off for 12 months with code ${PROMO_CODE}.`,
    },
    {
      text: `Who in your family has stories you haven't recorded yet?\n\nTag them 👇 or start your thread now.\n\nheirloom.blue/?promo=${PROMO_CODE}\n\n${BSKY_TAGS}`,
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: PROMO_URL_BSK,
          title: "Heirloom — Start your family's thousand-year thread",
          description: `Use code ${PROMO_CODE} for 30% off the monthly plan for one full year. Offer ends June 30.`,
        },
      },
    },
  ];

  let rootUri = '', rootCid = '', parentUri = '', parentCid = '';

  for (let i = 0; i < thread.length; i++) {
    const { text, embed } = thread[i] as { text: string; embed?: unknown };
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text: text.slice(0, 300),
      createdAt: new Date().toISOString(),
    };
    if (i > 0) record.reply = { root: { uri: rootUri, cid: rootCid }, parent: { uri: parentUri, cid: parentCid } };
    if (embed) record.embed = embed;

    const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.accessJwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }),
    });
    const j = await res.json() as { uri?: string; cid?: string; error?: string };
    if (!res.ok || !j.uri || !j.cid) throw new Error(`Bsky post ${i + 1}: ${j.error ?? res.status}`);
    console.log(`[bsky] ✓ Post ${i + 1}/3 → ${j.uri}`);
    if (i === 0) { rootUri = j.uri; rootCid = j.cid; }
    parentUri = j.uri; parentCid = j.cid;
  }

  return `https://bsky.app/profile/${handle}/post/${rootUri.split('/').pop()}`;
}

// ─── Facebook ────────────────────────────────────────────────────────────────

async function fbUpdateProfilePicture(token: string, pageId: string) {
  console.log('[fb] Updating Page profile picture…');
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/picture`, {
    method: 'POST',
    body: new URLSearchParams({ url: AVATAR_URL, access_token: token }),
  });
  const j = await res.json() as { success?: boolean; error?: { message: string } };
  if (!res.ok || j.error) {
    console.warn(`[fb] Profile picture: ${j.error?.message ?? res.status} (non-fatal, continuing)`);
    return;
  }
  console.log('[fb] ✓ Page profile picture updated');
}

async function fbPostPromo(token: string, pageId: string) {
  console.log('[fb] Posting promo…');
  const caption = `What happens to your family stories when you're gone?

Heirloom is a perpetual family archive — every memory, voice recording, photo and letter woven into a permanent thread passed down through generations. Append-only. Multi-generational. Owned by your bloodline, not a platform.

30% off the monthly plan for 12 months. Use code ${PROMO_CODE} at checkout. Offer ends June 30.

👇 Tag someone whose family stories deserve to be saved.
💾 Save this post to share with your family later.

${FB_TAGS}`;

  const body = new URLSearchParams({ caption, url: SQUARE_URL, access_token: token });
  const res   = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, { method: 'POST', body });
  const j     = await res.json() as { id?: string; error?: { message: string } };
  if (!res.ok || j.error) throw new Error(`FB post: ${j.error?.message ?? res.status}`);

  // Link in first comment to avoid Facebook reach penalty for links in captions
  if (j.id) {
    await fetch(`https://graph.facebook.com/v21.0/${j.id}/comments`, {
      method: 'POST',
      body: new URLSearchParams({
        message: `→ Claim your 30% discount now: ${PROMO_URL_FB}`,
        access_token: token,
      }),
    }).catch(() => undefined);
    console.log('[fb] ✓ Post published + discount link added as comment');
  }
  return j.id;
}

// ─── Instagram ───────────────────────────────────────────────────────────────

async function igPostPromo(token: string, igUserId: string) {
  console.log('[ig] Posting promo…');
  const caption = `What happens to your family stories when you're gone? 🧵

Heirloom is a perpetual family archive — every memory, voice recording, and letter woven into a permanent thread passed down across generations. Append-only. Multi-generational. Owned by your bloodline, not a platform.

30% off the monthly plan for one full year.
Use code ${PROMO_CODE} at checkout.
Offer ends June 30 → link in bio.

💬 Who in your family has stories you haven't recorded yet? Drop their name below.
🔖 Save this to share with your family.

${IG_TAGS}`;

  const cBody = new URLSearchParams({ image_url: SQUARE_URL, caption, access_token: token });
  const cRes  = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, { method: 'POST', body: cBody });
  const cJ    = await cRes.json() as { id?: string; error?: { message: string } };
  if (!cRes.ok || !cJ.id) throw new Error(`IG container: ${cJ.error?.message ?? cRes.status}`);

  const pRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: cJ.id, access_token: token }),
  });
  const pJ = await pRes.json() as { id?: string; error?: { message: string } };
  if (!pRes.ok || !pJ.id) throw new Error(`IG publish: ${pJ.error?.message ?? pRes.status}`);
  console.log('[ig] ✓ Post published:', pJ.id);
  return pJ.id;
}

// ─── Pinterest ───────────────────────────────────────────────────────────────

async function pinPostPromo(token: string, boardId: string) {
  console.log('[pin] Pinning promo…');
  const description = `How to preserve your family history forever — Heirloom family archive app.\n\n30% off the monthly plan for one full year. Use code ${PROMO_CODE} at checkout. Offer ends June 30.\n\nHeirloom is a perpetual family archive where every memory, voice recording, and letter is woven into a permanent thread passed down across generations. The perfect gift for grandparents, parents, and families who want to protect their stories.\n\n${PIN_TAGS}`;

  const body = {
    board_id: boardId,
    title: `How to Preserve Your Family History Forever (30% Off — Code ${PROMO_CODE})`,
    description,
    link: PROMO_URL_PIN,
    media_source: {
      source_type: 'image_url',
      url: SQUARE_URL,
    },
    note: `Use code ${PROMO_CODE} for 30% off`,
  };

  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json() as { id?: string; code?: number; message?: string };
  if (!res.ok || !j.id) throw new Error(`Pinterest pin: ${j.message ?? res.status}`);
  console.log('[pin] ✓ Pin created:', j.id);
  return j.id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const bskyHandle   = process.env.BLUESKY_HANDLE;
  const bskyPassword = process.env.BLUESKY_APP_PASSWORD;
  const metaToken    = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId       = process.env.META_PAGE_ID;
  const igUserId     = process.env.META_IG_USER_ID;
  const pinToken     = process.env.PINTEREST_ACCESS_TOKEN;
  const pinBoardId   = process.env.PINTEREST_BOARD_ID;

  const results: Record<string, string> = {};
  const errors:  Record<string, string> = {};

  // ── Bluesky
  if (bskyHandle && bskyPassword) {
    try { await bskyUpdateAvatar(bskyHandle, bskyPassword); }
    catch (e: unknown) { errors.bskyAvatar = (e as Error).message; console.error('[bsky] Avatar:', errors.bskyAvatar); }
    try { results.bskyThread = await bskyPostPromo(bskyHandle, bskyPassword); }
    catch (e: unknown) { errors.bskyPost = (e as Error).message; console.error('[bsky] Post:', errors.bskyPost); }
  } else { console.warn('[bsky] Credentials missing — skipping'); }

  // ── Facebook
  if (metaToken && pageId) {
    try { await fbUpdateProfilePicture(metaToken, pageId); }
    catch (e: unknown) { errors.fbAvatar = (e as Error).message; console.error('[fb] Avatar:', errors.fbAvatar); }
    try { results.fbPost = (await fbPostPromo(metaToken, pageId)) ?? ''; }
    catch (e: unknown) { errors.fbPost = (e as Error).message; console.error('[fb] Post:', errors.fbPost); }
  } else { console.warn('[fb] Meta credentials missing — skipping'); }

  // ── Instagram
  if (metaToken && igUserId) {
    try { results.igPost = (await igPostPromo(metaToken, igUserId)) ?? ''; }
    catch (e: unknown) { errors.igPost = (e as Error).message; console.error('[ig] Post:', errors.igPost); }
  } else { console.warn('[ig] IG credentials missing — skipping'); }

  // ── Pinterest
  if (pinToken && pinBoardId) {
    try { results.pinPost = (await pinPostPromo(pinToken, pinBoardId)) ?? ''; }
    catch (e: unknown) { errors.pinPost = (e as Error).message; console.error('[pin] Post:', errors.pinPost); }
  } else { console.warn('[pin] Pinterest credentials missing — skipping'); }

  console.log('\n═══ Launch complete ═══');
  console.log('Results:', results);
  if (Object.keys(errors).length) console.warn('Errors:', errors);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
