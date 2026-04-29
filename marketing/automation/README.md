# Heirloom Autonomous Content Engine

Daily content generation + multi-platform posting. Runs unattended via GitHub Actions. See [`../PLAYBOOK.md`](../PLAYBOOK.md) for strategy; this doc is the technical reference.

## Architecture

```
┌──────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────────┐
│ themes.ts    │ →  │ generate.ts│ →  │ variants.ts│ →  │ post.ts        │
│ 52-week +    │    │ Sonnet 4.6 │    │ Sonnet 4.6 │    │ direct API     │
│ seasonal     │    │ source post│    │ per-platfm │    │ + queue        │
└──────────────┘    └────────────┘    └────────────┘    └───────┬────────┘
                                                                │
                                          ┌─────────────────────┼─────────────────────┐
                                          ▼                     ▼                     ▼
                                  ┌─────────────┐       ┌─────────────┐       ┌──────────────┐
                                  │ Meta Graph  │       │ LinkedIn    │       │ Queue mode   │
                                  │ FB + IG     │       │ Pinterest   │       │ output/ +    │
                                  │ (free)      │       │ Bluesky     │       │ webhook      │
                                  └─────────────┘       │ (free)      │       │ (TikTok, X,  │
                                                        └─────────────┘       │ Threads, YT) │
                                                                              └──────────────┘
```

Single entrypoint: `src/run.ts`.

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
| `ANTHROPIC_MODEL` | no | default `claude-sonnet-4-6` (~$3/mo at this volume) |
| `META_PAGE_ACCESS_TOKEN` + `META_PAGE_ID` | optional | enable direct FB posting |
| `META_IG_USER_ID` | optional | enable direct IG posting (also needs META_PAGE_ACCESS_TOKEN) |
| `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_AUTHOR_URN` | optional | enable direct LinkedIn posting |
| `PINTEREST_ACCESS_TOKEN` + `PINTEREST_BOARD_ID` | optional | enable direct Pinterest posting |
| `BLUESKY_HANDLE` + `BLUESKY_APP_PASSWORD` | optional | enable direct Bluesky posting |
| `QUEUE_WEBHOOK_URL` | optional | Discord/Slack webhook for queue-mode notifications |
| `PLATFORMS` | no | comma-separated, default `instagram,tiktok,pinterest,facebook,linkedin,x` |

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

| Item | Cost | Notes |
|---|---|---|
| Anthropic API (Sonnet 4.6) | ~$3 | 1 daily generation, prompt caching enabled |
| Anthropic API (Haiku 4.5) | ~$0.25 | swap if you want even cheaper, quality drop is small |
| Meta Graph API | $0 | free, requires app review (~1 week) |
| LinkedIn / Pinterest / Bluesky API | $0 | free |
| TikTok Content Posting API | $0 | free, requires app review (~6 weeks) |
| X v2 API | $200 | paid only — default queue mode skips this |
| GitHub Actions | $0 | within free tier |
| **Total fully running** | **~$3** | Sonnet + free direct APIs + queue for TikTok/X |

Human time once running: ~5 min/day to paste queue items into TikTok and X (until app reviews land), then zero.

## Free path setup (recommended)

1. Anthropic API key (~$3/mo at this volume).
2. Meta Business app → connect Facebook Page + Instagram Business account → request `pages_manage_posts` and `instagram_content_publish` permissions. ~1 week review.
3. LinkedIn Developer app → request `w_organization_social` scope.
4. Pinterest developer app → connect business account.
5. Bluesky app password (no review needed).
6. Discord webhook (or Slack incoming webhook) for queue-mode notifications. Free.
7. Wait for app reviews (Meta/LinkedIn/Pinterest typically 1–14 days).
8. Until reviews are in: queue mode posts to webhook → operator pastes manually. ~5 min/day.
