-- Founder pledges — first 100 families who commit to the lifetime tier.
-- Funds the successor non-profit's seed (per /THREAD.md Pillar 5 +
-- marketing/PLAYBOOK.md §2 'Opening Cohort').
--
-- Status flow:
--   PLEDGED   — intent captured; operator follows up with Stripe payment link
--   PAID      — payment confirmed; family is in the Opening Cohort
--   ENGRAVED  — name added to the public continuity record + onboarding
--               complete
--   REVOKED   — withdrew before payment (no-op for operator)

CREATE TABLE IF NOT EXISTS founder_pledges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  family_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PLEDGED' CHECK (status IN ('PLEDGED', 'PAID', 'ENGRAVED', 'REVOKED')),
  -- Optional Stripe checkout session id for when the operator drops a
  -- payment link in front of the lead.
  stripe_session_id TEXT,
  -- Once paid, the family-thread linked to this pledge.
  thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  -- The pledge sequence number (1..100). Assigned at PAID transition.
  pledge_number INTEGER UNIQUE,
  paid_at TEXT,
  engraved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_founder_pledges_email ON founder_pledges(email);
CREATE INDEX IF NOT EXISTS idx_founder_pledges_status ON founder_pledges(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_pledges_email_unique ON founder_pledges(email) WHERE status != 'REVOKED';
