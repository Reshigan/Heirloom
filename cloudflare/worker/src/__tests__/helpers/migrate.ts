/**
 * Test helper — creates the DB schema for in-memory D1 tests.
 *
 * Embeds only the tables actually exercised by worker tests (users +
 * gift_vouchers). Using the embedded schema rather than reading migration
 * files from disk avoids filesystem sandbox issues in the Workers runtime.
 */

const TEST_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  encryption_salt TEXT,
  encrypted_master_key TEXT,
  key_derivation_params TEXT,
  terms_accepted_at TEXT,
  marketing_consent INTEGER DEFAULT 0,
  gold_legacy_member INTEGER DEFAULT 0,
  gold_member_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT,
  trial_ends_at TEXT,
  stripe_customer_id TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'ESSENTIAL', 'FAMILY', 'LEGACY', 'STARTER', 'FOREVER')),
  status TEXT DEFAULT 'TRIALING' CHECK (status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  trial_ends_at TEXT,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gift_vouchers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  code TEXT UNIQUE NOT NULL,
  purchaser_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('STARTER', 'FAMILY', 'FOREVER')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  duration_months INTEGER NOT NULL DEFAULT 12,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'SENT', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'CANCELLED')),
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TEXT,
  expires_at TEXT NOT NULL,
  admin_notes TEXT,
  created_by_admin_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  sent_at TEXT,
  voucher_type TEXT DEFAULT 'GIFT' CHECK (voucher_type IN ('GIFT', 'GOLD_LEGACY')),
  gold_member_number TEXT
);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_code ON gift_vouchers(code);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_status ON gift_vouchers(status);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dead_man_switches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WARNING', 'TRIGGERED', 'VERIFIED', 'RELEASED', 'CANCELLED')),
  check_in_interval_days INTEGER DEFAULT 30,
  grace_period_days INTEGER DEFAULT 7,
  required_verifications INTEGER DEFAULT 2,
  last_check_in TEXT,
  next_check_in_due TEXT,
  missed_check_ins INTEGER DEFAULT 0,
  triggered_at TEXT,
  verified_at TEXT,
  released_at TEXT,
  reminder_sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS legacy_contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship TEXT NOT NULL,
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verification_token TEXT UNIQUE,
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS founder_pledges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  family_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PLEDGED' CHECK (status IN ('PLEDGED', 'PAID', 'ENGRAVED', 'REVOKED')),
  stripe_session_id TEXT,
  thread_id TEXT,
  pledge_number INTEGER UNIQUE,
  paid_at TEXT,
  engraved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS switch_verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  dead_man_switch_id TEXT NOT NULL,
  legacy_contact_id TEXT NOT NULL,
  verification_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

export async function applyMigrations(db: D1Database): Promise<void> {
  const statements = TEST_SCHEMA
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    await db.prepare(stmt).run();
  }
}

/** Seed a minimal valid user row; returns the user id. */
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
