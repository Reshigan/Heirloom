# Heirloom — Project Memory (CLAUDE.md)

> Heirloom is a **Family Thread**: a perpetual, append-only, multi-author, multi-generational
> story archive owned by a bloodline, not a single user. Positioning: *"Start your family's
> thousand-year thread."* Web at `heirloom.blue` + installable PWA. The authoritative product/
> design spec is [STITCH_BRIEF.md](STITCH_BRIEF.md) — read it before touching UI.

## Repository map

| Path | Stack | What it is |
|---|---|---|
| **`cloudflare/frontend/`** ⭐ | React 18 + Vite + TS + Tailwind | **THE LIVE, DEPLOYED web app + PWA.** Deployed to Cloudflare Pages via `.github/workflows/deploy-cloudflare.yml`. Contains the `src/loom/` Tapestry subsystem (the migration toward STITCH_BRIEF). **This is the tree to edit for product/UX work.** |
| `cloudflare/worker/`, `cloudflare/` | Workers, D1 | Edge API + DB migrations. The only pre-existing tests (`cloudflare/worker/src/__tests__`). |
| `frontend/` | React 18 + Vite + TS | ⚠️ **NOT deployed.** An older in-progress redesign (the "Hearth"/fire-metaphor direction — itself a §2.6 anti-pattern). Kept in-repo but superseded by `cloudflare/frontend`. Don't invest here unless explicitly reviving it. |
| `backend/` | Node + Express + TS + Prisma | API server (note: the Cloudflare worker is the edge API; this Express backend is the fuller service). `npm test` = vitest — suite established in this pass (encryption/auth/billing/env). |
| `mobile/` | Capacitor | Native shells. |
| `marketing/automation/` | TS + tsx + Anthropic SDK + zod | **Autonomous content engine** — daily generate + multi-platform post. Runs via GitHub Actions. |
| `scripts/` | Node | Asset/video/social generation. |

## Design constitution (NON-NEGOTIABLE — full detail in STITCH_BRIEF.md §2)

The product is **the Tapestry** — a woven cloth where every family entry is one weft thread; the
cloth itself is the interface (no dashboard, no feed, no nav rail). The five "world-first
invariants" (§1.5): (A) Tapestry-is-the-interface, (B) append-only counter always visible,
(C) the Listener is the ambient AI surface (one typographic line, never a chatbot), (D) the
Unlock is the only ceremony (720ms), (E) print + textile fidelity.

- **Type is the hero.** Source Serif 4 (variable optical serif — display + prose), Inter (UI),
  JetBrains Mono (archival). No 4th typeface. (The Claude Design handoff bundle superseded the
  brief's original Newsreader with Source Serif 4 for letterpress fidelity — now canonical across
  the live app; legacy Cinzel/Cormorant/Caveat are retired. Tokens + `hl-*` primitives live in
  `cloudflare/frontend/src/styles/globals.css`.)
- **One emotional color:** sealing-wax `warm #b07a4a`, used at **<3% surface area**. Everything else
  is bone `#f4ecd8` on ink `#0e0e0c`. The 10-stop natural-dye palette (§2.7) lives **only** inside woven threads.
- **Negative space is the composition** (60–70% empty). **0px radius** default (2px inputs, never >4px). 1px hairlines only.
- **Motion has meaning or it's cut.** One curve `cubic-bezier(0.16,1,0.3,1)`; durations 180/360/720/1400ms only.
- **Anti-patterns that FAIL review (§2.6):** glassmorphism, gradient meshes, floating cards w/ translateY hover,
  icon libraries (product has **no icons** — `∞` is the only mark), decorative emoji, spinners (use a hairline
  progress bar), toasts (inline status only), avatar circles, any literal metaphor object (fire/vault/key/quill).

> ⚠️ The **`cloudflare/frontend/src/loom/`** subsystem is the canonical implementation of the brief
> (Tapestry, the Wall/ReadingRoom, the Unwoven Thread/Composer, the Unlock, the Listener/Echo). When
> building product UI, extend the loom subsystem and prefer its primitives. The non-deployed `frontend/`
> tree uses a "Hearth"/fire metaphor that is itself a §2.6 anti-pattern — don't pattern-match off it.

## Commands

```bash
# Frontend — EDIT cloudflare/frontend (the deployed tree), NOT frontend/
cd cloudflare/frontend && npm run dev   # vite dev server
npm run build                           # tsc && vite build = the typecheck/launch gate (currently clean)

# Backend
cd backend && npm install && npx prisma generate   # first-time setup (node_modules + Prisma client)
npm run dev                       # tsx watch src/server.ts
npm test                          # vitest — see Testing (suite established in this pass)
npm run db:migrate / db:generate / db:seed

# Marketing automation (see marketing/PLAYBOOK.md + marketing/automation/README.md)
cd marketing/automation
npm run preview                   # DRY RUN — writes output/, posts nothing. Safe.
npm run daily                     # generate + post for real (needs platform secrets)
npm run typecheck
```

## Testing — current reality

- **Live frontend (`cloudflare/frontend`):** `tsc --noEmit` / `npm run build` pass clean (0 errors). Component tests TBD.
- **Backend:** vitest suite established this pass — `backend/vitest.config.ts` + `src/test/setup.ts`
  (sets throwaway env so `config/env.ts` parses; mocks Redis/Prisma at the test-file level). Covers
  `encryption.service` (zero-knowledge crypto round-trips/tamper-detection), `auth.service`
  (bcrypt + JWT), `billing.service` (currency math), `env` (tier/pricing invariants). **37 tests, green.**
  Run: `cd backend && npm test` (needs `npm install` + `npx prisma generate` first).
- **Worker:** `cloudflare/worker/src/__tests__/utils.test.ts`.
- Verify before claiming done: run the actual command and read the output. No "should pass."

## Marketing automation — how it works

Pipeline: `themes.ts` (52-week + seasonal calendar) → `generate.ts` (source post, Sonnet) →
`variants.ts` (per-platform) → `post.ts` (direct Meta/LinkedIn/Pinterest/Bluesky API + queue webhook
for TikTok/X/Threads/YT). Single entrypoint `src/run.ts` (subcommands: generate, post, daily,
preview, metrics). CI: `.github/workflows/social-autopost.yml` runs daily 14:00 UTC. All platform
creds are optional env — absent creds → that platform is skipped (graceful). `ANTHROPIC_API_KEY` is
the only hard requirement for generation.

## Conventions

- TS strict throughout. Pages are lazy-loaded in `App.tsx` (Landing eager). Auth via `useAuthStore` (Zustand).
- Match the surrounding file's idiom. The brief's vocabulary (Tapestry, the Wall, the Listener, the
  Sealed Note, the Unwoven Thread, Bloodline) is canonical — name components by it.
- Reference the brief by section (e.g. "§6.3 Composer") in commits and PRs touching UI.
