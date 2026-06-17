/**
 * voiceOfflineQueue — an IndexedDB-backed holding queue for voice recordings
 * captured while offline (or when the upload network call fails).
 *
 * Why IndexedDB and not localStorage: a recording is a Blob. The text holding
 * queue in Offline.tsx (`heirloom-offline-holding`) is localStorage + JSON, so
 * binary audio cannot live there. IDB stores Blobs natively — we never
 * base64/JSON-stringify the audio.
 *
 * Shape mirrors what Record.tsx needs to replay the upload sequence later:
 * getUploadUrl → PUT blob → voiceApi.create (with title/transcript/metadata/
 * legacyRecipientIds). The drain runs from Offline.tsx on the online transition.
 *
 * Robustness: every IDB open is wrapped so a failure (private mode, quota,
 * unsupported) degrades to a no-op rather than crashing the app. enqueue is the
 * one path that should surface failure to its caller (so Record can still show
 * a held vs. lost distinction), but it too never throws synchronously.
 */

const DB_NAME = 'heirloom-voice-queue';
const STORE = 'recordings';
const DB_VERSION = 1;

export interface HeldVoice {
  id: string;
  blob: Blob;
  filename: string;
  contentType: string;
  title: string;
  transcript: string | null;
  duration: number;
  metadata: any;
  legacyRecipientIds: string[];
  at: number; // epoch ms
}

/**
 * openDb — resolve an IDBDatabase or reject. Callers catch the rejection and
 * degrade. We do NOT cache the connection: the queue is touched rarely (on
 * save and on reconnect), and a fresh handle sidesteps stale-connection /
 * versionchange edge cases.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the fallback below */
  }
  return `hv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * enqueueVoice — persist a held recording. Generates the id + at stamp.
 * Resolves with the new id. Rejects only if IDB is genuinely unavailable, so
 * the caller can decide whether the recording was held or lost.
 */
export async function enqueueVoice(item: Omit<HeldVoice, 'id' | 'at'>): Promise<string> {
  const id = uuid();
  const record: HeldVoice = { ...item, id, at: Date.now() };
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('enqueue failed'));
      tx.onabort = () => reject(tx.error ?? new Error('enqueue aborted'));
      tx.objectStore(STORE).put(record);
    });
    return id;
  } finally {
    db.close();
  }
}

/**
 * listVoice — every held recording, oldest first (FIFO drain order). Never
 * throws: on any IDB failure it resolves to an empty list so the drain is a
 * no-op rather than a crash.
 */
export async function listVoice(): Promise<HeldVoice[]> {
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return [];
  }
  try {
    const all = await new Promise<HeldVoice[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as HeldVoice[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('list failed'));
    });
    return all.sort((a, b) => a.at - b.at);
  } catch {
    return [];
  } finally {
    db.close();
  }
}

/**
 * removeVoice — drop a held recording once it has uploaded. Never throws.
 */
export async function removeVoice(id: string): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('remove failed'));
      tx.onabort = () => reject(tx.error ?? new Error('remove aborted'));
      tx.objectStore(STORE).delete(id);
    });
  } catch {
    /* leave it queued — a later drain retries */
  } finally {
    db.close();
  }
}

/**
 * countVoice — how many recordings are holding. Never throws; degrades to 0.
 */
export async function countVoice(): Promise<number> {
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return 0;
  }
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => reject(req.error ?? new Error('count failed'));
    });
  } catch {
    return 0;
  } finally {
    db.close();
  }
}
