# The Family Thread — Heirloom's Architectural Premise

This document defines the world-first concept Heirloom is built around. It is the source of truth for product, positioning, and engineering decisions. If something in `cloudflare/worker/`, `frontend/`, or `marketing/` contradicts this document, the document wins.

## What it is

A **Family Thread** is a perpetual, append-only, multi-author, multi-generational story archive owned by a family bloodline (or chosen-family unit) rather than by any individual user.

A Thread is started by someone alive today, contributed to by everyone in the bloodline who is granted authorship, and read by descendants in 2050, 2100, 2200. Entries can be added, never deleted. Authorship passes generationally. Entries can be **time-locked** — released only on a specific date, on a recipient's milestone (18th birthday, wedding day), or on a triggering event (the author's death, the recipient's first child).

This is not a feature set. It is the central architectural commitment of Heirloom.

## Why it's world-first

Every existing player in this category treats the unit as a single user with a finite project:

- **Storyworth, Remento, Promptly Journals** — one author writes for 52 weeks; output is one printed book. Single-generation, finite, terminal.
- **Ancestry, MyHeritage, FamilySearch** — genealogical data (names, dates, certificates). No story. No voice.
- **Cake, Empathy** — end-of-life admin (wills, funerals, bills). Logistics, not memory.
- **Eter9 (failed), HereAfter AI, StoryFile** — AI clones of dead people. Uncanny, ethically fraught, abandoned by users.
- **The dead category** — Lifebrary, SafeBeyond, MyWishes, DeadSocial, Afternote, GoneNotGone — all positioned as "send messages from beyond." All gone.

None of them treats **the family across centuries as the unit of preservation**. None of them is *append-only*, *multi-author*, or *time-locked at scale*. None of them commits to *outlasting the company*.

The combination — perpetual + multi-author + multi-generational + time-locked + cross-company-survival — has not been built.

## The five pillars

### 1. Perpetual

A Thread does not end. It does not expire. It does not get deleted. The free plan does not delete content. The paid plan does not delete content. Account closure does not delete content; it only freezes new authorship. The company shutdown does not delete content (see Pillar 5).

This is the inverse of every existing product's mechanic. Most platforms threaten deletion as a conversion lever. We commit to permanence as the entire value proposition.

### 2. Append-only

Entries can be added. Entries can be amended (with a visible amendment trail — never silent edits). Entries cannot be deleted by anyone other than the original author within a 30-day grace window, after which they are immutable. Comments on entries are append-only with the same grace rule.

This isn't a technical limitation; it's a trust commitment. Descendants in 2080 need to know that what they're reading is what was written, not what was edited later.

### 3. Multi-author / multi-generational

A Thread has many authors over time. The original Thread starter (the "Founder") designates initial members and assigns roles. Members can invite other members. Members can be granted descendant access — their children, grandchildren, etc., can be added to the Thread automatically when they reach a configured age.

Authorship transitions across generations. A great-grandmother in 2030 writes an entry. Her granddaughter in 2055 adds a comment. That granddaughter's son in 2090 reads both, asks the archive a question, and adds his own entry that ties them together. The Thread compounds.

### 4. Time-locked

Every entry has a release schedule. Most are *immediate*, visible to all current Thread members. But authors can configure:

- **Date-locked**: opens on a specific date (e.g., 2050-01-01).
- **Age-locked**: opens when a designated recipient reaches a specific age ("when my granddaughter turns 18").
- **Event-locked**: opens on the author's death (verified via the existing dead-man's-switch infrastructure), on a recipient's wedding, on the birth of their first child (recipient self-attests, optional verification by another member).
- **Generation-locked**: opens once a designated descendant exists ("for my first great-grandchild").

The locking mechanism uses both database flags and cryptographic key escrow: the entry payload is encrypted, the key is held by the platform (and a successor — see Pillar 5), and only released when the lock condition is verified.

This is the feature that makes the Thread structurally different from every email-prompts-to-book competitor.

### 5. Continuity beyond the company

The Thread must outlive Heirloom-the-company. We commit to:

- **Decentralized storage backup**: Thread payloads are pinned to IPFS (or equivalent permanent storage layer) on a rolling schedule, with redundancy across at least three independent pinning providers.
- **Successor non-profit**: a separately incorporated 501(c)(3) (or jurisdictional equivalent) holds an irrevocable license to operate the archive if Heirloom dissolves. Initial funding comes from the Founder tier purchases (see pricing).
- **Family-export at any time**: every Thread member can export the full Thread as an open-format archive (JSON + media files) at any time, free, with one click. No vendor lock-in.
- **Open data format**: the Thread export schema is published, versioned, and stable. Any future archivist can read it without our cooperation.

This is the credibility moat. Every competitor has died and taken user content with it. We make that an architectural impossibility.

## Identity and access

### Bloodline membership

A Thread is bound to a bloodline (or chosen family unit), not a user account. Members are linked through:

- **Founder**: the person who created the Thread. Cannot be revoked except by Founder action.
- **Successors**: members designated by the Founder (or by chain of succession) to inherit administrative authority. By default, a Founder names 2 successors; succession activates on Founder's death.
- **Authors**: any member with write permission. Granted by Founder or current successor.
- **Readers**: members with read-only access (children below an authorship age, in-laws, etc.).
- **Descendants-on-the-list**: future people not yet born or not yet of age. Created as a placeholder — once the human exists and is verified by an existing member, they auto-inherit reader/author rights at the configured age.

All membership grants are append-only and signed (cryptographically attested by the granter). A grant is recorded as an entry; revocation is also an entry.

### Visibility levels

Each entry carries one of:

- **Private (author-only)**: only the author and any explicit recipients see it.
- **Family-only (default)**: all current Thread members see it.
- **Descendants-only**: members of generations N+1 and below see it; current generation does not.
- **Public-historian (opt-in)**: redacted version released to the open archive (~50–100 years after author's death, opt-in only). Useful for genealogists and historians.

Visibility is enforced at read time, not at write time. An entry written today as "descendants-only" is encrypted to a key that only the descendant subgroup can decrypt — even Heirloom staff cannot read it.

## The schema (canonical)

See `cloudflare/migrations/0036_family_thread.sql`. Tables:

- `threads` — root entity. Has founder, successor list, settings, archival status.
- `thread_members` — current and future members with roles + age-gates.
- `thread_entries` — append-only content. Text, voice, photo, video. Encrypted payload.
- `entry_unlocks` — time-lock configuration per entry.
- `entry_comments` — cross-generational dialogue.
- `entry_amendments` — visible amendment trail.
- `entry_tags` — people, places, dates, eras.
- `successor_designations` — chain of administrative succession.
- `archive_pins` — IPFS / permanent-storage pin records for continuity audit.

## Output products (downstream)

The Thread is the source of truth. Every downstream product is a *view* on the Thread:

- **The Living Book**: a snapshot rendering of selected entries, printed on demand via Lulu. Not annual (Storyworth-style); requested any time, any subset.
- **The Wall**: a chronological reader interface for browsing entries.
- **The Bloodline**: a tree visualization where each node (person) shows their attached entries.
- **The Time-Locked Inbox**: a destination for entries unlocking soon for the current viewer (e.g., "3 entries unlock for you in the next 30 days").
- **The Q&A**: a retrieval interface where descendants can ask the archive natural-language questions and get matched entries (RAG over the Thread, scoped to readable entries only).

## Pricing model

The pricing should reinforce the architecture, not extract from it.

- **Free**: read your family's Threads forever; write up to 10 entries/year. No deletion, no expiry.
- **Family ($15/mo per family, not per user)**: unlimited entries, unlimited members, all features. One subscription covers the whole bloodline.
- **Founder ($999 one-time, lifetime)**: locks lifetime access for the family forever; funds the successor non-profit; Founder name engraved in the archive's continuity record.

Compare to Storyworth's $99/year-per-recipient and the entire competitor field's per-user-per-month — we charge per family, not per seat, because the family is the unit.

## Positioning summary

**One sentence**: Heirloom is the family thread that outlives all of us — append-only, multi-author, multi-generational, time-locked, perpetually archived.

**Headline**: *Start your family's thousand-year thread.*

**Sub**: *Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you, after us, after the company.*

**What we're not**: not a book service, not a death-planning app, not a genealogy tool, not an AI ghost. The Thread is the product. Books and AI Q&A are views on it.

## What was wrong with the prior playbook

The previous version of `marketing/PLAYBOOK.md` proposed pivoting to the Storyworth "gift-as-wedge" playbook ($99 → year of prompts → printed book). That positioning is correct *for Storyworth*, and it is finite. It would convert better than the original death-planning frame, but it would put us in a pricing race with a 5-year-incumbent. And it would lock us out of the world-first concept above — multi-generational continuity is incompatible with a one-shot annual gift product.

The gift wedge can still exist as a feature (gift a year of Family-tier membership for someone), but it is not the headline. The headline is the Thread.

## UI/UX standard — pixel-perfect, not "good enough"

The Thread is meant to be read by people who don't exist yet. Sloppy UI signals "transient app." Pixel-perfect signals "this is meant to last." Every surface needs to meet the bar:

- **Type**: a single typographic system used consistently — display serif for entry titles and date marks, humanist sans for body and metadata, monospaced for archival timestamps. Optical-sized fonts where they exist (e.g., the Source Serif 4 family). No fallback chains that produce visible reflow.
- **Color**: dark surface (#0a0c10) for the logged-in archive — it's a vault, not a feed. Gold (#c9a959) for accent and date marks. Light-warm theme (#faf6ee on #1a1916) for the public marketing surface and the descendants' first-touch screens. CSS variables driving everything; theme switch is one toggle.
- **Spacing**: 8px base unit, hard. No 7s, no 13s, no eyeballed margins. Tailwind config locked to a defined token set.
- **Motion**: motion has meaning or it's removed. Entries fade in on first view. Time-locked entries pulse softly until unlocked. No decorative parallax. Respect `prefers-reduced-motion`.
- **Imagery**: no stock photos. No multigenerational hands. Family threads should be illustrated abstractly (line work over textured paper) until users supply their own imagery.
- **Hit targets, focus rings, contrast**: WCAG 2.2 AA minimum, AAA on body text. Every interactive element ≥44px. Visible keyboard focus on every focusable thing.
- **Error & empty states**: written with the same care as the marketing copy. The empty Thread is its own moment ("Your thread is waiting. The first entry is the hardest.").
- **Performance**: archive renders 5,000 entries without lag. Virtualized list. Image lazy-loading. No flicker on theme change.
- **Cross-generational compatibility**: the descendants' reader interface must work on whatever browser exists in 2050. Build to web standards, not framework-of-the-month. Server-rendered fallback for every screen.
- **Print fidelity**: the Living Book and any PDF export must render identically to screen — same fonts, same spacing, same line breaks. Designers and print engineers in the loop, not an afterthought.

This is the bar. If a surface doesn't meet it, it doesn't ship.

## Open questions before further build

These were not in the prior playbook because they are specific to the world-first architecture:

1. **Legal entity for the successor non-profit**: which jurisdiction, when to incorporate? Recommend Delaware 501(c)(3) within 12 months of public launch.
2. **IPFS pinning provider mix**: Pinata + Web3.Storage + Filecoin Saturn? Cost ~$50/mo at projected volume. Worth fronting for the continuity claim.
3. **Cryptographic design**: per-Thread key + per-visibility-level subkey + key escrow for time-locks. Roughly Signal's sender-keys model adapted for time-locks. Needs a one-week design pass.
4. **Death verification beyond the existing dead-man's-switch**: when an event-lock says "on the author's death," we need a more rigorous verification than missed check-ins. Recommend: 2 of N legacy contacts confirm + 60-day grace window.
5. **Age verification for descendants**: when a 14-year-old great-niece needs to be granted reader access at 18, how do we attest she's now 18? Self-attestation + parental confirmation seems right. Document attestation is overkill.
