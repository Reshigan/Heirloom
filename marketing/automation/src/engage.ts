// Engagement work-list — the missing growth mechanism.
//
// Broadcasting alone wins nothing on Bluesky (chronological feed, no algorithmic
// boost) or Facebook (Page organic reach ≈ 1-2%). Distribution comes from
// showing up in OTHER people's threads: a genuine reply on Bluesky carries the
// handle into a high-reach conversation; a real comment in the right Facebook
// group reaches the audience that the Page never will.
//
// This module does NOT auto-engage — aggressive auto-reply gets accounts banned
// on both platforms and reads as a bot, which violates brand voice rule 14
// (quiet, compounding, never engagement bait). Instead it produces a daily
// 5-minute checklist of WHERE a human should show up, with an optional
// genuinely-helpful reply opener the operator edits and sends by hand.
//
//   tsx src/run.ts engage   — write output/<date>/engage.md + print to stdout
//
// Bluesky targets are discovered live via app.bsky.feed.searchPosts. Facebook
// targets are curated group themes (the Graph API can't search groups).

import fs from "node:fs/promises";
import path from "node:path";
import { complete, hasGenProvider } from "./generate.js";

// In-niche search phrases where a genuine memory-keeper reply belongs. Deliberately
// NOT raw fresh-grief ("my mom just died") — replying to acute grief with anything
// brand-adjacent is tasteless. These are curiosity / memory-keeping / family-history
// conversations where showing up as a real person fits.
const BLUESKY_TERMS = [
  '"my grandmother used to say"',
  '"my grandfather used to say"',
  '"wish I had recorded"',
  '"wish I had asked"',
  '"questions to ask my parents"',
  '"family stories"',
  '"family history"',
  "genealogy",
  '"recording my parents"',
  '"my dad\'s voice"',
  '"before they forget"',
  '"only one who remembers"',
  '"family recipe"',
  '"oral history"',
  '"legacy letter"',
];

// Curated Facebook group THEMES to search and participate in (Graph API offers no
// group search, so the operator searches these in-app and joins the largest active
// public ones). Comment as a person who keeps family memory — never as the Page.
const FACEBOOK_GROUP_THEMES = [
  "Genealogy / family history research",
  "Questions to ask your parents / grandparents",
  "Caring for aging parents",
  "Memory keeping / scrapbooking / journaling",
  "Family recipes & the stories behind them",
  "Grief & loss support (memory-keeping angle only)",
  "Estate planning / end-of-life planning",
  "New parents & expecting (letters to your future child)",
  "Adoptees & reconnecting with family roots",
];

interface BlueskyTarget {
  handle: string;
  text: string;
  url: string;
  likes: number;
  replies: number;
  reposts: number;
  reply?: string;
}

interface BskyPost {
  uri: string;
  author?: { handle?: string };
  record?: { text?: string; reply?: unknown };
  likeCount?: number;
  replyCount?: number;
  repostCount?: number;
  indexedAt?: string;
}

async function blueskySession(): Promise<{ jwt: string; did: string; handle: string } | null> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) return null;
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  });
  const json = (await res.json().catch(() => ({}))) as { accessJwt?: string; did?: string; handle?: string };
  if (!res.ok || !json.accessJwt || !json.did) return null;
  return { jwt: json.accessJwt, did: json.did, handle: json.handle ?? handle };
}

function postUrl(uri: string, handle: string): string {
  // at://did/app.bsky.feed.post/<rkey> → https://bsky.app/profile/<handle>/post/<rkey>
  const rkey = uri.split("/").pop() ?? "";
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

// Pull high-engagement, recent, top-level posts for the niche terms. One target
// per author (dedupe), skip our own posts and pure replies, require a minimum of
// real engagement so the operator's reply lands where people actually are.
async function discoverBluesky(
  session: { jwt: string; handle: string },
  perTerm = 5,
  maxTargets = 10,
): Promise<BlueskyTarget[]> {
  const seenAuthors = new Set<string>([session.handle.toLowerCase()]);
  const targets: BlueskyTarget[] = [];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const term of BLUESKY_TERMS) {
    if (targets.length >= maxTargets) break;
    const url =
      `https://bsky.social/xrpc/app.bsky.feed.searchPosts?sort=top&limit=${perTerm}` +
      `&q=${encodeURIComponent(term)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${session.jwt}` } });
    if (!res.ok) {
      console.log(`[engage] bsky search "${term}" → HTTP ${res.status}`);
      continue;
    }
    const json = (await res.json().catch(() => ({}))) as { posts?: BskyPost[] };
    for (const p of json.posts ?? []) {
      if (targets.length >= maxTargets) break;
      const handle = p.author?.handle?.toLowerCase();
      const text = (p.record?.text ?? "").trim();
      if (!handle || !text) continue;
      if (seenAuthors.has(handle)) continue; // one target per author
      if (p.record?.reply) continue; // top-level only — replies bury our reply
      const likes = p.likeCount ?? 0;
      const replies = p.replyCount ?? 0;
      const reposts = p.repostCount ?? 0;
      if (likes + reposts * 2 < 3) continue; // skip dead posts — engage where people are
      if (p.indexedAt && new Date(p.indexedAt).getTime() < sevenDaysAgo) continue; // recent only
      seenAuthors.add(handle);
      targets.push({
        handle: p.author!.handle!,
        text,
        url: postUrl(p.uri, p.author!.handle!),
        likes,
        replies,
        reposts,
      });
    }
  }

  // Best conversations first — engagement is the proxy for reach of our reply.
  targets.sort((a, b) => b.likes + b.reposts * 2 - (a.likes + a.reposts * 2));
  return targets.slice(0, maxTargets);
}

const REPLY_SYSTEM = `You write a single genuine reply to a stranger's social post, as a real person who cares about families keeping their stories. NOT as a brand. Rules:
- Respond to THIS specific post — react to what they actually said.
- Warm, plain, human. One or two short sentences. Under 220 characters.
- NEVER pitch a product, NEVER include a link, NEVER use a hashtag, NEVER say "Heirloom".
- No emojis. No "as someone who...". No platitudes ("so sorry for your loss" on its own).
- If the post is raw grief, the reply only listens — no advice, no ask.
The reply is a starting point a human will edit before sending.`;

// Draft one genuine reply opener per target in a single LLM call (cheap, optional).
async function draftReplies(targets: BlueskyTarget[]): Promise<void> {
  if (!targets.length || !hasGenProvider()) return;
  const numbered = targets.map((t, i) => `${i + 1}. ${t.text.replace(/\s+/g, " ").slice(0, 240)}`).join("\n");
  const user = `Draft one genuine reply for each post below. Output ONLY a JSON array of strings, in order, one reply per post. No prose, no fences.

${numbered}`;
  try {
    const raw = await complete(REPLY_SYSTEM, user);
    const first = raw.indexOf("[");
    const last = raw.lastIndexOf("]");
    if (first === -1 || last === -1) return;
    const replies = JSON.parse(raw.slice(first, last + 1)) as unknown;
    if (!Array.isArray(replies)) return;
    targets.forEach((t, i) => {
      const r = replies[i];
      if (typeof r === "string" && r.trim()) t.reply = r.trim();
    });
  } catch (err) {
    console.log(`[engage] reply drafting skipped — ${(err as Error).message}`);
  }
}

function renderMarkdown(dateKey: string, bsky: BlueskyTarget[], bskyAvailable: boolean): string {
  const lines: string[] = [];
  lines.push(`# Engagement work-list — ${dateKey}`);
  lines.push("");
  lines.push(
    "5 minutes. Show up as a person in conversations that are already happening. " +
      "Replies and comments are the only free distribution on Bluesky and Facebook — " +
      "broadcasting is not. Never pitch, never link in the reply itself. Be genuinely useful.",
  );
  lines.push("");

  lines.push("## Bluesky — reply to these threads");
  lines.push("");
  if (!bskyAvailable) {
    lines.push(
      "_BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set — can't discover live targets. " +
        "Set them to populate this section._",
    );
  } else if (!bsky.length) {
    lines.push("_No fresh in-niche targets cleared the engagement floor today. Try again next run._");
  } else {
    bsky.forEach((t, i) => {
      lines.push(`### ${i + 1}. @${t.handle} · ♥ ${t.likes} · ↺ ${t.reposts} · 💬 ${t.replies}`);
      lines.push(`> ${t.text.replace(/\n+/g, " ").slice(0, 280)}`);
      lines.push("");
      lines.push(`Open: ${t.url}`);
      if (t.reply) {
        lines.push("");
        lines.push(`Draft reply (edit before sending): ${t.reply}`);
      }
      lines.push("");
    });
  }

  lines.push("## Facebook — comment in these group themes (as a person, not the Page)");
  lines.push("");
  lines.push(
    "Page posts reach ~1-2% of followers. The audience is in Groups. Search each theme " +
      "in-app, join the largest active public group, and leave one genuine comment where " +
      "it fits. Link only if asked, and only in a reply to your own comment.",
  );
  lines.push("");
  for (const theme of FACEBOOK_GROUP_THEMES) lines.push(`- ${theme}`);
  lines.push("");

  return lines.join("\n");
}

export async function engage(): Promise<void> {
  const dateKey = new Date().toISOString().slice(0, 10);
  const session = await blueskySession();
  let bsky: BlueskyTarget[] = [];
  if (session) {
    bsky = await discoverBluesky(session);
    console.log(`[engage] discovered ${bsky.length} Bluesky target(s)`);
    await draftReplies(bsky);
  } else {
    console.log("[engage] Bluesky creds not set — skipping live discovery");
  }

  const md = renderMarkdown(dateKey, bsky, Boolean(session));
  const file = path.resolve(process.cwd(), `output/${dateKey}/engage.md`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, md, "utf-8");

  // Print so the work-list is visible in CI logs and local runs without opening the file.
  console.log(`\n${md}\n`);
  console.log(`[engage] written → output/${dateKey}/engage.md`);
}
