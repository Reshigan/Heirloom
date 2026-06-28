# Heirloom — Project Memory (CLAUDE.md)

> Heirloom is **the Deep** — the deep water a family keeps the conversation in across
> generations: a perpetual, append-only, multi-author, multi-generational archive owned by a
> bloodline, not a single user. Hero line: *"Some things only get deeper."* The durability proof
> *"Start your family's thousand-year thread"* stays true but is **demoted to a proof-point —
> never the first thing anyone reads** (see brand/BRAND.md §3). Web at `heirloom.blue` +
> installable PWA. The authoritative design constitution is [ART_DIRECTION.md](ART_DIRECTION.md)
> — read it before touching UI.
>
> **Brand: The Deep.** The user-facing surface is deep water (ground `#070d14`), and the
> user-facing word for the family archive is **the Deep** — entries *settle* / are *lowered*
> into it. The capture verb is *"let it settle."* The word "cloth" is retired from user copy.
> The mark is the **Sounding mark** — concentric depth-rings crossed by one warm surface-line
> (never a glowing filament web). Internally the rendering subsystem keeps its `Cloth*`/`loom`
> names and `/loom/*` routes — those are code, not copy.

## Repository map

| Path | Stack | What it is |
|---|---|---|
| **`cloudflare/frontend/`** ⭐ | React 18 + Vite + TS + Tailwind | **THE LIVE, DEPLOYED web app + PWA.** Deployed to Cloudflare Pages via `.github/workflows/deploy-cloudflare.yml`. The `src/loom/` subsystem is the canonical Deep interface — `WaterCanvas` (the deep-water home surface, seeded by member dyes), `Filament` (the quiet token-woven ambient ground), `ClothShell`, `ClothBackdrop`, and room components. **This is the tree to edit for product/UX work.** |
| `cloudflare/worker/`, `cloudflare/` ⭐ | Workers, D1/R2/KV | **THE LIVE EDGE API — single source of truth for all server behaviour.** D1 schema + migrations live here; the deployed app talks only to this. Soft-delete/append-only, encryption, billing, moderation all live in `src/routes/`. |
| `mobile/` | Capacitor | Native shells. |
| `marketing/automation/` | TS + tsx + Anthropic SDK + zod | **Autonomous content engine** — daily generate + multi-platform post. Runs via GitHub Actions. |
| `scripts/` | Node | Asset/video/social generation. |

## Design constitution (full detail in ART_DIRECTION.md)

The interface is built on **the Deep** — a living water surface (`WaterCanvas`, seeded by the
family's member dyes) with a quiet token-woven ambient ground (`Filament`). The Deep is the home
surface. Everything else (Composer, Rooms, Letters, Voice, Settings) sits on top of it via
`ClothShell` + `ClothBackdrop`.

**The five rules (from ART_DIRECTION.md):**
1. Type is the hero — Fraunces (display only, ≥~24px — turns unreadable smaller; token `--font-display`/`--serif-display`), Source Serif 4 (body/prose/reading/inputs — the readable workhorse; token `--serif`/`--font-body`, and the hand/italic voice), JetBrains Mono (labels/archival, uppercase letterspaced; token `--mono`).
2. One color has emotion — a single accent at <3% surface area, **user-chosen** from 5 hues (copper `#e0a062`, seafoam `#7fd4c4` = default, glacial, jade, moonstone). Device-local (`heirloom-accent` localStorage), signal only. Dark-theme only for v1 (light keeps AA copper-browns). Derived from one `--accent`/`--accent-bright` pair via `color-mix`; `[data-accent]` on `<html>` swaps it (set by `theme-boot.js` + `useLoomAccent`). Everything else is cream `#f2e6d0` on ground `#070d14` (The Deep's deep water).
3. Negative space is the composition — 60–70% of any view is empty.
4. Motion has meaning or it's removed — one curve `cubic-bezier(0.16,1,0.3,1)`; durations 180/360/720/1400ms only.
5. Outside time — if a visual move signals "this is 2026," cut it.

**Color tokens** (canonical in `src/styles/globals.css`):
`ink #070d14` · `bone #f2e6d0` · `bone-dim rgba(242,230,208,0.72)` · `bone-faint rgba(242,230,208,0.62)` (lifted from 0.44 for legibility over water) · `rule rgba(242,230,208,0.11)` · `warm #e0a062` · `warm-bright #f0c074` · `warm-dim #b07a3e`. Tailwind utility classes (`text-paper`/`bg-gold`/`font-display`) read from `tailwind.config.js`, NOT globals.css — keep both files in sync or old palette bleeds into the bundle.

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

> `STITCH_BRIEF.md` in the repo root is a legacy design-tool directive (for Google Stitch) and
> is **no longer the authoritative spec**. Ignore it.

> ⚠️ The **`cloudflare/frontend/src/loom/`** subsystem is the canonical product implementation.
> `WaterCanvas` renders the Deep (deep water, seeded by member dyes). `Filament` is the quiet
> token-woven ambient ground (no copper glow — copper is signal only). `ClothShell` is the app
> chrome. `ClothBackdrop` is the global ambient surface layer. When building new screens, extend
> these — never add a global nav bar, tab bar, or dashboard grid on top of the Deep.

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

Pipeline: `themes.ts` (52-week + seasonal calendar) → `generate.ts` (source post, Claude/Llama via Cloudflare Workers AI) →
`variants.ts` (per-platform) → `post.ts` (direct Facebook + Bluesky API). The engine posts to
**TWO surfaces only — Facebook and Bluesky**; everything else was retired. Single entrypoint
`src/run.ts` (subcommands: generate, post, daily, preview, metrics). CI:
`.github/workflows/social-autopost.yml` runs daily 14:00 UTC. All creds are optional env — absent
creds → that platform is skipped (graceful). `ANTHROPIC_API_KEY` (or `CLOUDFLARE_API_TOKEN` +
`CLOUDFLARE_ACCOUNT_ID` for the free Workers AI path) is the only hard requirement for generation.

## Conventions

- TS strict throughout. Pages are lazy-loaded in `App.tsx` (Landing eager). Auth via `useAuthStore` (Zustand).
- Match the surrounding file's idiom. Canonical user-facing vocabulary: **the Deep** (entries *settle* / are *lowered* in), the Wall, the Sealed Note, the Composer, the Bloodline. Capture verb is *"let it settle"*. Code/component names keep the `Cloth*`/`loom` lineage.
- Extend the Deep system (`WaterCanvas`, `Filament`, `ClothShell`, `ClothBackdrop`, room components) rather than building outside it.
