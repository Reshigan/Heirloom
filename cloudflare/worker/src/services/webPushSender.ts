/**
 * Web Push for Cloudflare Workers — the browser/PWA push transport.
 *
 * The Node `web-push` library can't run on Workers (it needs Node crypto + http),
 * so this is a self-contained implementation against the Web Crypto API:
 *   - VAPID application-server identification — ES256 JWT, RFC 8292.
 *   - Payload encryption — aes128gcm content encoding, RFC 8291 (keys) over RFC 8188 (framing).
 *
 * Counterpart to the native transports in pushSender.ts (APNs/FCM). The frontend
 * subscribes with the matching VAPID *public* key (VITE_VAPID_PUBLIC_KEY) and the
 * subscription is stored in device_tokens (platform='web') as JSON.
 */

export interface VapidConfig {
  /** Raw uncompressed P-256 public point, base64url (65 bytes). Must match the frontend's VITE_VAPID_PUBLIC_KEY. */
  publicKey: string;
  /** PKCS8 DER private key, base64 — imported for ECDSA signing. */
  privateKey: string;
  /** Contact, e.g. 'mailto:hello@heirloom.blue'. */
  subject: string;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// ---- base64url helpers -------------------------------------------------------

function b64urlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array | ArrayBuffer): string {
  const b = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64StdToBytes(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

// ---- HMAC / HKDF (RFC 5869) --------------------------------------------------

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, data as BufferSource);
  return new Uint8Array(sig);
}

/** HKDF for short outputs (length <= 32) — one expand block suffices for all Web Push uses (32/16/12). */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const prk = await hmacSha256(salt, ikm);                       // Extract
  const okm = await hmacSha256(prk, concat(info, new Uint8Array([1]))); // Expand (single block)
  return okm.slice(0, length);
}

// ---- VAPID JWT (RFC 8292) ----------------------------------------------------

async function importVapidSigningKey(privateKeyPkcs8B64: string): Promise<CryptoKey> {
  const der = b64StdToBytes(privateKeyPkcs8B64);
  return crypto.subtle.importKey('pkcs8', der as BufferSource, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

async function buildVapidJwt(audience: string, config: VapidConfig): Promise<string> {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 12 * 60 * 60, // <= 24h per spec; 12h is comfortable.
    sub: config.subject,
  })));
  const unsigned = `${header}.${payload}`;
  const key = await importVapidSigningKey(config.privateKey);
  // ECDSA over Web Crypto returns raw r||s (IEEE P1363) — exactly the JWS ES256 form.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned) as BufferSource);
  return `${unsigned}.${bytesToB64url(sig)}`;
}

// ---- aes128gcm payload encryption (RFC 8291 + RFC 8188) ----------------------

async function encryptPayload(
  plaintext: Uint8Array,
  uaPublicB64url: string, // subscription p256dh
  authSecretB64url: string, // subscription auth
): Promise<Uint8Array> {
  const uaPublic = b64urlToBytes(uaPublicB64url);   // 65 bytes
  const authSecret = b64urlToBytes(authSecretB64url); // 16 bytes

  // Ephemeral (application-server) ECDH keypair for this message.
  const asKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  ) as CryptoKeyPair;
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey('raw', asKeyPair.publicKey) as ArrayBuffer,
  ); // 65 bytes

  const uaPublicKey = await crypto.subtle.importKey(
    'raw', uaPublic as BufferSource, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );
  // Runtime needs `public`; @cloudflare/workers-types types it as `$public`, so cast the algorithm.
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPublicKey } as any, asKeyPair.privateKey, 256),
  ); // 32 bytes

  // RFC 8291 §3.4: derive the input keying material from the ECDH secret + auth secret.
  const keyInfo = concat(
    new TextEncoder().encode('WebPush: info\0'),
    uaPublic,
    asPublic,
  );
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  // RFC 8188 §2.1: random 16-byte salt, then derive CEK + nonce.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  // Single record: plaintext || 0x02 (last-record delimiter), then AES-128-GCM.
  const padded = concat(plaintext, new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey('raw', cek as BufferSource, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource, tagLength: 128 }, aesKey, padded as BufferSource),
  );

  // RFC 8188 header: salt(16) || rs(4, big-endian) || idlen(1) || keyid(asPublic) || ciphertext.
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const idlen = new Uint8Array([asPublic.length]);
  return concat(salt, rs, idlen, asPublic, ciphertext);
}

// ---- public send -------------------------------------------------------------

export interface WebPushResult { success: boolean; error?: string; gone?: boolean }

/**
 * Send one web-push message. `gone` is true when the endpoint reports the
 * subscription is permanently invalid (404/410) so the caller can deactivate it.
 */
export async function sendWebPush(
  rawToken: string, // JSON.stringify({ endpoint, keys: { p256dh, auth } })
  notification: { title: string; body: string; data?: Record<string, unknown> },
  config: VapidConfig,
): Promise<WebPushResult> {
  let sub: WebPushSubscription;
  try {
    sub = JSON.parse(rawToken);
  } catch {
    return { success: false, error: 'Malformed web subscription', gone: true };
  }
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { success: false, error: 'Incomplete web subscription', gone: true };
  }

  try {
    const url = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await buildVapidJwt(audience, config);

    const payload = new TextEncoder().encode(JSON.stringify({
      title: notification.title,
      body: notification.body,
      ...(notification.data ? { ...notification.data } : {}),
    }));
    const body = await encryptPayload(payload, sub.keys.p256dh, sub.keys.auth);

    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${config.publicKey}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: body as BodyInit,
    });

    if (res.status === 201 || res.status === 200 || res.status === 202) {
      return { success: true };
    }
    const gone = res.status === 404 || res.status === 410;
    const errBody = await res.text().catch(() => '');
    return { success: false, error: `WebPush ${res.status}: ${errBody}`.slice(0, 300), gone };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Web push send failed' };
  }
}
