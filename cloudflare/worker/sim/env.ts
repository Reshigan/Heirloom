/**
 * Simulation environment — boots the REAL worker against an in-process database.
 *
 * The Cloudflare Worker (`src/index.ts`) only knows the shapes of its bindings:
 * D1 (`DB`), KV (`KV`), R2 (`STORAGE`), a rate-limiter Durable Object, and a few
 * string vars. This module provides faithful, in-memory stand-ins for all of
 * them — backed by Node 22+/25's built-in `node:sqlite` for D1 — so the actual
 * route handlers, SQL, JWT signing, password hashing and time-lock resolution run
 * unchanged. Nothing here mocks the worker's own logic; it only supplies the edge.
 *
 * Used by sim/lifetime.test.ts to drive a full product lifetime end-to-end.
 */
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, '..', '..', 'migrations'); // cloudflare/migrations

/** D1 binds null/number/string; coerce the JS values routes actually pass. */
function coerce(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v as never;
}

class D1Prepared {
  constructor(
    private db: DatabaseSync,
    private sql: string,
    private params: unknown[] = [],
  ) {}

  bind(...params: unknown[]): D1Prepared {
    return new D1Prepared(this.db, this.sql, params.map(coerce));
  }

  async first<T = Record<string, unknown>>(col?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.params as never[])) as
      | Record<string, unknown>
      | undefined;
    if (row === undefined || row === null) return null;
    if (col !== undefined) return (row[col] ?? null) as T;
    return row as T;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: true; meta: object }> {
    const results = this.db.prepare(this.sql).all(...(this.params as never[])) as T[];
    return { results, success: true, meta: {} };
  }

  async run(): Promise<{ success: true; meta: { changes: number; last_row_id: number; duration: number } }> {
    const info = this.db.prepare(this.sql).run(...(this.params as never[]));
    return {
      success: true,
      meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid), duration: 0 },
    };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const rows = this.db.prepare(this.sql).all(...(this.params as never[])) as Record<string, unknown>[];
    return rows.map((r) => Object.values(r)) as T[];
  }
}

class D1 {
  constructor(private db: DatabaseSync) {}
  prepare(sql: string): D1Prepared {
    return new D1Prepared(this.db, sql);
  }
  async batch(stmts: D1Prepared[]): Promise<unknown[]> {
    const out: unknown[] = [];
    this.db.exec('BEGIN');
    try {
      for (const s of stmts) {
        // @ts-expect-error reach the stmt's own SQL to choose read vs write
        const sql: string = s.sql ?? '';
        out.push(/^\s*(SELECT|WITH)/i.test(sql) || /RETURNING/i.test(sql) ? await s.all() : await s.run());
      }
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
    return out;
  }
  async exec(sql: string): Promise<{ count: number; duration: number }> {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }
}

/** In-memory KV with TTL — sessions, refresh + temp tokens live here. */
class KV {
  private m = new Map<string, string>();
  private exp = new Map<string, number>();
  private live(key: string): boolean {
    const e = this.exp.get(key);
    if (e !== undefined && e < Date.now()) {
      this.m.delete(key);
      this.exp.delete(key);
      return false;
    }
    return true;
  }
  async get(key: string, typeOrOpts?: 'json' | 'text' | { type?: string }): Promise<unknown> {
    if (!this.live(key)) return null;
    const v = this.m.get(key);
    if (v === undefined) return null;
    const asJson = typeOrOpts === 'json' || (typeof typeOrOpts === 'object' && typeOrOpts?.type === 'json');
    return asJson ? JSON.parse(v) : v;
  }
  async put(
    key: string,
    val: string,
    opts?: { expirationTtl?: number; expiration?: number },
  ): Promise<void> {
    this.m.set(key, typeof val === 'string' ? val : String(val));
    if (opts?.expirationTtl) this.exp.set(key, Date.now() + opts.expirationTtl * 1000);
    else if (opts?.expiration) this.exp.set(key, opts.expiration * 1000);
  }
  async delete(key: string): Promise<void> {
    this.m.delete(key);
    this.exp.delete(key);
  }
  async list(): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor: string }> {
    return { keys: [...this.m.keys()].map((name) => ({ name })), list_complete: true, cursor: '' };
  }
}

/** R2 stand-in — uploads aren't exercised; reads return null gracefully. */
class R2 {
  private m = new Map<string, ArrayBuffer>();
  async put(key: string, val: ArrayBuffer): Promise<{ key: string }> {
    this.m.set(key, val);
    return { key };
  }
  async get(key: string): Promise<null | { body: ReadableStream; arrayBuffer: () => Promise<ArrayBuffer> }> {
    const v = this.m.get(key);
    if (!v) return null;
    return { body: new ReadableStream(), arrayBuffer: async () => v };
  }
  async delete(key: string): Promise<void> {
    this.m.delete(key);
  }
  async head(): Promise<null> {
    return null;
  }
}

/** Rate-limiter Durable Object stub — the worker fails open if this throws,
 *  but we return a clean "allowed" so the path is exercised, not bypassed. */
const RATE_LIMITER = {
  idFromName: (name: string) => ({ name, toString: () => name }),
  get: () => ({
    fetch: async () =>
      new Response(JSON.stringify({ allowed: true, remaining: 99, reset: 0 }), {
        headers: { 'content-type': 'application/json' },
      }),
  }),
};

const AI = {
  run: async () => ({ response: '' }),
};

export interface SimEnv {
  DB: D1;
  KV: KV;
  STORAGE: R2;
  RATE_LIMITER: typeof RATE_LIMITER;
  AI: typeof AI;
  JWT_SECRET: string;
  ENCRYPTION_MASTER_KEY: string;
  ENVIRONMENT: string;
  APP_URL: string;
  API_URL: string;
  CRON_ENABLED: string;
}

export interface SimHarness {
  env: SimEnv;
  sqlite: DatabaseSync;
  ctx: { waitUntil: (p: Promise<unknown>) => void; passThroughOnException: () => void };
  /** migrations that failed to apply (e.g. FTS5) — non-fatal, reported. */
  skippedMigrations: { file: string; error: string }[];
}

/** Build a fresh in-memory edge: apply the real migrations, wire the bindings. */
export function makeHarness(): SimHarness {
  const sqlite = new DatabaseSync(':memory:');
  const skippedMigrations: { file: string; error: string }[] = [];

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    try {
      sqlite.exec(sql);
    } catch (e) {
      // FTS5 virtual tables / triggers and other edge-only SQL may not exist in
      // node:sqlite. None are needed for the lifetime flows; record + continue.
      skippedMigrations.push({ file, error: (e as Error).message });
    }
  }

  const env: SimEnv = {
    DB: new D1(sqlite),
    KV: new KV(),
    STORAGE: new R2(),
    RATE_LIMITER,
    AI,
    JWT_SECRET: 'sim-jwt-secret-thirty-two-bytes-minimum-000',
    ENCRYPTION_MASTER_KEY: 'sim-master-key-thirty-two-bytes-min-00000',
    ENVIRONMENT: 'development',
    APP_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:8787',
    CRON_ENABLED: 'true',
  };

  const ctx = {
    waitUntil: (p: Promise<unknown>) => {
      Promise.resolve(p).catch(() => {});
    },
    passThroughOnException: () => {},
  };

  return { env, sqlite, ctx, skippedMigrations };
}
