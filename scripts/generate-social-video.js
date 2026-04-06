/**
 * Heirloom Social Video Generator
 * Renders motion-graphic videos from JSON post configs using Puppeteer + FFmpeg.
 *
 * Prerequisites:
 *   npm install puppeteer
 *   ffmpeg must be installed (apt install ffmpeg)
 *   Place royalty-free ambient piano track at scripts/assets/ambient-piano.mp3
 *
 * Usage (single video):
 *   node scripts/generate-social-video.js --config scripts/content/all-posts.json --id w1-mon
 *
 * The generateVideo() function is also exported for use by generate-all-videos.js.
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'videos');

/**
 * Build the HTML page for one video post.
 */
function buildHTML(config) {
  const lineStyles = config.lines
    .map(
      (l, i) =>
        `.line:nth-child(${i + 1}) { animation-delay: ${l.delay}s; }`
    )
    .join('\n');

  const lineMarkup = config.lines
    .map((l) => {
      const classes = ['line', l.style || 'headline'].join(' ');
      return `<div class="${classes}">${l.text.replace(/\n/g, '<br>')}</div>`;
    })
    .join('\n');

  const endDelay = config.endCardDelay || config.duration - 3;

  return `<!DOCTYPE html>
<html>
<head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:wght@300;400&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1920px;
  background: linear-gradient(180deg, #050608 0%, #0a0c10 40%, #0c0a0e 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px;
  overflow: hidden;
}
.line {
  font-family: 'Playfair Display', serif;
  color: #f5f3ee;
  text-align: center;
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 0.8s ease forwards;
  margin-bottom: 24px;
}
.line.headline { font-size: 64px; font-weight: 400; line-height: 1.15; }
.line.body { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; color: #d4d0c8; line-height: 1.3; }
.line.gold, .line.headline.gold { color: #c9a959; font-style: italic; }
.line.stat { font-size: 96px; color: #c9a959; font-weight: 600; }
.end-card {
  position: absolute; bottom: 120px;
  display: flex; flex-direction: column; align-items: center;
  opacity: 0; animation: fadeUp 0.8s ease forwards;
  animation-delay: ${endDelay}s;
}
.end-card .logo { font-size: 48px; color: #c9a959; margin-bottom: 16px; }
.end-card .url { font-family: 'Playfair Display', serif; font-size: 36px; color: #c9a959; letter-spacing: 0.15em; }
.end-card .cta { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #d4d0c8; margin-top: 8px; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
${lineStyles}
</style>
</head>
<body>
${lineMarkup}
<div class="end-card">
  <div class="logo">\u221E</div>
  <div class="url">heirloom.blue</div>
  <div class="cta">Start free \u2014 preserve what matters</div>
</div>
</body>
</html>`;
}

/**
 * Render a single video from a post config object.
 * @param {object} config  Post config with id, lines, duration, endCardDelay
 * @param {object} opts    Optional overrides: { outputDir, fps, audioPath }
 * @returns {Promise<string>} Path to the generated MP4
 */
async function generateVideo(config, opts = {}) {
  const fps = opts.fps || 30;
  const outputDir = opts.outputDir || OUTPUT_DIR;
  const audioPath =
    opts.audioPath || path.join(ASSETS_DIR, 'ambient-piano.mp3');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const framesDir = path.join('/tmp', `frames-${config.id}`);
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const html = buildHTML(config);
  const totalFrames = config.duration * fps;

  console.log(
    `  [${config.id}] Rendering ${totalFrames} frames (${config.duration}s @ ${fps}fps)...`
  );

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  for (let i = 0; i < totalFrames; i++) {
    await page.evaluate((time) => {
      document.getAnimations().forEach((a) => {
        a.currentTime = time;
      });
    }, (i / fps) * 1000);
    await page.screenshot({
      path: path.join(framesDir, `frame-${String(i).padStart(5, '0')}.png`),
    });
  }
  await browser.close();

  // Assemble with FFmpeg
  const outputPath = path.join(outputDir, `${config.id}.mp4`);
  const hasAudio = fs.existsSync(audioPath);

  const audioFlag = hasAudio
    ? `-i "${audioPath}" -c:a aac -shortest`
    : '-an';

  const cmd = [
    'ffmpeg -y',
    `-framerate ${fps}`,
    `-i "${framesDir}/frame-%05d.png"`,
    audioFlag,
    '-c:v libx264 -pix_fmt yuv420p',
    `-t ${config.duration}`,
    `"${outputPath}"`,
  ].join(' ');

  console.log(`  [${config.id}] Assembling MP4...`);
  execSync(cmd, { stdio: 'pipe' });

  // Cleanup frames
  fs.rmSync(framesDir, { recursive: true });

  console.log(`  [${config.id}] Done -> ${outputPath}`);
  return outputPath;
}

module.exports = { generateVideo, buildHTML };

// CLI entry-point
if (require.main === module) {
  const args = process.argv.slice(2);
  const configIdx = args.indexOf('--config');
  const idIdx = args.indexOf('--id');

  if (configIdx === -1 || idIdx === -1) {
    console.error(
      'Usage: node generate-social-video.js --config <json> --id <post-id>'
    );
    process.exit(1);
  }

  const allPosts = JSON.parse(fs.readFileSync(args[configIdx + 1], 'utf8'));
  const post = allPosts.find((p) => p.id === args[idIdx + 1]);
  if (!post) {
    console.error(`Post "${args[idIdx + 1]}" not found in config.`);
    process.exit(1);
  }

  generateVideo(post).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
