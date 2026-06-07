# Heirloom — Product Context

## Product Purpose

Heirloom is a **Family Thread**: a perpetual, append-only, multi-author, multi-generational story archive owned by a bloodline, not a single user. Positioning: "Start your family's thousand-year thread."

Web app at heirloom.blue + installable PWA (Cloudflare Pages). The product is a woven cloth — every family entry is a weft thread; the cloth is the interface.

## Register

**product** — app UI. Design serves the product, not the marketing surface.

## Users

Primary: women 35–60 who use iPhones and iPads to document family memories. They are not tech-literate, are emotionally invested in what they're writing, and have one chance to capture a grandparent's story. Secondary: adult children inheriting the archive (passive readers). Tertiary: Founders — early adopters who paid $249 lifetime, invested in the mission.

The user is sitting at the kitchen table at 9pm, after the kids are in bed, typing on an iPhone SE. The ambient light is warm. The mood is reflective, quiet, slightly melancholy. They are not trying to "get things done" — they are trying to remember.

## Anti-references

- Notion: dense, utilitarian, feature-saturated
- Storyworth: weekly email prompts, feels like homework
- Ancestry.com: genealogy database, clinical, cold
- Day One: journaling app aesthetic — soft pastels, rounded corners, "mindfulness" vibes
- Google Photos: algorithmic timeline, faces-recognition UI
- Any SaaS dashboard: metrics, charts, cards, gradients

## Brand voice

Archival. Quiet authority. Speaks across centuries, not quarters. No startup energy. No exclamation marks. No "memories" as a marketing word (internal term only). No "legacy" or "gift" framing. The product trusts the user to understand its value without being told.

## Design constitution

The authoritative spec is ART_DIRECTION.md. Summary:

1. **Type is the hero.** Source Serif 4 (display + prose), Inter (UI), JetBrains Mono (archival). No fourth typeface.
2. **One emotional color.** Sealing-wax warm (#b07a4a) at <3% surface area. Everything else is bone (#f4ecd8) on ink (#0e0e0c).
3. **Negative space is the composition.** 60–70% of any view is empty.
4. **Motion has meaning or it's removed.** One curve: cubic-bezier(0.16,1,0.3,1). Durations: 180/360/720/1400ms only.
5. **Outside time.** If a visual move signals "this is 2026," cut it.

## Pricing

- Free: $0, 1 thread + 500MB storage
- Family: $6.99/mo or $69/yr, unlimited threads + 50GB + 5 members
- Founder: $249 one-time lifetime, 500GB

## Anti-patterns (kill on sight)

- Glassmorphism, frosted glass, blurred backgrounds
- Gradient meshes, conic gradients, animated noise
- Icon libraries — the product has no icons; ∞ is the only mark
- Decorative emoji
- Loading spinners — use ProgressHair hairline progress bar
- Toast notifications — inline status only
- Avatar circles / rounded-full identity chips
- Any motion that doesn't carry information
- Breathing circles (voice/audio cliché)
