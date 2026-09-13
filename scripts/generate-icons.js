import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard SVG (for any purpose / desktop / favicon)
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2c221c" />
      <stop offset="100%" stop-color="#1d1714" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#e28a5f" flood-opacity="0.25" />
    </filter>
  </defs>
  
  <!-- Rounded squircle container matching warm dark UI -->
  <rect
    x="24"
    y="24"
    width="464"
    height="464"
    rx="136"
    ry="136"
    fill="url(#bgGrad)"
    stroke="#8e5537"
    stroke-width="20"
  />

  <!-- Pulse / Activity waveform -->
  <path
    d="M 144 292 H 188 L 224 180 L 264 360 L 300 292 H 368"
    fill="none"
    stroke="#e28a5f"
    stroke-width="36"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#glow)"
  />
</svg>
`;

// 2. Maskable SVG (Full-bleed background with icon within 80% safe zone for Android adaptive icons)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradFull" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2c221c" />
      <stop offset="100%" stop-color="#191412" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#382b23" />
      <stop offset="100%" stop-color="#231b17" />
    </linearGradient>
    <filter id="glowMaskable" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#e28a5f" flood-opacity="0.3" />
    </filter>
  </defs>
  
  <!-- Full bleed background for adaptive icon masking -->
  <rect width="512" height="512" fill="url(#bgGradFull)" />

  <!-- Inner squircle safely inside the 80% safe zone (safe area is 51.2px to 460.8px) -->
  <rect
    x="76"
    y="76"
    width="360"
    height="360"
    rx="100"
    ry="100"
    fill="url(#cardGrad)"
    stroke="#8e5537"
    stroke-width="16"
  />

  <!-- Pulse / Activity waveform scaled to safe zone -->
  <path
    d="M 168 285 H 202 L 230 200 L 262 338 L 290 285 H 344"
    fill="none"
    stroke="#e28a5f"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#glowMaskable)"
  />
</svg>
`;

// 3. Apple touch icon SVG (opaque background, no border cut)
const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="bgGradApple" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2c221c" />
      <stop offset="100%" stop-color="#191412" />
    </linearGradient>
  </defs>
  
  <rect width="180" height="180" fill="url(#bgGradApple)" />
  
  <rect
    x="14"
    y="14"
    width="152"
    height="152"
    rx="42"
    ry="42"
    fill="none"
    stroke="#8e5537"
    stroke-width="7"
  />

  <path
    d="M 50 102 H 66 L 79 63 L 93 126 L 106 102 H 130"
    fill="none"
    stroke="#e28a5f"
    stroke-width="12"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`;

async function generate() {
  console.log('Generating PWA and Android shortcut icons...');

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg.trim());

  // Generate 512x512 standard PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // Generate 192x192 standard PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // Generate 512x512 maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');

  // Generate 192x192 maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('Created icon-maskable-192.png');

  // Generate 180x180 apple touch icon
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Also generate 64x64 and 32x32 favicon pngs
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-64.png'));
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('Created favicon PNGs');

  console.log('All icons generated successfully.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
