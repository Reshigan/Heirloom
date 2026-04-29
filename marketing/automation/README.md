# Heirloom Autonomous Content Engine

Daily content generation + multi-platform posting. Runs unattended via GitHub Actions. See [`../PLAYBOOK.md`](../PLAYBOOK.md) for strategy; this doc is the technical reference.

## Architecture

```
┌──────────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌────────┐
│ themes.ts    │ →  │ generate.ts│ →  │ variants.ts│ →  │ post.ts  │ →  │Ayrshare│
│ 52-week +    │    │ Claude API │    │ Claude API │    │ REST API │    │ → 10   │
│ seasonal     │    │ source post│    │ per-platfm │    │ or DRY   │    │ networks│
└──────────────┘    └────────────┘    └────────────┘    └──────────┘    └────────┘
                                                              ↑
                                                        ┌─────┴────┐
                                                        │metrics.ts│
                                                        │ feedback │
                                                        └──────────┘
```

Single entrypoint: `src/run.ts`. Subcommands: `generate`, `post`, `daily`, `preview`, `metrics`.

## Setup

```bash
cd marketing/automation
npm install
cp .env.example .env  # fill in keys
npm run preview       # dry-run, writes to output/, no posts go out
```

## Required environment

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | content generation |
| `ANTHROPIC_MODEL` | no | default `claude-opus-4-7` |
| `AYRSHARE_API_KEY` | no in DRY_RUN | omit to run in mock mode |
| `PLATFORMS` | no | comma-separated, default `instagram,tiktok,pinterest,facebook,linkedin,x` |
| `DRY_RUN` | no | `1` to skip posting, write to `output/` only |

## Run modes

```bash
npm run preview    # dry-run end-to-end. safe to run anytime.
npm run generate   # generate-only, write source post to output/source.json
npm run post       # post pre-generated source, regenerating per-platform variants
npm run daily      # full pipeline: generate + variants + post
npm run metrics    # pull engagement metrics for today's post IDs
```

## Daily cron

`.github/workflows/social-autopost.yml` runs `npm run daily` every day at 14:00 UTC. To switch on:

1. Set repo secrets `ANTHROPIC_API_KEY` and `AYRSHARE_API_KEY`.
2. Optionally set repo variables `ANTHROPIC_MODEL` and `PLATFORMS`.
3. Manually trigger once via workflow_dispatch with `mode=preview` to verify output.
4. Once preview output looks right, leave on auto-schedule.

## Output

Each run writes to `output/YYYY-MM-DD/`:

- `source.json` — the day's source post (hook, body, CTA, hashtags, image prompt)
- `variants.json` — array of per-platform variants
- `results.json` — Ayrshare post results or DRY_RUN markers
- `<platform>.md` — preview-mode rendering of each variant (DRY_RUN only)

The repo also keeps `output/source.json` and `output/metrics.jsonl` at the top level for the next day's run to read recent context.

## Themes

`src/themes.ts` is the 52-week calendar. Each ISO week has a primary theme + suggested angles. Four seasonal windows override the rolling theme:

- Mother's Day (May 1–14)
- Father's Day (June 1–22)
- Grandparents Day (Sept 1–15)
- Christmas (Dec 15–25)

Per the research in `../PLAYBOOK.md` §3, these four peaks drive ~60% of revenue in this category. The seasonal copy is sharper / more conversion-oriented; rolling weekly copy is softer and brand-building.

## Voice

`src/voice.ts` holds the brand voice + per-platform guidelines. **This is the file to edit if marketing copy comes out wrong.** Don't try to fix tone via post-hoc edits — change the system prompt and regenerate.

## Image generation

This module produces `imagePrompt` strings + `imageSpec` dimensions for each variant. The actual rendering is intentionally not implemented here. Hand off `imagePrompt` to:

- **Bannerbear** or **Placid** for templated text-on-image (recommended for consistency, $49/mo)
- **Ideogram** or **Imagen** for photographic generation
- **Runway** or **Sora** for video

Wire your chosen image service into `post.ts` `postToAyrshare(input)` — set `input.imageUrl` before calling.

## Replacing Ayrshare

`post.ts` is the only file that talks to Ayrshare. To migrate to direct platform APIs (Meta Graph API, X v2, Pinterest v5, etc.) — about 4–6 weeks of work per platform — replace `post()` with platform-specific dispatchers. The variant pipeline doesn't change.

## Costs (monthly, expected)

- Anthropic API: ~$30 (1 daily generation × 6 variants × 30 days, with prompt caching)
- Ayrshare: $149 (business tier)
- Bannerbear / Placid: $49 (when wired in)
- GitHub Actions: $0 (within free tier for public repos; ~$5/mo for private)
- **Total: ~$230/mo for fully autonomous multi-platform daily content**

Human time required: zero, once running. Operator should review `output/` weekly to spot drift.
