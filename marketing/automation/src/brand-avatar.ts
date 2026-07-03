// One-shot: set the Facebook Page profile picture and Bluesky avatar to the
// Drop mark. Run via `tsx src/brand-avatar.ts` in CI (workflow_dispatch),
// where META_PAGE_* and BLUESKY_* secrets live. Safe to re-run.
const ICON_URL = "https://heirloom.blue/icons/icon-512.png";

async function facebook() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) { console.log("[fb] no creds — skipped"); return; }
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/picture`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ picture: ICON_URL, access_token: token }),
  });
  console.log("[fb] page picture:", res.status, await res.text());
}

async function bluesky() {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) { console.log("[bsky] no creds — skipped"); return; }
  const pds = "https://bsky.social";
  const sess = await (await fetch(`${pds}/xrpc/com.atproto.server.createSession`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  })).json() as any;
  if (!sess.accessJwt) { console.log("[bsky] auth failed"); return; }
  const png = Buffer.from(await (await fetch(ICON_URL)).arrayBuffer());
  const blob = await (await fetch(`${pds}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST", headers: { "content-type": "image/png", authorization: `Bearer ${sess.accessJwt}` },
    body: png,
  })).json() as any;
  const cur = await (await fetch(`${pds}/xrpc/com.atproto.repo.getRecord?repo=${sess.did}&collection=app.bsky.actor.profile&rkey=self`, {
    headers: { authorization: `Bearer ${sess.accessJwt}` },
  })).json() as any;
  const value = { ...(cur.value ?? { $type: "app.bsky.actor.profile" }), avatar: blob.blob };
  const put = await fetch(`${pds}/xrpc/com.atproto.repo.putRecord`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${sess.accessJwt}` },
    body: JSON.stringify({ repo: sess.did, collection: "app.bsky.actor.profile", rkey: "self", value, swapRecord: cur.cid ?? undefined }),
  });
  console.log("[bsky] avatar:", put.status, (await put.text()).slice(0, 120));
}

await facebook();
await bluesky();
