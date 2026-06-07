/**
 * Heirloom short-video BANK generator.
 *
 * Renders every spec in scripts/content/tiktok-bank.json into a ready-to-upload
 * 9:16 mp4 under output/videos/bank/. These are the stock TikToks/Reels/Shorts:
 * hand-upload them now, and the moment TikTok API posting is wired (see
 * docs/TIKTOK_SETUP.md) the daily pipeline can pull from the same files.
 *
 * Usage:
 *   node scripts/generate-tiktok-bank.mjs           # render all specs
 *   node scripts/generate-tiktok-bank.mjs <id>      # render one by id
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromSpec, generateShort } from "./generate-tiktok.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK = path.join(__dirname, "content", "tiktok-bank.json");
const OUT_DIR = path.join(__dirname, "..", "output", "videos", "bank");

const only = process.argv[2];
const specs = JSON.parse(fs.readFileSync(BANK, "utf8")).filter(
  (s) => !only || s.id === only,
);

if (!specs.length) {
  console.error(only ? `No spec with id "${only}".` : "Bank is empty.");
  process.exit(1);
}

console.log(`[bank] rendering ${specs.length} short(s) → output/videos/bank/`);
const manifest = [];
for (const spec of specs) {
  process.stdout.write(`[bank] ${spec.id} (season=${spec.season ?? "evergreen"})… `);
  const out = await generateShort(fromSpec(spec), { outDir: OUT_DIR });
  const { size } = fs.statSync(out);
  console.log(`ok (${Math.round(size / 1024)}KB)`);
  manifest.push({ id: spec.id, season: spec.season ?? null, file: path.relative(path.join(__dirname, ".."), out) });
}

fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`[bank] done — ${manifest.length} video(s) + manifest.json`);
