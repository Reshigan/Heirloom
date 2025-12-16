-- Heirloom D1 Database Schema - Additional Tables
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0002_add_admin_wrapped_support.sql

-- ============================================
-- ADMIN USERS
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT')),
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_role ON admin_users(role);

-- ============================================
-- COUPONS
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  discount_value REAL NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase REAL,
  applicable_tiers TEXT DEFAULT '[]', -- JSON array
  valid_from TEXT DEFAULT (datetime('now')),
  valid_until TEXT,
  is_active INTEGER DEFAULT 1,
  created_by_id TEXT REFERENCES admin_users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid ON coupons(valid_until);

-- ============================================
-- COUPON REDEMPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  discount_applied REAL NOT NULL,
  order_id TEXT,
  redeemed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_redemptions_user ON coupon_redemptions(user_id);

-- ============================================
-- WRAPPED DATA (Year-in-Review)
-- ============================================

CREATE TABLE IF NOT EXISTS wrapped_data (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_memories INTEGER DEFAULT 0,
  total_voice_stories INTEGER DEFAULT 0,
  total_letters INTEGER DEFAULT 0,
  total_storage INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  top_emotions TEXT DEFAULT '[]', -- JSON
  top_tagged_people TEXT DEFAULT '[]', -- JSON
  highlights TEXT DEFAULT '[]', -- JSON
  summary TEXT,
  generated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, year)
);

CREATE INDEX idx_wrapped_user ON wrapped_data(user_id);
CREATE INDEX idx_wrapped_year ON wrapped_data(year);

-- ============================================
-- SUPPORT TICKETS
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'RESOLVED', 'ESCALATED', 'CLOSED')),
  assigned_to TEXT,
  metadata TEXT DEFAULT '{}', -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

-- ============================================
-- SUPPORT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM', 'INTERNAL')),
  content TEXT NOT NULL,
  attachments TEXT DEFAULT '[]', -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_ticket ON support_messages(ticket_id);

-- ============================================
-- BOT CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS bot_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  intent TEXT,
  helpful INTEGER,
  article_ids TEXT DEFAULT '[]', -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_bot_user ON bot_conversations(user_id);
CREATE INDEX idx_bot_intent ON bot_conversations(intent);
CREATE INDEX idx_bot_created ON bot_conversations(created_at);

-- ============================================
-- ACTIVITIES (Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created ON activities(created_at);

-- ============================================
-- SEED DEFAULT ADMIN USER
-- ============================================

-- Create a default admin user (password: admin123456)
-- In production, change this password immediately!
INSERT OR IGNORE INTO admin_users (id, email, password_hash, first_name, last_name, role)
VALUES (
  'admin-default-001',
  'admin@heirloom.app',
  'CHANGE_ME_ON_FIRST_LOGIN', -- Will be set properly via wrangler secret or first login
  'Admin',
  'User',
  'SUPER_ADMIN'
);
