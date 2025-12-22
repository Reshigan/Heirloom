/**
 * App Icon Generator for Heirloom Mobile App
 * 
 * This script generates app icons for iOS and Android from a source image.
 * 
 * Usage:
 * 1. Place your 1024x1024 source icon at ./assets/icon-source.png
 * 2. Run: node scripts/generate-icons.js
 * 
 * Requirements:
 * - npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Icon sizes for different platforms
const ICON_SIZES = {
  // Main app icon
  icon: { size: 1024, name: 'icon.png' },
  // Adaptive icon for Android
  adaptiveIcon: { size: 1024, name: 'adaptive-icon.png' },
  // Splash icon
  splashIcon: { size: 200, name: 'splash-icon.png' },
  // Favicon for web
  favicon: { size: 48, name: 'favicon.png' },
};

// Create a simple placeholder icon with the Heirloom infinity symbol
async function createPlaceholderIcon() {
  const size = 1024;
  const backgroundColor = '#0a0c10';
  const goldColor = '#D4AF37';
  
  // Create SVG with infinity symbol
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text 
        x="50%" 
        y="55%" 
        font-family="Georgia, serif" 
        font-size="400" 
        fill="${goldColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >∞</text>
      <text 
        x="50%" 
        y="80%" 
        font-family="Georgia, serif" 
        font-size="80" 
        fill="${goldColor}" 
        text-anchor="middle" 
        letter-spacing="20"
      >HEIRLOOM</text>
    </svg>
  `;
  
  return Buffer.from(svg);
}

async function generateIcons() {
  console.log('Generating Heirloom app icons...\n');
  
  // Check if source icon exists, otherwise create placeholder
  const sourceIconPath = path.join(ASSETS_DIR, 'icon-source.png');
  let sourceBuffer;
  
  if (fs.existsSync(sourceIconPath)) {
    console.log('Using existing source icon...');
    sourceBuffer = await sharp(sourceIconPath).resize(1024, 1024).png().toBuffer();
  } else {
    console.log('Creating placeholder icon...');
    const svgBuffer = await createPlaceholderIcon();
    sourceBuffer = await sharp(svgBuffer).resize(1024, 1024).png().toBuffer();
  }
  
  // Generate each icon size
  for (const [key, config] of Object.entries(ICON_SIZES)) {
    const outputPath = path.join(ASSETS_DIR, config.name);
    
    await sharp(sourceBuffer)
      .resize(config.size, config.size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: ${config.name} (${config.size}x${config.size})`);
  }
  
  console.log('\nAll icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Replace the placeholder icons with your actual brand icons');
  console.log('2. Ensure icons meet App Store and Play Store guidelines');
  console.log('3. iOS icons should not have transparency');
  console.log('4. Android adaptive icons should have proper safe zones');
}

generateIcons().catch(console.error);
