/**
 * Test helper — builds the DB schema for in-memory D1 tests from the REAL
 * migrations in cloudflare/migrations, replayed in filename order.
 *
 * This used to be a hand-written stub of "only the tables the tests touch".
 * It drifted: users grew signup_source in production and every register test
 * started failing with `table users has no column named signup_source`, which
 * says nothing about the code under test. A stub schema tests the stub.
 *
 * Vite inlines the .sql files at transform time (import.meta.glob + ?raw), so
 * nothing reads the filesystem inside the Workers runtime.
 */

const MIGRATIONS = import.meta.glob('../../../../migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// A glob that matches nothing is not an error in Vite — it yields {} and every
// test then fails with "no such table: users", which reads like a code bug.
if (Object.keys(MIGRATIONS).length === 0) {
  throw new Error('migrate.ts: no migrations matched — check the glob path');
}

/**
 * Split a migration into executable statements. D1's .prepare() takes one
 * statement at a time, so a naive `split(';')` is tempting — but a `;` also
 * appears inside `--` comments and inside CREATE TRIGGER ... BEGIN ... END
 * bodies. Strip the comments, then only treat a `;` as a terminator when it
 * isn't inside a trigger body.
 */
function splitStatements(sql: string): string[] {
  const clean = sql.replace(/--[^\n]*/g, '');
  const statements: string[] = [];
  let current = '';
  let inTrigger = false;

  for (const part of clean.split(';')) {
    current += part;
    if (/\bCREATE\s+TRIGGER\b/i.test(current)) inTrigger = true;
    // The trigger body ends at the `END` that closes its `BEGIN`.
    if (inTrigger && !/\bEND\s*$/i.test(current.trim())) {
      current += ';';
      continue;
    }
    const stmt = current.trim();
    if (stmt) statements.push(stmt);
    current = '';
    inTrigger = false;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

const SCHEMA: string[] = Object.keys(MIGRATIONS)
  .sort()
  .flatMap((path) => splitStatements(MIGRATIONS[path]));

// Most suites call applyMigrations() from beforeEach. Replaying 76 migrations
// per test is slow, and the data-fixup UPDATEs inside them re-fire the FTS5
// triggers against an already-populated index, which SQLite reports as
// SQLITE_CORRUPT_VTAB. isolatedStorage is off, so once per DB is enough.
const applied = new WeakSet<D1Database>();

export async function applyMigrations(db: D1Database): Promise<void> {
  if (applied.has(db)) return;
  applied.add(db);

  for (const stmt of SCHEMA) {
    try {
      await db.prepare(stmt).run();
    } catch (err) {
      // Migrations replay onto a DB that may already carry earlier statements
      // (isolatedStorage is off, so a file's second applyMigrations() re-runs
      // everything). CREATE ... IF NOT EXISTS is idempotent; a bare ALTER TABLE
      // ADD COLUMN and a seed-data INSERT are not — re-running either is a
      // no-op we want to swallow, not a schema error.
      const msg = String(err);
      if (/duplicate column name|already exists|UNIQUE constraint failed/i.test(msg)) continue;
      throw new Error(`migration statement failed: ${stmt.slice(0, 120)}…\n${msg}`);
    }
  }
}

export async function seedUser(
  db: D1Database,
  overrides: Partial<{
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
  }> = {},
): Promise<string> {
  const id = overrides.id ?? 'test-user-001';
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      overrides.email ?? 'test@heirloom.blue',
      overrides.password_hash ?? '$2b$10$hashedpasswordhere',
      overrides.first_name ?? 'Test',
      overrides.last_name ?? 'User',
    )
    .run();
  return id;
}
