// Regenerate the static share/OG + social assets in the current Deep brand,
// reusing the proven renderDeep engine (deep water, dye tint, Sounding rings,
// ∞, wordmark) instead of the retired cloth generators. Run:
//   cd marketing/automation && npx tsx scripts/render-deep-og.mjs
import { renderDeep } from "../src/image.js";
import fs from "node:fs";
import path from "node:path";

const PUB = path.resolve("../../cloudflare/frontend/public");
const OG = path.join(PUB, "og");
fs.mkdirSync(OG, { recursive: true });

// [file, width, height, dye, eyebrow, saying]
const ASSETS = [
  // OG share cards (1200×630) — the link preview for each shared surface.
  [`${OG}/entry.png`, 1200, 630, "woad", "A story, kept", "Some things only get deeper."],
  [`${OG}/inherit.png`, 1200, 630, "kermes", "A letter has surfaced", "Someone kept this for you."],
  [`${OG}/milestone.png`, 1200, 630, "indigo", "In memory", "Held in the Deep, for as long as your family lasts."],
  [`${OG}/wrapped.png`, 1200, 630, "saffron", "The year, kept", "A year lowered into the Deep."],
  // Social broadcast fallbacks.
  [`${PUB}/social-square.png`, 1080, 1080, "woad", "", "Some things only get deeper."],
  [`${PUB}/social-vertical.png`, 1080, 1920, "woad", "", "Some things only get deeper."],
];

for (const [file, width, height, dye, eyebrow, saying] of ASSETS) {
  const png = renderDeep({ saying, width, height, seed: path.basename(file), dye, eyebrow: eyebrow || undefined });
  fs.writeFileSync(file, png);
  console.log(`wrote ${path.relative(PUB, file)} (${width}×${height}, ${png.length}B)`);
}
