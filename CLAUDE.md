# Heirloom — Project Memory (CLAUDE.md)

> Heirloom is a **Family Thread**: a perpetual, append-only, multi-author, multi-generational
> story archive owned by a bloodline, not a single user. Positioning: *"Start your family's
> thousand-year thread."* Web at `heirloom.blue` + installable PWA. The authoritative design
> constitution is [ART_DIRECTION.md](ART_DIRECTION.md) — read it before touching UI.

## Repository map

| Path | Stack | What it is |
|---|---|---|
| **`cloudflare/frontend/`** ⭐ | React 18 + Vite + TS + Tailwind | **THE LIVE, DEPLOYED web app + PWA.** Deployed to Cloudflare Pages via `.github/workflows/deploy-cloudflare.yml`. The `src/loom/` subsystem is the canonical cloth interface — `ClothCanvas3D`, `ClothShell`, `ClothBackdrop`, and room components. **This is the tree to edit for product/UX work.** |
| `cloudflare/worker/`, `cloudflare/` ⭐ | Workers, D1/R2/KV | **THE LIVE EDGE API — single source of truth for all server behaviour.** D1 schema + migrations live here; the deployed app talks only to this. Soft-delete/append-only, encryption, billing, moderation all live in `src/routes/`. |
| `mobile/` | Capacitor | Native shells. |
| `marketing/automation/` | TS + tsx + Anthropic SDK + zod | **Autonomous content engine** — daily generate + multi-platform post. Runs via GitHub Actions. |
| `scripts/` | Node | Asset/video/social generation. |

## Design constitution (full detail in ART_DIRECTION.md)

The interface is built on the **cloth** — a 3D woven fabric (`ClothCanvas3D`) where every family
entry is a weft thread. The cloth is the home surface. Everything else (Composer, Rooms, Letters,
Voice, Settings) sits on top of it via `ClothShell` + `ClothBackdrop`.

**The five rules (from ART_DIRECTION.md):**
1. Type is the hero — Cormorant Garamond (display only, ≥~24px — turns unreadable smaller), Spectral (body/prose/reading/inputs — the readable workhorse), Space Mono (labels/archival, uppercase letterspaced), Inter (residual UI). Tangerine is the lone exception, only for the signature hand.
2. One color has emotion — copper `warm #e0a062` at <3% surface area. Everything else is cream `#f2e6d0` on ground `#0b0907`.
3. Negative space is the composition — 60–70% of any view is empty.
4. Motion has meaning or it's removed — one curve `cubic-bezier(0.16,1,0.3,1)`; durations 180/360/720/1400ms only.
5. Outside time — if a visual move signals "this is 2026," cut it.

**Color tokens** (canonical in `src/styles/globals.css`):
`ink #0b0907` · `bone #f2e6d0` · `bone-dim rgba(242,230,208,0.72)` · `bone-faint rgba(242,230,208,0.44)` · `rule rgba(242,230,208,0.11)` · `warm #e0a062` · `warm-bright #f0c074` · `warm-dim #b07a3e`. Tailwind utility classes (`text-paper`/`bg-gold`/`font-display`) read from `tailwind.config.js`, NOT globals.css — keep both files in sync or old palette bleeds into the bundle.

**The 10-stop natural-dye palette** (`src/loom/dye.ts`) is the family's identity system — each member
owns a dye that travels as signal: left-margin thread (3px left-border), name color (`DYE_TEXT`
variants). Dyes are signal only — no dye backgrounds, buttons, or fills.

**Anti-patterns (kill on sight):**
- Glassmorphism, frosted glass, blurred backgrounds
- Gradient meshes, conic gradients, animated noise
- Icon libraries — the product has no icons; `∞` is the only mark
- Decorative emoji
- Loading spinners — use the `ProgressHair` hairline progress bar
- Toast notifications — inline status only
- Avatar circles / `rounded-full` identity chips
- Any motion that doesn't carry information

> ⚠️ The **`cloudflare/frontend/src/loom/`** subsystem is the canonical product implementation.
> `ClothCanvas3D` is the cloth. `ClothShell` is the app chrome. `ClothBackdrop` is the global
> ambient cloth layer. When building new screens, extend these — never add a global nav bar, tab
> bar, or dashboard grid on top of the cloth.
>
> `STITCH_BRIEF.md` in the repo root is a legacy design-tool directive (for Google Stitch) and
> is **no longer the authoritative spec**. Ignore it.

## Commands

```bash
# Frontend — EDIT cloudflare/frontend (the deployed tree)
cd cloudflare/frontend && npm run dev   # vite dev server
npm run build                           # tsc && vite build = the typecheck/launch gate (currently clean)

# Worker (canonical edge API)
cd cloudflare/worker && npx tsc --noEmit   # typecheck gate (currently clean)

# Marketing automation (see marketing/PLAYBOOK.md + marketing/automation/README.md)
cd marketing/automation
npm run preview                   # DRY RUN — writes output/, posts nothing. Safe.
npm run daily                     # generate + post for real (needs platform secrets)
npm run typecheck
```

## Testing — current reality

- **Live frontend (`cloudflare/frontend`):** `tsc --noEmit` / `npm run build` pass clean (0 errors). Component tests TBD.
- **Worker:** `cloudflare/worker/src/__tests__/utils.test.ts`; typecheck via `npx tsc --noEmit`.
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
- Match the surrounding file's idiom. Canonical vocabulary: **the Cloth**, the Wall, the Sealed Note, the Unwoven Thread, the Composer, the Bloodline. Name components by it.
- Extend the cloth system (`ClothCanvas3D`, `ClothShell`, `ClothBackdrop`, room components) rather than building outside it.
