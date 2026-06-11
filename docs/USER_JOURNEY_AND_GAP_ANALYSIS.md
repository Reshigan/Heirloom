# Heirloom — User Journey & Gap Analysis

> Authored 2026-06-11. Two halves: **Part 1** documents the *intended* end-to-end
> user journey, derived from the system's stated intent (CLAUDE.md, ART_DIRECTION.md,
> THREAD.md). **Part 2** compares that intent against what is *actually built* on the
> live platform (Cloudflare Workers + D1 API, the `cloudflare/frontend` React/PWA).
>
> Method: route table from `App.tsx` (93 routes), live API surface mapped from
> `cloudflare/worker/src` (50+ route files, ~135 D1 tables), and per-page reality
> checks (does the page call a real API or is it static). Sources cited inline.

---

## Part 1 — The Intended Journey

### The promise

Heirloom is a **Family Thread**: a perpetual, append-only, multi-author,
multi-generational story archive owned by a *bloodline*, not a single user.
Positioning: *"Start your family's thousand-year thread."* It is explicitly **not a
feed** — it is a vault that compounds. The emotional register is watchfulness and
continuity: quiet, weight, one warm-lit thing.

The interface is the **Cloth** — a 3D woven fabric (`ClothCanvas3D`) where every
family entry is a weft thread. Each member owns a **dye** (one of ten natural-dye
stops) that travels as signal: a 3px left-margin thread and a name color. Everything
else — Composer, Rooms, Letters, Voice, Settings — sits *on top of* the cloth via
`ClothShell` + `ClothBackdrop`. Canonical vocabulary: the Cloth, the Wall, the Sealed
Note, the Unwoven Thread, the Composer, the Bloodline, the weft thread.

### The intended end-to-end arc

```
DISCOVER → ENTER → FOUND → WEAVE → INVITE → ENDURE → INHERIT
```

1. **Discover.** A stranger meets the brand through a quiet, confusing-in-a-good-way
   marketing surface (the daily sentence, scenario pages: "a letter for her wedding
   day," "voice for the unborn"). The promise: *the recipe with no card, the voice on
   the 1997 tape, the photo nobody can name* — captured before it's lost.

2. **Enter.** Sign up → email verify → a guided onboarding that *creates the first
   Thread at signup* and walks the user into their first entry. No empty dashboard;
   the cloth is already there.

3. **Found.** The user founds (or is invited into) a **Thread** — the bloodline
   container. They are its founder; they can designate **successors** who inherit
   stewardship across generations.

4. **Weave.** The daily act: open the Composer and add a weft thread — a **memory**
   (photo/text), a **voice recording**, or a **Sealed Note** (a letter time-locked
   until a date, a milestone, an event, or the author's death). Entries carry the
   author's dye. A daily prompt and "on this day" resurfacing pull the user back.

5. **Invite.** Add the **Bloodline** — family members, each assigned a dye. Invite
   them to co-author the Thread with per-entry visibility (PRIVATE / FAMILY /
   DESCENDANTS / HISTORIAN). The archive becomes multi-author.

6. **Endure.** The Thread must outlive its author. A **dead man's switch** (check-in
   cadence + legacy contacts) and **IPFS continuity pinning** guarantee the archive
   persists and releases. Content is encrypted at rest with key escrow.

7. **Inherit.** A recipient receives a token, opens the **Inheritance / Recipient
   portal**, and reads what was left for them — the Unwoven Thread becoming visible
   only when time permits. Stewardship passes to a successor. The thread does not have
   a last year.

The intended journey is **narrow and deep**: one surface (the cloth), one act (add a
thread), one promise (it endures and is inherited).

---

## Part 2 — Intent vs. Built

### Headline finding

**The platform is not under-built against its intent — it is over-built around it.**

Every load-bearing step of the intended arc has *genuine, deployed backend support*
(persistence, encryption, endpoints) and a *real, API-wired* frontend page. The gap
is **not** "promised but missing." The gap runs the other way: a focused thousand-year
thread has accreted **93 routes** and roughly a dozen growth/commerce subsystems
(gamification, gifts, books, memorials, referrals, influencer CRM) that sit *outside*
the core arc and dilute the "one surface, one act" intent the design constitution
demands.

### The core arc — fully built

| Intended step | Built? | Evidence |
|---|---|---|
| Discover (marketing/scenarios) | ✅ | `Showcase`, `Founder`, `/for/*` `ScenarioPages`, `DailySentence` (static syndication surface — the one intentionally backend-less page) |
| Enter (signup → verify → onboard) | ✅ real API | `Onboarding` creates a Thread at signup; full `/api/auth/*` (register, verify-email, 2FA, refresh) |
| Found a Thread + successors | ✅ real API | `ThreadsIndex`, `ThreadDetail`; `/api/threads` incl. `/:id/successors`, member roles, revoke |
| Weave: memory / voice / sealed note | ✅ real API | `Compose`, `Record`, `PhotoQuick`; `/api/memories`, `/api/voice` (R2 + Workers-AI transcription), `/api/letters` (draft→seal→release, encrypted) |
| Invite the Bloodline + dye + visibility | ✅ real API | `Family` (CRUD + 7-day soft-delete grace + restore); thread entry visibility PRIVATE/FAMILY/DESCENDANTS/HISTORIAN |
| Endure: dead man's switch + continuity | ✅ real API | `/api/deadman/*` (check-in, legacy contacts, verify token); `/api/archive/*` IPFS pin audit; key escrow + PBKDF2 encryption |
| Inherit: recipient portal | ✅ real API | `Inherit` (1307L, real), `/api/inherit/:token`, `/content/*`, recipient reply; `Inbox` surfaces upcoming/recent unlocks |

Every uncertain page from the first pass was verified to call real APIs:
`Inherit` (4), `FutureLetter` (3), `TimeCapsule` (3), `Wrapped` (3), `QandA` (2),
`PersonPage` (3), `FamilyFeed` (1). Only `DailySentence` (0) is deliberately a static
marketing surface.

### The sprawl — built, but outside the intended arc

These are real, backend-backed features. None are broken; all are *off-thesis*
relative to "a quiet thousand-year thread":

- **Gamification:** Streaks, Challenges (weekly), Milestones, Legacy Score —
  `/api/engagement/*`. Streak mechanics and a "score" are the kind of "this is 2026"
  signal ART_DIRECTION rule 5 says to cut.
- **Commerce/growth:** Gift vouchers + Gift V2 (encrypted links), Gift Subscriptions,
  Referrals, Influencer CRM + payouts, Founder pledges — multiple Stripe flows and a
  whole marketing/admin subsystem.
- **Output products:** Living Books (Lulu Direct print), Memorials (public tribute
  pages), Wrapped (year-in-review), Memory Cards / Memory Map / Story Artifacts —
  shareable derivatives of the archive.
- **Ops:** Push (APNs/FCM/VAPID), Support tickets+chat, Announcements, Export (PDF),
  Social import, full Admin dashboard.

### The real gaps (intent ≠ implementation)

1. **Surface coherence, not feature coverage.** Intent: *one* surface, the cloth;
   "never add a global nav/tab/dashboard grid on top of the cloth" (CLAUDE.md). Built:
   93 routes including `/dashboard`, gamified `/streaks`, `/challenges`, `/milestones`.
   The map has outgrown the constitution. **Gap = curation/IA, not missing function.**

2. **Tone drift vs. ART_DIRECTION rule 5 ("outside time").** Streaks, scores,
   challenges, "Wrapped" are mechanics that explicitly date the product to 2026 and
   pull toward "feed/app," against the "vault, book-not-app" intent.

3. **Two backends, one live.** The Express `backend/` mirrors the API but is **not
   deployed** — the Cloudflare Worker is the sole live API (`https://api.heirloom.blue`).
   The dormant tree is a maintenance/security liability (drift, confusion) with no
   product value. **Recommend archiving it.**

4. **`DailySentence` is intentionally backend-less** — correct as a syndication
   surface, but worth labeling so it isn't mistaken for an unfinished feature.

5. **Inheritance is the thesis but the least-trafficked journey.** It is fully built,
   yet it's the end of a long funnel (found → weave → invite → endure → inherit). The
   gap is *activation*, not implementation: most of the surface area pushes weekly
   engagement, not the once-a-generation inheritance moment that is the actual promise.

### Recommendation (one line each)

- **Decide the canon.** Pick the ~10 routes that ARE the thread (compose, record,
  threads, family, letters, inbox, inherit, today, settings, billing); demote the rest
  behind the cloth or to clearly-marked secondary surfaces.
- **Audit tone against rule 5.** Either re-skin gamification into the cloth idiom (a
  thread grows, not a streak counter) or cut it.
- **Archive `backend/`.** One live API; remove the dormant mirror.
- **Instrument the inheritance funnel.** The thesis step deserves the activation
  investment the engagement features currently absorb.

---

### Appendix — page reality verdicts

**Core, API-backed (real):** Compose, Record, PhotoQuick, Family, Letters,
ThreadsIndex, ThreadDetail, ThreadCompose, Memories, MemoryRoom, Inbox, Today,
Onboarding, Join, Settings, Billing, StoryView, Inherit, FutureLetter, TimeCapsule,
Wrapped, QandA, PersonPage, FamilyFeed.

**Engagement (real, off-thesis):** Streaks, Challenges, Referrals, Milestones,
Memorials, MemoryCards, MemoryMap, InterviewMode, LifeEvents.

**Marketing/static:** Showcase, Founder (hybrid: static + live pledge count),
FoundersWall, `/for/*` ScenarioPages, DailySentence (deliberately backend-less).

**Gift/commerce flow:** GiftPurchase, GiftRedeem, GiftReceive, GiftAMemory,
GiftSubscriptions, BookBuilder.

**Not live:** `backend/` (Express + Prisma) — superseded by the Cloudflare Worker.
