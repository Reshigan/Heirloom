/**
 * One-shot Bluesky promotion: 30% off monthly plan for 1 year.
 * Promo code: THREAD30
 * URL: https://heirloom.blue/?promo=THREAD30&ref=bsky
 *
 * Run:  cd marketing/automation && npx tsx scripts/bluesky-promo.ts
 *
 * Requires BLUESKY_HANDLE + BLUESKY_APP_PASSWORD in environment.
 * If not set, writes the post to output/<date>/queue/bluesky.md for manual posting.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const PROMO_URL = 'https://heirloom.blue/?promo=THREAD30&ref=bsky';
const PROMO_CODE = 'THREAD30';

// QR code via api.qrserver.com — bone background, ink foreground, 600×600
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&color=0e0e0c&bgcolor=f4ecd8&data=${encodeURIComponent(PROMO_URL)}`;

// Bluesky thread: three posts, 300 chars each.
// Post 1: hook + promo code
// Post 2: what Heirloom is (for people who haven't heard of it)
// Post 3: QR + link card + hashtags (gets the embed)
const THREAD: { text: string; isLast?: boolean }[] = [
  {
    text: '30% off Heirloom for one full year.\n\nYour family deserves a thousand-year thread — every memory woven in, never erased. Photos, voice recordings, letters. Passed down through generations, owned by your bloodline, not a platform.\n\nCode: THREAD30 at checkout.',
  },
  {
    text: 'Heirloom is a perpetual family archive. Not a social feed, not a cloud backup — a woven cloth where every entry is one thread. Append-only. Multi-generational. Built to outlast any single lifetime.\n\nMonthly plan. 30% off for 12 months. Offer ends June 30.',
  },
  {
    text: 'Scan the QR code or visit the link to start your family\'s thread.\n\nheirloom.blue/?promo=THREAD30\n\n#genealogy #familyhistory #memorypreservation #legacyplanning #familytree #heritage #ancestors #heirloom',
    isLast: true,
  },
];

async function createBlueskySession(handle: string, password: string) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const json = await res.json() as { accessJwt?: string; did?: string; error?: string };
  if (!res.ok || !json.accessJwt || !json.did) {
    throw new Error(`Bluesky auth failed: ${json.error ?? res.status}`);
  }
  return json as { accessJwt: string; did: string };
}

async function uploadBlob(imageUrl: string, jwt: string) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const buf = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') ?? 'image/png';
  const uploadRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': contentType },
    body: buf,
  });
  const json = await uploadRes.json() as { blob?: unknown };
  return json.blob ?? null;
}

async function postThread(session: { accessJwt: string; did: string }) {
  let rootUri = '';
  let rootCid = '';
  let parentUri = '';
  let parentCid = '';

  // Upload QR code for the first post
  console.log('Uploading QR code image…');
  const imageBlob = await uploadBlob(QR_URL, session.accessJwt);

  for (let i = 0; i < THREAD.length; i++) {
    const { text, isLast } = THREAD[i];
    const isFirst = i === 0;
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text: text.slice(0, 300),
      createdAt: new Date().toISOString(),
    };

    if (!isFirst) {
      record.reply = {
        root: { uri: rootUri, cid: rootCid },
        parent: { uri: parentUri, cid: parentCid },
      };
    }

    // First post: attach QR code image
    if (isFirst && imageBlob) {
      record.embed = {
        $type: 'app.bsky.embed.images',
        images: [{ image: imageBlob, alt: `QR code for Heirloom promo — use code ${PROMO_CODE} for 30% off` }],
      };
    }

    // Last post in thread: link card embed
    if (isLast && !isFirst) {
      record.embed = {
        $type: 'app.bsky.embed.external',
        external: {
          uri: PROMO_URL,
          title: 'Heirloom — Start your family\'s thousand-year thread',
          description: `Use code ${PROMO_CODE} for 30% off the monthly plan for one full year.`,
        },
      };
    }

    const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
    });
    const json = await res.json() as { uri?: string; cid?: string; error?: string };
    if (!res.ok || !json.uri || !json.cid) {
      throw new Error(`Post ${i + 1} failed: ${json.error ?? res.status}`);
    }

    console.log(`✓ Post ${i + 1}/${THREAD.length} → ${json.uri}`);

    if (isFirst) { rootUri = json.uri; rootCid = json.cid; }
    parentUri = json.uri;
    parentCid = json.cid;
  }

  return rootUri;
}

async function writeQueueFallback() {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.resolve(process.cwd(), 'output', date, 'queue');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'bluesky-promo.md');
  const content = `# Bluesky Promo — ${date}

**Promo code:** ${PROMO_CODE}
**URL:** ${PROMO_URL}
**QR code:** ${QR_URL}

---

## Post 1 (root)

${THREAD[0].text}

[Attach QR code image: ${QR_URL}]

---

## Post 2 (reply to Post 1)

${THREAD[1].text}

---

## Post 3 (reply to Post 2 — add link card to ${PROMO_URL})

${THREAD[2].text}
`;
  await fs.writeFile(file, content, 'utf8');
  return file;
}

async function main() {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !password) {
    console.log('BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set — writing queue file instead.');
    const file = await writeQueueFallback();
    console.log(`\n✓ Queue file written: ${file}`);
    console.log('\nPost this manually on Bluesky, attaching the QR code to the first post.');
    console.log(`QR code URL: ${QR_URL}`);
    return;
  }

  console.log(`Posting to Bluesky as @${handle}…`);
  const session = await createBlueskySession(handle, password);
  const rootUri = await postThread(session);
  console.log(`\n✓ Thread live: https://bsky.app/profile/${handle}/post/${rootUri.split('/').pop()}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
