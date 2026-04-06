#!/usr/bin/env node
/**
 * Batch Video Generator — renders all 60 social videos from all-posts.json.
 *
 * Prerequisites:
 *   npm install puppeteer
 *   ffmpeg must be installed
 *   Optional: place scripts/assets/ambient-piano.mp3 for background music
 *
 * Usage:
 *   # Generate all 60 videos
 *   node scripts/generate-all-videos.js
 *
 *   # Generate only week 1
 *   node scripts/generate-all-videos.js --week 1
 *
 *   # Generate a single post
 *   node scripts/generate-all-videos.js --id w1-mon
 *
 * Output:
 *   output/videos/w1-mon.mp4
 *   output/videos/w1-tue.mp4
 *   ...etc
 */

const fs = require('fs');
const path = require('path');
const { generateVideo } = require('./generate-social-video');

const CONTENT_PATH = path.join(__dirname, 'content', 'all-posts.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'videos');

async function main() {
  if (!fs.existsSync(CONTENT_PATH)) {
    console.error(
      'Content JSON not found. Run `node scripts/generate-content-json.js` first.'
    );
    process.exit(1);
  }

  const allPosts = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
  const args = process.argv.slice(2);

  let posts = allPosts;

  // Filter by --week
  const weekIdx = args.indexOf('--week');
  if (weekIdx !== -1) {
    const week = parseInt(args[weekIdx + 1]);
    posts = posts.filter((p) => p.week === week);
    console.log(`Filtering to week ${week} (${posts.length} posts)\n`);
  }

  // Filter by --id
  const idIdx = args.indexOf('--id');
  if (idIdx !== -1) {
    const id = args[idIdx + 1];
    posts = posts.filter((p) => p.id === id);
    console.log(`Filtering to post ${id}\n`);
  }

  if (posts.length === 0) {
    console.error('No matching posts found.');
    process.exit(1);
  }

  console.log(`Generating ${posts.length} videos...\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const videoConfig = {
      id: post.id,
      lines: post.video.lines,
      duration: post.video.duration,
      endCardDelay: post.video.endCardDelay,
    };

    console.log(
      `[${i + 1}/${posts.length}] ${post.id} — "${post.title}" (Week ${post.week}, ${post.day})`
    );

    try {
      await generateVideo(videoConfig, { outputDir: OUTPUT_DIR });
      success++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Complete: ${success} succeeded, ${failed} failed out of ${posts.length}`);
  console.log(`Videos saved to: ${OUTPUT_DIR}`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
