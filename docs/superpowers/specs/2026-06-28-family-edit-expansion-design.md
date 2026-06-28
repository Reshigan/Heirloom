# Family edit expansion — design

> Spec A of a 3-part effort (A → B → C). A = family page edit expansion. B =
> viral mechanism loops. C = viral content/assets (Ollama marketing + 3D share).
> This spec covers **A only**. Approved 2026-06-28.

## Goal

Two changes to the Family surface, both about letting the inviter fully shape a
member's identity — before and after they join:

1. **Member-to-member links** — a typed family-tree edge between two members
   (parent / child / spouse / sibling) plus an optional freeform label
   ("mother", "step-father", "chosen sister"). Edits live in the Family page
   and the Person page.
2. **Full edit on pending invites** — the inviter can pre-set relationship, thread
   colour (dye), birthday, and notes on a pending invite, not just name + email.
   On accept, those fields seed a real `family_members` row in the inviter's roster
   (closes a pre-existing gap: today an accepted invite only creates a
   `thread_members` co-author row and never appears in the inviter's family
   roster).

Out of scope: B and C (separate specs), and any change to the `thread_members`
co-author insert (left as-is).

## Schema reality (verified)

- `family_members`: id, user_id, name, relationship, email, phone, birth_date,
  notes, avatar_url, dye, created_at, updated_at, deleted_at. (Owner = inviter.)
- `thread_members`: id, thread_id, user_id, display_name, email, relation_label,
  role, target_role, created_at. No dye / birth_date / notes.
- `family_invites`: id, inviter_user_id, invitee_email, invitee_name,
  invite_code, thread_id, sent_at, expires_at, status, accepted_at,
  reward_claimed. No relationship / dye / birth_date / notes.
- Today `POST /invite/accept` creates a `thread_members` row only — no
  `family_members` row. So an accepted invitee is a co-author but is invisible
  in the inviter's family roster.
- Schema mirror for tests lives at
  `cloudflare/worker/src/__tests__/helpers/migrate.ts`. Prod migrations are the
  source of truth; the test helper must mirror any new table/column.

## Design

### A1 — Member-to-member links

**New table `family_relationships`:**

```sql
CREATE TABLE IF NOT EXISTS family_relationships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  to_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parent','child','spouse','sibling')),
  label TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, from_member_id, to_member_id, type)
);
```

- Both endpoints must belong to the same `user_id` and not be soft-deleted
  (`deleted_at IS NULL`). Enforced at the route, not the schema.
- **Symmetric canonicalization** at write time: for `spouse` / `sibling`, store
  the lower member id as `from_member_id` so a reversed duplicate cannot sneak
  past the UNIQUE constraint. `parent` / `child` are directional: `from` is the
  parent, `to` is the child.
- Hard-delete. Structural metadata, not legacy content — no append-only /
  soft-delete needed.

**Worker routes (added to `routes/family.ts`, under `familyRoutes`):**

- `GET /family/relationships` — all edges for the caller, joined with member
  names for display (`from_name`, `to_name`). Excludes edges touching
  soft-deleted members.
- `POST /family/relationships` `{ fromMemberId, toMemberId, type, label? }` —
  validate ownership of both endpoints, reject self-edges, reject unknown type,
  canonicalize symmetric edges, insert. 400 on dup (UNIQUE hit caught → friendly
  "already linked" message).
- `DELETE /family/relationships/:id` — ownership check, hard-delete.

**Type:** `FamilyRelationship` in `cloudflare/frontend/src/types/index.ts`.

```ts
export interface FamilyRelationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  fromName?: string;
  toName?: string;
  type: 'parent' | 'child' | 'spouse' | 'sibling';
  label?: string | null;
}
```

### A2 — Full edit on pending invites

**Schema: 4 new columns on `family_invites`:**

```sql
ALTER TABLE family_invites ADD COLUMN relationship TEXT;
ALTER TABLE family_invites ADD COLUMN dye TEXT;
ALTER TABLE family_invites ADD COLUMN birth_date TEXT;
ALTER TABLE family_invites ADD COLUMN notes TEXT;
```

Plus one new column on `family_members` to link an inviter-created member to the
joining account (for future profile sync, out of scope here but the column is
laid down now so the accept flow can populate it):

```sql
ALTER TABLE family_members ADD COLUMN linked_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
```

**Worker changes:**

- `PATCH /engagement/invites/:id` (in `routes/engagement.ts`) extended to accept
  `relationship`, `dye`, `birthDate`, `notes`. Same COALESCE convention as the
  member update: `undefined` = leave as-is, `''` = clear to null. Auth +
  `status='pending'` guard unchanged. Email/name handling unchanged.
- `POST /engagement/invite/accept` extended: after the existing
  `thread_members` insert (unchanged), **also INSERT a `family_members` row
  owned by the inviter** seeded from the invite's pre-set fields:
  - `name` ← `invitee_name`
  - `relationship` ← new `relationship` column
  - `email` ← `invitee_email`
  - `dye` ← new `dye` column
  - `birth_date` ← new `birth_date` column
  - `notes` ← new `notes` column
  - `linked_user_id` ← the accepting user's id
  - Best-effort: wrapped so a failure never aborts the accept (the accept stands
    regardless), mirroring the existing defensive `joinedThread` pattern.

**Type:** `FamilyMember` gains `linkedUserId?: string | null`.

### Frontend

All edits extend the existing Deep-system surfaces — no new nav, tab bar, or
grid. Styling reuses the inline-edit field styles already in `Family.tsx`
(bone-on-ink, hairline rules, `DyePicker`, `hl-mono` labels).

**`services/api.ts`:**

- `familyApi.getRelationships()`, `familyApi.addRelationship(input)`,
  `familyApi.removeRelationship(id)`.
- `engagementApi.editInvite(id, payload)` — payload widens to optionally
  include `relationship`, `dye`, `birthDate`, `notes`. Existing `name`/`email`
  semantics unchanged.

**`pages/Family.tsx`:**

- Pending-invite inline edit form expands: relationship input, birthday input,
  notes textarea, `DyePicker` — same fields/styles as the member edit form.
- Member row: a quiet `hl-mono` line under each member listing their links —
  e.g. "mother of Ava · spouse of Ben". Computed client-side from the
  relationships query.
- "add relation →" button (member row, non-editing state) opens an inline
  picker: target-member `<select>` (other members, excludes self + soft-deleted),
  4-type radio (`parent`/`child`/`spouse`/`sibling`, arrow-key handler reused),
  optional freeform label input, save. Uses `familyApi.addRelationship`.
- Each shown link has a remove control calling `familyApi.removeRelationship`.

**`pages/PersonPage.tsx`:**

- Dedicated "kin" section: full edge list for the focused member with remove
  controls + the same add-relation picker. Reuse the `Family.tsx` picker as a
  shared component (`AddRelationshipPicker`) to avoid duplication.

**Water seeding (no regression):** `waterDyes` already reads member dyes. The
new `family_members` row created on accept is a normal member, so the joining
user's pre-set dye contributes to the family water exactly like a manually
added member. No `waterDyes` change needed.

## Error handling

- POST relationship: 400 on self-edge, unknown type, unknown member id, or
  duplicate (caught UNIQUE violation → "already linked"). 404 if either
  endpoint does not belong to the caller.
- DELETE relationship: 404 if not owned by caller.
- PATCH invite: 404 if not pending / not owned. Validation on email unchanged.
- Accept-time `family_members` insert: best-effort, never aborts the accept;
  failure is logged (`console.error`) exactly like the existing `joinedThread`
  try/catch.

## Testing

- Worker: extend `cloudflare/worker/src/__tests__/utils.test.ts` (or a new
  `family.relationships.test.ts) with:
  - POST rejects self-edge, unknown type, cross-user endpoint, dup edge
    (incl. reversed-symmetric dup).
  - Symmetric canonicalization stores lower-id-first for spouse/sibling.
  - DELETE ownership: cannot delete another user's edge.
  - PATCH invite persists relationship/dye/birthDate/notes; `''` clears,
    `undefined` leaves.
  - Accept flow creates a `family_members` row with seeded fields +
    `linked_user_id`; `thread_members` insert unchanged.
- Type gate: `npx tsc --noEmit` clean in `cloudflare/worker` and
  `cd cloudflare/frontend && npm run build` clean.
- Mirror schema in `src/__tests__/helpers/migrate.ts`.

## Risks

- **Dual representation.** The invitee is now both a `thread_members` co-author
  and a `family_members` row in the inviter's roster. That is the intended model
  (inviter's view of that person vs. their co-authorship), and `linked_user_id`
  lets a future sync reconcile edits. No reconciliation is built in this spec.
- **Symmetric-edge uniqueness** depends on app-level canonicalization. A
  direct DB write bypassing the route could create a reversed dup; acceptable
  since all writes go through the route.
- **`linked_user_id` column laid down now** but unused beyond the accept seed.
  Intentional: avoids a second migration when profile-sync lands.